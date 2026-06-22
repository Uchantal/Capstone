import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'

export default function GDLevel2Page() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = useGDDemonstrationProgress()

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level1DemonstrationPassed) {
      navigate('/graphic-design/level-1/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 1 demonstration first.' },
      })
    }
  }, [isPreviewMode, loading, progress.level1DemonstrationPassed, navigate])

  if (!isPreviewMode && (loading || !progress.level1DemonstrationPassed)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <GDLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Redesign for a Different Audience"
      brief="The same creative talent evening now also needs a version for a formal invitation sent to parents and local community leaders. The tone needs to feel trustworthy and calm rather than loud and exciting. The audience reading this version is adults in a formal context, not teenagers on a noticeboard."
      task="Your Level 1 design is loaded below. Change the colours and arrangement to suit a calmer, more formal tone for an adult audience. Adjust text sizes, element positions, and colours. You may add or remove elements."
      reasoningPrompt="Why did you change the colours and layout for this audience, and how does it feel different from your Level 1 version?"
      nextPath="/graphic-design/level-2/practise"
      stageId="gd-level-2"
      requires={[]}
      initialPosterLevel={1}
    />
  )
}
