import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from 'react'

import { useClock } from '../hooks/useClock'
import {
  INTERFERENCE_CANVAS,
  INTERFERENCE_WORLD,
  buildColorLookup,
  clamp,
  getEnabledSources,
} from '../lib/waveMath'
import type {
  ColorMapId,
  InterferenceClass,
  InterferenceSettings,
  Point,
  RenderQuality,
  WaveSource,
} from '../types'

interface InterferenceCanvasProps {
  settings: InterferenceSettings
  classification: InterferenceClass
  classificationLabel: string
  setSources: Dispatch<SetStateAction<WaveSource[]>>
  onProbePointChange: (point: Point | null) => void
  selectedSourceId: string | null
  onSelectedSourceChange: (sourceId: string | null) => void
  onMoveSelectedSource: (deltaX: number, deltaY: number) => void
  ariaLabel: string
  errorMessage: string
  canvasRef: RefObject<HTMLCanvasElement | null>
}

type GestureState =
  | { kind: 'source'; sourceId: string; pointerId: number; offset: Point }
  | { kind: 'probe'; pointerId: number }

/** Canvas pixels per field sample, by quality. Smaller is sharper. */
const QUALITY_STEP: Record<RenderQuality, number> = {
  high: 3,
  standard: 4,
  light: 6,
}

const GUIDE_STEP = 2
const SOURCE_HIT_RADIUS = 4
const PROBE_HIT_RADIUS = 3
const KEYBOARD_STEP = 1
const SCALE = INTERFERENCE_CANVAS.width / INTERFERENCE_WORLD.width

const CLASS_COLORS: Record<InterferenceClass, string> = {
  constructive: '#ffd84d',
  destructive: '#ff5fa8',
  mixed: '#cfe3ff',
  unavailable: '#cfe3ff',
}

const worldToCanvas = (point: Point) => ({
  x: point.x * SCALE,
  y: point.y * SCALE,
})

interface FieldCache {
  key: string
  width: number
  height: number
  phases: Float32Array[]
  omegas: number[]
  amplitudes: number[]
}

const buildFieldCache = (
  key: string,
  sources: WaveSource[],
  width: number,
  height: number,
): FieldCache => {
  const phases = sources.map((source) => {
    const data = new Float32Array(width * height)
    const k = (2 * Math.PI) / source.wavelength
    for (let yIndex = 0; yIndex < height; yIndex += 1) {
      const y = ((yIndex + 0.5) / height) * INTERFERENCE_WORLD.height
      for (let xIndex = 0; xIndex < width; xIndex += 1) {
        const x = ((xIndex + 0.5) / width) * INTERFERENCE_WORLD.width
        data[yIndex * width + xIndex] = k * Math.hypot(x - source.x, y - source.y) + source.phase
      }
    }
    return data
  })

  return {
    key,
    width,
    height,
    phases,
    omegas: sources.map((source) => 2 * Math.PI * source.frequency),
    amplitudes: sources.map((source) => source.amplitude),
  }
}

const buildGuideImage = (
  sources: WaveSource[],
  showConstructive: boolean,
  showDestructive: boolean,
) => {
  const width = Math.round(INTERFERENCE_CANVAS.width / GUIDE_STEP)
  const height = Math.round(INTERFERENCE_CANVAS.height / GUIDE_STEP)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  const [sourceA, sourceB] = sources
  const image = context.createImageData(width, height)
  const data = image.data
  const phaseOffset = (sourceA.phase - sourceB.phase) / (2 * Math.PI)
  const tolerance = 0.05

  for (let yIndex = 0; yIndex < height; yIndex += 1) {
    const y = ((yIndex + 0.5) / height) * INTERFERENCE_WORLD.height
    for (let xIndex = 0; xIndex < width; xIndex += 1) {
      const x = ((xIndex + 0.5) / width) * INTERFERENCE_WORLD.width
      const ratio =
        Math.hypot(x - sourceA.x, y - sourceA.y) / sourceA.wavelength -
        Math.hypot(x - sourceB.x, y - sourceB.y) / sourceB.wavelength +
        phaseOffset
      const toInteger = Math.abs(ratio - Math.round(ratio))
      const toHalf = Math.abs(ratio - 0.5 - Math.round(ratio - 0.5))
      const index = (yIndex * width + xIndex) * 4

      if (showConstructive && toInteger < tolerance) {
        const alpha = 1 - toInteger / tolerance
        data[index] = 255
        data[index + 1] = 216
        data[index + 2] = 77
        data[index + 3] = Math.round(235 * alpha * alpha * (3 - 2 * alpha))
      } else if (showDestructive && toHalf < tolerance) {
        const alpha = 1 - toHalf / tolerance
        data[index] = 255
        data[index + 1] = 95
        data[index + 2] = 168
        data[index + 3] = Math.round(235 * alpha * alpha * (3 - 2 * alpha))
      }
    }
  }

  context.putImageData(image, 0, 0)
  return canvas
}

const sourceKey = (sources: WaveSource[]) =>
  sources
    .map(
      (source) =>
        `${source.x.toFixed(3)},${source.y.toFixed(3)},${source.wavelength},${source.phase},${source.frequency},${source.amplitude}`,
    )
    .join('|')

export function InterferenceCanvas({
  settings,
  classification,
  classificationLabel,
  setSources,
  onProbePointChange,
  selectedSourceId,
  onSelectedSourceChange,
  onMoveSelectedSource,
  ariaLabel,
  errorMessage,
  canvasRef,
}: InterferenceCanvasProps) {
  const clock = useClock()
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fieldCacheRef = useRef<FieldCache | null>(null)
  const guideCacheRef = useRef<{ key: string; image: HTMLCanvasElement | null } | null>(null)
  const lutRef = useRef<{ id: ColorMapId; table: Uint8ClampedArray } | null>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const [contextFailed, setContextFailed] = useState(false)
  const [cursor, setCursor] = useState<'crosshair' | 'grab' | 'grabbing'>('crosshair')

  const drawFrame = useEffectEvent(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      setContextFailed(true)
      return
    }

    const time = clock.getTime()
    const { width, height } = INTERFERENCE_CANVAS
    const dpr = canvas.width / width
    const enabledSources = getEnabledSources(settings.sources)

    // --- Wave field -------------------------------------------------------
    const step = QUALITY_STEP[settings.quality]
    const fieldWidth = Math.round(width / step)
    const fieldHeight = Math.round(height / step)

    const key = `${fieldWidth}x${fieldHeight}:${sourceKey(enabledSources)}`
    if (fieldCacheRef.current?.key !== key) {
      fieldCacheRef.current = buildFieldCache(key, enabledSources, fieldWidth, fieldHeight)
    }
    const cache = fieldCacheRef.current

    if (lutRef.current?.id !== settings.colorMap) {
      lutRef.current = { id: settings.colorMap, table: buildColorLookup(settings.colorMap) }
    }
    const lut = lutRef.current.table

    if (!fieldCanvasRef.current) {
      fieldCanvasRef.current = document.createElement('canvas')
    }
    const fieldCanvas = fieldCanvasRef.current
    if (fieldCanvas.width !== fieldWidth || fieldCanvas.height !== fieldHeight) {
      fieldCanvas.width = fieldWidth
      fieldCanvas.height = fieldHeight
    }
    const fieldContext = fieldCanvas.getContext('2d')
    if (!fieldContext) {
      setContextFailed(true)
      return
    }

    const image = fieldContext.createImageData(fieldWidth, fieldHeight)
    const pixels = image.data
    const sourceCount = cache.phases.length
    const totalAmplitude = Math.max(
      cache.amplitudes.reduce((sum, amplitude) => sum + amplitude, 0),
      0.01,
    )
    const shifts = cache.omegas.map((omega) => omega * time)
    const isIntensity = settings.viewMode === 'intensity'

    for (let index = 0; index < fieldWidth * fieldHeight; index += 1) {
      let value = 0

      if (sourceCount > 0) {
        if (isIntensity) {
          let real = 0
          let imaginary = 0
          for (let s = 0; s < sourceCount; s += 1) {
            const theta = cache.phases[s][index] - shifts[s]
            real += cache.amplitudes[s] * Math.cos(theta)
            imaginary += cache.amplitudes[s] * Math.sin(theta)
          }
          // Intensity ∝ amplitude², normalized so full constructive interference is 1.
          const relative = Math.hypot(real, imaginary) / totalAmplitude
          value = 2 * relative * relative - 1
        } else {
          for (let s = 0; s < sourceCount; s += 1) {
            value += cache.amplitudes[s] * Math.sin(cache.phases[s][index] - shifts[s])
          }
          value /= totalAmplitude
        }
      } else {
        value = isIntensity ? -1 : 0
      }

      const lutIndex = Math.round((clamp(value, -1, 1) + 1) * 127.5) * 3
      const pixelIndex = index * 4
      pixels[pixelIndex] = lut[lutIndex]
      pixels[pixelIndex + 1] = lut[lutIndex + 1]
      pixels[pixelIndex + 2] = lut[lutIndex + 2]
      pixels[pixelIndex + 3] = 255
    }

    fieldContext.putImageData(image, 0, 0)

    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(fieldCanvas, 0, 0, width, height)

    // --- Constructive / destructive guide lines ---------------------------
    if ((settings.showConstructive || settings.showDestructive) && enabledSources.length >= 2) {
      const guideKey = `${sourceKey(enabledSources.slice(0, 2))}:${settings.showConstructive}:${settings.showDestructive}`
      if (guideCacheRef.current?.key !== guideKey) {
        guideCacheRef.current = {
          key: guideKey,
          image: buildGuideImage(
            enabledSources.slice(0, 2),
            settings.showConstructive,
            settings.showDestructive,
          ),
        }
      }
      const guideImage = guideCacheRef.current.image
      if (guideImage) {
        context.drawImage(guideImage, 0, 0, width, height)
      }
    }

    // --- Moving wavefronts (crest circles) --------------------------------
    if (settings.showWavefronts) {
      const maxRadius = Math.hypot(INTERFERENCE_WORLD.width, INTERFERENCE_WORLD.height)
      context.save()
      context.lineWidth = 1.4
      context.globalAlpha = 0.75

      enabledSources.forEach((source) => {
        const center = worldToCanvas(source)
        const cycles = source.frequency * time - source.phase / (2 * Math.PI) + 0.25
        const offset = ((cycles % 1) + 1) % 1
        context.strokeStyle = source.accent

        for (
          let radius = offset * source.wavelength;
          radius < maxRadius;
          radius += source.wavelength
        ) {
          if (radius < 0.5) {
            continue
          }
          context.beginPath()
          context.arc(center.x, center.y, radius * SCALE, 0, 2 * Math.PI)
          context.stroke()
        }
      })
      context.restore()
    }

    // --- Probe ------------------------------------------------------------
    const probe = settings.probePoint
    if (probe) {
      const probeCanvas = worldToCanvas(probe)
      const color = CLASS_COLORS[classification]

      context.save()
      context.setLineDash([6, 6])
      context.lineWidth = 1.5
      context.strokeStyle = 'rgba(255, 255, 255, 0.75)'
      enabledSources.slice(0, 2).forEach((source, index) => {
        const sourceCanvas = worldToCanvas(source)
        context.beginPath()
        context.moveTo(sourceCanvas.x, sourceCanvas.y)
        context.lineTo(probeCanvas.x, probeCanvas.y)
        context.stroke()

        context.setLineDash([])
        context.font = '600 13px system-ui, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        const midX = (sourceCanvas.x + probeCanvas.x) / 2
        const midY = (sourceCanvas.y + probeCanvas.y) / 2
        context.fillStyle = 'rgba(6, 16, 36, 0.72)'
        context.beginPath()
        context.roundRect(midX - 14, midY - 10, 28, 20, 10)
        context.fill()
        context.fillStyle = source.accent
        context.fillText(`r${index === 0 ? '₁' : '₂'}`, midX, midY + 0.5)
        context.setLineDash([6, 6])
      })
      context.restore()

      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260)
      context.save()
      context.strokeStyle = color
      context.globalAlpha = 0.35 + 0.35 * pulse
      context.lineWidth = 2
      context.beginPath()
      context.arc(probeCanvas.x, probeCanvas.y, 14 + pulse * 5, 0, 2 * Math.PI)
      context.stroke()
      context.globalAlpha = 1
      context.fillStyle = color
      context.strokeStyle = '#06121f'
      context.lineWidth = 2.5
      context.beginPath()
      context.arc(probeCanvas.x, probeCanvas.y, 7, 0, 2 * Math.PI)
      context.fill()
      context.stroke()

      if (classification !== 'unavailable') {
        context.font = '700 14px system-ui, sans-serif'
        const textWidth = context.measureText(classificationLabel).width
        const bubbleWidth = textWidth + 22
        const bubbleX = clamp(probeCanvas.x - bubbleWidth / 2, 6, width - bubbleWidth - 6)
        const bubbleY = probeCanvas.y > 52 ? probeCanvas.y - 46 : probeCanvas.y + 20
        context.fillStyle = 'rgba(6, 16, 36, 0.82)'
        context.beginPath()
        context.roundRect(bubbleX, bubbleY, bubbleWidth, 26, 13)
        context.fill()
        context.fillStyle = color
        context.textAlign = 'left'
        context.textBaseline = 'middle'
        context.fillText(classificationLabel, bubbleX + 11, bubbleY + 13.5)
      }
      context.restore()
    }

    // --- Sources ----------------------------------------------------------
    context.save()
    context.font = '700 13px system-ui, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    settings.sources.forEach((source, index) => {
      const point = worldToCanvas(source)
      const isSelected = source.id === selectedSourceId

      if (!source.enabled) {
        context.setLineDash([3, 3])
        context.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        context.fillStyle = 'rgba(6, 16, 36, 0.55)'
        context.lineWidth = 1.5
        context.beginPath()
        context.arc(point.x, point.y, 10, 0, 2 * Math.PI)
        context.fill()
        context.stroke()
        context.setLineDash([])
        context.fillStyle = 'rgba(255, 255, 255, 0.8)'
        context.fillText(String(index + 1), point.x, point.y + 0.5)
        return
      }

      const glow = context.createRadialGradient(point.x, point.y, 4, point.x, point.y, 30)
      glow.addColorStop(0, `${source.accent}aa`)
      glow.addColorStop(1, `${source.accent}00`)
      context.fillStyle = glow
      context.beginPath()
      context.arc(point.x, point.y, 30, 0, 2 * Math.PI)
      context.fill()

      if (isSelected) {
        context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        context.lineWidth = 2
        context.setLineDash([4, 4])
        context.beginPath()
        context.arc(point.x, point.y, 17, 0, 2 * Math.PI)
        context.stroke()
        context.setLineDash([])
      }

      context.fillStyle = source.accent
      context.strokeStyle = '#ffffff'
      context.lineWidth = 2.5
      context.beginPath()
      context.arc(point.x, point.y, 11, 0, 2 * Math.PI)
      context.fill()
      context.stroke()

      context.fillStyle = '#071423'
      context.fillText(String(index + 1), point.x, point.y + 0.5)
    })

    context.restore()
  })

  // Size the backing store for crisp rendering on high-DPI screens.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(INTERFERENCE_CANVAS.width * dpr)
    canvas.height = Math.round(INTERFERENCE_CANVAS.height * dpr)
    drawFrame()
  }, [canvasRef])

  useEffect(() => clock.subscribeTick(() => drawFrame()), [clock])

  useEffect(() => {
    drawFrame()
  }, [settings, selectedSourceId, classification, classificationLabel])

  // Keep the probe pulse alive while paused.
  useEffect(() => {
    if (!settings.probePoint) {
      return undefined
    }
    const id = window.setInterval(() => {
      if (!clock.getSnapshot().isPlaying) {
        drawFrame()
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [clock, settings.probePoint])

  const toWorldPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: clamp(
        ((event.clientX - rect.left) / rect.width) * INTERFERENCE_WORLD.width,
        0,
        INTERFERENCE_WORLD.width,
      ),
      y: clamp(
        ((event.clientY - rect.top) / rect.height) * INTERFERENCE_WORLD.height,
        0,
        INTERFERENCE_WORLD.height,
      ),
    }
  }

  const findSource = (point: Point, slop = 1) =>
    [...settings.sources]
      .reverse()
      .find(
        (source) => Math.hypot(point.x - source.x, point.y - source.y) <= SOURCE_HIT_RADIUS * slop,
      )

  const isNearProbe = (point: Point) =>
    settings.probePoint !== null &&
    Math.hypot(point.x - settings.probePoint.x, point.y - settings.probePoint.y) <= PROBE_HIT_RADIUS

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = toWorldPoint(event)
    const slop = event.pointerType === 'touch' ? 1.6 : 1
    const source = findSource(point, slop)

    if (source) {
      onSelectedSourceChange(source.id)
      gestureRef.current = {
        kind: 'source',
        sourceId: source.id,
        pointerId: event.pointerId,
        offset: { x: source.x - point.x, y: source.y - point.y },
      }
      setCursor('grabbing')
    } else {
      gestureRef.current = { kind: 'probe', pointerId: event.pointerId }
      if (!isNearProbe(point)) {
        onProbePointChange(point)
      }
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current
    const point = toWorldPoint(event)

    if (!gesture || gesture.pointerId !== event.pointerId) {
      if (event.pointerType === 'mouse') {
        setCursor(findSource(point) || isNearProbe(point) ? 'grab' : 'crosshair')
      }
      return
    }

    if (gesture.kind === 'source') {
      const x = clamp(point.x + gesture.offset.x, 0, INTERFERENCE_WORLD.width)
      const y = clamp(point.y + gesture.offset.y, 0, INTERFERENCE_WORLD.height)
      setSources((previous) =>
        previous.map((source) => (source.id === gesture.sourceId ? { ...source, x, y } : source)),
      )
      return
    }

    onProbePointChange(point)
  }

  const finishGesture = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    gestureRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setCursor('crosshair')
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const distance = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    }
    const move = moves[event.key]

    if (move) {
      event.preventDefault()
      onMoveSelectedSource(move[0], move[1])
    } else if (event.key === 'Escape' && settings.probePoint) {
      onProbePointChange(null)
    }
  }

  return (
    <>
      {contextFailed ? (
        <p className="canvas-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="sim-canvas sim-canvas--interference"
        style={{ cursor }}
        width={INTERFERENCE_CANVAS.width}
        height={INTERFERENCE_CANVAS.height}
        role="img"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
      >
        {ariaLabel}
      </canvas>
    </>
  )
}
