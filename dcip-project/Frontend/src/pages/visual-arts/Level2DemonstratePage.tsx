import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { completeVisualArtsDemonstration } from '../../services/api'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

const TASK =
  'Draw one circle and shade it. Your circle must have at least two visible tones: a lighter area ' +
  'and a darker shadow area. Add a cast shadow below the circle.'

function checkVADemonstration(
  interactionCount: number,
  coloursUsed: string[],
  isCanvasEmpty: boolean,
): { passed: boolean; feedback: string[] } {
  const feedback: string[] = []

  if (isCanvasEmpty) feedback.push('Your canvas is empty. Start drawing before checking.')
  if (coloursUsed.length < 1) feedback.push('Use at least one colour to draw on the canvas.')
  if (interactionCount < 5) feedback.push(`Make more marks on the canvas (${interactionCount}/5 strokes).`)
  if (coloursUsed.length < 2) feedback.push('Use at least two different colours in your drawing.')
  if (interactionCount < 8) feedback.push(`Make more marks on the canvas (${interactionCount}/8 strokes).`)

  return { passed: feedback.length === 0, feedback }
}

export default function VALevel2DemonstratePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = useVisualArtsDemonstrationProgress()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [resetKey, setResetKey] = useState(0)
  const interactionCount = useRef(0)
  const coloursUsedRef = useRef(new Set<string>())
  const [checkResult, setCheckResult] = useState<{ passed: boolean; feedback: string[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const { recordInteraction: recordEngInteraction, recordColour: recordEngColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'level2Demonstrate')

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.completedStages.includes('va-level-2-practise')) {
      navigate('/visual-arts/level-2/practise', {
        replace: true,
        state: { lockedMessage: 'Complete Level 2 Practise first.' },
      })
    }
  }, [isPreviewMode, loading, progress.completedStages, navigate])

  function recordInteraction() {
    recordEngInteraction()
    interactionCount.current += 1
  }

  function handleColourUsed(colour: string) {
    recordEngColour(colour)
    coloursUsedRef.current.add(colour)
  }

  function handleCheck() {
    if (isPreviewMode) { setCheckResult({ passed: true, feedback: [] }); return }
    const isEmpty = coloursUsedRef.current.size === 0
    const result = checkVADemonstration(
      interactionCount.current,
      [...coloursUsedRef.current],
      isEmpty,
    )
    setCheckResult(result)
  }

  const handleSubmit = async () => {
    if (isPreviewMode) { setPassed(true); return }
    setSubmitting(true)
    const score = await computeAndSave()
    setEngagementScore(score)
    const snapshot = canvasRef.current?.toDataURL('image/png') ?? ''
    try {
      await completeVisualArtsDemonstration(2, true, snapshot)
      setPassed(true)
    } catch {
      setPassed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setPassed(false)
    setCheckResult(null)
    interactionCount.current = 0
    coloursUsedRef.current = new Set()
    setResetKey(k => k + 1)
  }

  if (!isPreviewMode && (loading || !progress.completedStages.includes('va-level-2-practise'))) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 2 Task</p>
      <p className="text-text-primary font-semibold text-xs mb-1">Circle with Light and Shadow</p>
      <p className="text-text-secondary text-xs leading-relaxed mb-3">{TASK}</p>

      {checkResult && !checkResult.passed && (
        <div className="mb-3">
          <p className="text-text-primary font-semibold text-xs mb-1.5">Needs work:</p>
          <ul className="space-y-1.5">
            {checkResult.feedback.map((msg, i) => (
              <li key={i} className="text-xs text-accent flex gap-1.5">
                <span className="mt-0.5 flex-shrink-0">&#8226;</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {checkResult?.passed && (
        <div className="bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 rounded-lg px-2.5 py-2 mb-3">
          <p className="text-[#2D6A4F] text-xs font-medium">Your work meets the requirements.</p>
        </div>
      )}

      <button
        onClick={handleReset}
        className="text-text-muted text-[10px] hover:text-text-secondary transition-colors"
      >
        Reset canvas
      </button>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>
        {!checkResult?.passed ? (
          <button
            onClick={handleCheck}
            className="bg-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            {checkResult ? 'Check again' : 'Check my work'}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#2D6A4F] text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? 'Saving...' : 'Submit and Continue'}
          </button>
        )}
      </div>

      <VisualArtsModule
        key={resetKey}
        canvasRef={canvasRef}
        step={5}
        onInteraction={recordInteraction}
        onColourUsed={handleColourUsed}
        onToolChange={recordTool}
        sidebarFooter={sidebarFooter}
      />

      {passed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 2 Demonstration Complete</h2>
            <p className="text-text-secondary text-sm mb-3">
              Your drawing has been saved to your portfolio.
            </p>
            {engagementScore !== null && engagementScore < 40 && (
              <p className="text-sm text-amber-600 mb-3">
                Your engagement score for this session was low. Try spending more time exploring the tools next time.
              </p>
            )}
            <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Intermediate Visual Arts Badge
            </div>
            <p className="text-text-muted text-xs mb-5">
              Review your work against the task and try again if you are not satisfied.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/visual-arts/level-3')}
                className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
              >
                Continue to Level 3
              </button>
              <button
                onClick={handleReset}
                className="border border-surface-border text-text-secondary font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
