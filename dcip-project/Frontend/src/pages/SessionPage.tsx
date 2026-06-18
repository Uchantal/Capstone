import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { savePortfolioItem } from '../services/api'
import { savePendingItem } from '../services/db'
import TopNav from '../components/TopNav'
import StepIndicator from '../components/StepIndicator'
import MusicModule from '../components/modules/MusicModule'
import VisualArtsModule from '../components/modules/VisualArtsModule'
import GraphicDesignModule from '../components/modules/GraphicDesignModule'
import GuitarModule from '../components/modules/music/GuitarModule'
import PianoModule from '../components/modules/music/PianoModule'
import VoiceModule from '../components/modules/music/VoiceModule'

type Discipline =
  | 'music'
  | 'music-guitar'
  | 'music-piano'
  | 'music-voice'
  | 'visual-arts'
  | 'graphic-design'

const disciplineInfo: Record<Discipline, { name: string; emoji: string; steps: string[] }> = {
  music: {
    name: 'Music',
    emoji: '🎵',
    steps: [
      'Listen to the example and get familiar with the rhythm',
      'Try recording a short vocal or humming melody',
      'Play the keyboard, try a simple 5-note sequence',
      'Record a full melody of at least 10 seconds',
      'Save your composition to your portfolio',
    ],
  },
  'music-guitar': {
    name: 'Guitar',
    emoji: '🎸',
    steps: [
      'Explore the fretboard: tap strings and frets to hear notes',
      'Play your first chord, try E minor or C major',
      'Practice a 4-chord progression: Em → Am → G → C',
      'Record a short melody or chord progression',
      'Give your session a title and save it to your portfolio',
    ],
  },
  'music-piano': {
    name: 'Piano',
    emoji: '🎹',
    steps: [
      'Play the C major scale: C D E F G A B C in order',
      'Try the basic chords: C major, F major, G major',
      'Find a short melody by ear using the virtual keyboard',
      'Record your piano session',
      'Give your session a title and save it to your portfolio',
    ],
  },
  'music-voice': {
    name: 'Voice & Singing',
    emoji: '🎤',
    steps: [
      'Complete the breathing and warm-up exercises',
      'Pitch matching: click each tone and sing it back',
      'Sing the vowel exercise: A – E – I – O – U up and down',
      'Record a short phrase, melody, or vocal exercise',
      'Give your session a title and save it to your portfolio',
    ],
  },
  'visual-arts': {
    name: 'Visual Arts',
    emoji: '🎨',
    steps: [
      'Choose a colour palette: warm, cool, or mixed',
      'Draw three basic shapes that represent something real',
      'Explore shading by adding darker tones to one shape',
      'Combine your shapes into a small composition',
      'Name and save your artwork to your portfolio',
    ],
  },
  'graphic-design': {
    name: 'Graphic Design',
    emoji: '✏️',
    steps: [
      'Choose your poster topic: event, announcement, or message',
      'Sketch a simple layout: where does the title go?',
      'Add your title text in a large, readable size',
      'Add a supporting image or background colour',
      'Save your poster design to your portfolio',
    ],
  },
}

export default function SessionPage() {
  const { discipline } = useParams<{ discipline: Discipline }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [startTime] = useState(Date.now())
  const [sessionDuration, setSessionDuration] = useState(0)
  const [progressUpdate, setProgressUpdate] = useState<{
    currentLevel: number
    sessionsAtCurrentLevel: number
    levelJustCompleted: boolean
    newLevelTitle: string | null
    skillLabel: string
    totalSessions: number
    sessionQuality: 'short' | 'standard' | 'deep'
    milestones: string[]
  } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioDataRef = useRef<string>('')

  const info = disciplineInfo[discipline as Discipline]

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  if (!info) return <div className="p-8">Unknown discipline</div>

  const handleSave = async (fileData: string, fileType: string) => {
    if (!title.trim()) return
    const durationMinutes = Math.round((Date.now() - startTime) / 60000)
    setSessionDuration(durationMinutes)
    setSaving(true)
    try {
      if (navigator.onLine) {
        const res = await savePortfolioItem({ discipline: discipline!, title, fileType, fileData, durationMinutes })
        if (res.data?.progressUpdate) {
          setProgressUpdate(res.data.progressUpdate)
        }
      } else {
        await savePendingItem({ discipline: discipline!, title, fileType, fileData, durationMinutes, createdAt: new Date().toISOString() })
      }
      setSaved(true)
    } catch {
      await savePendingItem({ discipline: discipline!, title, fileType, fileData, durationMinutes, createdAt: new Date().toISOString() })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    const isOffline = !progressUpdate
    const quality = progressUpdate?.sessionQuality ?? (sessionDuration < 10 ? 'short' : sessionDuration <= 30 ? 'standard' : 'deep')
    const qualityConfig = {
      short: { label: 'Quick Session', icon: '⏱', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      standard: { label: 'Standard Session', icon: '⭐', color: 'bg-primary/10 text-primary border-primary/20' },
      deep: { label: 'Deep Practice!', icon: '🔥', color: 'bg-green-100 text-green-700 border-green-200' },
    }
    const qc = qualityConfig[quality]
    const levelPct = progressUpdate
      ? Math.round((progressUpdate.sessionsAtCurrentLevel / 5) * 100)
      : 0

    return (
      <div className="min-h-screen bg-bg-page">
        <TopNav />
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10 space-y-4">

          {/* Quality badge */}
          <div className={`border rounded-2xl p-4 flex items-center gap-3 ${qc.color}`}>
            <span className="text-2xl">{qc.icon}</span>
            <div>
              <p className="font-bold text-sm">{qc.label}</p>
              <p className="text-xs opacity-80">{sessionDuration} min session</p>
            </div>
          </div>

          {/* Level up celebration */}
          {progressUpdate?.levelJustCompleted && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 text-center">
              <span className="text-4xl animate-bounce inline-block mb-2">★</span>
              <p className="text-primary font-bold text-lg">Level Up!</p>
              <p className="text-text-primary text-sm mt-1">
                You reached Level {progressUpdate.currentLevel}
                {progressUpdate.newLevelTitle ? ` — ${progressUpdate.newLevelTitle}` : ''}
              </p>
            </div>
          )}

          {/* Progress update */}
          {progressUpdate && !isOffline && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="text-text-primary font-bold text-sm mb-3">Your Progress</p>
              <p className="text-text-secondary text-xs mb-2">
                Sessions at current level: {progressUpdate.sessionsAtCurrentLevel} / 5
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${levelPct}%` }}
                />
              </div>
              <p className="text-text-muted text-xs">
                {progressUpdate.skillLabel} · Level {progressUpdate.currentLevel} · {progressUpdate.totalSessions} sessions total
              </p>
            </div>
          )}

          {/* Milestones */}
          {progressUpdate && progressUpdate.milestones.length > 0 && (
            <div className="bg-white border-2 border-primary/30 rounded-2xl p-5 space-y-2">
              <p className="text-primary font-bold text-sm mb-1">Milestone Reached!</p>
              {progressUpdate.milestones.map((m, i) => (
                <p key={i} className="text-text-primary text-sm flex gap-2 items-start">
                  <span className="text-primary shrink-0">★</span>
                  {m}
                </p>
              ))}
            </div>
          )}

          {/* Offline note */}
          {isOffline && (
            <div className="bg-white border border-border rounded-2xl p-5 text-center">
              <p className="text-text-primary font-semibold text-sm mb-1">Work saved!</p>
              <p className="text-text-secondary text-xs">
                Saved locally. It will sync to your portfolio when you reconnect.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => { setStep(1); setSaved(false); setTitle(''); setProgressUpdate(null) }}
              className="bg-primary text-white font-semibold text-sm py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue practicing
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-border text-text-secondary text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              View my progress
            </button>
            <button
              onClick={() => navigate('/skill-summary')}
              className="border border-border text-text-secondary text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              View skill summary
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-border text-text-secondary text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <h1 className="text-text-primary font-bold text-xl">{info.name} Session</h1>
            <p className="text-text-secondary text-xs">{user?.school?.name}</p>
          </div>
        </div>

        <StepIndicator current={step} total={5} />

        {/* Current step instruction */}
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1">
            Step {step}
          </p>
          <p className="text-text-primary text-base font-semibold">{info.steps[step - 1]}</p>
        </div>

        {/* Module */}
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          {discipline === 'music' && (
            <MusicModule
              step={step}
              onAudioReady={(data) => { audioDataRef.current = data }}
            />
          )}
          {discipline === 'music-guitar' && (
            <GuitarModule
              step={step}
              onAudioReady={(data) => { audioDataRef.current = data }}
            />
          )}
          {discipline === 'music-piano' && (
            <PianoModule
              step={step}
              onAudioReady={(data) => { audioDataRef.current = data }}
            />
          )}
          {discipline === 'music-voice' && (
            <VoiceModule
              step={step}
              onAudioReady={(data) => { audioDataRef.current = data }}
            />
          )}
          {discipline === 'visual-arts' && (
            <VisualArtsModule canvasRef={canvasRef} step={step} />
          )}
          {discipline === 'graphic-design' && (
            <GraphicDesignModule canvasRef={canvasRef} step={step} />
          )}
        </div>

        {/* Save form — shown on step 5, not needed for piano intro */}
        {step === 5 && discipline !== 'music-piano' && (
          <div className="bg-white border border-border rounded-xl p-5 mb-6">
            <label className="text-text-primary text-sm font-medium block mb-2">
              Give your work a title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My first melody, Colour study #1"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="border border-border text-text-secondary text-sm px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Next step →
            </button>
          ) : discipline === 'music-piano' ? (
            <button
              onClick={() => navigate('/piano/understanding-the-piano')}
              className="bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue to Door To Know Piano
            </button>
          ) : (
            <button
              onClick={() => {
                if (discipline === 'music' || discipline === 'music-guitar' || discipline === 'music-voice') {
                  handleSave(audioDataRef.current || 'audio-session', 'audio/wav')
                } else {
                  const canvas = canvasRef.current
                  const data = canvas ? canvas.toDataURL('image/png') : 'canvas-session'
                  handleSave(data, 'image/png')
                }
              }}
              disabled={saving || !title.trim()}
              className="bg-secondary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save to portfolio ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
