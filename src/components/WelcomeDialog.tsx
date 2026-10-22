import { useEffect, useRef, useState } from 'react'

import type { UiCopy } from '../data/translations'
import { Icon } from './Icon'
import { AppLogo } from './TopBar'

interface WelcomeDialogProps {
  copy: UiCopy
  open: boolean
  onClose: () => void
}

function StepArt({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="welcome-art welcome-art--logo">
        <span className="welcome-art__ring" />
        <span className="welcome-art__ring welcome-art__ring--late" />
        <AppLogo size={88} />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="welcome-art welcome-art--ripple">
        <svg viewBox="0 0 220 120" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <g key={index}>
              <circle
                cx="80"
                cy="60"
                r="10"
                className="ripple-ring"
                style={{ animationDelay: `${index * 0.6}s` }}
              />
              <circle
                cx="140"
                cy="60"
                r="10"
                className="ripple-ring ripple-ring--b"
                style={{ animationDelay: `${index * 0.6}s` }}
              />
            </g>
          ))}
          <circle cx="80" cy="60" r="7" fill="#ff8c61" stroke="#fff" strokeWidth="2" />
          <circle
            cx="140"
            cy="60"
            r="7"
            fill="#4cc7d9"
            stroke="#fff"
            strokeWidth="2"
            className="drag-source"
          />
          <path
            d="M150 74l6 18 4-7 8-1z"
            fill="#fff"
            stroke="#0b1a33"
            strokeWidth="1.5"
            className="drag-cursor"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="welcome-art welcome-art--trophy">
      <span className="welcome-art__badge">
        <Icon name="target" size={34} />
      </span>
      <span className="welcome-art__badge welcome-art__badge--main">
        <Icon name="star" size={44} />
      </span>
      <span className="welcome-art__badge">
        <Icon name="quiz" size={34} />
      </span>
    </div>
  )
}

export function WelcomeDialog({ copy, open, onClose }: WelcomeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [step, setStep] = useState(0)
  const steps = copy.welcomeSteps
  const isLast = step === steps.length - 1

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    if (open && !dialog.open) {
      dialog.showModal?.()
      dialog.querySelector<HTMLButtonElement>('.primary-button')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const close = () => {
    onClose()
    setStep(0)
  }

  return (
    <dialog
      ref={dialogRef}
      className="welcome"
      aria-labelledby="welcome-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          close()
        }
      }}
    >
      <div className="welcome__panel">
        <button
          type="button"
          className="icon-button icon-button--ghost welcome__close"
          onClick={close}
          aria-label={copy.close}
        >
          <Icon name="close" />
        </button>

        <StepArt step={step} />

        <div className="welcome__text" key={step}>
          <h2 id="welcome-title">{steps[step].title}</h2>
          <p>{steps[step].body}</p>
          {isLast ? (
            <div className="shortcut-list">
              <strong>{copy.shortcutsTitle}</strong>
              <dl>
                {copy.shortcuts.map(([key, description]) => (
                  <div key={key}>
                    <dt>
                      <kbd>{key}</kbd>
                    </dt>
                    <dd>{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="welcome__dots" aria-hidden="true">
          {steps.map((_, index) => (
            <span key={index} className={index === step ? 'is-active' : undefined} />
          ))}
        </div>

        <div className="welcome__actions">
          {step === 0 ? (
            <button type="button" className="text-button text-button--muted" onClick={close}>
              {copy.welcomeSkip}
            </button>
          ) : (
            <button type="button" className="text-button" onClick={() => setStep(step - 1)}>
              <Icon name="chevronLeft" size={18} /> {copy.welcomeBack}
            </button>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={() => (isLast ? close() : setStep(step + 1))}
          >
            {isLast ? copy.welcomeStart : copy.welcomeNext}
            {isLast ? null : <Icon name="chevronRight" size={18} />}
          </button>
        </div>
      </div>
    </dialog>
  )
}
