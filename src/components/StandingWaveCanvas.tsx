import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { StandingWaveSettings, Theme } from '../types'
import {
  STANDING_CANVAS,
  getStandingAntinodes,
  getStandingDisplacement,
  getStandingNodes,
  getTravelingWaveComponents,
} from '../lib/waveMath'

interface StandingWaveCanvasProps {
  settings: StandingWaveSettings
  time: number
  theme: Theme
  ariaLabel: string
  errorMessage: string
}

const projectX = (value: number, length: number, marginX: number, width: number) =>
  marginX + (value / length) * width

export function StandingWaveCanvas({
  settings,
  time,
  theme,
  ariaLabel,
  errorMessage,
}: StandingWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const errorLoggedRef = useRef(false)
  const [contextFailed, setContextFailed] = useState(false)

  const drawFrame = useEffectEvent(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      if (!errorLoggedRef.current) {
        console.error('[StandingWaveCanvas] Failed to acquire 2D rendering context.')
        errorLoggedRef.current = true
      }
      setContextFailed(true)
      return
    }

    const palette =
      theme === 'dark'
        ? {
            background: '#111827',
            baseline: '#6f7d94',
            grid: 'rgba(154, 162, 177, 0.18)',
            combined: '#f8c34f',
            forward: 'rgba(122, 210, 214, 0.65)',
            backward: 'rgba(255, 145, 122, 0.65)',
            trail: 'rgba(169, 190, 221, 0.18)',
            node: '#f2f5f9',
            antinode: '#7de17e',
          }
        : {
            background: '#fbf4ea',
            baseline: '#6a768a',
            grid: 'rgba(62, 76, 96, 0.12)',
            combined: '#d96d35',
            forward: 'rgba(19, 138, 142, 0.44)',
            backward: 'rgba(76, 102, 173, 0.44)',
            trail: 'rgba(94, 126, 177, 0.16)',
            node: '#102034',
            antinode: '#287a3c',
          }

    const width = STANDING_CANVAS.width
    const height = STANDING_CANVAS.height
    const marginX = 56
    const usableWidth = width - marginX * 2
    const baselineY = height / 2
    const usableAmplitude = height * 0.34
    const scale = usableAmplitude / Math.max(settings.amplitude * 2.2, 0.3)

    context.clearRect(0, 0, width, height)
    context.fillStyle = palette.background
    context.fillRect(0, 0, width, height)

    context.strokeStyle = palette.grid
    context.lineWidth = 1
    context.setLineDash([6, 10])
    ;[0.25, 0.5, 0.75].forEach((ratio) => {
      const x = marginX + usableWidth * ratio
      context.beginPath()
      context.moveTo(x, 28)
      context.lineTo(x, height - 28)
      context.stroke()
    })
    context.setLineDash([])

    context.strokeStyle = palette.baseline
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(marginX, baselineY)
    context.lineTo(width - marginX, baselineY)
    context.stroke()

    const drawWave = (
      sampleTime: number,
      color: string,
      lineWidth: number,
      mode: 'combined' | 'forward' | 'backward',
    ) => {
      context.beginPath()
      context.strokeStyle = color
      context.lineWidth = lineWidth

      for (let index = 0; index <= 220; index += 1) {
        const x = (settings.length * index) / 220
        const xPixel = projectX(x, settings.length, marginX, usableWidth)
        let displacement = 0

        if (mode === 'combined') {
          displacement = getStandingDisplacement(x, sampleTime, settings)
        } else {
          const components = getTravelingWaveComponents(x, sampleTime, settings)
          displacement =
            mode === 'forward' ? components.forward : components.backward
        }

        const yPixel = baselineY - displacement * scale

        if (index === 0) {
          context.moveTo(xPixel, yPixel)
        } else {
          context.lineTo(xPixel, yPixel)
        }
      }

      context.stroke()
    }

    if (settings.showSnapshots) {
      for (let trail = settings.snapshotCount; trail >= 1; trail -= 1) {
        drawWave(time - trail * 0.06, palette.trail, 1.4, 'combined')
      }
    }

    drawWave(time, palette.forward, 1.35, 'forward')
    drawWave(time, palette.backward, 1.35, 'backward')
    drawWave(time, palette.combined, 3.2, 'combined')

    const nodePositions = getStandingNodes(settings)
    const antinodePositions = getStandingAntinodes(settings)

    context.fillStyle = palette.node
    nodePositions.forEach((position) => {
      const x = projectX(position, settings.length, marginX, usableWidth)
      context.beginPath()
      context.arc(x, baselineY, 5, 0, 2 * Math.PI)
      context.fill()
    })

    context.fillStyle = palette.antinode
    antinodePositions.forEach((position, index) => {
      const x = projectX(position, settings.length, marginX, usableWidth)
      const y = baselineY + (index % 2 === 0 ? -22 : 22)

      context.beginPath()
      context.moveTo(x, y - 6)
      context.lineTo(x + 6, y)
      context.lineTo(x, y + 6)
      context.lineTo(x - 6, y)
      context.closePath()
      context.fill()
    })

    const boundaryTop = baselineY - usableAmplitude - 18
    const boundaryHeight = usableAmplitude * 2 + 36

    const drawFixedBoundary = (x: number) => {
      context.fillStyle = palette.baseline
      context.fillRect(x - 4, boundaryTop, 8, boundaryHeight)
      context.strokeStyle = palette.grid
      context.lineWidth = 1

      for (let offset = 0; offset < boundaryHeight; offset += 14) {
        context.beginPath()
        context.moveTo(x - 18, boundaryTop + offset + 10)
        context.lineTo(x - 4, boundaryTop + offset - 2)
        context.stroke()
      }
    }

    const drawFreeBoundary = (x: number) => {
      context.strokeStyle = palette.baseline
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(x, boundaryTop)
      context.lineTo(x, boundaryTop + boundaryHeight)
      context.stroke()
      context.beginPath()
      context.arc(x, baselineY, 9, 0, 2 * Math.PI)
      context.stroke()
    }

    if (settings.boundary === 'fixed-fixed') {
      drawFixedBoundary(marginX)
      drawFixedBoundary(width - marginX)
    } else if (settings.boundary === 'fixed-free') {
      drawFixedBoundary(marginX)
      drawFreeBoundary(width - marginX)
    } else {
      drawFreeBoundary(marginX)
      drawFreeBoundary(width - marginX)
    }
  })

  useEffect(() => {
    drawFrame()
  }, [settings, theme, time])

  return (
    <div className="canvas-shell">
      {contextFailed ? (
        <p className="canvas-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="standing-wave-canvas"
        width={STANDING_CANVAS.width}
        height={STANDING_CANVAS.height}
        role="img"
        aria-label={ariaLabel}
      >
        {ariaLabel}
      </canvas>
    </div>
  )
}
