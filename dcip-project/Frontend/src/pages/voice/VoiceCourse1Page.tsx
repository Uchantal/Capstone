import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const VOICE_TERMS = [
  { term: 'Pitch', def: 'How high or low a sound is. Singing in tune means producing the correct pitch for each note.' },
  { term: 'Frequency', def: 'The number of vibrations per second (Hz). Frequency determines pitch.' },
  { term: 'Note', def: 'A named musical pitch: C D E F G A B. After B, the pattern repeats one octave higher.' },
  { term: 'Scale', def: 'A sequence of notes arranged from low to high, following a specific pattern of steps.' },
  { term: 'Octave', def: 'The interval between one note and the same note name higher. That note vibrates twice as fast.' },
  { term: 'Tone', def: 'A steady sound with a clear, definite pitch — as opposed to noise, which has no pitch.' },
  { term: 'Diaphragm', def: 'The dome-shaped muscle beneath your lungs that pushes air upward through your vocal cords.' },
  { term: 'Breath support', def: 'Using controlled diaphragm pressure to maintain a steady airflow while singing.' },
  { term: 'Vocal cords', def: 'Two small folds of tissue in your larynx that vibrate when air passes through them to produce sound.' },
  { term: 'Resonance', def: 'The way your throat, mouth, and skull amplify and colour the sound your vocal cords produce.' },
  { term: 'Melody', def: 'A sequence of notes forming a recognisable musical phrase or tune.' },
  { term: 'Harmony', def: 'Two or more pitches that complement each other when sung or played at the same time.' },
]
import MainLayout from '../../components/MainLayout'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useReadingEngagement } from '../../hooks/useReadingEngagement'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

// Breathing circle shown in the diaphragmatic breathing card (3 cycles)
function BreathingGuide() {
  const [breathSize, setBreathSize]   = useState<'small' | 'large'>('small')
  const [breathPhase, setBreathPhase] = useState<'in' | 'out'>('in')
  const [done, setDone]               = useState(false)
  const [started, setStarted]         = useState(false)

  const start = () => {
    setStarted(true)
    setDone(false)
    const t1 = setTimeout(() => { setBreathSize('large'); setBreathPhase('in')  },   100)
    const t2 = setTimeout(() => { setBreathSize('small'); setBreathPhase('out') },  4100)
    const t3 = setTimeout(() => { setBreathSize('large'); setBreathPhase('in')  },  8100)
    const t4 = setTimeout(() => { setBreathSize('small'); setBreathPhase('out') }, 12100)
    const t5 = setTimeout(() => { setBreathSize('large'); setBreathPhase('in')  }, 16100)
    const t6 = setTimeout(() => { setBreathSize('small'); setBreathPhase('out') }, 20100)
    const t7 = setTimeout(() => setDone(true),                                    24100)
    return () => { [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout) }
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex flex-col items-center gap-2">
        <div className={`rounded-full border-4 transition-all ease-in-out duration-[4000ms] flex items-center justify-center
          ${breathSize === 'large'
            ? 'w-36 h-36 bg-primary/10 border-primary'
            : 'w-20 h-20 bg-transparent border-primary/40'
          }`}
        >
          {started && !done && (
            <span className="text-primary font-semibold text-sm">
              {breathPhase === 'in' ? 'In' : 'Out'}
            </span>
          )}
          {done && <span className="text-primary text-sm font-semibold">Done</span>}
        </div>
        {!started ? (
          <button
            onClick={start}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Start breathing guide
          </button>
        ) : done ? (
          <button onClick={start} className="text-text-muted text-xs underline">Do it again</button>
        ) : (
          <p className="text-primary text-xs font-medium">
            {breathPhase === 'in' ? 'Breathe in...' : 'Breathe out...'}
          </p>
        )}
      </div>
      <p className="text-text-secondary text-sm leading-relaxed flex-1 min-w-48">
        Breathe in for 4 counts, out for 4 counts. Three cycles total. Your belly should expand on the inhale, not your chest.
      </p>
    </div>
  )
}

export default function VoiceCourse1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { markStageVisited } = useVoiceDemonstrationProgress()
  const [showGlossary, setShowGlossary] = useState(false)
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('voice', 'course1')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = async () => {
      await markStageVisited('voice-course-1')
      navigate('/voice/pitch-and-scale')
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
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">
            Voice and Singing
          </button>
          <span>/</span>
          <span>Door To Know Voice</span>
          <span>/</span>
          <span className="text-text-primary">Posture, Breath, and Your Voice</span>
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

        <h1 className="text-text-primary font-bold text-2xl mb-1">Posture, Breath, and Your Voice</h1>
        <p className="text-text-secondary text-sm mb-8">
          Singing starts before any sound is made. This course builds the physical foundations.
        </p>

        {/* Card 1: Posture */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Posture Before You Sing</h2>
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            Good posture allows deep breathing and prevents throat tension. When your body is properly aligned,
            your lungs can expand fully and your throat stays open and relaxed.
          </p>
          <div className="space-y-2 mb-2">
            {[
              'Stand or sit straight with a relaxed spine',
              'Drop your shoulders away from your ears',
              'Relax your jaw and neck',
              'Keep your chin level, not tilted up or pushed forward',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-text-secondary text-sm">{item}</p>
              </div>
            ))}
          </div>
          <img
            src="/images/posture-correct-incorrect.png"
            alt="Correct posture shows a straight spine with green dots. Incorrect posture shows a hunched spine with red dots."
            className="w-full max-w-md mx-auto block mt-4 rounded-lg"
          />
        </div>

        {/* Card 2: Diaphragmatic Breathing */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Diaphragmatic Breathing</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Singing from the chest strains the voice. Singing from the diaphragm gives power, control, and
            protects your vocal cords. When you breathe in, your belly should expand outward. When you exhale,
            your belly falls back in. Your chest should stay relatively still.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-5">
            <p className="text-text-primary text-sm font-semibold mb-1">Exercise</p>
            <p className="text-text-secondary text-sm">
              Place one hand on your chest and one on your belly. Breathe in slowly for 4 seconds.
              Did your belly move out? That is diaphragmatic breathing.
            </p>
          </div>
          <BreathingGuide />
        </div>

        {/* Card 3: How Your Voice Works */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-6">
          <h2 className="text-text-primary font-bold text-base mb-3">Your Voice and How It Works</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Your vocal cords vibrate when air passes through them to create sound. The more controlled
            your breath, the more controlled your sound. Humming is the safest way to start because it
            keeps sound resonating in the front of your face rather than pressing in your throat.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-text-primary text-sm font-semibold mb-1">Exercise</p>
            <p className="text-text-secondary text-sm">
              Hum a comfortable note. Feel the vibration in your lips and face. If you feel pressure in
              your throat, you are pushing too hard. Relax and try again.
            </p>
          </div>
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
            Continue to Pitch and the Musical Scale
          </button>
        </div>
      </div>

      {showGlossary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGlossary(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-lg">Voice and Singing — Key Terms</h2>
              <button onClick={() => setShowGlossary(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VOICE_TERMS.map(({ term, def }) => (
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
