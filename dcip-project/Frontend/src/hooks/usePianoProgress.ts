import { useCallback, useEffect, useState } from 'react'
import { fetchPianoProgress, completeJourneyStage } from '../services/api'

export type PianoSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface PianoProgress {
  completedStages: string[]
  level1DemonstrationPassed: boolean
  level2DemonstrationPassed: boolean
  level3DemonstrationPassed: boolean
  productionPassed: boolean
  pianoSkillLevel: PianoSkillLevel
}

const EMPTY: PianoProgress = {
  completedStages: [],
  level1DemonstrationPassed: false,
  level2DemonstrationPassed: false,
  level3DemonstrationPassed: false,
  productionPassed: false,
  pianoSkillLevel: 'not-started',
}

export function usePianoProgress() {
  const [progress, setProgress] = useState<PianoProgress>(EMPTY)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetchPianoProgress()
      .then(res => setProgress(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markStageVisited = useCallback((stageId: string) => {
    completeJourneyStage({ discipline: 'piano', stageId }).catch(() => {})
    setProgress(prev => ({
      ...prev,
      completedStages: prev.completedStages.includes(stageId)
        ? prev.completedStages
        : [...prev.completedStages, stageId],
    }))
  }, [])

  return { progress, loading, reload: load, markStageVisited }
}
