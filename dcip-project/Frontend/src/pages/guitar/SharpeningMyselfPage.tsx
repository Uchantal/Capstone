import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'

const NOTE_REFERENCE = [
  {
    note: 'C',
    positions: [
      { string: 'low E', fret: 8 },
      { string: 'A',     fret: 3 },
      { string: 'D',     fret: 10 },
      { string: 'G',     fret: 5 },
      { string: 'B',     fret: 1 },
      { string: 'high e', fret: 8 },
    ],
  },
  {
    note: 'D',
    positions: [
      { string: 'low E', fret: 10 },
      { string: 'A',     fret: 5 },
      { string: 'D',     fret: 'open' },
      { string: 'G',     fret: 7 },
      { string: 'B',     fret: 3 },
      { string: 'high e', fret: 10 },
    ],
  },
  {
    note: 'E',
    positions: [
      { string: 'low E', fret: 'open' },
      { string: 'A',     fret: 7 },
      { string: 'D',     fret: 2 },
      { string: 'G',     fret: 9 },
      { string: 'B',     fret: 5 },
      { string: 'high e', fret: 'open' },
    ],
  },
]

const CHORD_REFERENCE = [
  { id: 'Em', shape: 'E minor', strings: 'all open except D fret 2, A fret 2' },
  { id: 'Am', shape: 'A minor', strings: 'B fret 1, G fret 2, D fret 2; low E muted' },
  { id: 'G',  shape: 'G major', strings: 'low E fret 3, A fret 2, high e fret 3' },
  { id: 'C',  shape: 'C major', strings: 'A fret 3, D fret 2, B fret 1; low E muted' },
]

export default function GuitarSharpeningPage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level3DemonstrationPassed) {
      navigate('/guitar/level-3/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 3 demonstration first.' },
      })
    }
  }, [loading, progress.level3DemonstrationPassed, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.level3DemonstrationPassed) {
      markStageVisited('guitar-sharpening')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.level3DemonstrationPassed])

  if (loading || !progress.level3DemonstrationPassed) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span className="text-text-primary">Sharpening Myself</span>
        </div>
        <button
          onClick={() => navigate('/guitar/production')}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready. Continue to Production.
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4 overflow-y-auto max-h-64">
          <h1 className="text-text-primary font-bold text-lg mb-1">Sharpening Myself</h1>
          <p className="text-text-secondary text-sm mb-4">
            Practice freely. Play any note or chord you have learned. There is no pass or fail here. This is where you build confidence.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
              <div className="bg-[#F9F7F4] px-3 py-2 border-b border-surface-border">
                <p className="text-text-muted text-[10px] uppercase tracking-wide font-medium">Note Position Reference</p>
              </div>
              <div className="divide-y divide-surface-border">
                {NOTE_REFERENCE.map(({ note, positions }) => (
                  <div key={note} className="flex px-3 py-2 gap-3 items-start flex-wrap">
                    <p className="text-primary font-bold text-base w-5 shrink-0">{note}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {positions.map(p => (
                        <p key={`${p.string}-${p.fret}`} className="text-text-secondary text-xs">
                          <span className="font-medium text-text-primary">{p.string}</span>{' '}
                          {p.fret === 'open' ? '(open)' : `fret ${p.fret}`}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
              <div className="bg-[#F9F7F4] px-3 py-2 border-b border-surface-border">
                <p className="text-text-muted text-[10px] uppercase tracking-wide font-medium">Chord Reference</p>
              </div>
              <div className="divide-y divide-surface-border">
                {CHORD_REFERENCE.map(c => (
                  <div key={c.id} className="flex px-3 py-2 gap-3">
                    <p className="text-text-primary font-bold text-sm w-8 shrink-0">{c.id}</p>
                    <div>
                      <p className="text-text-primary text-xs font-medium">{c.shape}</p>
                      <p className="text-text-muted text-[10px]">{c.strings}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard showChords={true} />
        </div>
      </div>
    </div>
  )
}
