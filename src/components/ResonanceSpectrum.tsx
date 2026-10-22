import type { PointerEvent as ReactPointerEvent } from 'react'

import { RESONANCE_SUCCESS } from '../data/missions'
import {
  getMaxDriveFrequency,
  getMinDriveFrequency,
  getModeRatios,
  getResonanceLevel,
  getFundamentalFrequency,
} from '../lib/waveMath'
import type { StandingWaveSettings } from '../types'

interface ResonanceSpectrumProps {
  settings: StandingWaveSettings
  title: string
  hint: string
  onFrequencyChange: (frequency: number) => void
}

const WIDTH = 600
const HEIGHT = 150
const PAD_X = 12
const PAD_TOP = 24
const PAD_BOTTOM = 22
const SAMPLES = 360

export function ResonanceSpectrum({
  settings,
  title,
  hint,
  onFrequencyChange,
}: ResonanceSpectrumProps) {
  const minFrequency = getMinDriveFrequency(settings)
  const maxFrequency = getMaxDriveFrequency(settings)
  const fundamental = getFundamentalFrequency(
    settings.length,
    settings.tension,
    settings.linearDensity,
    settings.boundary,
  )
  const ratios = getModeRatios(settings.boundary)
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

  const toX = (frequency: number) =>
    PAD_X + ((frequency - minFrequency) / (maxFrequency - minFrequency)) * (WIDTH - PAD_X * 2)
  const toY = (level: number) => PAD_TOP + (1 - level) * plotHeight

  const frequencies = [
    ...Array.from(
      { length: SAMPLES },
      (_, index) => minFrequency + ((maxFrequency - minFrequency) * index) / (SAMPLES - 1),
    ),
    ...ratios.map((ratio) => ratio * fundamental),
  ].sort((a, b) => a - b)

  const curve = frequencies
    .map(
      (frequency) =>
        `${toX(frequency).toFixed(1)},${toY(getResonanceLevel(settings, frequency)).toFixed(1)}`,
    )
    .join(' ')

  const driveFrequency = Math.min(Math.max(settings.driveFrequency, minFrequency), maxFrequency)
  const level = getResonanceLevel(settings)
  const markerX = toX(driveFrequency)
  const isHit = level >= RESONANCE_SUCCESS

  const handlePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.type === 'pointermove' && event.buttons === 0) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH
    const ratio = (x - PAD_X) / (WIDTH - PAD_X * 2)
    const frequency = minFrequency + Math.min(Math.max(ratio, 0), 1) * (maxFrequency - minFrequency)

    // Snap onto a peak when the tap lands very close to it, so it feels fair on touch.
    const nearestPeak = ratios
      .map((modeRatio) => modeRatio * fundamental)
      .find((peak) => Math.abs(toX(peak) - x) < 6)
    onFrequencyChange(nearestPeak ?? frequency)
  }

  return (
    <figure className="spectrum">
      <figcaption>
        <strong>{title}</strong>
        <span>{hint}</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={title}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
      >
        <defs>
          <linearGradient id="spectrum-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={toY(RESONANCE_SUCCESS)}
          y2={toY(RESONANCE_SUCCESS)}
          className="spectrum__threshold"
        />
        <polygon
          points={`${toX(frequencies[0])},${toY(0)} ${curve} ${toX(frequencies[frequencies.length - 1])},${toY(0)}`}
          fill="url(#spectrum-fill)"
        />
        <polyline points={curve} fill="none" className="spectrum__curve" />
        <line x1={PAD_X} x2={WIDTH - PAD_X} y1={toY(0)} y2={toY(0)} className="spectrum__axis" />
        {ratios.map((ratio) => (
          <text
            key={ratio}
            x={toX(ratio * fundamental)}
            y={PAD_TOP - 8}
            textAnchor="middle"
            className="spectrum__label"
          >
            {ratio === 1 ? 'f₁' : `${ratio}f₁`}
          </text>
        ))}
        <text x={PAD_X} y={HEIGHT - 6} className="spectrum__tick">
          {minFrequency.toFixed(0)} Hz
        </text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 6} textAnchor="end" className="spectrum__tick">
          {maxFrequency.toFixed(0)} Hz
        </text>
        <line
          x1={markerX}
          x2={markerX}
          y1={PAD_TOP - 2}
          y2={toY(0)}
          className={isHit ? 'spectrum__marker is-hit' : 'spectrum__marker'}
        />
        <circle
          cx={markerX}
          cy={toY(level)}
          r={6}
          className={isHit ? 'spectrum__dot is-hit' : 'spectrum__dot'}
        />
      </svg>
    </figure>
  )
}
