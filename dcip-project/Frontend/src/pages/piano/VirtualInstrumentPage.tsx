import { useNavigate } from 'react-router-dom'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { usePianoProgress } from '../../hooks/usePianoProgress'

export default function VirtualInstrumentPage() {
  const navigate = useNavigate()
  const { markStageVisited } = usePianoProgress()

  const handleContinue = () => {
    markStageVisited('piano-virtual-instrument')
    navigate('/piano/understanding-the-piano')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
          <span className="text-xs text-text-muted">Virtual Piano</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Piano
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <p className="text-text-secondary text-sm">
            This is a virtual piano keyboard. Press the keys to hear notes. Explore the sound before you begin learning chords.
          </p>
        </div>
        <div className="flex-1 bg-[#E8E4DC] p-4 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm">
            <PianoKeyboard />
          </div>
          <p className="flex-shrink-0 pt-2 text-center text-xs text-text-secondary">
            Keys A-K + W E T Y U for octave 1 | Use mouse or touch for octave 2
          </p>
        </div>
      </div>
    </div>
  )
}
