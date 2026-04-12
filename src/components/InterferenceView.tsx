import { SignalChart } from './SignalChart'
import { InterferenceCanvas } from './InterferenceCanvas'
import type { UiCopy } from '../data/translations'
import { formatNumber, formatNumberWithUnit } from '../lib/format'
import type { Locale } from '../types'
import type { InterferenceStateModel } from '../hooks/useInterferenceState'

interface InterferenceViewProps {
  copy: UiCopy
  locale: Locale
  time: number
  state: InterferenceStateModel
}

const getClassLabel = (
  classification: InterferenceStateModel['summary']['classification'],
  copy: UiCopy,
) => {
  switch (classification) {
    case 'constructive':
      return copy.constructive
    case 'destructive':
      return copy.destructive
    case 'mixed':
      return copy.mixed
    default:
      return copy.unavailable
  }
}

export function InterferenceView({
  copy,
  locale,
  time,
  state,
}: InterferenceViewProps) {
  return (
    <>
      <div className="metric-grid">
        <article className="metric-card">
          <span>{copy.metricSources}</span>
          <strong>{state.summary.sourceCount}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.metricPattern}</span>
          <strong>
            {state.summary.stablePattern ? copy.stablePattern : copy.driftingPattern}
          </strong>
        </article>
        <article className="metric-card">
          <span>{copy.classification}</span>
          <strong>{getClassLabel(state.summary.classification, copy)}</strong>
        </article>
      </div>

      <InterferenceCanvas
        sources={state.settings.sources}
        time={time}
        colorMap={state.settings.colorMap}
        resolution={state.settings.resolution}
        showConstructive={state.settings.showConstructive}
        showDestructive={state.settings.showDestructive}
        showWavefronts={state.settings.showWavefronts}
        probePoint={state.settings.probePoint}
        setSources={state.setSources}
        onProbePointChange={state.setProbePoint}
        selectedSourceId={state.selectedSourceId}
        onSelectedSourceChange={state.setSelectedSourceId}
        onMoveSelectedSource={state.moveSelectedSource}
        ariaLabel={copy.interferenceCanvasAria}
        errorMessage={copy.canvasUnsupported}
      />

      <div className="info-grid">
        <article className="info-card">
          <span>{copy.probePoint}</span>
          <strong>
            {state.settings.probePoint
              ? `(${formatNumber(state.settings.probePoint.x, locale, 1)}, ${formatNumber(state.settings.probePoint.y, locale, 1)})`
              : copy.noProbePoint}
          </strong>
        </article>
        <article className="info-card">
          <span>{copy.pathDifference}</span>
          <strong>
            {state.summary.pathDifference !== null
              ? formatNumberWithUnit(state.summary.pathDifference, locale, '', 2)
              : copy.unavailable}
          </strong>
        </article>
        <article className="info-card">
          <span>{copy.speedLabel}</span>
          <strong>{formatNumber(state.summary.averageSpeed, locale, 2)}</strong>
        </article>
      </div>

      <SignalChart
        title={copy.chartTitle}
        emptyLabel={copy.chartEmpty}
        samples={state.probeSamples}
        accent="#ffd36b"
      />
    </>
  )
}
