import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { saveVAProductionResult, savePortfolioItem, completeVisualArtsProduction } from '../../services/api'
import Footer from '../../components/Footer'

const PRODUCTION_CHECKLIST = [
  { id: 'three-shapes',    text: 'My composition contains at least three recognisable shapes or elements' },
  { id: 'colour',          text: 'I used colour intentionally, not randomly' },
  { id: 'shading',         text: 'At least one element shows visible shading' },
  { id: 'original',        text: 'This is my own original work and I am ready to submit it' },
]

type Phase = 'intro' | 'working' | 'done'

export default function VAProductionPage() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { progress, loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  const [phase, setPhase] = useState<Phase>('intro')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!progress.level3DemonstrationPassed) {
      navigate('/visual-arts/level-3/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 3 demonstration first.' },
      })
      return
    }
    if (!progress.completedStages.includes('va-sharpening')) {
      navigate('/visual-arts/sharpening', {
        replace: true,
        state: { lockedMessage: 'Complete Sharpening Myself first.' },
      })
    }
  }, [loading, progress.level3DemonstrationPassed, progress.completedStages, navigate])

  const allChecked = PRODUCTION_CHECKLIST.every(item => checked.has(item.id))

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!allChecked || submitting) return
    setSubmitting(true)

    const imageData = canvasRef.current?.toDataURL('image/png') ?? ''

    try {
      await saveVAProductionResult({
        finalImageData: imageData,
        checklistConfirmed: {
          hasThreeShapes: checked.has('three-shapes'),
          usedColourIntentionally: checked.has('colour'),
          hasVisibleShading: checked.has('shading'),
          isOriginalWork: checked.has('original'),
        },
      })

      const portfolioRes = await savePortfolioItem({
        discipline: 'visual-arts',
        title: 'Visual Arts Production',
        fileType: 'image/png',
        fileData: imageData,
        durationMinutes: 0,
      })

      setPortfolioId(portfolioRes.data?._id ?? null)
      await markStageVisited('va-production')
      completeVisualArtsProduction(true).catch(() => {})
      setPhase('done')
    } catch {
      setPhase('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !progress.level3DemonstrationPassed) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </nav>

        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-12 w-full">
          <div className="bg-secondary/5 border-2 border-secondary/30 rounded-2xl p-8 text-center mb-6">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-secondary font-bold text-xl">*</span>
            </div>
            <h1 className="text-text-primary font-bold text-2xl mb-2">Production Submitted</h1>
            <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto mb-4">
              Your composition has been saved to your portfolio. You have completed the Visual Arts journey.
            </p>
            <div className="inline-flex items-center bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold px-4 py-2 rounded-full">
              Advanced Visual Arts Badge
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {portfolioId && (
              <button
                onClick={() => navigate('/portfolio')}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                View in Portfolio
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full border border-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white border border-border rounded-2xl p-10 shadow-sm">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Visual Arts Production</p>
              <h1 className="text-text-primary font-bold text-2xl mb-4">Create a Finished Composition</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Using the tools and techniques you have practised throughout this journey, create one finished composition.
                Choose your own subject. There are no restrictions on what you draw, only on how carefully you apply what you have learned.
              </p>
              <div className="bg-[#F9F7F4] border border-border rounded-xl px-5 py-4 text-left mb-8">
                <p className="text-text-primary font-semibold text-xs mb-2">What is expected:</p>
                <ul className="space-y-1.5">
                  <li className="text-text-secondary text-xs">At least three recognisable shapes or elements</li>
                  <li className="text-text-secondary text-xs">Intentional use of colour throughout</li>
                  <li className="text-text-secondary text-xs">Visible shading on at least one element</li>
                  <li className="text-text-secondary text-xs">An original subject of your choosing</li>
                </ul>
              </div>
              <button
                onClick={() => setPhase('working')}
                className="bg-primary text-white font-semibold px-10 py-3 rounded-xl hover:bg-primary-dark transition-colors"
              >
                Begin
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DC</span>
          </div>
          <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Save and Exit
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 w-full">
        <div className="bg-white border border-border rounded-2xl p-5 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Your task</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Create one finished composition using at least three elements, intentional colour, and visible shading on at least one element.
            Choose your own subject. Take your time.
          </p>
        </div>

        <div className="mb-5">
          <VisualArtsModule canvasRef={canvasRef} step={5} />
        </div>

        <div className="bg-white border border-border rounded-2xl p-6">
          <p className="text-text-primary font-semibold text-sm mb-1">
            When you are finished, confirm each of the following:
          </p>
          <p className="text-text-secondary text-xs mb-5">
            Tick each item honestly before submitting. Submitting saves your canvas to your portfolio.
          </p>
          <div className="space-y-3 mb-6">
            {PRODUCTION_CHECKLIST.map(item => (
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
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!allChecked || submitting}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Production'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
