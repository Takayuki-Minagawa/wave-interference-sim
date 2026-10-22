import { useEffect, useRef } from 'react'

import { Icon } from './Icon'
import type { IconName } from './Icon'

export interface ToastMessage {
  id: number
  title: string
  body?: string
  icon: IconName
  tone: 'success' | 'info'
}

interface ToastStackProps {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}

const TOAST_DURATION = 3800

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_DURATION)
    return () => window.clearTimeout(timer)
  }, [onDismiss, toast.id])

  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      <span className="toast__icon">
        <Icon name={toast.icon} size={20} />
      </span>
      <div className="toast__text">
        <strong>{toast.title}</strong>
        {toast.body ? <span>{toast.body}</span> : null}
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="close"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  size: number
  color: string
  shape: 'rect' | 'circle'
}

const CONFETTI_COLORS = ['#ffd84d', '#ff8c61', '#4cc7d9', '#a3e35c', '#ff6fae', '#8f7bff']

/**
 * Fires a short confetti burst every time `burstKey` increases.
 */
export function Confetti({ burstKey }: { burstKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (burstKey === 0) {
      return undefined
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return undefined
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    const particles: Particle[] = Array.from({ length: 140 }, (_, index) => {
      const fromLeft = index % 2 === 0
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9
      const speed = 9 + Math.random() * 9
      return {
        x: fromLeft ? width * 0.1 : width * 0.9,
        y: height * 0.85,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        shape: Math.random() > 0.3 ? 'rect' : 'circle',
      }
    })

    let frame = 0
    let animationId = 0
    const animate = () => {
      frame += 1
      context.clearRect(0, 0, width, height)
      const fade = Math.max(0, 1 - Math.max(0, frame - 90) / 60)
      context.globalAlpha = fade

      particles.forEach((particle) => {
        particle.vy += 0.32
        particle.vx *= 0.985
        particle.vy *= 0.985
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.spin

        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        if (particle.shape === 'rect') {
          context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2)
        } else {
          context.beginPath()
          context.arc(0, 0, particle.size / 3, 0, Math.PI * 2)
          context.fill()
        }
        context.restore()
      })

      if (fade > 0) {
        animationId = requestAnimationFrame(animate)
      } else {
        context.clearRect(0, 0, width, height)
      }
    }
    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      context.clearRect(0, 0, width, height)
    }
  }, [burstKey])

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
}
