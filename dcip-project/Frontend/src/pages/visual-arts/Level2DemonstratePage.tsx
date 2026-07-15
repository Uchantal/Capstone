import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import { useAuth } from '../../hooks/useAuth'
import VisualArtsModule, { VisualArtsModuleHandle } from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { completeVisualArtsDemonstration, fetchEngagementScores } from '../../services/api'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'
import DcipLogoLink from '../../components/DcipLogoLink'
import { useCritiqueAI } from '../../hooks/useCritiqueAI'
import AICritiqueModal from '../../components/ai/AICritiqueModal'
import AskAIHint from '../../components/ai/AskAIHint'

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

function levelAverage(scores: Record<string, number | null>, keys: string[]): number {
  const values = keys.map(k => scores[k]).filter((v): v is number => v !== null && v !== undefined)
  if (values.length === 0) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export default function VALevel2DemonstratePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { user } = useAuth()
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
    useVAEngagement('visual-arts', 'level2Demonstrate')
  const { state: critiqueState, runCritique, submitExplanation, skipCritique } = useCritiqueAI()
  const pendingRef = useRef<{ imageData: string; combined: number } | null>(null)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(null)
  const [retryFeedback, setRetryFeedback] = useState<{ score: number; feedback: string; suggestions: string[] } | null>(null)

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
    const canvasSnapshot = moduleRef.current?.getSnapshot() ?? ''
    setSubmittedSnapshot(canvasSnapshot)
    const snapshot = moduleRef.current?.captureCleanImage() ?? ''
    const score = await computeAndSave()
    setEngagementScore(score)
    let combined = score
    try {
      const res = await fetchEngagementScores('visual-arts')
      const scores = res.data?.scores ?? {}
      combined = levelAverage({ ...scores, level2Demonstrate: score }, ['level2Learn', 'level2Practise', 'level2Demonstrate'])
    } catch {}
    pendingRef.current = { imageData: snapshot, combined }
    setSubmitting(false)
    runCritique(snapshot, 'visual-arts', 2, TASK, [
      'One circle drawn and shaded',
      'At least two visible tones: a lighter area and a darker shadow area',
      'A cast shadow visible below the circle',
      'At least 8 visible marks on the canvas',
    ])
  }

  useEffect(() => {
    const s = critiqueState
    if (!pendingRef.current) return
    if (s.status !== 'done' && s.status !== 'skipped' && s.status !== 'error') return
    const { imageData, combined } = pendingRef.current
    pendingRef.current = null
    const aiScore = s.status === 'done' ? s.score : null
    ;(async () => {
      const finalScore = aiScore !== null ? Math.round(aiScore * 0.7 + combined * 0.3) : combined
      setCombinedScore(finalScore)
      if (finalScore >= 60) {
        try { await completeVisualArtsDemonstration(2, true, imageData) } catch {}
        moduleRef.current?.clearDraft()
        setPassed(true)
      } else {
        setCheckResult(null)
        if (s.status === 'done' && s.feedback) {
          setRetryFeedback({ score: finalScore, feedback: s.feedback, suggestions: s.suggestions })
        } else {
          setRetryFeedback({ score: finalScore, feedback: 'Your score was below 60. Review your work and try again.', suggestions: [] })
        }
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [critiqueState.status])

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
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 2 Task</p>
      <p className="text-text-primary font-semibold text-xs mb-1">Circle with Light and Shadow</p>
      <p className="text-text-secondary text-xs leading-relaxed mb-3">{TASK}</p>

      {retryFeedback && (
        <div className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">AI Feedback — Score: {retryFeedback.score}/100</p>
          <p className="text-xs text-text-secondary leading-relaxed mb-1">{retryFeedback.feedback}</p>
          {retryFeedback.suggestions.length > 0 && (
            <ul className="space-y-1">
              {retryFeedback.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1"><span className="flex-shrink-0">•</span><span>{s}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}

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
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate(-1)}
            className="hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
          <span>/</span>
          <button
            onClick={() => navigate('/visual-arts/level-2/practise')}
            className="hover:text-text-primary transition-colors"
          >
            Level 2
          </button>
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
            disabled={submitting || critiqueState.status === 'loading'}
            className="bg-[#2D6A4F] text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? 'Saving...' : critiqueState.status === 'loading' ? 'Analysing...' : 'Submit and Continue'}
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
        draftKey={`${user?.id ?? 'anon'}:va:level2-demonstrate`}
        initialSnapshot={submittedSnapshot ?? undefined}
      />

      {critiqueState.status === 'loading' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-text-primary font-semibold text-sm mb-1">AI is reviewing your work...</p>
            <p className="text-text-muted text-xs">This takes a few seconds.</p>
          </div>
        </div>
      )}

      {critiqueState.status === 'needsExplanation' && (
        <AICritiqueModal
          question={critiqueState.question}
          onSubmit={text => submitExplanation(pendingRef.current?.imageData ?? '', 'visual-arts', 2, text, TASK, ['Circle with shading (light and shadow tones)', 'Cast shadow below the circle'])}
          onSkip={skipCritique}
        />
      )}

      <AskAIHint discipline="Visual Arts" context="Visual Arts Level 2 — Demonstrate (draw one circle shaded with at least two tones and a cast shadow below)" side="left" />

      {passed && (() => {
        const displayScore = combinedScore ?? engagementScore
        const levelPassed = isPreviewMode || displayScore === null || displayScore >= 60
        const gradeLabel = displayScore === null ? null
          : displayScore >= 80 ? 'Excellent' : displayScore >= 60 ? 'Good'
          : displayScore >= 40 ? 'Fair' : 'Needs Improvement'
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl overflow-y-auto max-h-[90vh]">
              {levelPassed ? (
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Level 2 Complete</h2>
                  <p className="text-text-secondary text-sm mb-3">Your drawing has been saved to your portfolio.</p>
                  {displayScore !== null && (
                    <div className="mb-4 p-3 bg-[#F9F7F4] rounded-xl border border-surface-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Level Score (Combined)</p>
                      <p className="text-2xl font-bold text-text-primary">{displayScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                      <p className="text-xs font-semibold mt-1 text-secondary">{gradeLabel}</p>
                    </div>
                  )}
                  {critiqueState.status === 'done' && critiqueState.feedback && (
                    <div className="mb-4 p-3 bg-[#F9F7F4] rounded-xl border border-surface-border text-left">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">AI Feedback</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{critiqueState.feedback}</p>
                      {critiqueState.suggestions.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {critiqueState.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                              <span className="text-primary flex-shrink-0">•</span><span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-5">
                    Intermediate Visual Arts Badge
                  </div>
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
                  {critiqueState.status === 'done' && critiqueState.feedback && (
                    <div className="mb-4 p-3 bg-[#F9F7F4] rounded-xl border border-surface-border text-left">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">AI Feedback</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{critiqueState.feedback}</p>
                      {critiqueState.suggestions.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {critiqueState.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                              <span className="text-primary flex-shrink-0">•</span><span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-amber-700 leading-relaxed mb-6">
                    You need at least 60/100 to earn this badge. Review the feedback above and try again.
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
