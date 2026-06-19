import { useState, useEffect, useCallback } from 'react'
import { fetchGDProgress, completeJourneyStage } from '../services/api'

export type GDSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface GDDemoProgress {
  completedStages: string[]
  level1DemonstrationPassed: boolean
  level2DemonstrationPassed: boolean
  level3DemonstrationPassed: boolean
  productionPassed: boolean
  graphicDesignSkillLevel: GDSkillLevel
}

const DEFAULT_PROGRESS: GDDemoProgress = {
  completedStages: [],
  level1DemonstrationPassed: false,
  level2DemonstrationPassed: false,
  level3DemonstrationPassed: false,
  productionPassed: false,
  graphicDesignSkillLevel: 'not-started',
}

export function useGDDemonstrationProgress() {
  const [progress, setProgress] = useState<GDDemoProgress>(DEFAULT_PROGRESS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    fetchGDProgress()
      .then(res => setProgress(res.data))
      .catch(() => setProgress(DEFAULT_PROGRESS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const markStageVisited = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'graphic-design', stageId })
      setProgress(prev => ({
        ...prev,
        completedStages: prev.completedStages.includes(stageId)
          ? prev.completedStages
          : [...prev.completedStages, stageId],
      }))
    } catch {
      // Best-effort
    }
  }, [])

  return { progress, loading, reload, markStageVisited }
}
