import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsLevelScreen from '../../components/visual-arts/VisualArtsLevelScreen'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'

const CHECKLIST = [
  { id: 'two-elements',   text: 'My composition has at least two distinct elements' },
  { id: 'shading',        text: 'I have used shading on at least one element' },
  { id: 'colour',         text: 'I used more than one colour intentionally, not just outlines' },
  { id: 'finished',       text: 'I am ready to show this as a finished small piece' },
]

export default function VALevel3Page() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = useVisualArtsDemonstrationProgress()

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level2DemonstrationPassed) {
      navigate('/visual-arts/level-2/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 2 demonstration first.' },
      })
    }
  }, [isPreviewMode, loading, progress.level2DemonstrationPassed, navigate])

  if (!isPreviewMode && (loading || !progress.level2DemonstrationPassed)) return null

  return (
    <VisualArtsLevelScreen
      levelNumber={3}
      totalLevels={3}
      levelTitle="Level 3: A Small Composition"
      task="Combine shapes, colour, and shading into one small composition. Choose a simple subject, for example a fruit, a house, or a simple object from your surroundings, and draw it using everything you have practised so far. Use at least two distinct elements, intentional colour, and visible shading on at least one element."
      checklist={CHECKLIST}
      nextPath="/visual-arts/level-3/practise"
      stageId="va-level-3"
      requires={[]}
    />
  )
}
