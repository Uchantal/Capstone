import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import AskAIHint from '../../components/ai/AskAIHint'

const TERMS = [
  { term: 'Pitch', def: 'How high or low a sound is. Singing in tune means producing the correct pitch for each note.' },
  { term: 'Frequency', def: 'The number of vibrations per second, measured in hertz (Hz). Frequency determines pitch: higher Hz means a higher note.' },
  { term: 'Note', def: 'A named musical sound: C D E F G A B. After B, the pattern repeats one octave higher.' },
  { term: 'Scale', def: 'A sequence of notes arranged from low to high (or high to low), following a specific pattern of steps.' },
  { term: 'Octave', def: 'The interval between one note and the next note of the same name. The higher note vibrates exactly twice as fast.' },
  { term: 'Tone', def: 'A steady sound with a clear, definite pitch. Singing produces tone; noise has no definite pitch.' },
  { term: 'Diaphragm', def: 'The dome-shaped muscle beneath your lungs. When it contracts, it pushes air upward through your vocal cords.' },
  { term: 'Breath support', def: 'Using controlled pressure from the diaphragm to maintain a steady airflow while singing, keeping your tone even and sustained.' },
  { term: 'Vocal cords', def: 'Two small folds of tissue inside your larynx (voice box) that vibrate when air passes through them to produce sound.' },
  { term: 'Resonance', def: 'The way your throat, mouth, and skull amplify and colour the sound your vocal cords produce.' },
  { term: 'Melody', def: 'A sequence of notes forming a recognisable musical phrase or tune, moving from one note to the next.' },
  { term: 'Harmony', def: 'Two or more pitches that complement each other when sung or played at the same time.' },
]

export default function VoiceGlossaryPage() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <AskAIHint discipline="Voice" context="Voice Glossary" />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <span>Voice and Singing</span>
          <span>/</span>
          <span className="text-text-primary">Key Terms</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Key Terms</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          These are the words you will encounter throughout the Voice and Singing course. Read through them now
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
            onClick={() => navigate('/voice/posture-breath-voice')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Course 1
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
