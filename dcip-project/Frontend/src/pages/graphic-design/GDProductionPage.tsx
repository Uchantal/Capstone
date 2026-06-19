import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, exportDesignToDataUrl, DesignElement } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { saveGDProductionResult, savePortfolioItem, completeGDProduction } from '../../services/api'
import Footer from '../../components/Footer'

const CHECKLIST = [
  { id: 'hierarchy',   text: 'My poster has a title and subtitle with clear visual hierarchy' },
  { id: 'contrast',    text: 'My text and background have strong, readable contrast' },
  { id: 'layout',      text: 'My alignment and layout feel balanced and intentional' },
  { id: 'reasoning',   text: 'I have explained who this poster is for and why my choices suit them' },
  { id: 'original',    text: 'This is my own original design, not copied from a reference shown elsewhere on this platform' },
]

type Phase = 'intro' | 'working' | 'done'

function MinimalNav({ onExit }: { onExit: () => void }) {
  return (
    <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
          <span className="text-white font-bold text-xs">DC</span>
        </div>
        <span className="text-text-primary font-bold text-sm">DCIP Graphic Design</span>
      </div>
      <button
        onClick={onExit}
        className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        Save and Exit
      </button>
    </nav>
  )
}

export default function GDProductionPage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGDDemonstrationProgress()
  const [phase, setPhase] = useState<Phase>('intro')
  const [elements, setElements] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR)
  const [canvasKey] = useState(0)
  const [reasoning, setReasoning] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!progress.level3DemonstrationPassed) {
      navigate('/graphic-design/level-3/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 3 demonstration first.' },
      })
      return
    }
    if (!progress.completedStages.includes('gd-sharpening')) {
      navigate('/graphic-design/sharpening', {
        replace: true,
        state: { lockedMessage: 'Complete Sharpening Myself first.' },
      })
    }
  }, [loading, progress.level3DemonstrationPassed, progress.completedStages, navigate])

  const allChecked = CHECKLIST.every(item => checked.has(item.id))
  const canSubmit = allChecked && reasoning.trim().length > 0 && !submitting

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
    const textEls = elements.filter(el => el.type === 'text')
    const mainEl  = textEls[0]
    const subEl   = textEls[1]
    const imageData = await exportDesignToDataUrl(elements, bgColor)
    try {
      await saveGDProductionResult({
        posterTitle:    mainEl?.text ?? '',
        posterSubtitle: subEl?.text ?? '',
        fontSize:       String(mainEl?.fontSize ?? 24),
        alignment:      mainEl?.textAlign ?? 'left',
        bgColour:       bgColor,
        titleColour:    mainEl?.color ?? '#ffffff',
        finalImageData: imageData,
        reasoningText:  reasoning.trim(),
        checklistConfirmed: {
          hasTitleAndSubtitle:  checked.has('hierarchy'),
          hasStrongContrast:    checked.has('contrast'),
          hasIntentionalLayout: checked.has('layout'),
          hasReasoningText:     checked.has('reasoning'),
          isOriginalWork:       checked.has('original'),
        },
      })

      const portfolioRes = await savePortfolioItem({
        discipline: 'graphic-design',
        title: 'Graphic Design Production',
        fileType: 'image/png',
        fileData: imageData,
        durationMinutes: 0,
      })
      setPortfolioId(portfolioRes.data?._id ?? null)

      await markStageVisited('gd-production')
      completeGDProduction(true).catch(() => {})
      setPhase('done')
    } catch {
      setPhase('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <MinimalNav onExit={() => navigate('/dashboard')} />
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-12 w-full">
          <div className="bg-secondary/5 border-2 border-secondary/30 rounded-2xl p-8 text-center mb-6">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-text-primary font-bold text-2xl mb-2">Production Complete</h1>
            <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto mb-4">
              Your work has been saved to your portfolio. You have completed the Graphic Design journey.
            </p>
            <div className="inline-flex items-center bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold px-4 py-2 rounded-full">
              Advanced Graphic Design Badge
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
        <MinimalNav onExit={() => navigate('/dashboard')} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white border border-border rounded-2xl p-10 shadow-sm">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Graphic Design Production</p>
              <h1 className="text-text-primary font-bold text-2xl mb-4">Design One Complete Poster</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Choose a real announcement you care about, something from your school or community, and design one
                complete poster for it. Apply hierarchy, intentional alignment, and strong colour contrast.
              </p>
              <div className="bg-[#F9F7F4] border border-border rounded-xl px-5 py-4 text-left mb-8">
                <p className="text-text-primary font-semibold text-xs mb-2">What is expected:</p>
                <ul className="space-y-1.5">
                  <li className="text-text-secondary text-xs">A title and subtitle with clear visual hierarchy</li>
                  <li className="text-text-secondary text-xs">Text and background with strong, readable contrast</li>
                  <li className="text-text-secondary text-xs">Intentional alignment and balanced layout</li>
                  <li className="text-text-secondary text-xs">One short sentence describing who the poster is for and why your choices suit that audience</li>
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
      <MinimalNav onExit={() => navigate('/dashboard')} />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 w-full">

        <div className="bg-white border border-border rounded-2xl p-5 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Your task</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Design one complete poster for a real announcement from your school or community. Apply hierarchy,
            intentional alignment, and strong colour contrast. Then write one short sentence describing who the
            poster is for and why your design choices suit that audience.
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <DesignCanvas
            key={canvasKey}
            defaultElements={DEFAULT_ELEMENTS}
            defaultBgColor={DEFAULT_BG_COLOR}
            onChange={(els, bg) => { setElements(els); setBgColor(bg) }}
            onInteraction={() => {}}
          />
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <label className="text-text-primary font-semibold text-sm block mb-1">
            Who is this poster for, and why do your design choices suit that audience?
          </label>
          <p className="text-text-secondary text-xs mb-3">Write at least one sentence.</p>
          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            rows={3}
            placeholder="For example: This poster is for teenagers at my school. I used bold left-aligned text and a warm background because teenagers respond to direct, energetic designs."
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <p className="text-text-primary font-semibold text-sm mb-1">
            Before you submit, confirm each of the following honestly:
          </p>
          <p className="text-text-secondary text-xs mb-5">
            Tick each item only when it is genuinely true for your poster.
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
                <span className={`text-sm leading-relaxed ${checked.has(item.id) ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
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
