import { useEffect, useEffectEvent, useState } from 'react'
import type { RefObject } from 'react'

import { useClock } from '../hooks/useClock'
import {
  STANDING_CANVAS,
  getDrivenDisplacement,
  getDrivenModeResponses,
  getModeShape,
  getStandingDisplacement,
  getStandingModeRatio,
  getTravelingWaveComponents,
} from '../lib/waveMath'
import type { StandingSummary, StandingWaveSettings } from '../types'

interface StandingWaveCanvasProps {
  settings: StandingWaveSettings
  summary: StandingSummary
  nodeLabel: string
  antinodeLabel: string
  ariaLabel: string
  errorMessage: string
  canvasRef: RefObject<HTMLCanvasElement | null>
}

const MARGIN_X = 70
const SAMPLE_COUNT = 240
/** Pixels per unit of displacement. 2 × max amplitude (0.55) fills ±150 px. */
const DISPLACEMENT_SCALE = 136
const TRAIL_COUNT = 6
const TRAIL_SPACING = 0.05

const COLORS = {
  combined: '#ffc94d',
  forward: '#5fd4e0',
  backward: '#ff8f73',
  envelope: 'rgba(255, 201, 77, 0.10)',
  baseline: 'rgba(170, 196, 230, 0.35)',
  grid: 'rgba(170, 196, 230, 0.10)',
  node: '#ffffff',
  antinode: '#7ee8a0',
  support: '#8aa0c0',
  text: 'rgba(220, 232, 250, 0.85)',
}

export function StandingWaveCanvas({
  settings,
  summary,
  nodeLabel,
  antinodeLabel,
  ariaLabel,
  errorMessage,
  canvasRef,
}: StandingWaveCanvasProps) {
  const clock = useClock()
  const [contextFailed, setContextFailed] = useState(false)

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

    const { width, height } = STANDING_CANVAS
    const dpr = canvas.width / width
    const usableWidth = width - MARGIN_X * 2
    const baselineY = height / 2 - 6
    const visualTime = clock.getTime() / summary.slowMotionFactor
    const isDriven = settings.driveMode === 'driven'
    const responses = isDriven ? getDrivenModeResponses(settings) : []
    const naturalRatio = getStandingModeRatio(settings.boundary, settings.modeIndex)

    const projectX = (x: number) => MARGIN_X + (x / settings.length) * usableWidth
    const projectY = (displacement: number) =>
      baselineY - Math.max(-1.25, Math.min(1.25, displacement)) * DISPLACEMENT_SCALE

    const displacementAt = (x: number, time: number) =>
      isDriven
        ? getDrivenDisplacement(x, time, settings, responses)
        : getStandingDisplacement(x, time, settings)

    const envelopeAt = (x: number) => {
      if (!isDriven) {
        return (
          2 *
          settings.amplitude *
          Math.abs(getModeShape(x, naturalRatio, settings.boundary, settings.length))
        )
      }
      let real = 0
      let imaginary = 0
      responses.forEach((response) => {
        const shape = getModeShape(x, response.ratio, settings.boundary, settings.length)
        real += response.real * shape
        imaginary += response.imaginary * shape
      })
      return 2 * settings.amplitude * Math.hypot(real, imaginary)
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Background
    const background = context.createLinearGradient(0, 0, 0, height)
    background.addColorStop(0, '#0c1b36')
    background.addColorStop(1, '#060e1d')
    context.fillStyle = background
    context.fillRect(0, 0, width, height)

    // Grid
    context.strokeStyle = COLORS.grid
    context.lineWidth = 1
    for (let index = 1; index < 8; index += 1) {
      const x = MARGIN_X + (usableWidth * index) / 8
      context.beginPath()
      context.moveTo(x, 34)
      context.lineTo(x, height - 54)
      context.stroke()
    }
    ;[-1, -0.5, 0.5, 1].forEach((level) => {
      const y = baselineY - level * DISPLACEMENT_SCALE
      context.beginPath()
      context.moveTo(MARGIN_X, y)
      context.lineTo(width - MARGIN_X, y)
      context.stroke()
    })

    context.strokeStyle = COLORS.baseline
    context.setLineDash([4, 6])
    context.beginPath()
    context.moveTo(MARGIN_X, baselineY)
    context.lineTo(width - MARGIN_X, baselineY)
    context.stroke()
    context.setLineDash([])

    // Ruler
    const rulerY = height - 34
    context.strokeStyle = COLORS.baseline
    context.beginPath()
    context.moveTo(MARGIN_X, rulerY)
    context.lineTo(width - MARGIN_X, rulerY)
    context.stroke()
    context.fillStyle = COLORS.text
    context.font = '500 12px system-ui, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    for (let index = 0; index <= 4; index += 1) {
      const x = MARGIN_X + (usableWidth * index) / 4
      context.beginPath()
      context.moveTo(x, rulerY - 5)
      context.lineTo(x, rulerY + 5)
      context.stroke()
      context.fillText(`${((settings.length * index) / 4).toFixed(2)} m`, x, rulerY + 9)
    }

    // End supports
    const supportTop = baselineY - 168
    const supportHeight = 336

    const drawFixed = (x: number, side: -1 | 1) => {
      context.fillStyle = '#1b2d4d'
      context.fillRect(side < 0 ? x - 22 : x, supportTop, 22, supportHeight)
      context.strokeStyle = COLORS.support
      context.lineWidth = 1.2
      for (let offset = 0; offset < supportHeight; offset += 12) {
        context.beginPath()
        const outer = side < 0 ? x - 22 : x + 22
        context.moveTo(outer, supportTop + offset + 12)
        context.lineTo(x, supportTop + offset)
        context.stroke()
      }
      context.fillStyle = COLORS.support
      context.fillRect(x - 2, supportTop, 4, supportHeight)
    }

    const drawFree = (x: number, time: number) => {
      context.strokeStyle = COLORS.support
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(x, supportTop)
      context.lineTo(x, supportTop + supportHeight)
      context.stroke()
      const ringY = projectY(displacementAt(x === MARGIN_X ? 0 : settings.length, time))
      context.strokeStyle = '#ffffff'
      context.lineWidth = 3
      context.beginPath()
      context.arc(x, ringY, 9, 0, 2 * Math.PI)
      context.stroke()
    }

    if (settings.boundary === 'free-free') {
      drawFree(MARGIN_X, visualTime)
    } else {
      drawFixed(MARGIN_X, -1)
    }
    if (settings.boundary === 'fixed-fixed') {
      drawFixed(width - MARGIN_X, 1)
    } else {
      drawFree(width - MARGIN_X, visualTime)
    }

    // Envelope (the region the string sweeps through)
    context.beginPath()
    for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
      const x = (settings.length * index) / SAMPLE_COUNT
      const y = projectY(envelopeAt(x))
      if (index === 0) {
        context.moveTo(projectX(x), y)
      } else {
        context.lineTo(projectX(x), y)
      }
    }
    for (let index = SAMPLE_COUNT; index >= 0; index -= 1) {
      const x = (settings.length * index) / SAMPLE_COUNT
      context.lineTo(projectX(x), projectY(-envelopeAt(x)))
    }
    context.closePath()
    context.fillStyle = COLORS.envelope
    context.fill()

    const tracePath = (sample: (x: number) => number) => {
      context.beginPath()
      for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
        const x = (settings.length * index) / SAMPLE_COUNT
        const y = projectY(sample(x))
        if (index === 0) {
          context.moveTo(projectX(x), y)
        } else {
          context.lineTo(projectX(x), y)
        }
      }
    }

    // Afterimage trails
    if (settings.showSnapshots) {
      context.lineWidth = 2
      for (let trail = TRAIL_COUNT; trail >= 1; trail -= 1) {
        context.strokeStyle = `rgba(255, 214, 120, ${0.22 * (1 - trail / (TRAIL_COUNT + 1))})`
        tracePath((x) => displacementAt(x, visualTime - trail * TRAIL_SPACING))
        context.stroke()
      }
    }

    // Traveling components
    if (settings.showTraveling && !isDriven) {
      context.lineWidth = 2
      context.setLineDash([8, 6])
      context.strokeStyle = COLORS.forward
      tracePath((x) => getTravelingWaveComponents(x, visualTime, settings).forward)
      context.stroke()
      context.strokeStyle = COLORS.backward
      tracePath((x) => getTravelingWaveComponents(x, visualTime, settings).backward)
      context.stroke()
      context.setLineDash([])
    }

    // Main string
    context.save()
    context.shadowColor = 'rgba(255, 201, 77, 0.7)'
    context.shadowBlur = 14
    context.strokeStyle = COLORS.combined
    context.lineWidth = 4
    context.lineCap = 'round'
    context.lineJoin = 'round'
    tracePath((x) => displacementAt(x, visualTime))
    context.stroke()
    context.restore()

    // Nodes and antinodes
    const showMarkers = !isDriven || summary.resonanceLevel > 0.55
    if (showMarkers) {
      context.font = '700 13px system-ui, sans-serif'
      context.textAlign = 'center'

      summary.nodePositions.forEach((position) => {
        const x = projectX(position)
        context.fillStyle = COLORS.node
        context.strokeStyle = '#0a1730'
        context.lineWidth = 2.5
        context.beginPath()
        context.arc(x, baselineY, 6, 0, 2 * Math.PI)
        context.fill()
        context.stroke()
        if (settings.showLabels) {
          // Nodes at the very ends sit on the supports, so nudge their labels inward.
          const atStart = position < settings.length * 0.02
          const atEnd = position > settings.length * 0.98
          context.textAlign = atStart ? 'left' : atEnd ? 'right' : 'center'
          context.textBaseline = 'top'
          context.fillStyle = COLORS.text
          context.fillText(nodeLabel, x + (atStart ? 10 : atEnd ? -10 : 0), baselineY + 14)
          context.textAlign = 'center'
        }
      })

      summary.antinodePositions.forEach((position) => {
        const x = projectX(position)
        const peak = envelopeAt(position)
        const y = projectY(peak) - 12
        context.fillStyle = COLORS.antinode
        context.beginPath()
        context.moveTo(x, y - 6)
        context.lineTo(x + 6, y)
        context.lineTo(x, y + 6)
        context.lineTo(x - 6, y)
        context.closePath()
        context.fill()
        if (settings.showLabels) {
          context.textBaseline = 'bottom'
          context.fillText(antinodeLabel, x, y - 9)
        }
      })
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(STANDING_CANVAS.width * dpr)
    canvas.height = Math.round(STANDING_CANVAS.height * dpr)
    drawFrame()
  }, [canvasRef])

  useEffect(() => clock.subscribeTick(() => drawFrame()), [clock])

  useEffect(() => {
    drawFrame()
  }, [settings, summary, nodeLabel, antinodeLabel])

  return (
    <>
      {contextFailed ? (
        <p className="canvas-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="sim-canvas sim-canvas--standing"
        width={STANDING_CANVAS.width}
        height={STANDING_CANVAS.height}
        role="img"
        aria-label={ariaLabel}
      >
        {ariaLabel}
      </canvas>
    </>
  )
}
