import { useState, useCallback } from "react"

export function useLocalStorage<T>(
  key: string,
  fallback: T
): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  })

  const setValue = useCallback(
    (value: T) => {
      setStored(value)
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // quota exceeded or unavailable — state still updates in memory
      }
    },
    [key]
  )

  return [stored, setValue]
}
