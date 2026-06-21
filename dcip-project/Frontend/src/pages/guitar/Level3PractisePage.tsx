import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'

const D_POSITIONS = [
  { stringIdx: 3, fret: 0, label: 'D', stringName: 'D string', fretLabel: 'open' },
  { stringIdx: 1, fret: 3, label: 'D', stringName: 'B string', fretLabel: 'fret 3' },
]

const CHORD_REFERENCE = [
  { name: 'Em', fingers: 'E·B·E·G·B·E — open position' },
  { name: 'Am', fingers: 'A·E·A·C·E — open position' },
  { name: 'G',  fingers: 'G·B·D·G·B·G — open position' },
  { name: 'C',  fingers: 'C·E·G·C·E — open position' },
]

export default function GuitarLevel3PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()
  const [selectedNoteIdx, setSelectedNoteIdx] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    if (!progress.level2DemonstrationPassed) {
      navigate('/guitar/level-2/demonstrate', { replace: true, state: { lockedMessage: 'Complete the Level 2 demonstration first.' } })
      return
    }
    if (!progress.completedStages.includes('guitar-level-3')) {
      navigate('/guitar/level-3', { replace: true, state: { lockedMessage: 'Complete Level 3 first.' } })
    }
  }, [loading, progress.level2DemonstrationPassed, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.level2DemonstrationPassed && progress.completedStages.includes('guitar-level-3')) {
      markStageVisited('guitar-level-3-practise')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.level2DemonstrationPassed, progress.completedStages])

  const ready = !loading && progress.level2DemonstrationPassed && progress.completedStages.includes('guitar-level-3')
  if (!ready) return null

  const highlight = selectedNoteIdx !== null
    ? [{ stringIdx: D_POSITIONS[selectedNoteIdx].stringIdx, fret: D_POSITIONS[selectedNoteIdx].fret, label: 'D' }]
    : []

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={() => navigate('/guitar/level-3/demonstrate')}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 3: Practise</h1>
          <p className="text-text-secondary text-sm mb-3">
            Study the D note positions and the chord shapes below. Click a D note to highlight it on the fretboard. Use the chord library to practise the chord shapes.
          </p>

          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">D note positions</p>
              <div className="flex gap-2">
                {D_POSITIONS.map((pos, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedNoteIdx(selectedNoteIdx === i ? null : i)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                      selectedNoteIdx === i
                        ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                        : 'border-surface-border hover:border-primary/30 hover:bg-white text-text-secondary'
                    }`}
                  >
                    <span className="font-semibold text-inherit">{pos.stringName}</span>
                    <span className="text-text-muted ml-1">({pos.fretLabel})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Chord shapes to know</p>
              <div className="flex gap-2 flex-wrap">
                {CHORD_REFERENCE.map(chord => (
                  <div key={chord.name} className="px-3 py-2 rounded-xl border border-surface-border bg-white text-xs">
                    <span className="font-bold text-text-primary mr-1">{chord.name}</span>
                    <span className="text-text-muted">{chord.fingers}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard showChords={true} highlightPositions={highlight} />
        </div>
      </div>
    </div>
  )
}
