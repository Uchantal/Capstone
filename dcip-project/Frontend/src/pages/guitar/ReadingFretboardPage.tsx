import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const GUITAR_TERMS = [
  { term: 'String', def: 'One of the six wires stretched across the guitar, tuned E A D G B e from lowest to highest.' },
  { term: 'Fret', def: 'A metal strip across the neck. Pressing a string behind a fret raises its pitch by one semitone.' },
  { term: 'Note', def: 'A specific musical pitch produced at a string and fret combination. Named C D E F G A B.' },
  { term: 'Chord', def: 'A group of strings fretted and strummed together to produce harmony.' },
  { term: 'Open string', def: 'A string played without pressing any fret. Each open string has a fixed pitch (E A D G B e).' },
  { term: 'Strumming', def: 'Sweeping a finger or pick across several strings in one motion to play a chord.' },
  { term: 'Picking', def: 'Plucking individual strings one at a time with a finger or pick.' },
  { term: 'Scale', def: 'A sequence of notes following a specific pattern of intervals, used for melodies and solos.' },
  { term: 'Tab (Tablature)', def: 'A notation system showing which strings and frets to play, read left to right.' },
  { term: 'Tuning', def: 'Adjusting string tension so each string produces the correct pitch. Standard: E A D G B e.' },
  { term: 'Barre chord', def: 'A chord where one finger presses all six strings at the same fret.' },
  { term: 'Nut', def: 'The small grooved piece at the top of the neck that spaces the strings before the tuning pegs.' },
]
import MainLayout from '../../components/MainLayout'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'
import { useReadingEngagement } from '../../hooks/useReadingEngagement'

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
  const [showGlossary, setShowGlossary] = useState(false)
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('guitar', 'course1')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = async () => {
      await markComplete('guitar-course-1')
      navigate('/guitar/notes-across-the-neck')
    }
    if (score < 40) {
      setLowEngagement(true)
      setTimeout(proceed, 3000)
    } else {
      await proceed()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">
            Guitar
          </button>
          <span>/</span>
          <span>Door To Know Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Reading the Fretboard</span>
        </div>

        {/* Key Terms banner */}
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-text-secondary text-sm">
              Not sure what some words mean? Review the <span className="font-semibold text-text-primary">Key Terms</span> glossary before you start.
            </p>
          </div>
          <button
            onClick={() => setShowGlossary(true)}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shrink-0 ml-4"
          >
            View Key Terms
          </button>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Reading the Fretboard</h1>
        <p className="text-text-secondary text-sm mb-8">
          Before you can find notes, you need to understand what the fretboard is and how it is organised.
        </p>

        {/* Card 1: The Six Strings */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
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
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
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
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Octaves on the Fretboard</h2>
          <p className="text-text-secondary text-sm mb-3">
            Every string repeats its own open note one octave higher at the 12th fret. The 12th fret is always the same letter name as the open string, just higher in pitch. This pattern holds for every string.
          </p>
          <p className="text-text-secondary text-sm mb-4">
            Below, the low E string is highlighted at the open position (E2) and at fret 12 (E3). Both are the note E, one octave apart. Click them to hear the difference.
          </p>
          <GuitarFretboard showChords={false} highlightPositions={OCTAVE_HIGHLIGHT} />
        </div>

        <div className="flex flex-col items-end gap-2">
          {lowEngagement && (
            <p className="text-sm text-amber-600">
              Take your time with this content. Your engagement score for this page was low.
            </p>
          )}
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Notes Across the Neck
          </button>
        </div>
      </div>

      {showGlossary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGlossary(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-lg">Guitar — Key Terms</h2>
              <button onClick={() => setShowGlossary(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GUITAR_TERMS.map(({ term, def }) => (
                <div key={term} className="bg-[#F9F7F4] rounded-xl p-4">
                  <p className="text-primary font-bold text-sm mb-1">{term}</p>
                  <p className="text-text-secondary text-xs leading-relaxed">{def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
