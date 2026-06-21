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

const STRINGS = [
  { name: 'E2 (low E)', note: 'E', thickness: 'thickest string' },
  { name: 'A2',         note: 'A', thickness: 'second thickest' },
  { name: 'D3',         note: 'D', thickness: 'middle string' },
  { name: 'G3',         note: 'G', thickness: 'middle string' },
  { name: 'B3',         note: 'B', thickness: 'second thinnest' },
  { name: 'E4 (high e)', note: 'E', thickness: 'thinnest string' },
]

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Highlight: open low E (stringIdx=5, fret=0) and fret 12 to show octave
const OCTAVE_HIGHLIGHT = [
  { stringIdx: 5, fret: 0, label: 'E2' },
  { stringIdx: 5, fret: 12, label: 'E3' },
]

export default function ReadingFretboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { markComplete } = useGuitarProgress()

  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanContinue(true), 60_000)
    return () => clearTimeout(t)
  }, [])

  const handleContinue = async () => {
    if (!canContinue) return
    await markComplete('guitar-course-1')
    navigate('/guitar/notes-across-the-neck')
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
          <span className="text-text-primary">Reading the Fretboard</span>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Reading the Fretboard</h1>
        <p className="text-text-secondary text-sm mb-8">
          Before you can find notes, you need to understand what the fretboard is and how it is organised.
        </p>

        {/* Card 1: The Six Strings */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The Six Strings</h2>
          <p className="text-text-secondary text-sm mb-4">
            A standard guitar has six strings, each tuned to a specific open note. From lowest pitch to highest pitch the strings are: E, A, D, G, B, E. Notice that the lowest and highest strings share the same letter name, E, two octaves apart.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="bg-[#F9F7F4] border-b border-surface-border">
                <tr>
                  <th className="text-left text-text-muted font-medium px-4 py-2.5 uppercase text-xs tracking-wide">String</th>
                  <th className="text-left text-text-muted font-medium px-4 py-2.5 uppercase text-xs tracking-wide">Open Note</th>
                  <th className="text-left text-text-muted font-medium px-4 py-2.5 uppercase text-xs tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {STRINGS.map(s => (
                  <tr key={s.name}>
                    <td className="px-4 py-2.5 text-text-primary font-mono font-semibold">{s.name}</td>
                    <td className="px-4 py-2.5 text-primary font-bold text-base">{s.note}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{s.thickness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-text-muted text-xs mt-4">
            On the fretboard below, the top row is the high e string and the bottom row is the low E string. Click any position to hear the note.
          </p>
          <div className="mt-4">
            <GuitarFretboard showChords={false} />
          </div>
        </div>

        {/* Card 2: The Chromatic Sequence */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The Chromatic Sequence</h2>
          <p className="text-text-secondary text-sm mb-3">
            There are 12 notes in music. Moving one fret up the neck always moves exactly one half step forward in this sequence. After B, the sequence starts again at C.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CHROMATIC.map((note, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                note.includes('#')
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border-2 border-surface-border text-text-primary'
              }`}>
                {note}
              </div>
            ))}
          </div>
          <div className="bg-surface-warm border border-surface-border rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-text-primary text-sm font-semibold">Important exceptions</p>
            <p className="text-text-secondary text-sm">There is no E# or B#. The note one half step above E is F, and one above B is C.</p>
            <p className="text-text-secondary text-sm">There is no Fb or Cb either. These are simply E and B.</p>
          </div>
          <p className="text-text-secondary text-sm mt-4">
            On the A string (second from bottom), the open note is A. Moving up one fret at a time: A, A#, B, C, C#, D, D#, E, F, F#, G, G#, A. Twelve frets brings you back to A, one octave higher.
          </p>
        </div>

        {/* Card 3: Octaves on the Fretboard */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Octaves on the Fretboard</h2>
          <p className="text-text-secondary text-sm mb-3">
            Every string repeats its own open note one octave higher at the 12th fret. The 12th fret is always the same letter name as the open string, just higher in pitch. This pattern holds for every string.
          </p>
          <p className="text-text-secondary text-sm mb-4">
            Below, the low E string is highlighted at the open position (E2) and at fret 12 (E3). Both are the note E, one octave apart. Click them to hear the difference.
          </p>
          <GuitarFretboard showChords={false} highlightPositions={OCTAVE_HIGHLIGHT} />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue to Notes Across the Neck
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
