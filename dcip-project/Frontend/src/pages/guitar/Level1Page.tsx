import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Level1Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { completedStages, loading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (loading) return
    const hasBoth = completedStages.includes('guitar-course-1') && completedStages.includes('guitar-course-2')
    if (!hasBoth) {
      const missing = !completedStages.includes('guitar-course-1')
        ? 'Reading the Fretboard'
        : 'Notes Across the Neck'
      navigate('/guitar/reading-the-fretboard', {
        replace: true,
        state: { lockedMessage: `Complete ${missing} first.` },
      })
    }
  }, [completedStages, loading, navigate])

  return (
    <Level1Screen
      onComplete={() => markComplete('guitar-level-1')}
      nextPath="/guitar/level-2"
    />
  )
}
