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
      'Play the keyboard — try a simple 5-note sequence',
      'Record a full melody of at least 10 seconds',
      'Save your composition to your portfolio',
    ],
  },
  'music-guitar': {
    name: 'Guitar',
    emoji: '🎸',
    steps: [
      'Explore the fretboard — tap strings and frets to hear notes',
      'Play your first chord — try E minor or C major',
      'Practice a 4-chord progression: Em → Am → G → C',
      'Record a short melody or chord progression',
      'Give your session a title and save it to your portfolio',
    ],
  },
  'music-piano': {
    name: 'Piano',
    emoji: '🎹',
    steps: [
      'Play the C major scale — C D E F G A B C in order',
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
      'Pitch matching — click each tone and sing it back',
      'Sing the vowel exercise: A – E – I – O – U up and down',
      'Record a short phrase, melody, or vocal exercise',
      'Give your session a title and save it to your portfolio',
    ],
  },
  'visual-arts': {
    name: 'Visual Arts',
    emoji: '🎨',
    steps: [
      'Choose a colour palette — warm, cool, or mixed',
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
      'Choose your poster topic — event, announcement, or message',
      'Sketch a simple layout — where does the title go?',
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
    setSaving(true)
    try {
      if (navigator.onLine) {
        await savePortfolioItem({ discipline: discipline!, title, fileType, fileData, durationMinutes })
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
    return (
      <div className="min-h-screen bg-bg-page">
        <TopNav />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-text-primary font-bold text-xl mb-2">Work saved!</h2>
          <p className="text-text-secondary text-sm mb-8">
            {navigator.onLine
              ? 'Your work has been saved to your portfolio.'
              : 'Saved locally. It will sync to your portfolio when you reconnect.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(1); setSaved(false); setTitle('') }}
              className="bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Start another session
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-border text-text-secondary text-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
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
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <h1 className="text-text-primary font-bold text-xl">{info.name} Session</h1>
            <p className="text-text-secondary text-xs">{user?.school.name}</p>
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

        {/* Save form — shown on step 5 */}
        {step === 5 && (
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
          ) : (
            <button
              onClick={() => {
                if (discipline === 'music' || discipline === 'music-guitar' || discipline === 'music-piano' || discipline === 'music-voice') {
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
