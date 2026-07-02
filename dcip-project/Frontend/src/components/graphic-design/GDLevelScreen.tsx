import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, DesignElement, exportDesignToDataUrl } from './PosterSurface'
import { useGDProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useGDProgress'
import { fetchGDLevelPoster, saveGDLevelPoster } from '../../services/api'
import CanvasInstructionPanel from '../canvas/CanvasInstructionPanel'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'
import AskAIHint from '../ai/AskAIHint'
import DcipLogoLink from '../DcipLogoLink'

function stageIdToEngagementKey(stageId: string): string {
  if (stageId === 'gd-level-1') return 'level1Learn'
  if (stageId === 'gd-level-2') return 'level2Learn'
  if (stageId === 'gd-level-3') return 'level3Learn'
  return 'level1Learn'
}

const MINIMUM_INTERACTIONS = 10
const PLACEHOLDER_TEXTS = new Set(['New text', 'Your heading', 'Phone: \nEmail: \nWebsite: '])

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
  const isPreviewMode = usePreviewMode()
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
  const [engagementScore, setEngagementScore] = useState<number | null>(null)

  const { recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', stageIdToEngagementKey(stageId))

  function recordInteraction() {
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

  // Gate check
  useEffect(() => {
    if (isPreviewMode) return
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
    if (isPreviewMode) { setDataLoading(false); return }
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
  const canComplete    = isPreviewMode || (thresholdMet && contentReady)

  const textElements           = elements.filter(el => el.type === 'text' && (el.text ?? '').trim().length > 0)
  const hasOnlyPlaceholderText = textElements.length > 0 && textElements.every(el => PLACEHOLDER_TEXTS.has(el.text ?? ''))
  const buttonHint = !canComplete
    ? (!hasTextContent
        ? 'Add at least one text element to continue.'
        : hasOnlyPlaceholderText
          ? 'Replace the placeholder text with your own content.'
          : !reasoning.trim()
            ? 'Write your reasoning to continue.'
            : `Make at least ${MINIMUM_INTERACTIONS} design changes to continue.`)
    : ''

  const handleComplete = async () => {
    if (!canComplete || saving) return
    if (isPreviewMode) { setCompleted(true); return }
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
    const score = await computeAndSave(elements)
    setEngagementScore(score)
    await markComplete(stageId)
    setSaving(false)
    setCompleted(true)
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
      <AskAIHint discipline="Graphic Design" context={`${levelTitle} — Learn`} side="left" />
      {/* ── Top bar ── */}
      <div className="h-auto min-h-12 flex-shrink-0 bg-white border-b border-surface-border flex flex-wrap items-center px-4 py-2 gap-2">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="hover:text-text-primary transition-colors flex-shrink-0"
          >
            ← Back
          </button>
          <span>/</span>
          <span className="truncate">{levelTitle}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5 ml-auto">
          <button
            onClick={handleComplete}
            disabled={!canComplete || saving}
            className="bg-secondary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Mark Level Complete'}</span>
            <span className="sm:hidden">{saving ? 'Saving...' : 'Complete'}</span>
          </button>
          {!canComplete && (
            <p className="text-xs text-text-secondary text-right hidden sm:block">{buttonHint}</p>
          )}
        </div>
      </div>

      {/* ── Main area: instructions left, canvas right ── */}
      <div className="flex-1 flex flex-row overflow-hidden">

        {/* ── Instructions panel (left) ── */}
        <CanvasInstructionPanel>
          {lockedMessage && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-xs">
              {lockedMessage}
            </div>
          )}

          {/* Level progress */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest whitespace-nowrap">
              Level {levelNumber} of {totalLevels}
            </span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-primary rounded-full"
                style={{ width: `${(levelNumber / totalLevels) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-lg font-bold text-text-primary mb-1">{levelTitle}</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{brief}</p>

          {/* Task card */}
          <div className="border border-surface-border rounded-lg p-3 mb-3 bg-white">
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-1">Your task</p>
            <p className="text-sm text-text-secondary leading-relaxed">{task}</p>
          </div>

          {/* Planning note */}
          {planningNote && (
            <div className="border border-surface-border rounded-lg p-3 mb-3 bg-white">
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Your plan from Course 1</p>
              <p className="text-sm italic text-text-secondary">{planningNote}</p>
            </div>
          )}

          {/* Reference image (Level 3) */}
          {refImageUrl && (
            <div className="mb-4">
              <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1">
                Your Level 1 poster (reference)
              </p>
              <img
                src={refImageUrl}
                alt="Your Level 1 design"
                className="w-24 border border-surface-border rounded-lg"
              />
            </div>
          )}

          {/* Reasoning */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-2">
              {reasoningPrompt}
            </label>
            <textarea
              value={reasoning}
              onChange={e => setReasoning(e.target.value)}
              rows={4}
              placeholder="Write your reasoning here..."
              className="w-full border border-surface-border rounded-lg p-3 text-sm text-text-primary bg-white resize-none focus:outline-none focus:border-primary"
            />
          </div>

          {!contentReady && (
            <p className="text-xs text-text-muted">
              {!hasTextContent
                ? 'Add at least one text element to your poster to continue.'
                : 'Write your reasoning to continue.'}
            </p>
          )}
        </CanvasInstructionPanel>

        {/* ── Canvas area (right) ── */}
        <DesignCanvas
          key={canvasKey}
          defaultElements={elements}
          defaultBgColor={bgColor}
          onChange={(els, bg) => { setElements(els); setBgColor(bg); recordElementChange(els) }}
          onInteraction={recordInteraction}
        />
      </div>

      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete</h2>
            <p className="text-text-secondary text-sm mb-4">
              Well done. Your poster and reasoning have been saved.
            </p>
            {engagementScore !== null && engagementScore < 40 && (
              <p className="text-sm text-text-secondary mb-4 p-3 bg-[#F9F7F4] rounded-lg border border-surface-border">
                Your interaction with this exercise was limited. Spending more time exploring the tools and experimenting will strengthen your skills before the next level.
              </p>
            )}
            <button
              onClick={() => navigate(nextPath)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
