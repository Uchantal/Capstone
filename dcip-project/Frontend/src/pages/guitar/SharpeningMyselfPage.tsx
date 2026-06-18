import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

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
  const { completedStages, loading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('guitar-level-3')) {
      navigate('/guitar/level-3', {
        replace: true,
        state: { lockedMessage: 'Complete Level 3 first.' },
      })
    }
  }, [completedStages, loading, navigate])

  const handleContinue = async () => {
    await markComplete('guitar-sharpening')
    navigate('/guitar/production')
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        <h1 className="text-text-primary font-bold text-2xl mb-1">Sharpening Myself</h1>
        <p className="text-text-secondary text-sm mb-8">
          Practice freely. Play any note or chord you have learned. There is no pass or fail here. This is where you build confidence.
        </p>

        <GuitarFretboard showChords={true} />

        {/* Note reference */}
        <div className="mt-8 bg-white border border-border rounded-2xl overflow-hidden">
          <div className="bg-[#F9F7F4] px-6 py-3 border-b border-border">
            <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Note Position Reference</p>
            <p className="text-text-secondary text-xs mt-0.5">Natural notes taught in Door To Know Guitar</p>
          </div>
          <div className="divide-y divide-border">
            {NOTE_REFERENCE.map(({ note, positions }) => (
              <div key={note} className="flex px-6 py-4 gap-6 flex-wrap">
                <p className="text-primary font-bold text-2xl w-8 shrink-0">{note}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {positions.map(p => (
                    <p key={`${p.string}-${p.fret}`} className="text-text-secondary text-sm">
                      <span className="font-medium text-text-primary">{p.string}</span>{' '}
                      {p.fret === 'open' ? '— open' : `— fret ${p.fret}`}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chord reference */}
        <div className="mt-4 bg-white border border-border rounded-2xl overflow-hidden">
          <div className="bg-[#F9F7F4] px-6 py-3 border-b border-border">
            <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Chord Reference</p>
          </div>
          <div className="divide-y divide-border">
            {CHORD_REFERENCE.map(c => (
              <div key={c.id} className="flex px-6 py-3 gap-4">
                <p className="text-text-primary font-bold text-base w-10 shrink-0">{c.id}</p>
                <div>
                  <p className="text-text-primary text-sm font-medium">{c.shape}</p>
                  <p className="text-text-muted text-xs">{c.strings}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready. Continue to Production.
          </button>
        </div>
      </div>
    </div>
  )
}
