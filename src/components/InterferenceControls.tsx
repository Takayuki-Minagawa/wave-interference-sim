import type { CSSProperties } from 'react'

import type { UiCopy } from '../data/translations'
import { MAX_SOURCES, interferencePresets } from '../data/wavePresets'
import type { InterferenceStateModel } from '../hooks/useInterferenceState'
import { formatNumber, resolveText } from '../lib/format'
import { COLOR_MAP_IDS, getColorMapGradient, getWaveSpeed } from '../lib/waveMath'
import type { Locale, RenderQuality } from '../types'
import { Icon } from './Icon'
import { Section, Segmented, Slider, Switch } from './ui'

interface InterferenceControlsProps {
  copy: UiCopy
  locale: Locale
  state: InterferenceStateModel
}

const PHASE_SHORTCUTS = [
  { value: 0, label: '0' },
  { value: Math.PI / 2, label: 'π/2' },
  { value: Math.PI, label: 'π' },
]

const formatPhase = (phase: number, locale: Locale) => {
  const ratio = phase / Math.PI
  if (Math.abs(ratio) < 0.005) {
    return '0'
  }
  return `${formatNumber(ratio, locale, 2)}π`
}

export function InterferenceControls({ copy, locale, state }: InterferenceControlsProps) {
  const { settings } = state
  const selectedIndex = settings.sources.findIndex((source) => source.id === state.selectedSourceId)
  const selected = settings.sources[selectedIndex]

  return (
    <div className="controls">
      <Section title={copy.presets}>
        <div className="preset-grid">
          {interferencePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                state.selectedPresetId === preset.id ? 'preset-card is-active' : 'preset-card'
              }
              aria-pressed={state.selectedPresetId === preset.id}
              onClick={() => state.applyPreset(preset.id)}
            >
              <span className="preset-card__dots" aria-hidden="true">
                {preset.sources.map((source) => (
                  <i key={source.id} style={{ background: source.accent }} />
                ))}
              </span>
              <strong>{resolveText(preset.title, locale)}</strong>
              <span>{resolveText(preset.description, locale)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={copy.sources}>
        <div className="source-tabs" role="tablist" aria-label={copy.sources}>
          {settings.sources.map((source, index) => (
            <button
              key={source.id}
              type="button"
              role="tab"
              aria-selected={source.id === state.selectedSourceId}
              className={[
                'source-tab',
                source.id === state.selectedSourceId ? 'is-active' : '',
                source.enabled ? '' : 'is-muted',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--accent': source.accent } as CSSProperties}
              onClick={() => state.setSelectedSourceId(source.id)}
            >
              <span className="source-tab__dot">{index + 1}</span>
              <span className="source-tab__label">
                {copy.sourceLabel} {index + 1}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="source-tab source-tab--add"
            onClick={state.addSource}
            disabled={settings.sources.length >= MAX_SOURCES}
            aria-label={copy.addSource}
            title={copy.addSource}
          >
            <Icon name="plus" size={18} />
          </button>
        </div>

        <Switch
          label={
            <>
              <Icon name="link" size={16} /> {copy.linkSources}
            </>
          }
          checked={settings.linkSources}
          onChange={(linkSources) =>
            state.setSettings((previous) => ({
              ...previous,
              linkSources,
              sources: linkSources
                ? previous.sources.map((source) => ({
                    ...source,
                    wavelength: previous.sources[0].wavelength,
                    frequency: previous.sources[0].frequency,
                  }))
                : previous.sources,
            }))
          }
        />

        {selected ? (
          <article className="source-card" style={{ '--accent': selected.accent } as CSSProperties}>
            <header className="source-card__head">
              <span className="source-card__dot">{selectedIndex + 1}</span>
              <strong>
                {copy.sourceLabel} {selectedIndex + 1}
              </strong>
              <label className="mini-switch" title={copy.sourceEnabled}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={selected.enabled}
                  onChange={() => state.toggleSource(selected.id)}
                  aria-label={copy.sourceEnabled}
                />
                <span className="switch" aria-hidden="true" />
              </label>
              <button
                type="button"
                className="icon-button icon-button--ghost icon-button--sm"
                onClick={() => state.removeSource(selected.id)}
                disabled={settings.sources.length <= 1}
                aria-label={copy.removeSource}
                title={copy.removeSource}
              >
                <Icon name="trash" size={18} />
              </button>
            </header>

            <Slider
              label={copy.wavelength}
              valueLabel={`${formatNumber(selected.wavelength, locale, 1)} cm`}
              value={selected.wavelength}
              min={4}
              max={16}
              step={0.1}
              accent={selected.accent}
              onChange={(value) => state.updateSource(selected.id, 'wavelength', value)}
            />
            <Slider
              label={copy.frequency}
              valueLabel={`${formatNumber(selected.frequency, locale, 2)} Hz`}
              value={selected.frequency}
              min={0.35}
              max={1.8}
              step={0.01}
              accent={selected.accent}
              onChange={(value) => state.updateSource(selected.id, 'frequency', value)}
            />
            <Slider
              label={copy.amplitude}
              valueLabel={formatNumber(selected.amplitude, locale, 2)}
              value={selected.amplitude}
              min={0.2}
              max={1.6}
              step={0.01}
              accent={selected.accent}
              onChange={(value) => state.updateSource(selected.id, 'amplitude', value)}
            />
            <Slider
              label={copy.phase}
              valueLabel={formatPhase(selected.phase, locale)}
              value={selected.phase}
              min={-Math.PI}
              max={Math.PI}
              step={Math.PI / 24}
              accent={selected.accent}
              onChange={(value) => state.updateSource(selected.id, 'phase', value)}
            />
            <div className="chip-row">
              {PHASE_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  className={
                    Math.abs(selected.phase - shortcut.value) < 0.01 ? 'chip is-active' : 'chip'
                  }
                  onClick={() => state.updateSource(selected.id, 'phase', shortcut.value)}
                >
                  φ = {shortcut.label}
                </button>
              ))}
            </div>
            <div className="source-card__speed">
              <span>{copy.speedLabel}</span>
              <strong>
                {formatNumber(getWaveSpeed(selected.wavelength, selected.frequency), locale, 1)}{' '}
                cm/s
              </strong>
            </div>
          </article>
        ) : null}
      </Section>

      <Section title={copy.display}>
        <div className="field">
          <span className="field__label">{copy.viewMode}</span>
          <Segmented
            label={copy.viewMode}
            value={settings.viewMode}
            onChange={(viewMode) => state.setSettings((previous) => ({ ...previous, viewMode }))}
            options={[
              { value: 'wave', label: copy.viewWave },
              { value: 'intensity', label: copy.viewIntensity },
            ]}
          />
        </div>

        <div className="field">
          <span className="field__label">{copy.guides}</span>
          <div className="switch-list">
            <Switch
              label={copy.constructiveLines}
              swatch="#ffd84d"
              checked={settings.showConstructive}
              onChange={(showConstructive) =>
                state.setSettings((previous) => ({ ...previous, showConstructive }))
              }
            />
            <Switch
              label={copy.destructiveLines}
              swatch="#ff5fa8"
              checked={settings.showDestructive}
              onChange={(showDestructive) =>
                state.setSettings((previous) => ({ ...previous, showDestructive }))
              }
            />
            <Switch
              label={copy.wavefronts}
              swatch="linear-gradient(90deg, #ff8c61, #4cc7d9)"
              checked={settings.showWavefronts}
              onChange={(showWavefronts) =>
                state.setSettings((previous) => ({ ...previous, showWavefronts }))
              }
            />
          </div>
        </div>

        <div className="field">
          <span className="field__label">{copy.colorMap}</span>
          <div className="swatch-grid" role="radiogroup" aria-label={copy.colorMap}>
            {COLOR_MAP_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={settings.colorMap === id}
                className={settings.colorMap === id ? 'swatch is-active' : 'swatch'}
                onClick={() => state.setSettings((previous) => ({ ...previous, colorMap: id }))}
              >
                <span className="swatch__bar" style={{ background: getColorMapGradient(id) }} />
                <span>{copy.colorMapNames[id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">{copy.quality}</span>
          <Segmented<RenderQuality>
            label={copy.quality}
            value={settings.quality}
            onChange={(quality) => state.setSettings((previous) => ({ ...previous, quality }))}
            options={(['high', 'standard', 'light'] as const).map((quality) => ({
              value: quality,
              label: copy.qualityNames[quality],
            }))}
          />
        </div>
      </Section>
    </div>
  )
}
