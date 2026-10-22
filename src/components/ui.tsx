import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

interface SliderProps {
  label: string
  valueLabel: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  accent?: string
  disabled?: boolean
}

export function Slider({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
  accent,
  disabled,
}: SliderProps) {
  const id = useId()
  const fill = ((Math.min(Math.max(value, min), max) - min) / (max - min || 1)) * 100

  return (
    <div className="slider">
      <div className="slider__head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{valueLabel}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={
          {
            '--fill': `${fill}%`,
            ...(accent ? { '--slider-accent': accent } : {}),
          } as CSSProperties
        }
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

interface SwitchProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  swatch?: string
}

export function Switch({ label, checked, onChange, swatch }: SwitchProps) {
  return (
    <label className="switch-row">
      {swatch ? <span className="switch-row__swatch" style={{ background: swatch }} /> : null}
      <span className="switch-row__label">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  )
}

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  title?: string
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  )

  return (
    <div
      className={['segmented', `segmented--${size}`, className].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={label}
      style={
        {
          '--count': options.length,
          '--index': activeIndex,
        } as CSSProperties
      }
    >
      <span className="segmented__thumb" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          title={option.title}
          className={option.value === value ? 'is-active' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface SectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <section className="section">
      <header className="section__head">
        <h3>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  )
}
