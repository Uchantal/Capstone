import { useState, useEffect, useCallback } from 'react'
import { fetchVoiceProgress, completeJourneyStage } from '../services/api'

export type VoiceSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface VoiceDemoProgress {
  completedStages: string[]
  level1DemonstrationPassed: boolean
  level2DemonstrationPassed: boolean
  level3DemonstrationPassed: boolean
  productionPassed: boolean
  voiceSkillLevel: VoiceSkillLevel
}

const DEFAULT: VoiceDemoProgress = {
  completedStages: [],
  level1DemonstrationPassed: false,
  level2DemonstrationPassed: false,
  level3DemonstrationPassed: false,
  productionPassed: false,
  voiceSkillLevel: 'not-started',
}

export function useVoiceDemonstrationProgress() {
  const [progress, setProgress] = useState<VoiceDemoProgress>(DEFAULT)
  const [loading, setLoading]   = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    fetchVoiceProgress()
      .then(res => setProgress(res.data))
      .catch(() => setProgress(DEFAULT))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const markStageVisited = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'voice', stageId })
      setProgress(prev => ({
        ...prev,
        completedStages: prev.completedStages.includes(stageId)
          ? prev.completedStages
          : [...prev.completedStages, stageId],
      }))
    } catch {
      // best-effort
    }
  }, [])

  return { progress, loading, reload, markStageVisited }
}
