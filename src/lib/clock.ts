export const LOOP_DURATION = 60
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2] as const

type Listener = () => void

export interface ClockSnapshot {
  time: number
  isPlaying: boolean
  speed: number
}

/**
 * A tiny external store for the simulation clock.
 *
 * Canvases subscribe directly and redraw on every tick without going through
 * React, while UI that only cares about play state re-renders rarely.
 */
export class SimulationClock {
  private snapshot: ClockSnapshot = { time: 0, isPlaying: true, speed: 1 }
  private tickListeners = new Set<Listener>()
  private stateListeners = new Set<Listener>()
  private frameId = 0
  private lastFrame = 0

  getSnapshot = () => this.snapshot

  getTime = () => this.snapshot.time

  /** Subscribe to every time change (once per animation frame while playing). */
  subscribeTick = (listener: Listener) => {
    this.tickListeners.add(listener)
    return () => {
      this.tickListeners.delete(listener)
    }
  }

  /** Subscribe to play/pause and speed changes only. */
  subscribeState = (listener: Listener) => {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  start() {
    if (this.frameId || typeof requestAnimationFrame === 'undefined') {
      return
    }

    this.lastFrame = performance.now()
    const animate = (frameTime: number) => {
      const delta = Math.min((frameTime - this.lastFrame) / 1000, 0.05)
      this.lastFrame = frameTime

      if (this.snapshot.isPlaying) {
        const next = this.snapshot.time + delta * this.snapshot.speed
        this.setTimeInternal(next >= LOOP_DURATION ? next - LOOP_DURATION : next)
      }

      this.frameId = requestAnimationFrame(animate)
    }

    this.frameId = requestAnimationFrame(animate)
  }

  stop() {
    cancelAnimationFrame(this.frameId)
    this.frameId = 0
  }

  setTime = (time: number) => {
    this.setTimeInternal(Math.min(Math.max(time, 0), LOOP_DURATION))
  }

  reset = () => {
    this.setTimeInternal(0)
  }

  step = (seconds: number) => {
    const next = this.snapshot.time + seconds
    this.setTimeInternal(((next % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION)
  }

  setPlaying = (isPlaying: boolean) => {
    if (isPlaying === this.snapshot.isPlaying) {
      return
    }
    this.snapshot = { ...this.snapshot, isPlaying }
    this.emitState()
  }

  togglePlaying = () => {
    this.setPlaying(!this.snapshot.isPlaying)
  }

  setSpeed = (speed: number) => {
    this.snapshot = { ...this.snapshot, speed }
    this.emitState()
  }

  private setTimeInternal(time: number) {
    this.snapshot = { ...this.snapshot, time }
    this.tickListeners.forEach((listener) => listener())
  }

  private emitState() {
    this.stateListeners.forEach((listener) => listener())
  }
}
