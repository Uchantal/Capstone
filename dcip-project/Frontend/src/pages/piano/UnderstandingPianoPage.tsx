import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'

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
            className={`w-10 h-20 border border-border rounded-b-md flex items-end justify-center pb-1.5 text-xs font-semibold ${
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

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/session/music-piano')} className="hover:text-text-primary transition-colors">
            Piano
          </button>
          <span>/</span>
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">Understanding the Piano</span>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Understanding the Piano</h1>
        <p className="text-text-secondary text-sm mb-8">
          Before you play chords, learn how the piano keyboard is organised.
        </p>

        {/* Section 1 */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
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
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
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
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
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
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/piano/notes-build-chords')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue: How Notes Build Chords
          </button>
        </div>
      </div>
    </div>
  )
}
