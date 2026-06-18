import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarModule from '../../components/modules/music/GuitarModule'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function VirtualInstrumentPage() {
  const navigate = useNavigate()
  const { markComplete } = useGuitarProgress()

  const handleContinue = async () => {
    await markComplete('guitar-intro')
    navigate('/guitar/reading-the-fretboard')
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <p className="text-text-secondary text-sm mb-6">
          This is a virtual guitar. Try it. Play it. Listen to the sound.
        </p>
        <GuitarModule step={2} onAudioReady={() => {}} />
        <div className="flex justify-end mt-8">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Door To Know Guitar
          </button>
        </div>
      </div>
    </div>
  )
}
