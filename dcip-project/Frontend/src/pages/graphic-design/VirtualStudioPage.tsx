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
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <span>Graphic Design</span>
          <span>/</span>
          <span className="text-text-primary">Studio</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Graphic Design
        </button>
      </div>

      <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border px-4 py-3">
        <p className="text-text-secondary text-xs leading-relaxed">
          This is your design studio. Try adding a title, change the colours, see how it feels. There is no right answer here.
        </p>
      </div>

      <DesignCanvas
        defaultElements={DEFAULT_ELEMENTS}
        defaultBgColor={DEFAULT_BG_COLOR}
        onChange={() => {}}
        onInteraction={() => {}}
      />
    </div>
  )
}
