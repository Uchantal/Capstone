import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule, { VisualArtsModuleHandle } from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'
import { saveDraft, fetchDraft } from '../../services/api'
import DcipLogoLink from '../../components/DcipLogoLink'

export default function VALevel1PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  useEffect(() => {
    if (loading) return
    markStageVisited('va-level-1-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const { recordInteraction: recordEngInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'level1Practise')

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

  const handleReady = () => {
    computeAndSave().catch(() => {})
    navigate('/visual-arts/level-1/demonstrate')
  }

  if (!isPreviewMode && loading) return null

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 1 Practise</p>
      <p className="text-text-secondary text-xs leading-relaxed">
        Practise drawing shapes using the Line, Rectangle, and Ellipse tools. Try different sizes and combinations before moving on.
      </p>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span>Level 1</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={draftSaving}
            className="bg-secondary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            {draftSaving ? 'Saving...' : draftSaved ? 'Saved' : draftError ? 'Save failed' : 'Save Draft'}
          </button>
          <button
            onClick={handleReady}
            className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            I am ready to demonstrate
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
    </div>
  )
}
