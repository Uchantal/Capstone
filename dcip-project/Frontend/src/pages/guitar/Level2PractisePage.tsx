import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import DcipLogoLink from '../../components/DcipLogoLink'

const C_POSITIONS = [
  { stringIdx: 4, fret: 3, label: 'C', stringName: 'A string', fretLabel: 'fret 3' },
  { stringIdx: 2, fret: 5, label: 'C', stringName: 'G string', fretLabel: 'fret 5' },
  { stringIdx: 1, fret: 1, label: 'C', stringName: 'B string', fretLabel: 'fret 1' },
]

export default function GuitarLevel2PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = useGuitarDemonstrationProgress()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    markStageVisited('guitar-level-2-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (!isPreviewMode && loading) return null

  const highlight = selectedIdx !== null
    ? [{ stringIdx: C_POSITIONS[selectedIdx].stringIdx, fret: C_POSITIONS[selectedIdx].fret, label: 'C' }]
    : []

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span>
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={() => navigate('/guitar/level-2/demonstrate')}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 2: Practise</h1>
          <p className="text-text-secondary text-sm mb-3">
            Study each C note position below. Click a position to highlight it on the fretboard, then play it. Move between all three until they feel familiar.
          </p>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">C note positions</p>
          <div className="flex flex-wrap gap-2">
            {C_POSITIONS.map((pos, i) => (
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
              The highlighted dot shows where to press. Play the note, then try the other positions.
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
