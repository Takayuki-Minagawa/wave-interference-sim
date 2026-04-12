import { standingPresets } from '../data/wavePresets'
import type { UiCopy } from '../data/translations'
import { formatNumber, resolveText } from '../lib/format'
import type { BoundaryCondition, Locale } from '../types'
import type { StandingWaveStateModel } from '../hooks/useStandingWaveState'

interface StandingWaveControlsProps {
  copy: UiCopy
  locale: Locale
  state: StandingWaveStateModel
}

export function StandingWaveControls({
  copy,
  locale,
  state,
}: StandingWaveControlsProps) {
  return (
    <>
      <section className="panel-block">
        <div className="panel-block__title">{copy.presets}</div>
        <div className="preset-list">
          {standingPresets.map((preset) => (
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
        <div className="panel-block__title">{copy.standingPresetLabel}</div>
        <div className="mode-number-list">
          {[1, 2, 3, 4, 5, 6].map((modeIndex) => {
            const ratio =
              state.settings.boundary === 'fixed-free' ? 2 * modeIndex - 1 : modeIndex

            return (
              <button
                key={modeIndex}
                type="button"
                className={state.settings.modeIndex === modeIndex ? 'is-active' : ''}
                onClick={() =>
                  state.setSettings((previous) => ({
                    ...previous,
                    modeIndex,
                  }))
                }
              >
                {state.settings.boundary === 'fixed-free'
                  ? `${modeIndex} (${ratio}f₁)`
                  : `${modeIndex}f₁`}
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel-block">
        <div className="panel-block__title">{copy.sourceParameters}</div>
        <label className="range-row">
          <span>
            {copy.length}: {formatNumber(state.settings.length, locale, 2)} m
          </span>
          <input
            type="range"
            min={0.6}
            max={2}
            step={0.01}
            value={state.settings.length}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                length: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="range-row">
          <span>
            {copy.tension}: {formatNumber(state.settings.tension, locale, 1)} N
          </span>
          <input
            type="range"
            min={15}
            max={120}
            step={1}
            value={state.settings.tension}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                tension: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="range-row">
          <span>
            {copy.density}: {formatNumber(state.settings.linearDensity, locale, 3)} kg/m
          </span>
          <input
            type="range"
            min={0.005}
            max={0.04}
            step={0.001}
            value={state.settings.linearDensity}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                linearDensity: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="range-row">
          <span>
            {copy.amplitude}: {formatNumber(state.settings.amplitude, locale, 2)}
          </span>
          <input
            type="range"
            min={0.1}
            max={0.55}
            step={0.01}
            value={state.settings.amplitude}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                amplitude: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="range-row">
          <span>
            {copy.phaseOffset}:{' '}
            {formatNumber(state.settings.phaseOffset / Math.PI, locale, 2)}π
          </span>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={state.settings.phaseOffset}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                phaseOffset: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="field-row">
          <span>{copy.boundary}</span>
          <select
            value={state.settings.boundary}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                boundary: event.target.value as BoundaryCondition,
                modeIndex: 1,
              }))
            }
          >
            <option value="fixed-fixed">{copy.fixedFixed}</option>
            <option value="fixed-free">{copy.fixedFree}</option>
            <option value="free-free">{copy.freeFree}</option>
          </select>
        </label>

        <label className="toggle-card toggle-card--inline">
          <input
            type="checkbox"
            checked={state.settings.showSnapshots}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                showSnapshots: event.target.checked,
              }))
            }
          />
          <span>{copy.showSnapshots}</span>
        </label>

        <label className="range-row">
          <span>
            {copy.snapshotCount}: {formatNumber(state.settings.snapshotCount, locale, 0)}
          </span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={state.settings.snapshotCount}
            onChange={(event) =>
              state.setSettings((previous) => ({
                ...previous,
                snapshotCount: Number(event.target.value),
              }))
            }
          />
        </label>

        <p className="panel-note">{copy.standingNote}</p>
      </section>
    </>
  )
}
