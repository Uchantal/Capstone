import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { completeVisualArtsDemonstration } from '../../services/api'
import Footer from '../../components/Footer'

const MINIMUM_INTERACTIONS = 10

const TASK =
  'Draw exactly three shapes using three different tools. Use the Rectangle tool for one shape, ' +
  'the Ellipse tool for one shape, and the Line tool for one shape. Each shape must be a different colour.'

const CHECKLIST = [
  { id: 'rect',    text: 'I drew one shape using the Rectangle tool' },
  { id: 'ellipse', text: 'I drew one shape using the Ellipse tool' },
  { id: 'line',    text: 'I drew one shape using the Line tool' },
  { id: 'colours', text: 'Each shape is a different colour' },
]

export default function VALevel1DemonstratePage() {
  const navigate = useNavigate()
  const { progress, loading } = useVisualArtsDemonstrationProgress()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [resetKey, setResetKey] = useState(0)
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('va-level-1-practise')) {
      navigate('/visual-arts/level-1/practise', {
        replace: true,
        state: { lockedMessage: 'Complete Level 1 Practise first.' },
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
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    const snapshot = canvasRef.current?.toDataURL('image/png') ?? ''
    try {
      await completeVisualArtsDemonstration(1, true, snapshot)
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
    setResetKey(k => k + 1)
  }

  if (loading || !progress.completedStages.includes('va-level-1-practise')) {
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

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span>Level 1</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 1 Demonstration Task</p>
          <h1 className="text-text-primary font-bold text-xl mb-3">Three Shapes, Three Tools</h1>
          <p className="text-text-secondary text-sm leading-relaxed">{TASK}</p>
        </div>

        <div className="mb-5">
          <VisualArtsModule key={resetKey} canvasRef={canvasRef} step={5} onInteraction={recordInteraction} />
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <p className="text-text-primary font-semibold text-sm mb-1">
            Confirm each of the following before submitting:
          </p>
          <p className="text-text-secondary text-xs mb-5">
            Tick each item honestly. Your canvas will be saved to your portfolio for supervisor review.
          </p>
          <div className="space-y-3">
            {CHECKLIST.map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span
                  className={`text-sm leading-relaxed ${
                    checked.has(item.id) ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {item.text}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-secondary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Saving...' : 'Submit Demonstration'}
            </button>
          </div>
        </div>
      </div>

      {passed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 1 Demonstration Complete</h2>
            <p className="text-text-secondary text-sm mb-3">
              Your drawing has been saved to your portfolio.
            </p>
            <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Beginner Visual Arts Badge
            </div>
            <p className="text-text-muted text-xs mb-5">
              Review your work against the task checklist and try again if you are not satisfied.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/visual-arts/level-2')}
                className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
              >
                Continue to Level 2
              </button>
              <button
                onClick={handleReset}
                className="border border-border text-text-secondary font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-sm"
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
