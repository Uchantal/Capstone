import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
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

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <p className="text-text-secondary text-sm mb-6">
          This is your digital canvas. Try the tools. Draw freely. There is no right answer here.
        </p>
        <VisualArtsModule canvasRef={canvasRef} step={5} />
        <div className="flex justify-end mt-8">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Door To Know Visual Arts
          </button>
        </div>
      </div>
    </div>
  )
}
