import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, exportDesignToDataUrl, type DesignElement } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { completeGDDemonstration } from '../../services/api'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'

const PLACEHOLDERS = ['New text', 'Your heading', 'Phone: \nEmail: \nWebsite: ', 'Your contact info']

function checkGDDemonstration(elements: DesignElement[], bgColor: string): { passed: boolean; feedback: string[] } {
  const feedback: string[] = []
  const textEls = elements.filter(e => e.type === 'text')
  const nonTextEls = elements.filter(e => e.type !== 'text')
  const shapeEls = elements.filter(e => e.type === 'rect' || e.type === 'circle' || e.type === 'shape')

  if (textEls.length < 2) feedback.push('Add at least two text elements to your poster.')
  if (!textEls.some(e => (e.fontSize ?? 0) >= 32)) feedback.push('Make at least one text element large (font size 32 or bigger).')
  const fontSizes = textEls.map(e => e.fontSize ?? 24)
  if (fontSizes.length >= 2 && fontSizes.every(s => s === fontSizes[0])) feedback.push('Use different font sizes to create visual hierarchy.')
  const hasRealText = textEls.some(e => e.text && e.text.trim().length > 0 && !PLACEHOLDERS.includes(e.text.trim()))
  if (!hasRealText) feedback.push('Replace the placeholder text with your own real content.')

  if (shapeEls.length < 1) feedback.push('Add at least one shape to your poster.')
  const allColors = [
    ...textEls.map(e => e.color).filter(Boolean),
    ...shapeEls.map(e => e.fill).filter(Boolean),
  ] as string[]
  const uniqueColors = new Set(allColors.map(c => c.toLowerCase()))
  if (uniqueColors.size < 2) feedback.push('Use at least two different colours in your design.')
  const textColor = textEls[0]?.color
  if (textColor && textColor.toLowerCase() === bgColor.toLowerCase()) {
    feedback.push('Your text colour must contrast with the background colour.')
  }

  if (elements.length < 4) feedback.push('Add at least four elements to your poster.')
  const contactPattern = /[@+]|www\.|http|phone|email|contact|tel|\b\d{7,}\b/i
  const hasContact = textEls.some(e => e.text && contactPattern.test(e.text))
  if (!hasContact) feedback.push('Include a contact block with an email address, website, or phone number.')
  if (nonTextEls.length < 1) feedback.push('Include at least one non-text element (shape or image).')

  return { passed: feedback.length === 0, feedback }
}

export default function GDLevel3DemonstratePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { progress, loading, reload } = useGDDemonstrationProgress()
  const [elements, setElements] = useState(DEFAULT_ELEMENTS)
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR)
  const [canvasKey, setCanvasKey] = useState(0)
  const [exportW, setExportW] = useState(595)
  const [exportH, setExportH] = useState(842)
  const [checkResult, setCheckResult] = useState<{ passed: boolean; feedback: string[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const interactionCount = useRef(0)
  const { recordInteraction: recordEngInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'level3Demonstrate')

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.completedStages.includes('gd-level-3-practise')) {
      navigate('/graphic-design/level-3/practise', {
        replace: true,
        state: { lockedMessage: 'Complete Level 3 Practice first.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  function recordInteraction() {
    recordEngInteraction()
    interactionCount.current += 1
  }

  function handleCheck() {
    if (isPreviewMode) { setCheckResult({ passed: true, feedback: [] }); return }
    const result = checkGDDemonstration(elements, bgColor)
    setCheckResult(result)
  }

  const handleSubmit = async () => {
    if (isPreviewMode) { setPassed(true); return }
    setSubmitting(true)
    const score = await computeAndSave(elements)
    setEngagementScore(score)
    try {
      const snapshot = JSON.stringify({ elements, bgColor })
      const imageData = await exportDesignToDataUrl(elements, bgColor, exportW, exportH)
      await completeGDDemonstration(3, true, snapshot, imageData)
      reload()
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
    setElements(DEFAULT_ELEMENTS)
    setBgColor(DEFAULT_BG_COLOR)
    setCanvasKey(k => k + 1)
  }

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => navigate('/graphic-design/virtual-studio')} className="hover:text-text-primary transition-colors">
            Graphic Design
          </button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        <CanvasInstructionPanel>
          {lockedMessage && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-xs">
                  {lockedMessage}
                </div>
              )}

              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Task</p>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Design a poster that shows hierarchy, contrast, and balance all working together. This is your chance to show everything you have learned.
              </p>

              {checkResult && !checkResult.passed && (
                <div className="mb-4 space-y-1">
                  <p className="text-xs font-medium text-text-primary">Needs more work:</p>
                  {checkResult.feedback.map((msg, i) => (
                    <p key={i} className="text-xs text-accent flex items-start gap-1">
                      <span className="flex-shrink-0 mt-0.5">&#8226;</span>
                      <span>{msg}</span>
                    </p>
                  ))}
                </div>
              )}

              {checkResult?.passed && (
                <div className="mb-4 bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 rounded-lg px-3 py-2">
                  <p className="text-[#2D6A4F] text-xs font-medium">Your work meets the requirements.</p>
                </div>
              )}

              <div className="mt-auto pt-4">
                {!checkResult?.passed ? (
                  <button
                    onClick={handleCheck}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                  >
                    {checkResult ? 'Check again' : 'Check my work'}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-[#2D6A4F] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? 'Saving...' : isPreviewMode ? 'Submit (Preview - not saved)' : 'Submit and Continue'}
                  </button>
                )}
              </div>
        </CanvasInstructionPanel>

        <DesignCanvas
          key={canvasKey}
          defaultElements={DEFAULT_ELEMENTS}
          defaultBgColor={DEFAULT_BG_COLOR}
          onChange={(els, bg) => { setElements(els); setBgColor(bg); recordElementChange(els) }}
          onInteraction={recordInteraction}
          onDimensionsChange={(w, h) => { setExportW(w); setExportH(h) }}
        />
      </div>

      {passed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 3 Demonstrated</h2>
            <p className="text-text-secondary text-sm mb-4">
              Your poster has been saved to your portfolio.
            </p>
            {engagementScore !== null && engagementScore < 40 && (
              <p className="text-sm text-amber-600 mb-4">
                Your engagement score for this session was low. Try making more design changes next time.
              </p>
            )}
            <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6">
              Advanced Graphic Design Badge
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/graphic-design/virtual-studio')}
                className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full text-sm"
              >
                Back to Graphic Design
              </button>
              <button
                onClick={handleReset}
                className="border border-surface-border text-text-secondary font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-sm"
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
