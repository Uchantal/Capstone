import { useState, useEffect, useCallback } from 'react'
import { fetchJourneyProgress, completeJourneyStage } from '../services/api'

export const STAGE_PATHS: Record<string, string> = {
  'va-virtual-canvas': '/visual-arts/virtual-canvas',
  'va-course-1':       '/visual-arts/course-1',
  'va-course-2':       '/visual-arts/course-2',
  'va-level-1':        '/visual-arts/level-1',
  'va-level-2':        '/visual-arts/level-2',
  'va-level-3':        '/visual-arts/level-3',
  'va-sharpening':     '/visual-arts/sharpening',
  'va-production':     '/visual-arts/production',
}

export const STAGE_NAMES: Record<string, string> = {
  'va-virtual-canvas': 'Virtual Canvas',
  'va-course-1':       'Lines, Shapes, and Tools',
  'va-course-2':       'Colour and Light',
  'va-level-1':        'Level 1',
  'va-level-2':        'Level 2',
  'va-level-3':        'Level 3',
  'va-sharpening':     'Sharpening Myself',
  'va-production':     'Production',
}

export function useVisualArtsProgress() {
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJourneyProgress('visual-arts')
      .then(res => setCompletedStages(res.data.completedStages ?? []))
      .catch(() => setCompletedStages([]))
      .finally(() => setLoading(false))
  }, [])

  const markComplete = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'visual-arts', stageId })
      setCompletedStages(prev => prev.includes(stageId) ? prev : [...prev, stageId])
    } catch {
      // Best-effort; journey state is safe to continue without backend confirmation
    }
  }, [])

  return { completedStages, loading, markComplete }
}
