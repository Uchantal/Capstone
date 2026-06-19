import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VisualArtsLevelScreen from '../../components/visual-arts/VisualArtsLevelScreen'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'

const CHECKLIST = [
  { id: 'circle-drawn',   text: 'I have drawn one circle using the Ellipse tool' },
  { id: 'two-zones',      text: 'I have shaded at least two different tone areas on the circle' },
  { id: 'cast-shadow',    text: 'I have added a cast shadow beneath the circle' },
  { id: 'two-shades',     text: 'My shading uses more than one shade of colour' },
]

export default function VALevel2Page() {
  const navigate = useNavigate()
  const { progress, loading } = useVisualArtsDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level1DemonstrationPassed) {
      navigate('/visual-arts/level-1/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 1 demonstration first.' },
      })
    }
  }, [loading, progress.level1DemonstrationPassed, navigate])

  if (loading || !progress.level1DemonstrationPassed) return null

  return (
    <VisualArtsLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Practising Light and Shadow"
      task="Draw one circle using the Ellipse tool. Using the Brush, shade it to show the five zones you learned in Course 2: highlight, midtone, core shadow, reflected light, and cast shadow. Use a darker colour for the shadow areas and leave the highlight area lighter or unshaded."
      checklist={CHECKLIST}
      nextPath="/visual-arts/level-2/practise"
      stageId="va-level-2"
      requires={[]}
    />
  )
}
