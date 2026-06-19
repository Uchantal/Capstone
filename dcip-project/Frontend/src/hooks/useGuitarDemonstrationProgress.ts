import { useState, useEffect, useCallback } from 'react'
import { fetchGuitarProgress, completeJourneyStage } from '../services/api'

export type GuitarSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface GuitarDemoProgress {
  completedStages: string[]
  level1DemonstrationPassed: boolean
  level2DemonstrationPassed: boolean
  level3DemonstrationPassed: boolean
  productionPassed: boolean
  guitarSkillLevel: GuitarSkillLevel
}

const DEFAULT: GuitarDemoProgress = {
  completedStages: [],
  level1DemonstrationPassed: false,
  level2DemonstrationPassed: false,
  level3DemonstrationPassed: false,
  productionPassed: false,
  guitarSkillLevel: 'not-started',
}

export function useGuitarDemonstrationProgress() {
  const [progress, setProgress] = useState<GuitarDemoProgress>(DEFAULT)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    fetchGuitarProgress()
      .then(res => setProgress(res.data))
      .catch(() => setProgress(DEFAULT))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const markStageVisited = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'guitar', stageId })
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
