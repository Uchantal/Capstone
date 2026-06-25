import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { saveVAProductionResult, savePortfolioItem, completeVisualArtsProduction } from '../../services/api'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

const PRODUCTION_CHECKLIST = [
  { id: 'three-shapes', text: 'My composition contains at least three recognisable shapes or elements' },
  { id: 'colour',       text: 'I used colour intentionally, not randomly' },
  { id: 'shading',      text: 'At least one element shows visible shading' },
  { id: 'original',     text: 'This is my own original work and I am ready to submit it' },
]

type Phase = 'intro' | 'working' | 'done'

export default function VAProductionPage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  const [phase, setPhase] = useState<Phase>('intro')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const { recordInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'production')


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
    if (isPreviewMode) { setPhase('done'); return }
    setSubmitting(true)

    const score = await computeAndSave()
    setEngagementScore(score)
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

  if (!isPreviewMode && loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'done') {
    const lowEngagement = engagementScore !== null && engagementScore < 40
    const gradeLabel = engagementScore === null ? null
      : engagementScore >= 80 ? 'Excellent' : engagementScore >= 60 ? 'Good'
      : engagementScore >= 40 ? 'Fair' : 'Needs Improvement'

    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate('/dashboard')} className="bg-primary rounded-md w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0">
              <span className="text-white font-bold text-[10px]">DC</span>
            </button>
            <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Exit
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-white">
          <div className="max-w-md w-full text-center">
            <div className={`border-2 rounded-2xl p-10 mb-6 ${lowEngagement ? 'bg-amber-50 border-amber-200' : 'bg-secondary/5 border-secondary/30'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${lowEngagement ? 'bg-amber-100' : 'bg-secondary/10'}`}>
                <svg className={`w-7 h-7 ${lowEngagement ? 'text-amber-600' : 'text-[#2D6A4F]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={lowEngagement ? 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' : 'M5 13l4 4L19 7'} />
                </svg>
              </div>
              <h1 className="text-text-primary font-bold text-2xl mb-2">Production Submitted</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Your composition has been saved to your portfolio.
              </p>
              {engagementScore !== null && (
                <div className="mb-4 p-3 bg-white rounded-xl border border-surface-border">
                  <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Engagement Score</p>
                  <p className="text-3xl font-bold text-text-primary">{engagementScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                  <p className={`text-xs font-semibold mt-1 ${lowEngagement ? 'text-amber-600' : 'text-secondary'}`}>{gradeLabel}</p>
                </div>
              )}
              {lowEngagement ? (
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your engagement was too low to earn the badge. Spend more time exploring the tools, experimenting with shapes and colours, then try again.
                </p>
              ) : (
                <>
                  <p className="text-text-secondary text-sm mb-4">You have completed the Visual Arts journey.</p>
                  <div className="inline-flex items-center bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold px-4 py-2 rounded-full">
                    Advanced Visual Arts Badge
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {lowEngagement && (
                <button
                  onClick={() => { setPhase('working'); setChecked(new Set()); setEngagementScore(null); setPortfolioId(null) }}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Try Again
                </button>
              )}
              {portfolioId && !lowEngagement && (
                <button
                  onClick={() => navigate('/portfolio')}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  View in Portfolio
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-surface-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate('/dashboard')} className="bg-primary rounded-md w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0">
              <span className="text-white font-bold text-[10px]">DC</span>
            </button>
            <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-white">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white border border-surface-border rounded-2xl p-10 shadow-sm">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Visual Arts Production</p>
              <h1 className="text-text-primary font-bold text-2xl mb-4">Create a Finished Composition</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Using the tools and techniques you have practised throughout this journey, create one finished composition.
                Choose your own subject. There are no restrictions on what you draw, only on how carefully you apply what you have learned.
              </p>
              <div className="bg-[#F9F7F4] border border-surface-border rounded-xl px-5 py-4 text-left mb-8">
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
      </div>
    )
  }

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Your task</p>
      <p className="text-text-secondary text-xs leading-relaxed mb-3">
        Create one finished composition using at least three elements, intentional colour, and visible shading on at least one element. Choose your own subject.
      </p>

      <p className="text-text-primary font-semibold text-xs mb-1">When finished, confirm each item:</p>
      <p className="text-text-muted text-[10px] mb-3">Tick each item honestly before submitting.</p>

      <div className="space-y-2.5 mb-4">
        {PRODUCTION_CHECKLIST.map(item => (
          <label key={item.id} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checked.has(item.id)}
              onChange={() => toggleCheck(item.id)}
              className="mt-0.5 w-3.5 h-3.5 accent-primary flex-shrink-0"
            />
            <span
              className={`text-xs leading-snug ${
                checked.has(item.id) ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {item.text}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allChecked || submitting}
        className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? 'Submitting...' : 'Submit Production'}
      </button>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => navigate('/dashboard')} className="bg-primary rounded-md w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0">
            <span className="text-white font-bold text-[10px]">DC</span>
          </button>
          <span className="text-text-primary font-bold text-sm">DCIP Visual Arts</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Save and Exit
        </button>
      </div>

      <VisualArtsModule
        canvasRef={canvasRef}
        step={5}
        onInteraction={recordInteraction}
        onColourUsed={recordColour}
        onToolChange={recordTool}
        sidebarFooter={sidebarFooter}
      />
    </div>
  )
}
