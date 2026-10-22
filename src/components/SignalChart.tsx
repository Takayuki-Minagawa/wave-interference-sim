import { useClockTime } from '../hooks/useClock'
import { getInterferenceValueAtPoint } from '../lib/waveMath'
import type { Point, WaveSource } from '../types'

interface SignalChartProps {
  title: string
  probePoint: Point
  sources: WaveSource[]
  accent: string
}

const SAMPLE_COUNT = 150
const WINDOW_SECONDS = 5
const WIDTH = 300
const HEIGHT = 96
const MID = HEIGHT / 2

export function SignalChart({ title, probePoint, sources, accent }: SignalChartProps) {
  const time = useClockTime()
  const maxAmplitude = Math.max(
    sources.reduce((sum, source) => sum + (source.enabled ? source.amplitude : 0), 0),
    0.1,
  )

  const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const sampleTime = time - ((SAMPLE_COUNT - 1 - index) / (SAMPLE_COUNT - 1)) * WINDOW_SECONDS
    return getInterferenceValueAtPoint(probePoint, sampleTime, sources) / maxAmplitude
  })

  const toY = (value: number) => MID - value * (MID - 8)
  const points = samples
    .map(
      (value, index) =>
        `${((index / (SAMPLE_COUNT - 1)) * WIDTH).toFixed(1)},${toY(value).toFixed(1)}`,
    )
    .join(' ')
  const lastValue = samples[samples.length - 1] ?? 0

  return (
    <figure className="signal-chart">
      <figcaption>{title}</figcaption>
      <div className="signal-chart__plot">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id="signal-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="50%" stopColor={accent} stopOpacity="0" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <line x1="0" x2={WIDTH} y1={toY(1)} y2={toY(1)} className="signal-chart__grid" />
          <line x1="0" x2={WIDTH} y1={toY(-1)} y2={toY(-1)} className="signal-chart__grid" />
          <line x1="0" x2={WIDTH} y1={MID} y2={MID} className="signal-chart__axis" />
          <polygon points={`0,${MID} ${points} ${WIDTH},${MID}`} fill="url(#signal-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="signal-chart__dot"
          style={{ top: `${(toY(lastValue) / HEIGHT) * 100}%`, background: accent }}
        />
      </div>
    </figure>
  )
}
