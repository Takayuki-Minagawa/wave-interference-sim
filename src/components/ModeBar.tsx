import { formatNumber } from '../lib/format'
import type { UiCopy } from '../data/translations'
import type { Locale, SimulationMode } from '../types'

interface ModeBarProps {
  copy: UiCopy
  locale: Locale
  mode: SimulationMode
  onModeChange: (mode: SimulationMode) => void
  isPlaying: boolean
  onPlayingChange: (isPlaying: boolean) => void
  time: number
  onTimeChange: (time: number) => void
  onReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  speedOptions: readonly number[]
  loopDuration: number
}

export function ModeBar({
  copy,
  locale,
  mode,
  onModeChange,
  isPlaying,
  onPlayingChange,
  time,
  onTimeChange,
  onReset,
  speed,
  onSpeedChange,
  speedOptions,
  loopDuration,
}: ModeBarProps) {
  return (
    <section className="mode-bar panel">
      <div className="mode-tabs" role="tablist" aria-label="simulation mode">
        <button
          type="button"
          className={mode === 'interference' ? 'mode-tab is-active' : 'mode-tab'}
          onClick={() => onModeChange('interference')}
        >
          {copy.interferenceMode}
        </button>
        <button
          type="button"
          className={mode === 'standing' ? 'mode-tab is-active' : 'mode-tab'}
          onClick={() => onModeChange('standing')}
        >
          {copy.standingMode}
        </button>
      </div>

      <div className="playback-card">
        <div className="playback-card__buttons">
          <button type="button" onClick={() => onPlayingChange(!isPlaying)}>
            {isPlaying ? copy.pause : copy.play}
          </button>
          <button type="button" onClick={onReset}>
            {copy.reset}
          </button>
        </div>

        <label className="range-row">
          <span>
            {copy.time}: {formatNumber(time, locale, 2)} s
          </span>
          <input
            type="range"
            min={0}
            max={loopDuration}
            step={0.01}
            value={time}
            onChange={(event) => onTimeChange(Number(event.target.value))}
          />
        </label>

        <div className="speed-options">
          <span>{copy.speed}</span>
          <div className="speed-options__buttons">
            {speedOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={speed === option ? 'is-active' : ''}
                onClick={() => onSpeedChange(option)}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
