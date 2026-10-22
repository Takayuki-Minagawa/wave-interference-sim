import { useRef } from 'react'

import { RESONANCE_SUCCESS } from '../data/missions'
import type { UiCopy } from '../data/translations'
import type { StandingWaveStateModel } from '../hooks/useStandingWaveState'
import { formatNumber } from '../lib/format'
import { Icon } from './Icon'
import { ResonanceSpectrum } from './ResonanceSpectrum'
import { Stage } from './Stage'
import { StandingWaveCanvas } from './StandingWaveCanvas'
import type { Locale } from '../types'

interface StandingWaveViewProps {
  copy: UiCopy
  locale: Locale
  state: StandingWaveStateModel
  onSaved: () => void
}

export function StandingWaveView({ copy, locale, state, onSaved }: StandingWaveViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { settings, summary } = state
  const isDriven = settings.driveMode === 'driven'
  const isHit = summary.resonanceLevel >= RESONANCE_SUCCESS
  const lengthFactor = settings.boundary === 'fixed-free' ? 4 : 2
  const fmt = (value: number, digits = 1) => formatNumber(value, locale, digits)

  return (
    <>
      <Stage
        copy={copy}
        locale={locale}
        title={copy.modeStandingLong}
        hint={copy.stageHintStanding}
        canvasRef={canvasRef}
        fileName="wave-lab-standing"
        onSaved={onSaved}
        badges={
          <span
            className="badge badge--on-dark"
            title={copy.slowMotion(fmt(summary.slowMotionFactor, 0))}
          >
            {copy.slowMotion(fmt(summary.slowMotionFactor, 0))}
          </span>
        }
        footer={
          isDriven ? (
            <div className={isHit ? 'resonance-meter is-hit' : 'resonance-meter'}>
              <span className="resonance-meter__label">
                {isHit ? (
                  <>
                    <Icon name="sparkle" size={16} /> {copy.resonanceHit}
                  </>
                ) : (
                  copy.resonance
                )}
              </span>
              <span className="resonance-meter__track">
                <span
                  className="resonance-meter__fill"
                  style={{ width: `${Math.round(summary.resonanceLevel * 100)}%` }}
                />
              </span>
              <strong>{Math.round(summary.resonanceLevel * 100)}%</strong>
            </div>
          ) : (
            <div className="legend legend--lines" aria-hidden="true">
              <span>
                <i style={{ background: '#ffc94d' }} />
                {copy.modeStanding}
              </span>
              {settings.showTraveling ? (
                <>
                  <span>
                    <i className="is-dashed" style={{ color: '#5fd4e0' }} />→
                  </span>
                  <span>
                    <i className="is-dashed" style={{ color: '#ff8f73' }} />←
                  </span>
                </>
              ) : null}
              <span>
                <i className="is-dot" style={{ background: '#ffffff' }} />
                {copy.node}
              </span>
              <span>
                <i className="is-diamond" style={{ background: '#7ee8a0' }} />
                {copy.antinode}
              </span>
            </div>
          )
        }
      >
        <StandingWaveCanvas
          settings={settings}
          summary={summary}
          nodeLabel={copy.node}
          antinodeLabel={copy.antinode}
          ariaLabel={copy.standingCanvasAria}
          errorMessage={copy.canvasUnsupported}
          canvasRef={canvasRef}
        />
      </Stage>

      <section className="readout card">
        {isDriven ? (
          <ResonanceSpectrum
            settings={settings}
            title={copy.spectrumTitle}
            hint={copy.spectrumHint}
            onFrequencyChange={(driveFrequency) => state.updateSettings({ driveFrequency })}
          />
        ) : null}

        <div className="stat-grid">
          <div className="stat stat--hero">
            <span>{copy.statFrequency}</span>
            <strong>{fmt(summary.frequency)} Hz</strong>
          </div>
          <div className="stat">
            <span>{copy.statFundamental}</span>
            <strong>{fmt(summary.fundamentalFrequency)} Hz</strong>
          </div>
          <div className="stat">
            <span>{copy.statSpeed}</span>
            <strong>{fmt(summary.waveSpeed)} m/s</strong>
          </div>
          <div className="stat">
            <span>{copy.statWavelength}</span>
            <strong>{fmt(summary.wavelength, 2)} m</strong>
          </div>
          {!isDriven ? (
            <>
              <div className="stat">
                <span>{copy.statNodes}</span>
                <strong>{summary.nodePositions.length}</strong>
              </div>
              <div className="stat">
                <span>{copy.statAntinodes}</span>
                <strong>{summary.antinodePositions.length}</strong>
              </div>
            </>
          ) : null}
        </div>

        <ol className="formula-steps">
          <li>
            <code>v = √(T / μ)</code>
            <span>
              = √({fmt(settings.tension, 0)} / {formatNumber(settings.linearDensity, locale, 3)}) ={' '}
              <b>{fmt(summary.waveSpeed)} m/s</b>
            </span>
          </li>
          <li>
            <code>f₁ = v / {lengthFactor}L</code>
            <span>
              = {fmt(summary.waveSpeed)} / ({lengthFactor} × {fmt(settings.length, 2)}) ={' '}
              <b>{fmt(summary.fundamentalFrequency)} Hz</b>
            </span>
          </li>
          {isDriven ? (
            <li>
              <code>f / f₁</code>
              <span>
                = {fmt(summary.driveFrequency)} / {fmt(summary.fundamentalFrequency)} ={' '}
                <b>
                  {formatNumber(summary.driveFrequency / summary.fundamentalFrequency, locale, 2)}
                </b>
              </span>
            </li>
          ) : (
            <li>
              <code>f = {summary.modeRatio} × f₁</code>
              <span>
                = <b>{fmt(summary.frequency)} Hz</b>
              </span>
            </li>
          )}
          <li>
            <code>λ = v / f</code>
            <span>
              = <b>{fmt(summary.wavelength, 2)} m</b>
            </span>
          </li>
        </ol>
      </section>
    </>
  )
}
