import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../TopNav'
import PosterSurface, { DEFAULT_POSTER, PosterState } from './PosterSurface'
import { useGDProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useGDProgress'
import { fetchGDLevelPoster, saveGDLevelPoster } from '../../services/api'

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

function posterFromRecord(rec: Record<string, string> | null): PosterState {
  if (!rec) return DEFAULT_POSTER
  return {
    title:       rec.title      ?? '',
    subtitle:    rec.subtitle   ?? '',
    fontSize:    (rec.fontSize as PosterState['fontSize']) ?? 'medium',
    alignment:   (rec.alignment as PosterState['alignment']) ?? 'left',
    bgColour:    rec.bgColour   ?? '#1A1A1A',
    titleColour: rec.titleColour ?? '#C8960C',
  }
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
  const [poster, setPoster] = useState<PosterState>(DEFAULT_POSTER)
  const [referenceData, setReferenceData] = useState<PosterState | null>(null)
  const [planningNote, setPlanningNote] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const refCanvasRef = useRef<HTMLCanvasElement>(null)

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

  // Load prior poster data and planning note
  useEffect(() => {
    if (progressLoading) return
    const hasMissing = requires.some(r => !completedStages.includes(r))
    if (hasMissing) return

    const fetches: Promise<void>[] = []

    if (initialPosterLevel !== undefined) {
      fetches.push(
        fetchGDLevelPoster(initialPosterLevel)
          .then(res => { if (res.data) setPoster(posterFromRecord(res.data)) })
          .catch(() => {})
      )
    }

    if (referencePosterLevel !== undefined) {
      fetches.push(
        fetchGDLevelPoster(referencePosterLevel)
          .then(res => { if (res.data) setReferenceData(posterFromRecord(res.data)) })
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

  // Render reference poster onto its canvas
  useEffect(() => {
    if (!referenceData || !refCanvasRef.current) return
    const canvas = refCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = referenceData.bgColour
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#C8960C'
    ctx.fillRect(0, 0, 5, H)
    const sizes = { small: { t: 18, s: 10 }, medium: { t: 24, s: 12 }, large: { t: 30, s: 14 } }
    const sz = sizes[referenceData.fontSize] ?? sizes.medium
    const x = referenceData.alignment === 'center' ? W / 2
      : referenceData.alignment === 'right' ? W - 20 : 20
    const ta: CanvasTextAlign = referenceData.alignment === 'center' ? 'center'
      : referenceData.alignment === 'right' ? 'right' : 'left'
    ctx.textAlign = ta
    if (referenceData.title) {
      ctx.fillStyle = referenceData.titleColour
      ctx.font = `bold ${sz.t}px Inter, sans-serif`
      ctx.fillText(referenceData.title, x, H * 0.35, W - 40)
    }
    if (referenceData.subtitle) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = `${sz.s}px Inter, sans-serif`
      ctx.fillText(referenceData.subtitle, x, H * 0.35 + sz.t + 6, W - 40)
    }
  }, [referenceData])

  const loading = progressLoading || dataLoading

  const canComplete =
    poster.title.trim().length > 0 &&
    poster.subtitle.trim().length > 0 &&
    reasoning.trim().length > 0

  const handleComplete = async () => {
    if (!canComplete || saving) return
    setSaving(true)
    try {
      await saveGDLevelPoster({
        level: levelNumber,
        title: poster.title,
        subtitle: poster.subtitle,
        fontSize: poster.fontSize,
        alignment: poster.alignment,
        bgColour: poster.bgColour,
        titleColour: poster.titleColour,
        reasoning: reasoning.trim(),
      })
    } catch {
      // Best-effort
    }
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
    <div className="min-h-screen bg-bg-page">
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

        {/* Planning note reminder (Level 1 only) */}
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

        {/* Reference poster (Level 3: Level 1 shown alongside) */}
        {referenceData && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-5">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your Level 1 poster for reference</p>
            <canvas
              ref={refCanvasRef}
              width={700}
              height={420}
              className="w-full border border-border rounded-xl"
            />
            <p className="text-text-muted text-xs mt-2">This is read-only. Your editable poster is below.</p>
          </div>
        )}

        {/* Design surface */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your poster</p>
          <PosterSurface value={poster} onChange={setPoster} canvasRef={canvasRef} />
        </div>

        {/* Reasoning field */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <label className="text-text-primary font-semibold text-sm block mb-1">
            {reasoningPrompt}
          </label>
          <p className="text-text-secondary text-xs mb-3">
            Write at least one sentence in your own words. This is what distinguishes a deliberate design decision from just clicking buttons.
          </p>
          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            rows={4}
            placeholder="Write your reasoning here..."
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
          />
          {!canComplete && (
            <p className="text-text-muted text-xs mt-1.5">
              {!poster.title.trim() ? 'Add a poster title to continue.' :
               !poster.subtitle.trim() ? 'Add a subtitle to continue.' :
               'Write your reasoning to continue.'}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            disabled={!canComplete || saving}
            className="bg-secondary text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed text-sm"
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
              <span className="text-primary font-bold text-2xl">*</span>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              Well done. Your poster and reasoning have been saved.
            </p>
            <button
              onClick={() => navigate(nextPath)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              {levelNumber < totalLevels
                ? `Continue to Level ${levelNumber + 1}`
                : 'Continue to Free Practice'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
