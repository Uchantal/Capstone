import { useEffect, useRef } from 'react'
import { saveEngagementScore } from '../services/api'

export function useReadingEngagement(discipline: string, stage: string) {
  const mountTimeRef    = useRef(Date.now())
  const pausedMsRef     = useRef(0)
  const pauseStartRef   = useRef<number | null>(null)
  const maxScrollRef    = useRef(0)
  const scrollCountRef  = useRef(0)
  const lastScrollRef   = useRef(0)

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        pauseStartRef.current = Date.now()
      } else if (pauseStartRef.current !== null) {
        pausedMsRef.current += Date.now() - pauseStartRef.current
        pauseStartRef.current = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    let throttle: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      const now = Date.now()
      if (now - lastScrollRef.current > 500) {
        scrollCountRef.current += 1
        lastScrollRef.current = now
      }
      if (throttle) return
      throttle = setTimeout(() => {
        throttle = null
        const total = document.documentElement.scrollHeight
        const depth = total > 0
          ? Math.round(((window.scrollY + window.innerHeight) / total) * 100)
          : 100
        if (depth > maxScrollRef.current) maxScrollRef.current = Math.min(depth, 100)
      }, 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      if (throttle) clearTimeout(throttle)
    }
  }, [])

  const computeAndSave = async (): Promise<number> => {
    let totalPausedMs = pausedMsRef.current
    if (pauseStartRef.current !== null) totalPausedMs += Date.now() - pauseStartRef.current
    const activeSec = Math.max(0, (Date.now() - mountTimeRef.current - totalPausedMs) / 1000)

    const scrollScore      = maxScrollRef.current
    const timeScore        = Math.min((activeSec / 120) * 100, 100)
    const scrollEventScore = Math.min((scrollCountRef.current / 5) * 100, 100)
    const score = Math.round(scrollScore * 0.5 + timeScore * 0.3 + scrollEventScore * 0.2)

    try {
      await saveEngagementScore(discipline, stage, score)
    } catch {
      // best-effort
    }
    return score
  }

  return { computeAndSave }
}
