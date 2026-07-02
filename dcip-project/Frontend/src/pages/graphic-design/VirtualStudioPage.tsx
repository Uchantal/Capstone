import { useNavigate } from 'react-router-dom'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS } from '../../components/graphic-design/PosterSurface'
import { useGDProgress } from '../../hooks/useGDProgress'
import DcipLogoLink from '../../components/DcipLogoLink'

export default function VirtualStudioPage() {
  const navigate = useNavigate()
  const { markComplete } = useGDProgress()

  const handleContinue = async () => {
    await markComplete('gd-virtual-studio')
    navigate('/graphic-design/course-1')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted flex-1 min-w-0">
          <button
            onClick={() => navigate('/disciplines')}
            className="hover:text-text-primary transition-colors flex-shrink-0"
          >
            Graphic Design
          </button>
          <span>/</span>
          <span className="truncate">Canvas</span>
        </div>
        <button
          onClick={handleContinue}
          className="ml-auto bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors text-xs flex-shrink-0"
        >
          <span className="hidden sm:inline">Continue to Course 1</span>
          <span className="sm:hidden">Continue</span>
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
