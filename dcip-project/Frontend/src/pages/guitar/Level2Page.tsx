import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Level2Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { completedStages, loading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('guitar-level-1')) {
      navigate('/guitar/level-1', {
        replace: true,
        state: { lockedMessage: 'Complete Level 1 first.' },
      })
    }
  }, [completedStages, loading, navigate])

  return (
    <Level2Screen
      onComplete={() => markComplete('guitar-level-2')}
      nextPath="/guitar/level-3"
    />
  )
}
