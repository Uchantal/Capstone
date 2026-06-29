import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule, { VisualArtsModuleHandle } from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { completeVisualArtsDemonstration, fetchEngagementScores, savePortfolioItem } from '../../services/api'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

const TASK =
  'Create one small complete scene using at least three shapes, more than one colour, and shading on at least ' +
  'one element. Choose a simple subject: a fruit, a simple object, or a basic landscape.'

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
  if (coloursUsed.length < 3) feedback.push('Use at least three different colours in your drawing.')
  if (interactionCount < 12) feedback.push(`Make more marks on the canvas (${interactionCount}/12 strokes).`)

  return { passed: feedback.length === 0, feedback }
}

function levelAverage(scores: Record<string, number | null>, keys: string[]): number {
  const values = keys.map(k => scores[k]).filter((v): v is number => v !== null && v !== undefined)
  if (values.length === 0) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export default function VALevel3DemonstratePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading } = useVisualArtsDemonstrationProgress()
  const moduleRef = useRef<VisualArtsModuleHandle>(null)
  const [resetKey, setResetKey] = useState(0)
  const interactionCount = useRef(0)
  const coloursUsedRef = useRef(new Set<string>())
  const [checkResult, setCheckResult] = useState<{ passed: boolean; feedback: string[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const [combinedScore, setCombinedScore] = useState<number | null>(null)
  const { recordInteraction: recordEngInteraction, recordColour: recordEngColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'level3Demonstrate')


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
    const snapshot = moduleRef.current?.captureCleanImage() ?? ''
    let combined = score
    try {
      const res = await fetchEngagementScores('visual-arts')
      const scores = res.data?.scores ?? {}
      combined = levelAverage({ ...scores, level3Demonstrate: score }, ['level3Learn', 'level3Practise', 'level3Demonstrate'])
    } catch {
      // fall back to demonstrate score alone
    }
    setCombinedScore(combined)
    try {
      if (combined >= 60) {
        await completeVisualArtsDemonstration(3, true, snapshot)
        if (snapshot) savePortfolioItem({ discipline: 'visual-arts', title: 'Visual Arts Level 3 Demonstration', fileType: 'image/png', fileData: snapshot, durationMinutes: 0 }).catch(() => {})
      }
    } catch {
      // ignore
    } finally {
      setPassed(true)
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

  if (!isPreviewMode && loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 3 Task</p>
      <p className="text-text-primary font-semibold text-xs mb-1">A Small Complete Scene</p>
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
          <span>Level 3</span>
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
        ref={moduleRef}
        key={resetKey}
        step={5}
        onInteraction={recordInteraction}
        onColourUsed={handleColourUsed}
        onToolChange={recordTool}
        sidebarFooter={sidebarFooter}
      />

      {passed && (() => {
        const displayScore = combinedScore ?? engagementScore
        const levelPassed = isPreviewMode || displayScore === null || displayScore >= 60
        const gradeLabel = displayScore === null ? null
          : displayScore >= 80 ? 'Excellent' : displayScore >= 60 ? 'Good'
          : displayScore >= 40 ? 'Fair' : 'Needs Improvement'
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              {levelPassed ? (
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Level 3 Complete</h2>
                  <p className="text-text-secondary text-sm mb-3">Your drawing has been saved to your portfolio.</p>
                  {displayScore !== null && (
                    <div className="mb-4 p-3 bg-[#F9F7F4] rounded-xl border border-surface-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Level Score (Combined)</p>
                      <p className="text-2xl font-bold text-text-primary">{displayScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                      <p className="text-xs font-semibold mt-1 text-secondary">{gradeLabel}</p>
                    </div>
                  )}
                  <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-5">
                    Advanced Visual Arts Badge
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => navigate('/visual-arts/sharpening')}
                      className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
                    >
                      Continue to Sharpening Myself
                    </button>
                    <button
                      onClick={handleReset}
                      className="border border-surface-border text-text-secondary font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Demonstration Not Completed</h2>
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Level Score (Combined)</p>
                    <p className="text-2xl font-bold text-text-primary">{displayScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                    <p className="text-xs font-semibold mt-1 text-amber-600">{gradeLabel}</p>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed mb-6">
                    You need at least 60/100 to earn this badge. Spend more time exploring the tools, then try again.
                  </p>
                  <button
                    onClick={handleReset}
                    className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
