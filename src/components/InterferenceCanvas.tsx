import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from 'react'

import type { ColorMapId, Point, WaveSource } from '../types'
import {
  INTERFERENCE_CANVAS,
  INTERFERENCE_WORLD,
  clamp,
  classifyInterference,
  getColorFromValue,
  getEnabledSources,
  getInterferenceValueAtPoint,
  getPathDifference,
  getRepresentativeWavelength,
} from '../lib/waveMath'

interface InterferenceCanvasProps {
  sources: WaveSource[]
  time: number
  colorMap: ColorMapId
  resolution: number
  showConstructive: boolean
  showDestructive: boolean
  showWavefronts: boolean
  probePoint: Point | null
  setSources: Dispatch<SetStateAction<WaveSource[]>>
  onProbePointChange: (point: Point) => void
  selectedSourceId: string | null
  onSelectedSourceChange: (sourceId: string | null) => void
  onMoveSelectedSource: (deltaX: number, deltaY: number) => void
  ariaLabel: string
  errorMessage: string
}

type GestureState =
  | {
      kind: 'source'
      sourceId: string
      pointerId: number
      moved: boolean
    }
  | {
      kind: 'probe'
      pointerId: number
      startPoint: Point
      moved: boolean
    }

const SOURCE_RADIUS = 3.3
const CLICK_DRIFT = 1.4
const KEYBOARD_STEP = 1

const worldToCanvas = (point: Point) => ({
  x: (point.x / INTERFERENCE_WORLD.width) * INTERFERENCE_CANVAS.width,
  y: (point.y / INTERFERENCE_WORLD.height) * INTERFERENCE_CANVAS.height,
})

export function InterferenceCanvas({
  sources,
  time,
  colorMap,
  resolution,
  showConstructive,
  showDestructive,
  showWavefronts,
  probePoint,
  setSources,
  onProbePointChange,
  selectedSourceId,
  onSelectedSourceChange,
  onMoveSelectedSource,
  ariaLabel,
  errorMessage,
}: InterferenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const loggedErrorRef = useRef({
    main: false,
    offscreen: false,
  })
  const [contextFailed, setContextFailed] = useState(false)

  const drawFrame = useEffectEvent(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      if (!loggedErrorRef.current.main) {
        console.error('[InterferenceCanvas] Failed to acquire 2D rendering context.')
        loggedErrorRef.current.main = true
      }
      setContextFailed(true)
      return
    }

    const enabledSources = getEnabledSources(sources)
    const maximumAmplitude = Math.max(
      enabledSources.reduce((sum, source) => sum + source.amplitude, 0),
      0.01,
    )

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }

    const offscreenCanvas = offscreenRef.current
    const lowWidth = Math.max(48, Math.round(INTERFERENCE_CANVAS.width / resolution))
    const lowHeight = Math.max(32, Math.round(INTERFERENCE_CANVAS.height / resolution))
    offscreenCanvas.width = lowWidth
    offscreenCanvas.height = lowHeight

    const offscreenContext = offscreenCanvas.getContext('2d')
    if (!offscreenContext) {
      if (!loggedErrorRef.current.offscreen) {
        console.error(
          '[InterferenceCanvas] Failed to acquire 2D rendering context for the offscreen canvas.',
        )
        loggedErrorRef.current.offscreen = true
      }
      setContextFailed(true)
      return
    }

    const imageData = offscreenContext.createImageData(lowWidth, lowHeight)
    const pixelData = imageData.data

    for (let yIndex = 0; yIndex < lowHeight; yIndex += 1) {
      for (let xIndex = 0; xIndex < lowWidth; xIndex += 1) {
        const worldPoint = {
          x: (xIndex / Math.max(lowWidth - 1, 1)) * INTERFERENCE_WORLD.width,
          y: (yIndex / Math.max(lowHeight - 1, 1)) * INTERFERENCE_WORLD.height,
        }
        const value =
          getInterferenceValueAtPoint(worldPoint, time, enabledSources) / maximumAmplitude
        const [red, green, blue] = getColorFromValue(value, colorMap)
        const pixelIndex = (yIndex * lowWidth + xIndex) * 4
        pixelData[pixelIndex] = red
        pixelData[pixelIndex + 1] = green
        pixelData[pixelIndex + 2] = blue
        pixelData[pixelIndex + 3] = 255
      }
    }

    offscreenContext.putImageData(imageData, 0, 0)

    context.clearRect(0, 0, INTERFERENCE_CANVAS.width, INTERFERENCE_CANVAS.height)
    context.imageSmoothingEnabled = false
    context.drawImage(
      offscreenCanvas,
      0,
      0,
      INTERFERENCE_CANVAS.width,
      INTERFERENCE_CANVAS.height,
    )
    context.imageSmoothingEnabled = true

    if ((showConstructive || showDestructive) && enabledSources.length >= 2) {
      const wavelength = getRepresentativeWavelength(enabledSources)
      const overlayStep = Math.max(2.4, resolution / 2)

      context.save()
      context.globalAlpha = 0.72

      for (
        let y = overlayStep / 2;
        y < INTERFERENCE_WORLD.height;
        y += overlayStep
      ) {
        for (
          let x = overlayStep / 2;
          x < INTERFERENCE_WORLD.width;
          x += overlayStep
        ) {
          const pathDifference = getPathDifference({ x, y }, enabledSources)
          const classification = classifyInterference(pathDifference, wavelength, 0.05)
          const canvasPoint = worldToCanvas({ x, y })

          if (showConstructive && classification === 'constructive') {
            context.fillStyle = 'rgba(252, 244, 180, 0.92)'
            context.fillRect(canvasPoint.x - 1.1, canvasPoint.y - 1.1, 2.2, 2.2)
          }

          if (showDestructive && classification === 'destructive') {
            context.fillStyle = 'rgba(33, 24, 64, 0.84)'
            context.fillRect(canvasPoint.x - 1.1, canvasPoint.y - 1.1, 2.2, 2.2)
          }
        }
      }

      context.restore()
    }

    if (showWavefronts) {
      context.save()
      context.setLineDash([8, 10])
      context.lineWidth = 1.1

      const maxRadius = Math.hypot(
        INTERFERENCE_WORLD.width,
        INTERFERENCE_WORLD.height,
      )

      enabledSources.forEach((source) => {
        context.strokeStyle = `${source.accent}88`
        const canvasSource = worldToCanvas(source)
        const scale = INTERFERENCE_CANVAS.width / INTERFERENCE_WORLD.width

        for (
          let radius = source.wavelength;
          radius < maxRadius;
          radius += source.wavelength
        ) {
          context.beginPath()
          context.arc(canvasSource.x, canvasSource.y, radius * scale, 0, 2 * Math.PI)
          context.stroke()
        }
      })

      context.restore()
    }

    if (probePoint) {
      const probeCanvasPoint = worldToCanvas(probePoint)

      context.save()
      context.strokeStyle = 'rgba(248, 248, 250, 0.88)'
      context.fillStyle = 'rgba(244, 244, 248, 0.96)'
      context.lineWidth = 1.4

      enabledSources.slice(0, 2).forEach((source) => {
        const sourceCanvasPoint = worldToCanvas(source)
        context.beginPath()
        context.moveTo(sourceCanvasPoint.x, sourceCanvasPoint.y)
        context.lineTo(probeCanvasPoint.x, probeCanvasPoint.y)
        context.stroke()
      })

      context.beginPath()
      context.arc(probeCanvasPoint.x, probeCanvasPoint.y, 7, 0, 2 * Math.PI)
      context.fill()
      context.stroke()
      context.restore()
    }

    context.save()
    context.font = '600 13px "Avenir Next", "Hiragino Sans", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    enabledSources.forEach((source, index) => {
      const canvasPoint = worldToCanvas(source)
      const isSelected = source.id === selectedSourceId

      context.beginPath()
      context.fillStyle = source.accent
      context.strokeStyle = isSelected ? '#f8de7d' : 'rgba(255, 255, 255, 0.92)'
      context.lineWidth = isSelected ? 3 : 2
      context.arc(canvasPoint.x, canvasPoint.y, isSelected ? 11 : 10, 0, 2 * Math.PI)
      context.fill()
      context.stroke()

      context.fillStyle = '#09131f'
      context.fillText(String(index + 1), canvasPoint.x, canvasPoint.y + 0.5)
    })

    context.restore()
  })

  useEffect(() => {
    drawFrame()
  }, [
    colorMap,
    probePoint,
    resolution,
    showConstructive,
    showDestructive,
    showWavefronts,
    sources,
    time,
  ])

  const toWorldPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x =
      ((event.clientX - rect.left) / rect.width) * INTERFERENCE_WORLD.width
    const y =
      ((event.clientY - rect.top) / rect.height) * INTERFERENCE_WORLD.height

    return {
      x: clamp(x, 0, INTERFERENCE_WORLD.width),
      y: clamp(y, 0, INTERFERENCE_WORLD.height),
    }
  }

  const findSource = (point: Point) =>
    [...sources]
      .reverse()
      .find(
        (source) =>
          source.enabled &&
          Math.hypot(point.x - source.x, point.y - source.y) <= SOURCE_RADIUS,
      )

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = toWorldPoint(event)
    const selectedSource = findSource(point)

    if (selectedSource) {
      onSelectedSourceChange(selectedSource.id)
      gestureRef.current = {
        kind: 'source',
        sourceId: selectedSource.id,
        pointerId: event.pointerId,
        moved: false,
      }
    } else {
      gestureRef.current = {
        kind: 'probe',
        pointerId: event.pointerId,
        startPoint: point,
        moved: false,
      }
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }

    const point = toWorldPoint(event)

    if (gesture.kind === 'source') {
      gesture.moved = true
      setSources((previousSources) =>
        previousSources.map((source) =>
          source.id === gesture.sourceId
            ? { ...source, x: point.x, y: point.y }
            : source,
        ),
      )
      return
    }

    if (
      Math.hypot(point.x - gesture.startPoint.x, point.y - gesture.startPoint.y) >
      CLICK_DRIFT
    ) {
      gesture.moved = true
    }
  }

  const finishGesture = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current
    gestureRef.current = null

    if (
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }

    if (gesture.kind === 'probe' && !gesture.moved) {
      onProbePointChange(toWorldPoint(event))
    }
  }

  const cycleSelectedSource = (direction: 1 | -1) => {
    const enabledSources = getEnabledSources(sources)

    if (enabledSources.length === 0) {
      onSelectedSourceChange(null)
      return
    }

    const currentIndex = enabledSources.findIndex(
      (source) => source.id === selectedSourceId,
    )
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + enabledSources.length) % enabledSources.length

    onSelectedSourceChange(enabledSources[nextIndex]?.id ?? null)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      cycleSelectedSource(event.shiftKey ? -1 : 1)
      return
    }

    const distance = event.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        onMoveSelectedSource(-distance, 0)
        break
      case 'ArrowRight':
        event.preventDefault()
        onMoveSelectedSource(distance, 0)
        break
      case 'ArrowUp':
        event.preventDefault()
        onMoveSelectedSource(0, -distance)
        break
      case 'ArrowDown':
        event.preventDefault()
        onMoveSelectedSource(0, distance)
        break
      default:
        break
    }
  }

  return (
    <div className="canvas-shell">
      {contextFailed ? (
        <p className="canvas-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="interference-canvas"
        width={INTERFERENCE_CANVAS.width}
        height={INTERFERENCE_CANVAS.height}
        role="img"
        tabIndex={0}
        aria-label={ariaLabel}
        onFocus={() => {
          if (!selectedSourceId) {
            cycleSelectedSource(1)
          }
        }}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
      >
        {ariaLabel}
      </canvas>
    </div>
  )
}
