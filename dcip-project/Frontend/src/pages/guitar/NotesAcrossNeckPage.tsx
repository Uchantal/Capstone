import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'
import Footer from '../../components/Footer'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

// All C positions up to fret 12: [stringIdx, fret, label]
// STRING_DATA order: 0=e4, 1=B3, 2=G3, 3=D3, 4=A2, 5=E2
const C_POSITIONS = [
  { stringIdx: 5, fret: 8,  label: 'C' },
  { stringIdx: 4, fret: 3,  label: 'C' },
  { stringIdx: 3, fret: 10, label: 'C' },
  { stringIdx: 2, fret: 5,  label: 'C' },
  { stringIdx: 1, fret: 1,  label: 'C' },
  { stringIdx: 0, fret: 8,  label: 'C' },
]

const D_POSITIONS = [
  { stringIdx: 5, fret: 10, label: 'D' },
  { stringIdx: 4, fret: 5,  label: 'D' },
  { stringIdx: 3, fret: 0,  label: 'D' },
  { stringIdx: 3, fret: 12, label: 'D' },
  { stringIdx: 2, fret: 7,  label: 'D' },
  { stringIdx: 1, fret: 3,  label: 'D' },
  { stringIdx: 0, fret: 10, label: 'D' },
]

export default function NotesAcrossNeckPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { completedStages, loading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('guitar-course-1')) {
      navigate('/guitar/reading-the-fretboard', {
        replace: true,
        state: { lockedMessage: 'Complete Reading the Fretboard first.' },
      })
    }
  }, [completedStages, loading, navigate])

  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanContinue(true), 60_000)
    return () => clearTimeout(t)
  }, [])

  const handleContinue = async () => {
    if (!canContinue) return
    await markComplete('guitar-course-2')
    navigate('/guitar/level-1')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">
            Guitar
          </button>
          <span>/</span>
          <span>Door To Know Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Notes Across the Neck</span>
        </div>

        <ProgressBar value={2} total={2} label="Course 2 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Notes Across the Neck</h1>
        <p className="text-text-secondary text-sm mb-8">
          The same note appears in many places on the fretboard. Learning where a note repeats is what lets you play the same melody from different positions.
        </p>

        {/* Card A */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Why One Note Has Many Positions</h2>
          <p className="text-text-secondary text-sm mb-3">
            On a piano, middle C appears once. On a guitar, the note C appears six times across the neck within the first twelve frets, once on each string. This is what makes the guitar fretboard feel confusing at first: there is no single home for each note.
          </p>
          <p className="text-text-secondary text-sm">
            The advantage is flexibility. You can play the same melody note in the position that fits best for the chord you are already holding, without moving your hand far. Knowing all the positions of one note across the neck is a core guitar skill.
          </p>
        </div>

        {/* Card B: Finding Every C */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Worked Example: Finding Every C</h2>
          <p className="text-text-secondary text-sm mb-2">
            The note C appears at all six positions highlighted below. Click each highlighted position to hear the C note played at different pitches.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="text-left text-text-muted font-medium pr-6 py-1.5 uppercase text-xs tracking-wide">String</th>
                  <th className="text-left text-text-muted font-medium pr-6 py-1.5 uppercase text-xs tracking-wide">Fret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {[
                  { string: 'low E string', fret: 8 },
                  { string: 'A string',     fret: 3 },
                  { string: 'D string',     fret: 10 },
                  { string: 'G string',     fret: 5 },
                  { string: 'B string',     fret: 1 },
                  { string: 'high e string', fret: 8 },
                ].map(row => (
                  <tr key={row.string + row.fret}>
                    <td className="pr-6 py-1.5 text-text-primary font-medium">{row.string}</td>
                    <td className="pr-6 py-1.5 text-text-secondary">{row.fret === 0 ? 'open' : `fret ${row.fret}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GuitarFretboard showChords={false} highlightPositions={C_POSITIONS} />
        </div>

        {/* Card C: Finding Every D */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Worked Example: Finding Every D</h2>
          <p className="text-text-secondary text-sm mb-2">
            The note D appears at all positions below. Notice that D appears on its own string, the D string, both as the open note and at fret 12. These are the same note name, one octave apart.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="text-left text-text-muted font-medium pr-6 py-1.5 uppercase text-xs tracking-wide">String</th>
                  <th className="text-left text-text-muted font-medium pr-6 py-1.5 uppercase text-xs tracking-wide">Fret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {[
                  { string: 'low E string',  fret: 10 },
                  { string: 'A string',      fret: 5 },
                  { string: 'D string',      fret: 0 },
                  { string: 'D string',      fret: 12 },
                  { string: 'G string',      fret: 7 },
                  { string: 'B string',      fret: 3 },
                  { string: 'high e string', fret: 10 },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="pr-6 py-1.5 text-text-primary font-medium">{row.string}</td>
                    <td className="pr-6 py-1.5 text-text-secondary">{row.fret === 0 ? 'open' : `fret ${row.fret}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GuitarFretboard showChords={false} highlightPositions={D_POSITIONS} />
        </div>

        {/* Card D: Putting It Together */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Putting It Together</h2>
          <p className="text-text-secondary text-sm mb-4">
            The next three levels build on everything you have learned here.
          </p>
          <div className="space-y-3">
            <div className="flex gap-4 items-start">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded shrink-0">Level 1</span>
              <p className="text-text-secondary text-sm">You will find every position of one note across the neck.</p>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded shrink-0">Level 2</span>
              <p className="text-text-secondary text-sm">You will play the same note on three different strings, learning that a single melody note can come from more than one place.</p>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded shrink-0">Level 3</span>
              <p className="text-text-secondary text-sm">You will combine single notes and chord shapes across the neck in sequence.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue to Level 1
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
