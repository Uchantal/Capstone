import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule from '../modules/VisualArtsModule'
import { useVisualArtsProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useVisualArtsProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

function stageIdToEngagementKey(stageId: string): string {
  if (stageId === 'va-level-1') return 'level1Learn'
  if (stageId === 'va-level-2') return 'level2Learn'
  if (stageId === 'va-level-3') return 'level3Learn'
  return 'level1Learn'
}

export interface ChecklistItem {
  id: string
  text: string
}

interface Props {
  levelNumber: number
  totalLevels: number
  levelTitle: string
  task: string
  checklist: ChecklistItem[]
  nextPath: string
  stageId: string
  requires: string[]
}

const MINIMUM_INTERACTIONS = 10

export default function VisualArtsLevelScreen({
  levelNumber,
  totalLevels,
  levelTitle,
  task,
  checklist,
  nextPath,
  stageId,
  requires,
}: Props) {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { completedStages, loading, markComplete } = useVisualArtsProgress()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)

  const { recordInteraction: recordEngInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', stageIdToEngagementKey(stageId))

  function recordInteraction() {
    recordEngInteraction()
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) {
      setThresholdMet(true)
    }
  }

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    const firstMissing = requires.find(r => !completedStages.includes(r))
    if (firstMissing) {
      const path = STAGE_PATHS[firstMissing] ?? '/visual-arts/course-1'
      const name = STAGE_NAMES[firstMissing] ?? firstMissing
      navigate(path, { replace: true, state: { lockedMessage: `Complete ${name} first.` } })
    }
  }, [isPreviewMode, loading, completedStages, requires, navigate])

  const allChecked = checklist.every(item => checked.has(item.id))
  const canComplete = isPreviewMode || (thresholdMet && allChecked)

  const handleComplete = async () => {
    if (!canComplete) return
    if (!isPreviewMode) {
      const score = await computeAndSave()
      setEngagementScore(score)
      await markComplete(stageId)
    }
    setCompleted(true)
  }

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
      <div className="mb-3">
        <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">
          Level {levelNumber} of {totalLevels}
        </p>
        <div className="w-full h-1 bg-gray-200 rounded-full">
          <div
            className="h-1 bg-primary rounded-full"
            style={{ width: `${(levelNumber / totalLevels) * 100}%` }}
          />
        </div>
      </div>

      {lockedMessage && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-2.5 py-2 mb-3 text-accent text-xs">
          {lockedMessage}
        </div>
      )}

      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Task</p>
      <p className="text-text-primary font-semibold text-xs mb-1">{levelTitle}</p>
      <p className="text-text-secondary text-xs leading-relaxed mb-3">{task}</p>

      <div className="space-y-2.5 mb-3">
        {checklist.map(item => (
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

      {!thresholdMet && (
        <p className="text-text-muted text-[10px] leading-snug">
          Keep drawing to unlock completion. ({interactionCount.current}/{MINIMUM_INTERACTIONS} strokes)
        </p>
      )}
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span>Door To Know Visual Arts</span>
          <span>/</span>
          <span className="text-text-primary">{levelTitle}</span>
        </div>
        <button
          onClick={handleComplete}
          disabled={!canComplete}
          className="bg-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Mark Level Complete
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
              Well done. You completed all the tasks for this level.
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
              Continue to Practise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
