import { useState, useEffect, useCallback } from 'react'
import { fetchVisualArtsProgress, completeJourneyStage } from '../services/api'

export type VisualArtsSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface VADemoProgress {
  completedStages: string[]
  level1DemonstrationPassed: boolean
  level2DemonstrationPassed: boolean
  level3DemonstrationPassed: boolean
  productionPassed: boolean
  visualArtsSkillLevel: VisualArtsSkillLevel
}

const DEFAULT: VADemoProgress = {
  completedStages: [],
  level1DemonstrationPassed: false,
  level2DemonstrationPassed: false,
  level3DemonstrationPassed: false,
  productionPassed: false,
  visualArtsSkillLevel: 'not-started',
}

export function useVisualArtsDemonstrationProgress() {
  const [progress, setProgress] = useState<VADemoProgress>(DEFAULT)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    fetchVisualArtsProgress()
      .then(res => setProgress(res.data))
      .catch(() => setProgress(DEFAULT))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const markStageVisited = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'visual-arts', stageId })
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
