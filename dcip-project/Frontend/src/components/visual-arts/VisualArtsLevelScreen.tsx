import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../TopNav'
import VisualArtsModule from '../modules/VisualArtsModule'
import { useVisualArtsProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useVisualArtsProgress'

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
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { completedStages, loading, markComplete } = useVisualArtsProgress()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)

  // Stage gate: redirect to the first uncompleted prerequisite
  useEffect(() => {
    if (loading) return
    const firstMissing = requires.find(r => !completedStages.includes(r))
    if (firstMissing) {
      const path = STAGE_PATHS[firstMissing] ?? '/visual-arts/course-1'
      const name = STAGE_NAMES[firstMissing] ?? firstMissing
      navigate(path, { replace: true, state: { lockedMessage: `Complete ${name} first.` } })
    }
  }, [loading, completedStages, requires, navigate])

  const allChecked = checklist.every(item => checked.has(item.id))

  const handleComplete = async () => {
    if (!allChecked) return
    await markComplete(stageId)
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
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

        <ProgressBar
          value={levelNumber}
          total={totalLevels}
          label={`Level ${levelNumber} of ${totalLevels}`}
        />

        {/* Task card */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">
            Level {levelNumber} Task
          </p>
          <h1 className="text-text-primary font-bold text-xl mb-3">{levelTitle}</h1>
          <p className="text-text-secondary text-sm leading-relaxed">{task}</p>
        </div>

        {/* Canvas */}
        <div className="mb-5">
          <VisualArtsModule canvasRef={canvasRef} step={5} />
        </div>

        {/* Self-check checklist */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <p className="text-text-primary font-semibold text-sm mb-1">
            Before you continue, confirm each of the following:
          </p>
          <p className="text-text-secondary text-xs mb-5">
            Tick each item honestly. These confirm you completed the task, not that it is perfect.
          </p>
          <div className="space-y-3">
            {checklist.map(item => (
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
              onClick={handleComplete}
              disabled={!allChecked}
              className="bg-secondary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              Mark Level Complete
            </button>
          </div>
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-2xl">★</span>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Well done. You completed all the tasks for this level.
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
