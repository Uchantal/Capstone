import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { usePianoProgress } from '../../hooks/usePianoProgress'
import Footer from '../../components/Footer'

export default function VirtualInstrumentPage() {
  const navigate = useNavigate()
  const { markStageVisited } = usePianoProgress()

  const handleContinue = () => {
    markStageVisited('piano-virtual-instrument')
    navigate('/piano/understanding-the-piano')
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <h1 className="text-text-primary font-bold text-2xl mb-1">Virtual Piano</h1>
        <p className="text-text-secondary text-sm mb-6">
          This is a virtual piano keyboard. Press the keys to hear notes. Explore the sound before you begin learning chords.
        </p>
        <PianoKeyboard />
        <div className="flex justify-end mt-8">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Door To Know Piano
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
