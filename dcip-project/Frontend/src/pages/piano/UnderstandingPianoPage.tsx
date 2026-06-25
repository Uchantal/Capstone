import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PIANO_TERMS = [
  { term: 'Note', def: 'A single musical sound with a specific pitch. Notes are named C D E F G A B, then the pattern repeats.' },
  { term: 'Key', def: 'One of the individual black or white bars on the keyboard. Pressing a key produces a note.' },
  { term: 'Octave', def: 'The same note name appearing eight steps higher or lower. The higher version vibrates exactly twice as fast.' },
  { term: 'Scale', def: 'A set of notes arranged in order from low to high, following a fixed pattern of whole and half steps.' },
  { term: 'Chord', def: 'Three or more notes pressed at the same time, producing harmony.' },
  { term: 'Melody', def: 'A sequence of single notes played one after another that forms a recognisable tune.' },
  { term: 'Harmony', def: 'Notes sounded together to support or colour the melody.' },
  { term: 'Treble', def: 'The upper half of the keyboard, typically played by the right hand.' },
  { term: 'Bass', def: 'The lower half of the keyboard, typically played by the left hand.' },
  { term: 'Tempo', def: 'The speed of a piece of music, measured in beats per minute (BPM).' },
  { term: 'Staff', def: 'The five parallel horizontal lines on which musical notes are written.' },
  { term: 'Interval', def: 'The distance in pitch between any two notes. For example, C to G is a fifth.' },
]
import MainLayout from '../../components/MainLayout'
import { usePianoProgress } from '../../hooks/usePianoProgress'
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

function StaticKeyboard() {
  const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const blackPositions: Record<number, string> = { 0: 'C#', 1: 'D#', 3: 'F#', 4: 'G#', 5: 'A#' }
  const highlighted = new Set(['C', 'E', 'G'])

  return (
    <div className="flex select-none">
      {whiteNotes.map((note, i) => (
        <div key={note} className="relative flex-shrink-0">
          <div
            className={`w-10 h-20 border border-surface-border rounded-b-md flex items-end justify-center pb-1.5 text-xs font-semibold ${
              highlighted.has(note) ? 'bg-primary/20 border-primary text-primary' : 'bg-white text-text-muted'
            }`}
          >
            {note}
          </div>
          {blackPositions[i] !== undefined && (
            <div className="absolute z-10 left-7 top-0 w-6 h-12 rounded-b-md bg-text-primary flex items-end justify-center pb-1">
              <span className="text-[7px] text-white">{blackPositions[i]}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function UnderstandingPianoPage() {
  const navigate = useNavigate()
  const { markStageVisited } = usePianoProgress()
  const [showGlossary, setShowGlossary] = useState(false)
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('piano', 'course1')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = () => {
      markStageVisited('piano-understanding')
      navigate('/piano/notes-build-chords')
    }
    if (score < 40) {
      setLowEngagement(true)
      setTimeout(proceed, 3000)
    } else {
      proceed()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
          <button onClick={() => navigate('/piano/understanding-the-piano')} className="hover:text-text-primary transition-colors">
            Piano
          </button>
          <span>/</span>
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">Understanding the Piano</span>
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

        <h1 className="text-text-primary font-bold text-2xl mb-1">Understanding the Piano</h1>
        <p className="text-text-secondary text-sm mb-8">
          Before you play chords, learn how the piano keyboard is organised in relation to your computer Keyboard.
        </p>

        {/* Section 1 */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">White and Black Keys</h2>
          <p className="text-text-secondary text-sm mb-4">
            A piano has two types of keys. The white keys play the seven natural notes of music:
            <span className="text-text-primary font-semibold"> C, D, E, F, G, A, B</span>.
            These repeat across the keyboard in groups called octaves.
          </p>
          <p className="text-text-secondary text-sm">
            The black keys play sharps and flats, raised or lowered versions of the natural notes.
            They always appear in groups of two or three, which makes it easy to find your place on the keyboard.
          </p>
        </div>

        {/* Section 2: Static diagram */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Finding C on the Keyboard</h2>
          <p className="text-text-secondary text-sm mb-5">
            C is always the white key directly to the <span className="font-semibold">left of a group of two black keys</span>.
            In the diagram below, the gold-highlighted keys C, E and G form a C major chord.
          </p>
          <div className="overflow-x-auto pb-2">
            <StaticKeyboard />
          </div>
          <p className="text-text-muted text-xs mt-3">
            The gold keys (C, E, G) are the notes of a C major chord. You will play this in Level 1.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Octaves</h2>
          <p className="text-text-secondary text-sm mb-3">
            Each complete set of 12 keys (7 white + 5 black) is called an <span className="font-semibold">octave</span>.
            The same note name appears in every octave. C4, C5, C6 are all called C, but each one sounds higher than the last.
          </p>
          <p className="text-text-secondary text-sm">
            On the practice keyboard you will use C4 (middle C) as your home position.
            All the chords in this programme begin in the C4 range.
          </p>
          <div className="mt-4 flex gap-3">
            {['C4', 'C5', 'C6'].map(note => (
              <div key={note} className="bg-[#F9F7F4] rounded-xl px-4 py-3 text-center">
                <p className="text-text-primary font-bold text-sm">{note}</p>
                <p className="text-text-muted text-[10px]">
                  {note === 'C4' ? 'Middle C' : note === 'C5' ? 'One octave up' : 'Two octaves up'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Continue button */}
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
            Continue: How Notes Build Chords
          </button>
        </div>
      </div>

      {showGlossary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGlossary(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-lg">Piano — Key Terms</h2>
              <button onClick={() => setShowGlossary(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIANO_TERMS.map(({ term, def }) => (
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
