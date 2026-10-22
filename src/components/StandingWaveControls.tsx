import type { UiCopy } from '../data/translations'
import { standingPresets } from '../data/wavePresets'
import type { StandingWaveStateModel } from '../hooks/useStandingWaveState'
import { formatNumber, resolveText } from '../lib/format'
import {
  STANDING_MODE_COUNT,
  clamp,
  getMaxDriveFrequency,
  getMinDriveFrequency,
  getStandingModeRatio,
} from '../lib/waveMath'
import type { BoundaryCondition, Locale, StandingDriveMode } from '../types'
import { Section, Segmented, Slider, Switch } from './ui'

interface StandingWaveControlsProps {
  copy: UiCopy
  locale: Locale
  state: StandingWaveStateModel
}

function BoundaryGlyph({ boundary }: { boundary: BoundaryCondition }) {
  const leftFree = boundary === 'free-free'
  const rightFree = boundary !== 'fixed-fixed'
  const path =
    boundary === 'fixed-fixed'
      ? 'M10 16 Q32 2 54 16'
      : boundary === 'fixed-free'
        ? 'M10 16 Q38 16 54 4'
        : 'M10 4 Q32 28 54 4'

  return (
    <svg viewBox="0 0 64 32" className="boundary-glyph" aria-hidden="true">
      {leftFree ? (
        <>
          <line x1="10" y1="2" x2="10" y2="30" className="boundary-glyph__rod" />
          <circle cx="10" cy="4" r="3" className="boundary-glyph__ring" />
        </>
      ) : (
        <rect x="5" y="2" width="5" height="28" className="boundary-glyph__wall" />
      )}
      {rightFree ? (
        <>
          <line x1="54" y1="2" x2="54" y2="30" className="boundary-glyph__rod" />
          <circle cx="54" cy="4" r="3" className="boundary-glyph__ring" />
        </>
      ) : (
        <rect x="54" y="2" width="5" height="28" className="boundary-glyph__wall" />
      )}
      <path d={path} className="boundary-glyph__string" />
    </svg>
  )
}

function ModeGlyph({ ratio, boundary }: { ratio: number; boundary: BoundaryCondition }) {
  const points = Array.from({ length: 41 }, (_, index) => {
    const x = index / 40
    const shape =
      boundary === 'fixed-fixed'
        ? Math.sin(ratio * Math.PI * x)
        : boundary === 'fixed-free'
          ? Math.sin((ratio * Math.PI * x) / 2)
          : Math.cos(ratio * Math.PI * x)
    return `${(4 + x * 40).toFixed(1)},${(10 - shape * 7).toFixed(1)}`
  })
  const mirrored = points.map((point) => {
    const [x, y] = point.split(',').map(Number)
    return `${x},${(20 - y).toFixed(1)}`
  })

  return (
    <svg viewBox="0 0 48 20" className="mode-glyph" aria-hidden="true">
      <polyline points={mirrored.join(' ')} className="mode-glyph__ghost" />
      <polyline points={points.join(' ')} className="mode-glyph__line" />
    </svg>
  )
}

export function StandingWaveControls({ copy, locale, state }: StandingWaveControlsProps) {
  const { settings, summary } = state
  const isDriven = settings.driveMode === 'driven'
  const minDrive = getMinDriveFrequency(settings)
  const maxDrive = getMaxDriveFrequency(settings)
  const driveFrequency = clamp(settings.driveFrequency, minDrive, maxDrive)
  const nudge = (delta: number) =>
    state.updateSettings({ driveFrequency: clamp(driveFrequency + delta, minDrive, maxDrive) })

  return (
    <div className="controls">
      <Section title={copy.presets}>
        <div className="preset-grid">
          {standingPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                state.selectedPresetId === preset.id ? 'preset-card is-active' : 'preset-card'
              }
              aria-pressed={state.selectedPresetId === preset.id}
              onClick={() => state.applyPreset(preset.id)}
            >
              <ModeGlyph
                ratio={getStandingModeRatio(preset.settings.boundary, preset.settings.modeIndex)}
                boundary={preset.settings.boundary}
              />
              <strong>{resolveText(preset.title, locale)}</strong>
              <span>{resolveText(preset.description, locale)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={copy.driveMode}>
        <Segmented<StandingDriveMode>
          label={copy.driveMode}
          value={settings.driveMode}
          onChange={(driveMode) => state.updateSettings({ driveMode })}
          options={[
            { value: 'natural', label: copy.natural },
            { value: 'driven', label: copy.driven },
          ]}
        />

        {isDriven ? (
          <div className="drive-box">
            <Slider
              label={copy.driveFrequency}
              valueLabel={`${formatNumber(driveFrequency, locale, 1)} Hz`}
              value={driveFrequency}
              min={minDrive}
              max={maxDrive}
              step={0.1}
              onChange={(value) => state.updateSettings({ driveFrequency: value })}
            />
            <div className="fine-tune" role="group" aria-label={copy.fineTune}>
              <span>{copy.fineTune}</span>
              {[-1, -0.1, 0.1, 1].map((delta) => (
                <button key={delta} type="button" className="chip" onClick={() => nudge(delta)}>
                  {delta > 0 ? '+' : '−'}
                  {Math.abs(delta)}
                </button>
              ))}
            </div>
            <p className="hint-text">
              {copy.nearMode(
                `${copy.harmonic(summary.nearestResonanceRatio)} (${formatNumber(summary.nearestResonanceFrequency, locale, 1)} Hz)`,
              )}
            </p>
          </div>
        ) : (
          <div className="field">
            <span className="field__label">{copy.modeNumber}</span>
            <div className="mode-grid">
              {Array.from({ length: STANDING_MODE_COUNT }, (_, index) => index + 1).map(
                (modeIndex) => {
                  const ratio = getStandingModeRatio(settings.boundary, modeIndex)
                  return (
                    <button
                      key={modeIndex}
                      type="button"
                      aria-pressed={settings.modeIndex === modeIndex}
                      className={
                        settings.modeIndex === modeIndex ? 'mode-button is-active' : 'mode-button'
                      }
                      onClick={() => state.updateSettings({ modeIndex })}
                    >
                      <ModeGlyph ratio={ratio} boundary={settings.boundary} />
                      <span>{copy.harmonic(ratio)}</span>
                    </button>
                  )
                },
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title={copy.boundary}>
        <div className="boundary-grid" role="radiogroup" aria-label={copy.boundary}>
          {(
            [
              ['fixed-fixed', copy.fixedFixed, copy.fixedFixedDesc],
              ['fixed-free', copy.fixedFree, copy.fixedFreeDesc],
              ['free-free', copy.freeFree, copy.freeFreeDesc],
            ] as const
          ).map(([boundary, label, description]) => (
            <button
              key={boundary}
              type="button"
              role="radio"
              aria-checked={settings.boundary === boundary}
              className={
                settings.boundary === boundary ? 'boundary-card is-active' : 'boundary-card'
              }
              onClick={() => state.updateSettings({ boundary, modeIndex: 1 })}
            >
              <BoundaryGlyph boundary={boundary} />
              <strong>{label}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={copy.stringParams}>
        <Slider
          label={copy.length}
          valueLabel={`${formatNumber(settings.length, locale, 2)} m`}
          value={settings.length}
          min={0.6}
          max={2}
          step={0.01}
          onChange={(length) => state.updateSettings({ length })}
        />
        <Slider
          label={copy.tension}
          valueLabel={`${formatNumber(settings.tension, locale, 0)} N`}
          value={settings.tension}
          min={15}
          max={120}
          step={1}
          onChange={(tension) => state.updateSettings({ tension })}
        />
        <Slider
          label={copy.density}
          valueLabel={`${formatNumber(settings.linearDensity * 1000, locale, 0)} g/m`}
          value={settings.linearDensity}
          min={0.005}
          max={0.04}
          step={0.001}
          onChange={(linearDensity) => state.updateSettings({ linearDensity })}
        />
        <Slider
          label={copy.stringAmplitude}
          valueLabel={formatNumber(settings.amplitude, locale, 2)}
          value={settings.amplitude}
          min={0.1}
          max={0.55}
          step={0.01}
          onChange={(amplitude) => state.updateSettings({ amplitude })}
        />
      </Section>

      <Section title={copy.display}>
        <div className="switch-list">
          {!isDriven ? (
            <Switch
              label={copy.showTraveling}
              swatch="linear-gradient(90deg, #5fd4e0 50%, #ff8f73 50%)"
              checked={settings.showTraveling}
              onChange={(showTraveling) => state.updateSettings({ showTraveling }, true)}
            />
          ) : null}
          <Switch
            label={copy.showSnapshots}
            checked={settings.showSnapshots}
            onChange={(showSnapshots) => state.updateSettings({ showSnapshots }, true)}
          />
          <Switch
            label={copy.showLabels}
            checked={settings.showLabels}
            onChange={(showLabels) => state.updateSettings({ showLabels }, true)}
          />
        </div>
      </Section>
    </div>
  )
}
