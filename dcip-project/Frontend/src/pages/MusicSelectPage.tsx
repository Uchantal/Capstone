import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateDiscipline } from '../services/api'
import MainLayout from '../components/MainLayout'

const paths = [
  {
    url: '/guitar/reading-the-fretboard',
    subDiscipline: 'guitar',
    name: 'Guitar',
    img: '/images/guitar.jpg',
    imgAlt: 'Guitar',
    imgPosition: 'object-center',
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
    label: 'Open Guitar',
  },
  {
    url: '/piano/virtual-instrument',
    subDiscipline: 'piano',
    name: 'Piano',
    img: '/images/piano.jpg',
    imgAlt: 'Piano keyboard',
    imgPosition: 'object-center',
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
    label: 'Open Piano',
  },
  {
    url: '/voice/posture-breath-voice',
    subDiscipline: 'voice',
    name: 'Voice & Singing',
    img: '/images/voice.jpg',
    imgAlt: 'Voice and singing',
    imgPosition: 'object-top',
    description:
      'Record your voice, practise pitch, warm up with vocal exercises, and save recordings of your singing using your device microphone.',
    items: [
      'Breathing & warm-up',
      'Pitch matching exercise',
      'Sing a short melody',
      'Record & save your voice',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Open Voice & Singing',
  },
]

export default function MusicSelectPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  const handleSelect = async (path: (typeof paths)[number]) => {
    try {
      const res = await updateDiscipline('music', path.subDiscipline)
      updateUser({ discipline: res.data.discipline, subDiscipline: res.data.subDiscipline })
    } catch {
      // non-critical — navigate anyway
    }
    navigate(path.url)
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10">
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
          Select  your favorite part of music today and advance your skills. 
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {paths.map((path) => (
            <div
              key={path.url}
              className={`bg-white rounded-2xl border-2 border-surface-border border-t-4 ${path.accent} flex flex-col overflow-hidden group`}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={path.img}
                  alt={path.imgAlt}
                  className={`w-full h-full object-cover ${path.imgPosition} transition-transform duration-500 group-hover:scale-105`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
                    onClick={() => handleSelect(path)}
                    className={`w-full ${path.btn} text-white font-semibold text-sm py-3.5 rounded-xl transition-colors`}
                  >
                    {path.label}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

       
      </div>
    </MainLayout>
  )
}
