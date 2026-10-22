import { useEffect, useState } from 'react'

const readStorage = <T>(key: string, fallback: T, validate?: (value: unknown) => boolean) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) {
      return fallback
    }
    const parsed: unknown = JSON.parse(raw)
    return !validate || validate(parsed) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * useState that mirrors its value into localStorage.
 * Storage failures (private mode, blocked cookies) silently fall back to memory.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T | (() => T),
  validate?: (value: unknown) => boolean,
) {
  const [value, setValue] = useState<T>(() =>
    readStorage(key, typeof fallback === 'function' ? (fallback as () => T)() : fallback, validate),
  )

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore quota or privacy-mode errors; the value still lives in memory.
    }
  }, [key, value])

  return [value, setValue] as const
}
