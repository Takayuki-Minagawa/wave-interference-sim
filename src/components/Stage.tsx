import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'

import type { UiCopy } from '../data/translations'
import { useClock, useClockState, useClockTime } from '../hooks/useClock'
import { LOOP_DURATION, SPEED_OPTIONS } from '../lib/clock'
import { formatNumber } from '../lib/format'
import type { Locale } from '../types'
import { Icon } from './Icon'

function TimeReadout({ locale }: { locale: Locale }) {
  const time = useClockTime()
  const clock = useClock()

  return (
    <div className="timeline">
      <input
        type="range"
        className="timeline__range"
        min={0}
        max={LOOP_DURATION}
        step={0.01}
        value={time}
        aria-label="time"
        style={{ '--fill': `${(time / LOOP_DURATION) * 100}%` } as CSSProperties}
        onChange={(event) => clock.setTime(Number(event.target.value))}
      />
      <span className="timeline__value">{formatNumber(time, locale, 1)} s</span>
    </div>
  )
}

interface PlaybackBarProps {
  copy: UiCopy
  locale: Locale
}

export function PlaybackBar({ copy, locale }: PlaybackBarProps) {
  const clock = useClock()
  const { isPlaying, speed } = useClockState()

  return (
    <div className="playback">
      <button
        type="button"
        className="playback__play"
        onClick={clock.togglePlaying}
        aria-label={isPlaying ? copy.pause : copy.play}
        title={`${isPlaying ? copy.pause : copy.play} (Space)`}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={22} />
      </button>
      <button
        type="button"
        className="icon-button icon-button--ghost"
        onClick={clock.reset}
        aria-label={copy.reset}
        title={`${copy.reset} (R)`}
      >
        <Icon name="restart" />
      </button>
      {!isPlaying ? (
        <button
          type="button"
          className="icon-button icon-button--ghost"
          onClick={() => clock.step(1 / 30)}
          aria-label={copy.stepForward}
          title={copy.stepForward}
        >
          <Icon name="step" />
        </button>
      ) : null}
      <TimeReadout locale={locale} />
      <div className="speed-picker" role="radiogroup" aria-label={copy.speed}>
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={speed === option}
            className={speed === option ? 'is-active' : undefined}
            onClick={() => clock.setSpeed(option)}
          >
            {option}×
          </button>
        ))}
      </div>
    </div>
  )
}

interface StageProps {
  copy: UiCopy
  locale: Locale
  title: string
  hint: string
  badges?: ReactNode
  footer?: ReactNode
  canvasRef: RefObject<HTMLCanvasElement | null>
  fileName: string
  onSaved: () => void
  children: ReactNode
}

export function Stage({
  copy,
  locale,
  title,
  hint,
  badges,
  footer,
  canvasRef,
  fileName,
  onSaved,
  children,
}: StageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canFullscreen =
    typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void frameRef.current?.requestFullscreen().catch(() => undefined)
    }
  }

  const saveSnapshot = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      onSaved()
    }, 'image/png')
  }

  return (
    <div className="stage-frame" ref={frameRef}>
      <div className="stage-frame__bar">
        <div className="stage-frame__title">
          <strong>{title}</strong>
          <span>{hint}</span>
        </div>
        <div className="stage-frame__badges">{badges}</div>
        <div className="stage-frame__actions">
          <button
            type="button"
            className="icon-button icon-button--on-dark"
            onClick={saveSnapshot}
            aria-label={copy.snapshot}
            title={copy.snapshot}
          >
            <Icon name="camera" />
          </button>
          {canFullscreen ? (
            <button
              type="button"
              className="icon-button icon-button--on-dark"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? copy.exitFullscreen : copy.fullscreen}
              title={isFullscreen ? copy.exitFullscreen : copy.fullscreen}
            >
              <Icon name={isFullscreen ? 'shrink' : 'expand'} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="stage-frame__canvas">{children}</div>
      {footer ? <div className="stage-frame__footer">{footer}</div> : null}
      <PlaybackBar copy={copy} locale={locale} />
    </div>
  )
}
