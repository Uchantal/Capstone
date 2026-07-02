import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule, { VisualArtsModuleHandle } from '../modules/VisualArtsModule'
import { useVisualArtsProgress } from '../../hooks/useVisualArtsProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'
import { saveDraft, fetchDraft } from '../../services/api'
import DcipLogoLink from '../DcipLogoLink'
import AskAIHint from '../ai/AskAIHint'

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

export default function VisualArtsLevelScreen({
  levelNumber,
  totalLevels,
  levelTitle,
  task,
  checklist,
  nextPath,
  stageId,
  requires: _requires,
}: Props) {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, markComplete } = useVisualArtsProgress()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)

  const { recordInteraction: recordEngInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', stageIdToEngagementKey(stageId))

  const moduleRef = useRef<VisualArtsModuleHandle>(null)
  const [draftLoaded, setDraftLoaded] = useState<string | null>(null)
  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftError, setDraftError] = useState(false)

  useEffect(() => {
    fetchDraft('visual-arts')
      .then(res => setDraftLoaded(res.data.snapshot))
      .catch(() => {})
  }, [])

  function recordInteraction() {
    recordEngInteraction()
  }

  async function handleSaveDraft() {
    if (!moduleRef.current) return
    setDraftSaving(true)
    setDraftError(false)
    try {
      const snapshot = moduleRef.current.getSnapshot()
      const thumb = moduleRef.current.captureCleanImage()
      await saveDraft({ discipline: 'visual-arts', snapshot, ...(thumb ? { thumbnailData: thumb } : {}) })
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2500)
    } catch {
      setDraftError(true)
      setTimeout(() => setDraftError(false), 3000)
    } finally { setDraftSaving(false) }
  }

  const allChecked = checklist.every(item => checked.has(item.id))
  const canComplete = isPreviewMode || allChecked

  const handleComplete = async () => {
    if (!canComplete) return
    if (!isPreviewMode) {
      const score = await computeAndSave()
      setEngagementScore(score)
      if (score >= 60) {
        await markComplete(stageId)
      }
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
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AskAIHint discipline="Visual Arts" context={`${levelTitle} — Learn`} />
      <div className="h-auto min-h-12 flex-shrink-0 bg-white border-b border-surface-border flex flex-wrap items-center px-4 py-2 gap-2">
        <DcipLogoLink />
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted flex-1 min-w-0">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors whitespace-nowrap"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span className="truncate">{levelTitle}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleSaveDraft}
            disabled={draftSaving}
            className="bg-secondary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-xs disabled:opacity-50"
          >
            {draftSaving ? 'Saving…' : draftSaved ? 'Saved' : draftError ? 'Failed' : 'Save'}
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className="bg-secondary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            <span className="hidden sm:inline">Mark Level Complete</span>
            <span className="sm:hidden">Complete</span>
          </button>
        </div>
      </div>

      <VisualArtsModule
        ref={moduleRef}
        step={5}
        onInteraction={recordInteraction}
        onColourUsed={recordColour}
        onToolChange={recordTool}
        sidebarFooter={sidebarFooter}
        initialSnapshot={draftLoaded ?? undefined}
      />

      {completed && (() => {
        const passed = isPreviewMode || engagementScore === null || engagementScore >= 60
        const gradeLabel = engagementScore === null ? null
          : engagementScore >= 80 ? 'Excellent' : engagementScore >= 60 ? 'Good'
          : engagementScore >= 40 ? 'Fair' : 'Needs Improvement'

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              {passed ? (
                <>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete</h2>
                  <p className="text-text-secondary text-sm mb-4">
                    Well done. You have completed all the tasks for this level.
                  </p>
                  {engagementScore !== null && (
                    <div className="mb-4 p-3 bg-[#F9F7F4] rounded-xl border border-surface-border">
                      <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Engagement Score</p>
                      <p className="text-2xl font-bold text-text-primary">{engagementScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                      <p className="text-xs font-semibold mt-1 text-secondary">{gradeLabel}</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(nextPath)}
                    className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
                  >
                    Continue to Practise
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Level Not Completed</h2>
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Engagement Score</p>
                    <p className="text-2xl font-bold text-text-primary">{engagementScore}<span className="text-sm font-normal text-text-muted">/100</span></p>
                    <p className="text-xs font-semibold mt-1 text-amber-600">{gradeLabel}</p>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed mb-6">
                    You need at least 60/100 to earn the Level {levelNumber} badge. Spend more time exploring the tools and experimenting with different techniques, then try again.
                  </p>
                  <button
                    onClick={() => setCompleted(false)}
                    className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
