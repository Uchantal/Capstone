import { useNavigate } from 'react-router-dom'
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
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <span className="text-text-primary">Virtual Guitar</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Guitar
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <p className="text-text-secondary text-sm">
            This is a virtual guitar. Try it. Play it. Listen to the sound.
          </p>
        </div>
        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarModule step={2} onAudioReady={() => {}} />
        </div>
      </div>
    </div>
  )
}
