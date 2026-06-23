import { useRef } from 'react'
import { saveEngagementScore } from '../services/api'
import type { DesignElement } from '../components/graphic-design/PosterSurface'

// ── Visual Arts ──────────────────────────────────────────────────────────────

export function useVAEngagement(discipline: string, stage: string) {
  const interactionCountRef  = useRef(0)
  const toolsUsedRef         = useRef(new Set<string>())
  const coloursUsedRef       = useRef(new Set<string>())
  const firstStrokeRef       = useRef<number | null>(null)
  const lastStrokeRef        = useRef<number | null>(null)

  const recordInteraction = () => {
    interactionCountRef.current += 1
    const now = Date.now()
    if (firstStrokeRef.current === null) firstStrokeRef.current = now
    lastStrokeRef.current = now
  }

  const recordColour = (colour: string) => {
    coloursUsedRef.current.add(colour)
  }

  const recordTool = (tool: string) => {
    toolsUsedRef.current.add(tool)
  }

  const computeAndSave = async (): Promise<number> => {
    const interactionScore = Math.min((interactionCountRef.current / 20) * 100, 100)
    const toolVarietyScore = Math.min((toolsUsedRef.current.size / 3) * 100, 100)
    const colourScore      = Math.min((coloursUsedRef.current.size / 3) * 100, 100)
    const drawTimeSec =
      firstStrokeRef.current !== null && lastStrokeRef.current !== null
        ? (lastStrokeRef.current - firstStrokeRef.current) / 1000
        : 0
    const drawTimeScore = Math.min((drawTimeSec / 120) * 100, 100)

    const score = Math.round(
      interactionScore * 0.4 +
      toolVarietyScore * 0.2 +
      colourScore      * 0.2 +
      drawTimeScore    * 0.2
    )

    try {
      await saveEngagementScore(discipline, stage, score)
    } catch {
      // best-effort
    }
    return score
  }

  return { recordInteraction, recordColour, recordTool, computeAndSave }
}

// ── Graphic Design ───────────────────────────────────────────────────────────

export function useGDEngagement(discipline: string, stage: string) {
  const prevElementsRef    = useRef<DesignElement[]>([])
  const propertyChangesRef = useRef(0)
  const elementTypesRef    = useRef(new Set<string>())
  const interactionCountRef = useRef(0)

  const recordInteraction = () => {
    interactionCountRef.current += 1
  }

  const recordElementChange = (elements: DesignElement[]) => {
    elements.forEach(el => elementTypesRef.current.add(el.type))
    const prev = prevElementsRef.current
    if (elements.length > 0 && elements.length === prev.length) {
      for (let i = 0; i < elements.length; i++) {
        if (JSON.stringify(elements[i]) !== JSON.stringify(prev[i])) {
          propertyChangesRef.current += 1
          break
        }
      }
    }
    prevElementsRef.current = [...elements]
  }

  const computeAndSave = async (elements: DesignElement[]): Promise<number> => {
    elements.forEach(el => elementTypesRef.current.add(el.type))
    const elementScore       = Math.min((elements.length / 5) * 100, 100)
    const propertyChangeScore = Math.min((propertyChangesRef.current / 8) * 100, 100)
    const varietyScore       = Math.min((elementTypesRef.current.size / 3) * 100, 100)

    const score = Math.round(
      elementScore        * 0.4 +
      propertyChangeScore * 0.4 +
      varietyScore        * 0.2
    )

    try {
      await saveEngagementScore(discipline, stage, score)
    } catch {
      // best-effort
    }
    return score
  }

  return { recordInteraction, recordElementChange, computeAndSave }
}
