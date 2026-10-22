import { useRef } from 'react'

import type { UiCopy } from '../data/translations'
import type { InterferenceStateModel } from '../hooks/useInterferenceState'
import { formatNumber } from '../lib/format'
import { getClassLabel } from '../lib/labels'
import { getColorMapGradient } from '../lib/waveMath'
import type { InterferenceClass, Locale } from '../types'
import { Icon } from './Icon'
import { InterferenceCanvas } from './InterferenceCanvas'
import { SignalChart } from './SignalChart'
import { Stage } from './Stage'
import { Segmented } from './ui'

interface InterferenceViewProps {
  copy: UiCopy
  locale: Locale
  state: InterferenceStateModel
  onSaved: () => void
}

const CHART_ACCENT: Record<InterferenceClass, string> = {
  constructive: '#f5b400',
  destructive: '#ef4f9b',
  mixed: '#3b9fe0',
  unavailable: '#3b9fe0',
}

export function InterferenceView({ copy, locale, state, onSaved }: InterferenceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { settings, summary } = state
  const classLabel = getClassLabel(summary.classification, copy)
  const isIntensity = settings.viewMode === 'intensity'
  const lambda = summary.representativeWavelength
  const hasPhaseShift = summary.phaseDifference !== null && Math.abs(summary.phaseDifference) > 0.01

  return (
    <>
      <Stage
        copy={copy}
        locale={locale}
        title={copy.modeInterferenceLong}
        hint={copy.stageHintInterference}
        canvasRef={canvasRef}
        fileName="wave-lab-interference"
        onSaved={onSaved}
        footer={
          <>
            <div className="legend" aria-hidden="true">
              <span>{isIntensity ? copy.legendQuiet : copy.legendTrough}</span>
              <span
                className="legend__bar"
                style={{ background: getColorMapGradient(settings.colorMap) }}
              />
              <span>{isIntensity ? copy.legendLoud : copy.legendCrest}</span>
            </div>
            <Segmented
              label={copy.viewMode}
              size="sm"
              className="segmented--on-dark"
              value={settings.viewMode}
              onChange={(viewMode) => state.setSettings((previous) => ({ ...previous, viewMode }))}
              options={[
                { value: 'wave', label: copy.viewWave },
                { value: 'intensity', label: copy.viewIntensity },
              ]}
            />
          </>
        }
      >
        <InterferenceCanvas
          settings={settings}
          classification={summary.classification}
          classificationLabel={classLabel}
          setSources={state.setSources}
          onProbePointChange={state.setProbePoint}
          selectedSourceId={state.selectedSourceId}
          onSelectedSourceChange={state.setSelectedSourceId}
          onMoveSelectedSource={state.moveSelectedSource}
          ariaLabel={copy.interferenceCanvasAria}
          errorMessage={copy.canvasUnsupported}
          canvasRef={canvasRef}
        />
      </Stage>

      <section className="readout card" aria-live="polite">
        <header className="readout__head">
          <h2>
            <Icon name="target" size={18} />
            {copy.probeTitle}
          </h2>
          {settings.probePoint ? (
            <button type="button" className="text-button" onClick={() => state.setProbePoint(null)}>
              {copy.clearProbe}
            </button>
          ) : null}
        </header>

        {!settings.probePoint ? (
          <p className="readout__empty">
            <span className="tap-ripple" aria-hidden="true" />
            {copy.probeEmpty}
          </p>
        ) : (
          <div className="readout__body">
            <div className="readout__stats">
              {summary.distances ? (
                <>
                  <div className={`verdict verdict--${summary.classification}`}>
                    <span>{copy.classification}</span>
                    <strong>{classLabel}</strong>
                  </div>
                  <div className="stat">
                    <span>{copy.distance1}</span>
                    <strong>{formatNumber(summary.distances[0], locale, 1)} cm</strong>
                  </div>
                  <div className="stat">
                    <span>{copy.distance2}</span>
                    <strong>{formatNumber(summary.distances[1], locale, 1)} cm</strong>
                  </div>
                  <div className="stat">
                    <span>{copy.pathDifference}</span>
                    <strong>
                      {formatNumber(summary.pathDifference ?? 0, locale, 1)} cm
                      {lambda ? (
                        <small>
                          {' '}
                          = {formatNumber((summary.pathDifference ?? 0) / lambda, locale, 2)}λ
                        </small>
                      ) : null}
                    </strong>
                  </div>
                  {hasPhaseShift && summary.phaseRatio !== null ? (
                    <div className="stat">
                      <span>{copy.phaseRatio}</span>
                      <strong>{formatNumber(Math.abs(summary.phaseRatio), locale, 2)}</strong>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="readout__empty">{copy.probeNeedsTwo}</p>
              )}
            </div>
            <SignalChart
              title={copy.chartTitle}
              probePoint={settings.probePoint}
              sources={settings.sources}
              accent={CHART_ACCENT[summary.classification]}
            />
          </div>
        )}
      </section>
    </>
  )
}
