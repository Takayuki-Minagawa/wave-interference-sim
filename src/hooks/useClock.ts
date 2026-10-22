import { createContext, useContext, useSyncExternalStore } from 'react'

import type { SimulationClock } from '../lib/clock'

export const ClockContext = createContext<SimulationClock | null>(null)

export function useClock() {
  const clock = useContext(ClockContext)

  if (!clock) {
    throw new Error('useClock must be used inside a ClockContext provider')
  }

  return clock
}

/** Re-renders on play/pause and speed changes. */
export function useClockState() {
  const clock = useClock()
  return useSyncExternalStore(clock.subscribeState, clock.getSnapshot)
}

/** Re-renders on every animation frame. Use only for small components. */
export function useClockTime() {
  const clock = useClock()
  return useSyncExternalStore(clock.subscribeTick, clock.getTime)
}
