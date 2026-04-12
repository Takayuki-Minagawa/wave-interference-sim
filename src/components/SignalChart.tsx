interface SignalChartProps {
  title: string
  emptyLabel: string
  samples: number[]
  accent: string
}

export function SignalChart({
  title,
  emptyLabel,
  samples,
  accent,
}: SignalChartProps) {
  if (samples.length === 0) {
    return (
      <div className="signal-chart signal-chart--empty">
        <div className="signal-chart__title">{title}</div>
        <p>{emptyLabel}</p>
      </div>
    )
  }

  const amplitude = Math.max(0.15, ...samples.map((value) => Math.abs(value)))
  const points = samples
    .map((value, index) => {
      const x = (index / Math.max(samples.length - 1, 1)) * 100
      const y = 50 - (value / amplitude) * 36
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="signal-chart">
      <div className="signal-chart__title">{title}</div>
      <svg
        className="signal-chart__svg"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        role="img"
        aria-label={title}
      >
        <line x1="0" y1="14" x2="100" y2="14" className="signal-chart__grid" />
        <line x1="0" y1="50" x2="100" y2="50" className="signal-chart__axis" />
        <line x1="0" y1="86" x2="100" y2="86" className="signal-chart__grid" />
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  )
}
