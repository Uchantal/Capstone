import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'

const E_POSITIONS = [
  { stringIdx: 5, fret: 0,  label: 'E', stringName: 'Low E string',  fretLabel: 'open' },
  { stringIdx: 4, fret: 7,  label: 'E', stringName: 'A string',      fretLabel: 'fret 7' },
  { stringIdx: 3, fret: 2,  label: 'E', stringName: 'D string',      fretLabel: 'fret 2' },
  { stringIdx: 1, fret: 5,  label: 'E', stringName: 'B string',      fretLabel: 'fret 5' },
  { stringIdx: 0, fret: 0,  label: 'E', stringName: 'High e string', fretLabel: 'open' },
]

export default function GuitarLevel1PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('guitar-level-1')) {
      navigate('/guitar/level-1', { replace: true, state: { lockedMessage: 'Complete Level 1 first.' } })
    }
  }, [loading, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.completedStages.includes('guitar-level-1')) {
      markStageVisited('guitar-level-1-practise')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.completedStages])

  if (loading || !progress.completedStages.includes('guitar-level-1')) return null

  const highlight = selectedIdx !== null
    ? [{ stringIdx: E_POSITIONS[selectedIdx].stringIdx, fret: E_POSITIONS[selectedIdx].fret, label: 'E' }]
    : []

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 1</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={() => navigate('/guitar/level-1/demonstrate')}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 1: Practise</h1>
          <p className="text-text-secondary text-sm mb-3">
            Study each E note position below. Click a position to highlight it on the fretboard, then play it. When you feel ready, move to the demonstration.
          </p>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">E note positions</p>
          <div className="flex flex-wrap gap-2">
            {E_POSITIONS.map((pos, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                  selectedIdx === i
                    ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                    : 'border-surface-border hover:border-primary/30 hover:bg-white text-text-secondary'
                }`}
              >
                <span className="font-semibold text-inherit">{pos.stringName}</span>
                <span className="text-text-muted ml-1">({pos.fretLabel})</span>
              </button>
            ))}
          </div>
          {selectedIdx !== null && (
            <p className="text-text-muted text-xs mt-2">
              The highlighted dot shows where to press. Play the note, then try the others.
            </p>
          )}
        </div>
        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard showChords={false} highlightPositions={highlight} />
        </div>
      </div>
    </div>
  )
}
