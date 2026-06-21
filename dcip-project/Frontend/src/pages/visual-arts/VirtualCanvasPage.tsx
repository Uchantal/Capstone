import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsProgress } from '../../hooks/useVisualArtsProgress'

export default function VirtualCanvasPage() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { markComplete } = useVisualArtsProgress()

  const handleContinue = async () => {
    await markComplete('va-virtual-canvas')
    navigate('/visual-arts/course-1')
  }

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-secondary text-xs leading-relaxed mb-4">
        This is your digital canvas. Try the tools. Draw freely. There is no right answer here.
      </p>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <span className="text-text-primary">Visual Arts</span>
          <span>/</span>
          <span>Virtual Canvas</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Visual Arts
        </button>
      </div>

      <VisualArtsModule canvasRef={canvasRef} step={5} sidebarFooter={sidebarFooter} />
    </div>
  )
}
