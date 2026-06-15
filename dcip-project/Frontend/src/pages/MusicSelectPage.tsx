import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

const paths = [
  {
    id: 'music-guitar',
    emoji: '🎸',
    name: 'Guitar',
    description:
      'Learn chords, strumming patterns, and simple melodies using an interactive virtual fretboard powered by the Web Audio API.',
    items: [
      'Explore the fretboard',
      'Play your first chord',
      '3-chord progression',
      'Record a melody',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Practise Guitar',
  },
  {
    id: 'music-piano',
    emoji: '🎹',
    name: 'Piano',
    description:
      'Learn scales, chords, and melodies using an interactive virtual keyboard. Follow guided exercises at your own pace.',
    items: [
      'C major scale',
      'Basic chords (C, F, G)',
      'Short melody by ear',
      'Record your session',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Practise Piano',
  },
  {
    id: 'music-voice',
    emoji: '🎤',
    name: 'Voice & Singing',
    description:
      'Record your voice, practise pitch, warm up with vocal exercises, and save recordings of your singing using your device microphone.',
    items: [
      'Breathing & warm-up',
      'Pitch matching exercise',
      'Sing a short melody',
      'Record & save your voice',
    ],
    accent: 'border-t-purple-600',
    btn: 'bg-purple-700 hover:bg-purple-800',
    label: 'Practise Singing',
  },
]

export default function MusicSelectPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/disciplines')}
          className="text-text-secondary text-sm mb-6 hover:text-text-primary transition-colors inline-flex items-center gap-1"
        >
          ← Back to Module Selection
        </button>

        <h1 className="text-text-primary font-bold text-2xl mb-1">
          Music Module: Choose your practice
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Select how you want to practise music today. Each path is guided step by step.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {paths.map((path) => (
            <div
              key={path.id}
              className={`bg-white rounded-2xl border-2 border-border border-t-4 ${path.accent} flex flex-col overflow-hidden`}
            >
              {/* Icon area */}
              <div className="bg-yellow-50 flex items-center justify-center py-10">
                <div className="bg-yellow-100 rounded-2xl w-24 h-24 flex items-center justify-center">
                  <span className="text-5xl">{path.emoji}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-text-primary font-bold text-xl mb-2">{path.name}</h2>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {path.description}
                </p>

                <div className="mt-auto">
                  <p className="text-text-primary text-xs font-semibold mb-3">
                    What you'll practise:
                  </p>
                  <ul className="space-y-2 mb-6">
                    {path.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-secondary">
                        <span className="text-secondary">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(`/session/${path.id}`)}
                    className={`w-full ${path.btn} text-white font-semibold text-sm py-3.5 rounded-xl transition-colors`}
                  >
                    {path.label}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-text-secondary text-xs text-center mt-8">
          All three paths use your browser's built-in Web Audio API. No hardware or downloads required.
        </p>
      </div>
    </div>
  )
}
