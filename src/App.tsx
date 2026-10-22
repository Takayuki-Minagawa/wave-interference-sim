import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import './App.css'
import { Confetti, ToastStack } from './components/Celebration'
import type { ToastMessage } from './components/Celebration'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { InterferenceControls } from './components/InterferenceControls'
import { InterferenceView } from './components/InterferenceView'
import { LearnPanel } from './components/LearnPanel'
import { MissionPanel } from './components/MissionPanel'
import { QuizPanel } from './components/QuizPanel'
import { StandingWaveControls } from './components/StandingWaveControls'
import { StandingWaveView } from './components/StandingWaveView'
import { TopBar } from './components/TopBar'
import { WelcomeDialog } from './components/WelcomeDialog'
import { missions } from './data/missions'
import { uiText } from './data/translations'
import { ClockContext } from './hooks/useClock'
import { useInterferenceState } from './hooks/useInterferenceState'
import { usePersistentState } from './hooks/usePersistentState'
import { useStandingWaveState } from './hooks/useStandingWaveState'
import { SimulationClock } from './lib/clock'
import type { InspectorTab, Locale, SimulationMode, Theme } from './types'

const TABS: { id: InspectorTab; icon: IconName }[] = [
  { id: 'controls', icon: 'sliders' },
  { id: 'missions', icon: 'target' },
  { id: 'learn', icon: 'book' },
  { id: 'quiz', icon: 'quiz' },
]

const isOneOf =
  <T extends string>(...values: T[]) =>
  (value: unknown): boolean =>
    values.includes(value as T)

const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const getSystemTheme = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getBrowserLocale = (): Locale =>
  navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en'

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

interface ToastState {
  items: ToastMessage[]
  nextId: number
}

function App() {
  const [clock] = useState(() => new SimulationClock())
  const [theme, setTheme] = usePersistentState<Theme>(
    'wave-theme',
    getSystemTheme,
    isOneOf('light', 'dark'),
  )
  const [locale, setLocale] = usePersistentState<Locale>(
    'wave-locale',
    getBrowserLocale,
    isOneOf('ja', 'en'),
  )
  const [mode, setMode] = usePersistentState<SimulationMode>(
    'wave-mode',
    'interference',
    isOneOf('interference', 'standing'),
  )
  const [tab, setTab] = usePersistentState<InspectorTab>(
    'wave-tab',
    'controls',
    isOneOf('controls', 'missions', 'learn', 'quiz'),
  )
  const [completed, setCompleted] = usePersistentState<string[]>('wave-missions', [], isStringArray)
  const [quizBest, setQuizBest] = usePersistentState<Record<SimulationMode, number | null>>(
    'wave-quiz-best',
    { interference: null, standing: null },
    (value) => typeof value === 'object' && value !== null,
  )
  const [onboarded, setOnboarded] = usePersistentState('wave-onboarded', false)
  const [helpOpen, setHelpOpen] = useState(!onboarded)
  const [toasts, setToasts] = useState<ToastState>({ items: [], nextId: 1 })
  const [confettiKey, setConfettiKey] = useState(0)
  const inspectorRef = useRef<HTMLElement | null>(null)

  const interference = useInterferenceState()
  const standing = useStandingWaveState()
  const copy = uiText[locale]

  const pushToast = (toast: Omit<ToastMessage, 'id'>) =>
    setToasts((previous) => ({
      items: [...previous.items.slice(-2), { ...toast, id: previous.nextId }],
      nextId: previous.nextId + 1,
    }))

  const dismissToast = useCallback(
    (id: number) =>
      setToasts((previous) => ({
        ...previous,
        items: previous.items.filter((toast) => toast.id !== id),
      })),
    [],
  )

  // Missions complete as soon as the live simulation state satisfies them.
  // This adjusts state during render (guarded), which React supports without an extra effect.
  const missionContext = { interference: interference.summary, standing: standing.summary }
  const newlyCompleted = missions.filter(
    (mission) =>
      mission.mode === mode && !completed.includes(mission.id) && mission.check(missionContext),
  )
  if (newlyCompleted.length > 0) {
    const nextCompleted = [...completed, ...newlyCompleted.map((mission) => mission.id)]
    setCompleted(nextCompleted)
    setConfettiKey((key) => key + 1)
    setToasts((previous) => ({
      items: [
        ...previous.items.slice(-2),
        ...newlyCompleted.map((mission, index) => ({
          id: previous.nextId + index,
          title:
            nextCompleted.length === missions.length
              ? copy.allMissionsComplete
              : copy.missionComplete,
          body: mission.title[locale],
          icon: 'star' as const,
          tone: 'success' as const,
        })),
      ],
      nextId: previous.nextId + newlyCompleted.length,
    }))
  }

  useEffect(() => {
    clock.start()
    return () => clock.stop()
  }, [clock])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b1220' : '#f4f6fb')
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = copy.documentTitle
  }, [copy.documentTitle, locale])

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      helpOpen ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      isTypingTarget(event.target)
    ) {
      return
    }

    const onButton = event.target instanceof HTMLButtonElement

    if (event.code === 'Space' && !onButton) {
      event.preventDefault()
      clock.togglePlaying()
    } else if (event.key === 'r' || event.key === 'R') {
      clock.reset()
    } else if (event.key === '1') {
      setMode('interference')
    } else if (event.key === '2') {
      setMode('standing')
    }
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  const selectTab = (nextTab: InspectorTab, reveal = false) => {
    setTab(nextTab)
    if (reveal && window.matchMedia('(max-width: 960px)').matches) {
      inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const tabLabels: Record<InspectorTab, string> = {
    controls: copy.tabControls,
    missions: copy.tabMissions,
    learn: copy.tabLearn,
    quiz: copy.tabQuiz,
  }
  const remainingMissions = missions.filter(
    (mission) => mission.mode === mode && !completed.includes(mission.id),
  ).length

  const showSavedToast = () => pushToast({ title: copy.saved, icon: 'camera', tone: 'info' })

  const renderTabButton = (id: InspectorTab, icon: IconName, className: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={`${className}-${id}`}
      aria-selected={tab === id}
      aria-controls="inspector-panel"
      className={tab === id ? `${className} is-active` : className}
      onClick={() => selectTab(id, className === 'bottom-nav__item')}
    >
      <span className="tab-icon">
        <Icon name={icon} size={20} />
        {id === 'missions' && remainingMissions > 0 ? (
          <span className="tab-badge">{remainingMissions}</span>
        ) : null}
      </span>
      <span>{tabLabels[id]}</span>
    </button>
  )

  return (
    <ClockContext value={clock}>
      <div className="app" data-mode={mode}>
        <TopBar
          copy={copy}
          locale={locale}
          theme={theme}
          mode={mode}
          onModeChange={setMode}
          onLocaleChange={setLocale}
          onThemeChange={setTheme}
          onHelp={() => setHelpOpen(true)}
        />

        <main className="workspace">
          <section className="workspace__stage" aria-label={copy.modeSwitchLabel}>
            {mode === 'interference' ? (
              <InterferenceView
                copy={copy}
                locale={locale}
                state={interference}
                onSaved={showSavedToast}
              />
            ) : (
              <StandingWaveView
                copy={copy}
                locale={locale}
                state={standing}
                onSaved={showSavedToast}
              />
            )}
          </section>

          <aside className="inspector" ref={inspectorRef}>
            <nav className="inspector__tabs" role="tablist" aria-label={copy.tabControls}>
              {TABS.map(({ id, icon }) => renderTabButton(id, icon, 'inspector__tab'))}
            </nav>
            <div
              className="inspector__body"
              id="inspector-panel"
              role="tabpanel"
              aria-labelledby={`inspector__tab-${tab}`}
            >
              {tab === 'controls' ? (
                mode === 'interference' ? (
                  <InterferenceControls copy={copy} locale={locale} state={interference} />
                ) : (
                  <StandingWaveControls copy={copy} locale={locale} state={standing} />
                )
              ) : null}
              {tab === 'missions' ? (
                <MissionPanel
                  copy={copy}
                  locale={locale}
                  mode={mode}
                  completed={completed}
                  onReset={() => setCompleted([])}
                />
              ) : null}
              {tab === 'learn' ? (
                <LearnPanel
                  copy={copy}
                  locale={locale}
                  mode={mode}
                  interferenceSummary={interference.summary}
                  standingSummary={standing.summary}
                />
              ) : null}
              {tab === 'quiz' ? (
                <QuizPanel
                  key={mode}
                  copy={copy}
                  locale={locale}
                  mode={mode}
                  bestScore={quizBest[mode] ?? null}
                  onFinish={(score, total) => {
                    setQuizBest((previous) => ({
                      ...previous,
                      [mode]: Math.max(previous[mode] ?? 0, score),
                    }))
                    if (score === total) {
                      setConfettiKey((key) => key + 1)
                    }
                  }}
                />
              ) : null}
            </div>
          </aside>
        </main>

        <nav className="bottom-nav" role="tablist" aria-label={copy.tabControls}>
          {TABS.map(({ id, icon }) => renderTabButton(id, icon, 'bottom-nav__item'))}
        </nav>

        <WelcomeDialog
          copy={copy}
          open={helpOpen}
          onClose={() => {
            setHelpOpen(false)
            setOnboarded(true)
          }}
        />
        <ToastStack toasts={toasts.items} onDismiss={dismissToast} />
        <Confetti burstKey={confettiKey} />
      </div>
    </ClockContext>
  )
}

export default App
