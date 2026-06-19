import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS } from '../../components/graphic-design/PosterSurface'
import { useGDProgress } from '../../hooks/useGDProgress'
import Footer from '../../components/Footer'

export default function VirtualStudioPage() {
  const navigate = useNavigate()
  const { markComplete } = useGDProgress()

  const handleContinue = async () => {
    await markComplete('gd-virtual-studio')
    navigate('/graphic-design/course-1')
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <p className="text-text-secondary text-sm mb-6">
          This is your design studio. Try adding a title, change the colours, see how it feels. There is no right answer here.
        </p>
        <DesignCanvas
          defaultElements={DEFAULT_ELEMENTS}
          defaultBgColor={DEFAULT_BG_COLOR}
          onChange={() => {}}
          onInteraction={() => {}}
        />
        <div className="flex justify-end mt-8">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Door To Know Graphic Design
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
