import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import Footer from '../../components/Footer'

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
            ? 'w-36 h-36 bg-purple-100 border-purple-500'
            : 'w-20 h-20 bg-transparent border-purple-300'
          }`}
        >
          {started && !done && (
            <span className="text-purple-700 font-semibold text-sm">
              {breathPhase === 'in' ? 'In' : 'Out'}
            </span>
          )}
          {done && <span className="text-purple-500 text-sm font-semibold">Done</span>}
        </div>
        {!started ? (
          <button
            onClick={start}
            className="bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors"
          >
            Start breathing guide
          </button>
        ) : done ? (
          <button onClick={start} className="text-text-muted text-xs underline">Do it again</button>
        ) : (
          <p className="text-purple-700 text-xs font-medium">
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

  // Hidden 60-second timer before the Continue button is enabled
  const [canContinue, setCanContinue] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setCanContinue(true), 60_000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const handleContinue = async () => {
    if (!canContinue) return
    await markStageVisited('voice-course-1')
    navigate('/voice/pitch-and-scale')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">
            Voice and Singing
          </button>
          <span>/</span>
          <span>Door To Know Voice</span>
          <span>/</span>
          <span className="text-text-primary">Posture, Breath, and Your Voice</span>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Posture, Breath, and Your Voice</h1>
        <p className="text-text-secondary text-sm mb-8">
          Singing starts before any sound is made. This course builds the physical foundations.
        </p>

        {/* Card 1: Posture */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Posture Before You Sing</h2>
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            Good posture allows deep breathing and prevents throat tension. When your body is properly aligned,
            your lungs can expand fully and your throat stays open and relaxed.
          </p>
          <div className="flex gap-8 flex-wrap items-start">
            <svg viewBox="0 0 120 200" className="w-28 h-48 flex-shrink-0" aria-label="Posture diagram">
              {/* Head */}
              <circle cx="60" cy="28" r="20" fill="none" stroke="#C8960C" strokeWidth="2" />
              {/* Neck */}
              <line x1="60" y1="48" x2="60" y2="65" stroke="#C8960C" strokeWidth="2" />
              {/* Spine */}
              <line x1="60" y1="65" x2="60" y2="140" stroke="#C8960C" strokeWidth="2.5" />
              {/* Shoulders */}
              <line x1="25" y1="72" x2="95" y2="72" stroke="#C8960C" strokeWidth="2" />
              {/* Arms */}
              <line x1="25" y1="72" x2="20" y2="120" stroke="#C8960C" strokeWidth="2" />
              <line x1="95" y1="72" x2="100" y2="120" stroke="#C8960C" strokeWidth="2" />
              {/* Legs */}
              <line x1="60" y1="140" x2="40" y2="190" stroke="#C8960C" strokeWidth="2" />
              <line x1="60" y1="140" x2="80" y2="190" stroke="#C8960C" strokeWidth="2" />
              {/* Labels */}
              <text x="105" y="30" fontSize="7" fill="#888">level chin</text>
              <line x1="80" y1="28" x2="103" y2="28" stroke="#888" strokeWidth="0.8" />
              <text x="2" y="68" fontSize="7" fill="#888">relaxed</text>
              <text x="2" y="76" fontSize="7" fill="#888">shoulders</text>
              <text x="65" y="105" fontSize="7" fill="#888">straight</text>
              <text x="65" y="113" fontSize="7" fill="#888">spine</text>
              <text x="2" y="52" fontSize="7" fill="#888">relaxed</text>
              <text x="2" y="60" fontSize="7" fill="#888">jaw</text>
            </svg>
            <div className="flex-1 min-w-48 space-y-2">
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
          </div>
        </div>

        {/* Card 2: Diaphragmatic Breathing */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Diaphragmatic Breathing</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Singing from the chest strains the voice. Singing from the diaphragm gives power, control, and
            protects your vocal cords. When you breathe in, your belly should expand outward. When you exhale,
            your belly falls back in. Your chest should stay relatively still.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5">
            <p className="text-text-primary text-sm font-semibold mb-1">Exercise</p>
            <p className="text-text-secondary text-sm">
              Place one hand on your chest and one on your belly. Breathe in slowly for 4 seconds.
              Did your belly move out? That is diaphragmatic breathing.
            </p>
          </div>
          <BreathingGuide />
        </div>

        {/* Card 3: How Your Voice Works */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Your Voice and How It Works</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Your vocal cords vibrate when air passes through them to create sound. The more controlled
            your breath, the more controlled your sound. Humming is the safest way to start because it
            keeps sound resonating in the front of your face rather than pressing in your throat.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-text-primary text-sm font-semibold mb-1">Exercise</p>
            <p className="text-text-secondary text-sm">
              Hum a comfortable note. Feel the vibration in your lips and face. If you feel pressure in
              your throat, you are pushing too hard. Relax and try again.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {!canContinue && (
            <p className="text-text-muted text-xs">Read through the content above before continuing.</p>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue to Pitch and the Musical Scale
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
