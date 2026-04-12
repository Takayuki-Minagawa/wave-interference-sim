import type { Locale, Theme } from '../types'
import type { UiCopy } from '../data/translations'

interface AppHeroProps {
  copy: UiCopy
  locale: Locale
  theme: Theme
  onLocaleChange: (locale: Locale) => void
  onThemeChange: (theme: Theme) => void
}

export function AppHero({
  copy,
  locale,
  theme,
  onLocaleChange,
  onThemeChange,
}: AppHeroProps) {
  return (
    <header className="hero panel">
      <div className="hero__content">
        <p className="eyebrow">Wave Physics Studio</p>
        <h1>{copy.appTitle}</h1>
        <p className="hero__subtitle">{copy.subtitle}</p>
        <div className="hero__badges">
          <span>{copy.badgeA}</span>
          <span>{copy.badgeB}</span>
          <span>{copy.badgeC}</span>
        </div>
      </div>

      <div className="hero__controls">
        <div className="segmented-control">
          <span>{copy.language}</span>
          <div className="segmented-control__buttons">
            {(['ja', 'en'] as const).map((targetLocale) => (
              <button
                key={targetLocale}
                type="button"
                className={locale === targetLocale ? 'is-active' : ''}
                onClick={() => onLocaleChange(targetLocale)}
              >
                {targetLocale.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="segmented-control">
          <span>{copy.theme}</span>
          <div className="segmented-control__buttons">
            {([
              { id: 'light', label: copy.light },
              { id: 'dark', label: copy.dark },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                className={theme === option.id ? 'is-active' : ''}
                onClick={() => onThemeChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
