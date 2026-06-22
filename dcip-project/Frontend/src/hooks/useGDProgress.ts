import { useState, useEffect, useCallback } from 'react'
import { fetchJourneyProgress, completeJourneyStage } from '../services/api'

export const STAGE_PATHS: Record<string, string> = {
  'gd-virtual-studio': '/graphic-design/virtual-studio',
  'gd-course-1':       '/graphic-design/course-1',
  'gd-course-2':       '/graphic-design/course-2',
  'gd-level-1':        '/graphic-design/level-1',
  'gd-level-2':        '/graphic-design/level-2',
  'gd-level-3':        '/graphic-design/level-3',
  'gd-sharpening':     '/graphic-design/sharpening',
  'gd-production':     '/graphic-design/production',
}

export const STAGE_NAMES: Record<string, string> = {
  'gd-virtual-studio': 'Graphic Design Canvas',
  'gd-course-1':       'Typography and Layout',
  'gd-course-2':       'Colour and Composition',
  'gd-level-1':        'Level 1',
  'gd-level-2':        'Level 2',
  'gd-level-3':        'Level 3',
  'gd-sharpening':     'Sharpening Myself',
  'gd-production':     'Production',
}

export function useGDProgress() {
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJourneyProgress('graphic-design')
      .then(res => setCompletedStages(res.data.completedStages ?? []))
      .catch(() => setCompletedStages([]))
      .finally(() => setLoading(false))
  }, [])

  const markComplete = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'graphic-design', stageId })
      setCompletedStages(prev => prev.includes(stageId) ? prev : [...prev, stageId])
    } catch {
      // Best-effort
    }
  }, [])

  return { completedStages, loading, markComplete }
}
