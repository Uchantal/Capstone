import { useNavigate } from 'react-router-dom'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS } from '../../components/graphic-design/PosterSurface'
import { useGDProgress } from '../../hooks/useGDProgress'

export default function VirtualStudioPage() {
  const navigate = useNavigate()
  const { markComplete } = useGDProgress()

  const handleContinue = async () => {
    await markComplete('gd-virtual-studio')
    navigate('/graphic-design/course-1')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => navigate('/disciplines')}
            className="inline-flex items-center gap-1 text-text-secondary text-xs hover:text-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs text-text-muted">Graphic Design / Canvas</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Graphic Design
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <DesignCanvas
          defaultElements={DEFAULT_ELEMENTS}
          defaultBgColor={DEFAULT_BG_COLOR}
          onChange={() => {}}
          onInteraction={() => {}}
          defaultTemplateId="free"
        />
      </div>
    </div>
  )
}
