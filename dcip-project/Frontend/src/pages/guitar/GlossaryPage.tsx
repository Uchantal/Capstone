import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'

const TERMS = [
  { term: 'String', def: 'One of the six wires stretched across the guitar body and neck, tuned E A D G B e from lowest to highest pitch.' },
  { term: 'Fret', def: 'One of the metal strips across the neck. Pressing a string against the wood just behind a fret raises its pitch by one semitone.' },
  { term: 'Note', def: 'A specific musical pitch produced by a string at a particular fret. Named C D E F G A B.' },
  { term: 'Chord', def: 'A group of strings fretted at specific positions and strummed together to produce harmony.' },
  { term: 'Open string', def: 'A string played without pressing any fret. Each open string has its own fixed note (E A D G B e).' },
  { term: 'Strumming', def: 'Sweeping a finger or pick across several strings in one continuous motion to play a chord.' },
  { term: 'Picking', def: 'Plucking individual strings one at a time with a finger or pick, used for melodies and solos.' },
  { term: 'Scale', def: 'A sequence of notes following a specific pattern of intervals, used for melodies, solos, and understanding keys.' },
  { term: 'Tab (Tablature)', def: 'A notation system that shows which strings and frets to play, read left to right. Numbers represent frets, lines represent strings.' },
  { term: 'Tuning', def: 'Adjusting the tension of each string so it produces the correct pitch. Standard tuning is E A D G B e.' },
  { term: 'Barre chord', def: 'A chord where one finger presses across all six strings at the same fret. Barre chords can be moved up and down the neck.' },
  { term: 'Nut', def: 'The small grooved piece at the top of the neck that keeps the strings properly spaced before the tuning pegs.' },
]

export default function GuitarGlossaryPage() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <span>Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Key Terms</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Key Terms</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          These are the words you will encounter throughout the Guitar course. Read through them now
          so that when they appear in lessons, you already know what they mean.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {TERMS.map(({ term, def }) => (
            <div key={term} className="bg-white border border-surface-border rounded-xl p-4">
              <p className="text-primary font-bold text-sm mb-1">{term}</p>
              <p className="text-text-secondary text-xs leading-relaxed">{def}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/guitar/reading-the-fretboard')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Course 1
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
