import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, type DesignElement } from '../../components/graphic-design/PosterSurface'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'
import { saveDraft, fetchDraft } from '../../services/api'
import DcipLogoLink from '../../components/DcipLogoLink'
import AskAIHint from '../../components/ai/AskAIHint'

export default function GDLevel1PractisePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { loading, markStageVisited } = useGDDemonstrationProgress()
  const [elements, setElements] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const { recordInteraction: recordEngInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'level1Practise')

  const [draftInitEls, setDraftInitEls] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const [draftInitBg, setDraftInitBg] = useState(DEFAULT_BG_COLOR)
  const [draftReady, setDraftReady] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftError, setDraftError] = useState(false)
  const currentElementsRef = useRef<DesignElement[]>(DEFAULT_ELEMENTS)
  const currentBgColorRef = useRef<string>(DEFAULT_BG_COLOR)

  useEffect(() => {
    if (loading) return
    markStageVisited('gd-level-1-practise')
  }, [loading, markStageVisited])

  useEffect(() => {
    fetchDraft('graphic-design')
      .then(res => {
        const data = JSON.parse(res.data.snapshot) as { elements: DesignElement[]; bgColor: string }
        setDraftInitEls(data.elements ?? DEFAULT_ELEMENTS)
        setDraftInitBg(data.bgColor ?? DEFAULT_BG_COLOR)
      })
      .catch(() => {})
      .finally(() => setDraftReady(true))
  }, [])

  useEffect(() => {
    const autoSave = () => {
      if (document.visibilityState !== 'hidden') return
      const snapshot = JSON.stringify({ elements: currentElementsRef.current, bgColor: currentBgColorRef.current })
      saveDraft({ discipline: 'graphic-design', snapshot }).catch(() => {})
    }
    document.addEventListener('visibilitychange', autoSave)
    return () => document.removeEventListener('visibilitychange', autoSave)
  }, [])

  function recordInteraction() {
    recordEngInteraction()
  }

  const handleReady = () => {
    computeAndSave(elements).catch(() => {})
    navigate('/graphic-design/level-1/demonstrate')
  }

  async function handleSaveDraft() {
    setDraftSaving(true)
    setDraftError(false)
    try {
      const snapshot = JSON.stringify({ elements: currentElementsRef.current, bgColor: currentBgColorRef.current })
      await saveDraft({ discipline: 'graphic-design', snapshot })
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2500)
    } catch {
      setDraftError(true)
      setTimeout(() => setDraftError(false), 3000)
    } finally {
      setDraftSaving(false)
    }
  }

  if (loading || !draftReady) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
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
            className="bg-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        <CanvasInstructionPanel>
          {lockedMessage && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-xs">
              {lockedMessage}
            </div>
          )}
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Level 1 Practice</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Practise adjusting your title and subtitle until the hierarchy feels clear. Try different title sizes and alignments.
            There is no pass or fail here.
          </p>
        </CanvasInstructionPanel>

        <DesignCanvas
          defaultElements={draftInitEls}
          defaultBgColor={draftInitBg}
          onChange={(els, bg) => {
            currentElementsRef.current = els
            currentBgColorRef.current = bg
            setElements(els)
            recordElementChange(els)
          }}
          onInteraction={recordInteraction}
        />
      </div>
      <AskAIHint discipline="Graphic Design" context="Graphic Design Level 1 — Practise (adjust title and subtitle sizes; experiment with centre alignment and hierarchy)" side="left" />
    </div>
  )
}
