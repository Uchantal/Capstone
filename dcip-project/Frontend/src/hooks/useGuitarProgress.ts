import { useState, useEffect, useCallback } from 'react'
import { fetchJourneyProgress, completeJourneyStage } from '../services/api'

export const STAGE_PATHS: Record<string, string> = {
  'guitar-intro':     '/guitar/virtual-instrument',
  'guitar-course-1':  '/guitar/reading-the-fretboard',
  'guitar-course-2':  '/guitar/notes-across-the-neck',
  'guitar-level-1':   '/guitar/level-1',
  'guitar-level-2':   '/guitar/level-2',
  'guitar-level-3':   '/guitar/level-3',
  'guitar-sharpening': '/guitar/sharpening-myself',
  'guitar-production': '/guitar/production',
}

export const STAGE_NAMES: Record<string, string> = {
  'guitar-intro':      'Virtual Instrument',
  'guitar-course-1':   'Reading the Fretboard',
  'guitar-course-2':   'Notes Across the Neck',
  'guitar-level-1':    'Level 1',
  'guitar-level-2':    'Level 2',
  'guitar-level-3':    'Level 3',
  'guitar-sharpening': 'Sharpening Myself',
  'guitar-production': 'Production',
}

export function useGuitarProgress() {
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJourneyProgress('guitar')
      .then(res => setCompletedStages(res.data.completedStages ?? []))
      .catch(() => setCompletedStages([]))
      .finally(() => setLoading(false))
  }, [])

  const markComplete = useCallback(async (stageId: string) => {
    try {
      await completeJourneyStage({ discipline: 'guitar', stageId })
      setCompletedStages(prev => prev.includes(stageId) ? prev : [...prev, stageId])
    } catch {
      // Best-effort
    }
  }, [])

  return { completedStages, loading, markComplete }
}
