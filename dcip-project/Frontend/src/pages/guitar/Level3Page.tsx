import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Level3Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel3Page() {
  const navigate = useNavigate()
  const { completedStages, loading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('guitar-level-2')) {
      navigate('/guitar/level-2', {
        replace: true,
        state: { lockedMessage: 'Complete Level 2 first.' },
      })
    }
  }, [completedStages, loading, navigate])

  return (
    <Level3Screen
      onComplete={() => markComplete('guitar-level-3')}
      nextPath="/guitar/sharpening-myself"
    />
  )
}
