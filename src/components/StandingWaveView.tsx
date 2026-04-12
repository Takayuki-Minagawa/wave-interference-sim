import { StandingWaveCanvas } from './StandingWaveCanvas'
import type { UiCopy } from '../data/translations'
import {
  formatNumber,
  formatNumberWithUnit,
  formatPositionList,
} from '../lib/format'
import type { Locale, Theme } from '../types'
import type { StandingWaveStateModel } from '../hooks/useStandingWaveState'

interface StandingWaveViewProps {
  copy: UiCopy
  locale: Locale
  theme: Theme
  time: number
  state: StandingWaveStateModel
}

const getBoundaryLabel = (
  boundary: StandingWaveStateModel['summary']['boundary'],
  copy: UiCopy,
) => {
  switch (boundary) {
    case 'fixed-free':
      return copy.fixedFree
    case 'free-free':
      return copy.freeFree
    case 'fixed-fixed':
    default:
      return copy.fixedFixed
  }
}

export function StandingWaveView({
  copy,
  locale,
  theme,
  time,
  state,
}: StandingWaveViewProps) {
  return (
    <>
      <div className="metric-grid">
        <article className="metric-card">
          <span>{copy.ratio}</span>
          <strong>{formatNumber(state.summary.modeRatio, locale, 0)}x</strong>
        </article>
        <article className="metric-card">
          <span>{copy.metricNodes}</span>
          <strong>{state.summary.nodePositions.length}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.metricAntinodes}</span>
          <strong>{state.summary.antinodePositions.length}</strong>
        </article>
      </div>

      <StandingWaveCanvas
        settings={state.settings}
        time={time}
        theme={theme}
        ariaLabel={copy.standingCanvasAria}
        errorMessage={copy.canvasUnsupported}
      />

      <div className="info-grid info-grid--2col">
        <article className="info-card">
          <span>{copy.boundary}</span>
          <strong>{getBoundaryLabel(state.summary.boundary, copy)}</strong>
        </article>
        <article className="info-card">
          <span>{copy.currentFrequency}</span>
          <strong>{formatNumberWithUnit(state.summary.frequency, locale, 'Hz', 2)}</strong>
        </article>
        <article className="info-card">
          <span>{copy.waveSpeed}</span>
          <strong>{formatNumberWithUnit(state.summary.waveSpeed, locale, 'm/s', 2)}</strong>
        </article>
        <article className="info-card">
          <span>{copy.standingWavelength}</span>
          <strong>{formatNumberWithUnit(state.summary.wavelength, locale, 'm', 2)}</strong>
        </article>
        <article className="info-card info-card--wide">
          <span>{copy.nodeList}</span>
          <strong>{formatPositionList(state.summary.nodePositions, locale)}</strong>
        </article>
        <article className="info-card info-card--wide">
          <span>{copy.antinodeList}</span>
          <strong>{formatPositionList(state.summary.antinodePositions, locale)}</strong>
        </article>
      </div>
    </>
  )
}
