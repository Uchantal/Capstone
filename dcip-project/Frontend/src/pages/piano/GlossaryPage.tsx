import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'

const TERMS = [
  { term: 'Note', def: 'A single musical sound with a specific pitch. Notes are named C D E F G A B, then the pattern repeats.' },
  { term: 'Key', def: 'One of the individual black or white bars on the keyboard. Pressing a key produces a note.' },
  { term: 'Octave', def: 'The same note name appearing eight steps higher or lower. The higher version vibrates exactly twice as fast.' },
  { term: 'Scale', def: 'A set of notes arranged in order from low to high, following a fixed pattern of whole and half steps.' },
  { term: 'Chord', def: 'Three or more notes pressed at the same time. A chord produces harmony — sounds that blend together.' },
  { term: 'Melody', def: 'A sequence of single notes played one after another that forms a recognisable tune, usually with the right hand.' },
  { term: 'Harmony', def: 'Notes sounded together to support or colour the melody. Chords are the most common form of harmony.' },
  { term: 'Treble', def: 'The upper half of the keyboard, typically played by the right hand. Treble notes are higher in pitch.' },
  { term: 'Bass', def: 'The lower half of the keyboard, typically played by the left hand. Bass notes are lower in pitch.' },
  { term: 'Tempo', def: 'The speed of a piece of music, measured in beats per minute (BPM). A higher BPM means faster music.' },
  { term: 'Staff', def: 'The five parallel horizontal lines on which musical notes are written. Notes sit on or between the lines.' },
  { term: 'Interval', def: 'The distance in pitch between any two notes. For example, C to G is an interval of a fifth.' },
]

export default function PianoGlossaryPage() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <span>Piano</span>
          <span>/</span>
          <span className="text-text-primary">Key Terms</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Key Terms</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          These are the words you will encounter throughout the Piano course. Read through them now
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
            onClick={() => navigate('/piano/understanding-the-piano')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Course 1
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
