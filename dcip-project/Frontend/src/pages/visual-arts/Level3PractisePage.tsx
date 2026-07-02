import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule, { VisualArtsModuleHandle } from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'
import { saveDraft, fetchDraft } from '../../services/api'
import DcipLogoLink from '../../components/DcipLogoLink'

export default function VALevel3PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  useEffect(() => {
    if (loading) return
    markStageVisited('va-level-3-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const { recordInteraction: recordEngInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'level3Practise')

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
    navigate('/visual-arts/level-3/demonstrate')
  }

  if (!isPreviewMode && loading) return null

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 3 Practise</p>
      <p className="text-text-secondary text-xs leading-relaxed">
        Practise combining shapes, colour, and shading into one small scene. It does not need to be perfect. Focus on using everything together.
      </p>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span><span>Level 3</span><span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handleSaveDraft} disabled={draftSaving} className="bg-secondary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-xs disabled:opacity-50">
            {draftSaving ? 'Saving…' : draftSaved ? 'Saved' : draftError ? 'Failed' : 'Save'}
          </button>
          <button onClick={handleReady} className="bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors text-xs">
            <span className="hidden sm:inline">I am ready to demonstrate</span>
            <span className="sm:hidden">Demonstrate</span>
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
