import { useId } from 'react'

import type { UiCopy } from '../data/translations'
import type { Locale, SimulationMode, Theme } from '../types'
import { Icon } from './Icon'
import { Segmented } from './ui'

interface TopBarProps {
  copy: UiCopy
  locale: Locale
  theme: Theme
  mode: SimulationMode
  onModeChange: (mode: SimulationMode) => void
  onLocaleChange: (locale: Locale) => void
  onThemeChange: (theme: Theme) => void
  onHelp: () => void
}

export function AppLogo({ size = 36 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="app-logo">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b3f73" />
          <stop offset="100%" stopColor="#0fa3a0" />
        </linearGradient>
        <linearGradient id={`${id}wave`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffd76d" />
          <stop offset="100%" stopColor="#ff8c61" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}bg)`} />
      <circle
        cx="22"
        cy="24"
        r="10"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle
        cx="42"
        cy="24"
        r="10"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle cx="22" cy="24" r="3.5" fill="#ffffff" />
      <circle cx="42" cy="24" r="3.5" fill="#ffffff" />
      <path
        d="M8 46c6-9 10-9 16 0s10 9 16 0 10-9 16 0"
        fill="none"
        stroke={`url(#${id}wave)`}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TopBar({
  copy,
  locale,
  theme,
  mode,
  onModeChange,
  onLocaleChange,
  onThemeChange,
  onHelp,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <AppLogo />
        <div className="brand__text">
          <strong>{copy.appName}</strong>
          <span>{copy.appTagline}</span>
        </div>
      </div>

      <Segmented<SimulationMode>
        label={copy.modeSwitchLabel}
        className="mode-switch"
        value={mode}
        onChange={onModeChange}
        options={[
          {
            value: 'interference',
            label: (
              <>
                <Icon name="wave" size={18} />
                <span>{copy.modeInterference}</span>
              </>
            ),
            title: `${copy.modeInterferenceLong} (1)`,
          },
          {
            value: 'standing',
            label: (
              <>
                <Icon name="string" size={18} />
                <span>{copy.modeStanding}</span>
              </>
            ),
            title: `${copy.modeStandingLong} (2)`,
          },
        ]}
      />

      <div className="topbar__actions">
        <button
          type="button"
          className="icon-button"
          onClick={onHelp}
          aria-label={copy.help}
          title={copy.help}
        >
          <Icon name="help" />
        </button>
        <button
          type="button"
          className="icon-button icon-button--text"
          onClick={() => onLocaleChange(locale === 'ja' ? 'en' : 'ja')}
          aria-label={copy.language}
          title={copy.language}
        >
          <Icon name="globe" size={18} />
          <span>{copy.languageShort}</span>
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? copy.themeToLight : copy.themeToDark}
          title={theme === 'dark' ? copy.themeToLight : copy.themeToDark}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  )
}
