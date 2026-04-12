import { interferencePresets } from '../data/wavePresets'
import type { UiCopy } from '../data/translations'
import { formatNumber, resolveText } from '../lib/format'
import { getWaveSpeed } from '../lib/waveMath'
import type { ColorMapId, Locale, WaveSource } from '../types'
import type { InterferenceStateModel } from '../hooks/useInterferenceState'

interface InterferenceControlsProps {
  copy: UiCopy
  locale: Locale
  state: InterferenceStateModel
}

export function InterferenceControls({
  copy,
  locale,
  state,
}: InterferenceControlsProps) {
  const selectedSourceIndex = state.settings.sources.findIndex(
    (source) => source.id === state.selectedSourceId,
  )

  const updateSource = (
    sourceId: string,
    field: keyof Pick<WaveSource, 'wavelength' | 'frequency' | 'amplitude' | 'phase'>,
    value: number,
  ) => {
    state.updateSource(sourceId, field, value)
  }

  return (
    <>
      <section className="panel-block">
        <div className="panel-block__title">{copy.presets}</div>
        <div className="preset-list">
          {interferencePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                state.selectedPresetId === preset.id
                  ? 'preset-button is-active'
                  : 'preset-button'
              }
              onClick={() => state.applyPreset(preset.id)}
            >
              <strong>{resolveText(preset.title, locale)}</strong>
              <span>{resolveText(preset.description, locale)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.sourceCount}</div>
        <div className="inline-actions">
          <button
            type="button"
            onClick={state.addSource}
            disabled={state.settings.sources.length >= 4}
          >
            {copy.addSource}
          </button>
          <button
            type="button"
            onClick={state.removeSource}
            disabled={state.settings.sources.length <= 1}
          >
            {copy.removeSource}
          </button>
        </div>
        <p className="panel-note">
          {copy.selectedSource}:{' '}
          {selectedSourceIndex >= 0 ? selectedSourceIndex + 1 : copy.noSelectedSource}
        </p>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.sourceParameters}</div>
        <div className="source-list">
          {state.settings.sources.map((source, index) => (
            <article key={source.id} className="source-card">
              <header>
                <button
                  type="button"
                  className={
                    state.selectedSourceId === source.id
                      ? 'source-select-button is-active'
                      : 'source-select-button'
                  }
                  onClick={() => state.setSelectedSourceId(source.id)}
                >
                  <span
                    className="source-chip"
                    style={{ backgroundColor: source.accent }}
                  />
                  <strong>
                    {copy.sourceLabel} {index + 1}
                  </strong>
                </button>
              </header>

              <label className="range-row">
                <span>
                  {copy.wavelength}: {formatNumber(source.wavelength, locale, 2)}
                </span>
                <input
                  type="range"
                  min={4}
                  max={16}
                  step={0.1}
                  value={source.wavelength}
                  onChange={(event) =>
                    updateSource(source.id, 'wavelength', Number(event.target.value))
                  }
                />
              </label>

              <label className="range-row">
                <span>
                  {copy.frequency}: {formatNumber(source.frequency, locale, 2)} Hz
                </span>
                <input
                  type="range"
                  min={0.35}
                  max={1.8}
                  step={0.01}
                  value={source.frequency}
                  onChange={(event) =>
                    updateSource(source.id, 'frequency', Number(event.target.value))
                  }
                />
              </label>

              <label className="range-row">
                <span>
                  {copy.amplitude}: {formatNumber(source.amplitude, locale, 2)}
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={1.6}
                  step={0.01}
                  value={source.amplitude}
                  onChange={(event) =>
                    updateSource(source.id, 'amplitude', Number(event.target.value))
                  }
                />
              </label>

              <label className="range-row">
                <span>
                  {copy.phase}: {formatNumber(source.phase / Math.PI, locale, 2)}π
                </span>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01}
                  value={source.phase}
                  onChange={(event) =>
                    updateSource(source.id, 'phase', Number(event.target.value))
                  }
                />
              </label>

              <div className="metric-line">
                <span>{copy.speedLabel}</span>
                <strong>
                  {formatNumber(
                    getWaveSpeed(source.wavelength, source.frequency),
                    locale,
                    2,
                  )}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.overlays}</div>
        <div className="toggle-grid">
          <label className="toggle-card">
            <input
              type="checkbox"
              checked={state.settings.showConstructive}
              onChange={(event) =>
                state.setSettings((previous) => ({
                  ...previous,
                  showConstructive: event.target.checked,
                }))
              }
            />
            <span>{copy.constructiveLines}</span>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              checked={state.settings.showDestructive}
              onChange={(event) =>
                state.setSettings((previous) => ({
                  ...previous,
                  showDestructive: event.target.checked,
                }))
              }
            />
            <span>{copy.destructiveLines}</span>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              checked={state.settings.showWavefronts}
              onChange={(event) =>
                state.setSettings((previous) => ({
                  ...previous,
                  showWavefronts: event.target.checked,
                }))
              }
            />
            <span>{copy.wavefronts}</span>
          </label>
        </div>

        <label className="field-row">
          <span>{copy.colorMap}</span>
          <select
            value={state.settings.colorMap}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                colorMap: event.target.value as ColorMapId,
              }))
            }
          >
            <option value="thermal">{copy.thermal}</option>
            <option value="grayscale">{copy.grayscale}</option>
            <option value="spectral">{copy.spectral}</option>
          </select>
        </label>

        <label className="range-row">
          <span>
            {copy.resolution}: {formatNumber(state.settings.resolution, locale, 0)}
          </span>
          <input
            type="range"
            min={5}
            max={16}
            step={1}
            value={state.settings.resolution}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                resolution: Number(event.target.value),
              }))
            }
          />
        </label>

        <p className="panel-note">{copy.dragHint}</p>
        <p className="panel-note">{copy.clickHint}</p>
        <p className="panel-note">{copy.keyboardHint}</p>
      </section>
    </>
  )
}
