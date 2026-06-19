import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../TopNav'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, DesignElement, exportDesignToDataUrl } from './PosterSurface'
import { useGDProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useGDProgress'
import { fetchGDLevelPoster, saveGDLevelPoster } from '../../services/api'
import Footer from '../Footer'

const MINIMUM_INTERACTIONS = 10

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

interface Props {
  levelNumber: number
  totalLevels: number
  levelTitle: string
  brief: string
  task: string
  reasoningPrompt: string
  nextPath: string
  stageId: string
  requires: string[]
  initialPosterLevel?: number
  referencePosterLevel?: number
  planningNoteLevel?: number
}

function makeLegacyElements(rec: Record<string, string>): DesignElement[] {
  const els: DesignElement[] = []
  if (rec.title) {
    els.push({
      id: 'legacy-title', type: 'text',
      x: 30, y: 80, width: 360, height: 90,
      zIndex: 1,
      text: rec.title, fontSize: 36, fontWeight: 'bold',
      textAlign: 'left', color: rec.titleColour ?? '#C8960C',
    })
  }
  if (rec.subtitle) {
    els.push({
      id: 'legacy-subtitle', type: 'text',
      x: 30, y: 190, width: 360, height: 60,
      zIndex: 2,
      text: rec.subtitle, fontSize: 18, fontWeight: 'normal',
      textAlign: 'left', color: '#9ca3af',
    })
  }
  return els
}

export default function GDLevelScreen({
  levelNumber, totalLevels, levelTitle, brief, task, reasoningPrompt,
  nextPath, stageId, requires,
  initialPosterLevel, referencePosterLevel, planningNoteLevel,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { completedStages, loading: progressLoading, markComplete } = useGDProgress()

  const [dataLoading, setDataLoading] = useState(
    initialPosterLevel !== undefined || referencePosterLevel !== undefined || planningNoteLevel !== undefined
  )
  const [elements,    setElements]    = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const [bgColor,     setBgColor]     = useState(DEFAULT_BG_COLOR)
  const [canvasKey,   setCanvasKey]   = useState(0)
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null)
  const [planningNote, setPlanningNote] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [completed, setCompleted] = useState(false)

  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)

  function recordInteraction() {
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

  // Gate check
  useEffect(() => {
    if (progressLoading) return
    const firstMissing = requires.find(r => !completedStages.includes(r))
    if (firstMissing) {
      navigate(STAGE_PATHS[firstMissing] ?? '/graphic-design/course-1', {
        replace: true,
        state: { lockedMessage: `Complete ${STAGE_NAMES[firstMissing] ?? firstMissing} first.` },
      })
    }
  }, [progressLoading, completedStages, requires, navigate])

  // Load prior poster data, reference image, and planning note
  useEffect(() => {
    if (progressLoading) return
    const hasMissing = requires.some(r => !completedStages.includes(r))
    if (hasMissing) return

    const fetches: Promise<void>[] = []

    if (initialPosterLevel !== undefined) {
      fetches.push(
        fetchGDLevelPoster(initialPosterLevel)
          .then(res => {
            if (!res.data) return
            if (res.data.elementsJson) {
              try {
                const parsed = JSON.parse(res.data.elementsJson)
                setElements(parsed.elements ?? DEFAULT_ELEMENTS)
                setBgColor(parsed.bgColor ?? DEFAULT_BG_COLOR)
              } catch { /* use defaults */ }
            } else if (res.data.title) {
              setElements(makeLegacyElements(res.data))
              setBgColor(res.data.bgColour ?? DEFAULT_BG_COLOR)
            }
            setCanvasKey(k => k + 1)
          })
          .catch(() => {})
      )
    }

    if (referencePosterLevel !== undefined) {
      fetches.push(
        fetchGDLevelPoster(referencePosterLevel)
          .then(async res => {
            if (!res.data) return
            let els: DesignElement[]
            let bg: string
            if (res.data.elementsJson) {
              try {
                const parsed = JSON.parse(res.data.elementsJson)
                els = parsed.elements ?? DEFAULT_ELEMENTS
                bg  = parsed.bgColor  ?? DEFAULT_BG_COLOR
              } catch { els = DEFAULT_ELEMENTS; bg = DEFAULT_BG_COLOR }
            } else if (res.data.title) {
              els = makeLegacyElements(res.data)
              bg  = res.data.bgColour ?? DEFAULT_BG_COLOR
            } else {
              return
            }
            const url = await exportDesignToDataUrl(els, bg)
            setRefImageUrl(url)
          })
          .catch(() => {})
      )
    }

    if (planningNoteLevel !== undefined) {
      fetches.push(
        fetchGDLevelPoster(planningNoteLevel)
          .then(res => { if (res.data?.reasoning) setPlanningNote(res.data.reasoning) })
          .catch(() => {})
      )
    }

    if (fetches.length === 0) { setDataLoading(false); return }
    Promise.all(fetches).finally(() => setDataLoading(false))
  }, [progressLoading, completedStages, requires, initialPosterLevel, referencePosterLevel, planningNoteLevel])

  const loading = progressLoading || dataLoading

  const hasTextContent = elements.some(el => el.type === 'text' && (el.text ?? '').trim().length > 0)
  const contentReady   = hasTextContent && reasoning.trim().length > 0
  const canComplete    = thresholdMet && contentReady

  const handleComplete = async () => {
    if (!canComplete || saving) return
    setSaving(true)
    try {
      const mainText = elements.find(el => el.type === 'text')?.text ?? ''
      await saveGDLevelPoster({
        level: levelNumber,
        title: mainText,
        subtitle: '',
        elementsJson: JSON.stringify({ elements, bgColor }),
        reasoning: reasoning.trim(),
      })
    } catch { /* best-effort */ }
    await markComplete(stageId)
    setSaving(false)
    setCompleted(true)
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
          <span>Door To Know Graphic Design</span>
          <span>/</span>
          <span className="text-text-primary">{levelTitle}</span>
        </div>

        <ProgressBar value={levelNumber} total={totalLevels} label={`Level ${levelNumber} of ${totalLevels}`} />

        {/* Planning note from Course 1 (Level 1 only) */}
        {planningNote && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 mb-5">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Your plan from Course 1</p>
            <p className="text-text-secondary text-sm leading-relaxed">{planningNote}</p>
          </div>
        )}

        {/* Brief card */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level {levelNumber} Brief</p>
          <h1 className="text-text-primary font-bold text-xl mb-3">{levelTitle}</h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">{brief}</p>
          <div className="bg-[#F9F7F4] border border-border rounded-xl px-4 py-3">
            <p className="text-text-primary font-semibold text-xs mb-1">Your task</p>
            <p className="text-text-secondary text-sm leading-relaxed">{task}</p>
          </div>
        </div>

        {/* Level 1 reference image (Level 3 only) */}
        {refImageUrl && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-5">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your Level 1 poster for reference</p>
            <img
              src={refImageUrl}
              alt="Your Level 1 design"
              className="max-w-xs mx-auto block border border-border rounded-xl"
            />
            <p className="text-text-muted text-xs mt-2 text-center">This is read-only. Your editable poster is below.</p>
          </div>
        )}

        {/* Design surface */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your poster</p>
          <DesignCanvas
            key={canvasKey}
            defaultElements={elements}
            defaultBgColor={bgColor}
            onChange={(els, bg) => { setElements(els); setBgColor(bg) }}
            onInteraction={recordInteraction}
          />
        </div>

        {/* Reasoning field */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <label className="text-text-primary font-semibold text-sm block mb-1">
            {reasoningPrompt}
          </label>
          <p className="text-text-secondary text-xs mb-3">
            Write at least one sentence in your own words. This distinguishes a deliberate design decision from just clicking buttons.
          </p>
          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            rows={4}
            placeholder="Write your reasoning here..."
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
          />
          {!contentReady && (
            <p className="text-text-muted text-xs mt-1.5">
              {!hasTextContent
                ? 'Add at least one text element to your poster to continue.'
                : 'Write your reasoning to continue.'}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            disabled={!canComplete || saving}
            className="bg-secondary text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Saving...' : 'Mark Level Complete'}
          </button>
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              Well done. Your poster and reasoning have been saved.
            </p>
            <button
              onClick={() => navigate(nextPath)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practice
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
