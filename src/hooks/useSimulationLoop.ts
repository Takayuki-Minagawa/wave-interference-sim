import { useEffect, useEffectEvent, useState } from 'react'

export const LOOP_DURATION = 16
export const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2]

export function useSimulationLoop() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)

  const advanceClock = useEffectEvent((deltaSeconds: number) => {
    setTime((previousTime) => {
      const nextTime = previousTime + deltaSeconds * speed
      return nextTime >= LOOP_DURATION
        ? nextTime - LOOP_DURATION
        : nextTime
    })
  })

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    let animationFrameId = 0
    let lastFrame = performance.now()

    const animate = (frameTime: number) => {
      const delta = Math.min((frameTime - lastFrame) / 1000, 0.05)
      lastFrame = frameTime
      advanceClock(delta)
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, speed])

  return {
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    time,
    setTime,
    resetTime: () => setTime(0),
  }
}
