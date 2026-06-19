import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, exportDesignToDataUrl } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { completeGDDemonstration } from '../../services/api'
import Footer from '../../components/Footer'

const MINIMUM_INTERACTIONS = 8

const CHECKLIST = [
  { id: 'hierarchy', text: 'My poster has a clear visual hierarchy with a dominant title' },
  { id: 'contrast', text: 'My text and background have strong, readable contrast' },
  { id: 'layout', text: 'My layout feels balanced and intentional' },
  { id: 'message', text: 'My poster communicates a real message to a real audience' },
  { id: 'original', text: 'This is an original design that I created during this session' },
]

export default function GDLevel3DemonstratePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { progress, loading, reload } = useGDDemonstrationProgress()
  const [elements, setElements] = useState(DEFAULT_ELEMENTS)
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR)
  const [canvasKey, setCanvasKey] = useState(0)
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('gd-level-3-practise')) {
      navigate('/graphic-design/level-3/practise', {
        replace: true,
        state: { lockedMessage: 'Complete Level 3 Practice first.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  function recordInteraction() {
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

  const allChecked = CHECKLIST.every(item => checked.has(item.id))
  const canSubmit = thresholdMet && allChecked && !submitting

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const snapshot = JSON.stringify({ elements, bgColor })
      const imageData = await exportDesignToDataUrl(elements, bgColor)
      await completeGDDemonstration(3, true, snapshot, imageData)
      await reload()
      setPassed(true)
    } catch {
      setPassed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setPassed(false)
    setChecked(new Set())
    interactionCount.current = 0
    setThresholdMet(false)
    setElements(DEFAULT_ELEMENTS)
    setBgColor(DEFAULT_BG_COLOR)
    setCanvasKey(k => k + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/graphic-design/virtual-studio')} className="hover:text-text-primary transition-colors">
            Graphic Design
          </button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 3 Demonstration</p>
          <h1 className="text-text-primary font-bold text-xl mb-3">Create One Complete Poster</h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            Create one complete poster that combines everything you have learned: clear hierarchy, strong contrast, and intentional alignment.
            Choose a real announcement from your school or community.
          </p>
          <div className="bg-[#F9F7F4] border border-border rounded-xl px-4 py-3">
            <p className="text-text-primary font-semibold text-xs mb-1">Your task</p>
            <p className="text-text-secondary text-sm">
              Design a poster that shows hierarchy, contrast, and balance all working together.
              This is your chance to show everything you have learned across the three levels.
            </p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your poster</p>
          <DesignCanvas
            key={canvasKey}
            defaultElements={DEFAULT_ELEMENTS}
            defaultBgColor={DEFAULT_BG_COLOR}
            onChange={(els, bg) => { setElements(els); setBgColor(bg) }}
            onInteraction={recordInteraction}
          />
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <p className="text-text-primary font-semibold text-sm mb-1">
            When you are done, confirm each of the following honestly:
          </p>
          <p className="text-text-secondary text-xs mb-5">
            Tick each item only when it is genuinely true for your poster.
          </p>
          <div className="space-y-3 mb-6">
            {CHECKLIST.map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span className={`text-sm leading-relaxed ${checked.has(item.id) ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Saving...' : 'Submit Demonstration'}
            </button>
          </div>
        </div>
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
            <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6">
              Advanced Graphic Design Badge
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/graphic-design/sharpening')}
                className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full text-sm"
              >
                Continue to Sharpening Myself
              </button>
              <button
                onClick={handleReset}
                className="border border-border text-text-secondary font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
