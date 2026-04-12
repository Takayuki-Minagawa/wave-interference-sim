import { useEffect, useMemo, useState } from 'react'

import './App.css'
import { AppHero } from './components/AppHero'
import { InterferenceControls } from './components/InterferenceControls'
import { InterferenceView } from './components/InterferenceView'
import { LearningPanel } from './components/LearningPanel'
import { ModeBar } from './components/ModeBar'
import { StandingWaveControls } from './components/StandingWaveControls'
import { StandingWaveView } from './components/StandingWaveView'
import { uiText } from './data/translations'
import { useInterferenceState } from './hooks/useInterferenceState'
import {
  LOOP_DURATION,
  SPEED_OPTIONS,
  useSimulationLoop,
} from './hooks/useSimulationLoop'
import { useStandingWaveState } from './hooks/useStandingWaveState'
import type { Locale, SimulationMode, Theme } from './types'

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('wave-theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const getInitialLocale = (): Locale => {
  const savedLocale = localStorage.getItem('wave-locale')
  return savedLocale === 'en' ? 'en' : 'ja'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [locale, setLocale] = useState<Locale>(getInitialLocale)
  const [mode, setMode] = useState<SimulationMode>('interference')
  const playback = useSimulationLoop()
  const interference = useInterferenceState(playback.time)
  const standing = useStandingWaveState()
  const copy = uiText[locale]

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('wave-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('wave-locale', locale)
  }, [locale])

  const interferenceControlsState = useMemo(
    () => ({
      ...interference,
      applyPreset: (presetId: string) => {
        playback.resetTime()
        interference.applyPreset(presetId)
      },
    }),
    [interference, playback],
  )

  const standingControlsState = useMemo(
    () => ({
      ...standing,
      applyPreset: (presetId: string) => {
        playback.resetTime()
        standing.applyPreset(presetId)
      },
    }),
    [playback, standing],
  )

  return (
    <div className="app-shell">
      <AppHero
        copy={copy}
        locale={locale}
        theme={theme}
        onLocaleChange={setLocale}
        onThemeChange={setTheme}
      />

      <ModeBar
        copy={copy}
        locale={locale}
        mode={mode}
        onModeChange={setMode}
        isPlaying={playback.isPlaying}
        onPlayingChange={playback.setIsPlaying}
        time={playback.time}
        onTimeChange={playback.setTime}
        onReset={playback.resetTime}
        speed={playback.speed}
        onSpeedChange={playback.setSpeed}
        speedOptions={SPEED_OPTIONS}
        loopDuration={LOOP_DURATION}
      />

      <main className="dashboard">
        <aside className="panel controls-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {mode === 'interference' ? copy.interferenceMode : copy.standingMode}
              </p>
              <h2>{copy.controls}</h2>
            </div>
          </div>

          {mode === 'interference' ? (
            <InterferenceControls
              copy={copy}
              locale={locale}
              state={interferenceControlsState}
            />
          ) : (
            <StandingWaveControls
              copy={copy}
              locale={locale}
              state={standingControlsState}
            />
          )}
        </aside>

        <section className="panel visualization-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {mode === 'interference' ? copy.viewSurface : copy.viewString}
              </p>
              <h2>{copy.view}</h2>
            </div>
          </div>

          {mode === 'interference' ? (
            <InterferenceView
              copy={copy}
              locale={locale}
              time={playback.time}
              state={interferenceControlsState}
            />
          ) : (
            <StandingWaveView
              copy={copy}
              locale={locale}
              theme={theme}
              time={playback.time}
              state={standingControlsState}
            />
          )}
        </section>

        <aside className="panel learning-sidebar">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {mode === 'interference' ? copy.badgeC : copy.quizTitle}
              </p>
              <h2>{copy.learning}</h2>
            </div>
          </div>

          <LearningPanel
            key={`${mode}-${locale}`}
            locale={locale}
            mode={mode}
            interferenceSummary={interference.summary}
            standingSummary={standing.summary}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
