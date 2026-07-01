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
      'Explore the fretboard, discover how notes and chords sit across all six strings, and practise real chord progressions using an interactive virtual instrument.',
    items: [
      'Navigate the 6-string fretboard',
      'Find any note across the neck',
      'Play major chord progressions',
      'Record a practice session',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Open Guitar',
    meta: '2 Courses · 3 Levels',
  },
  {
    url: '/piano/virtual-instrument',
    subDiscipline: 'piano',
    name: 'Piano',
    img: '/images/piano.jpg',
    imgAlt: 'Piano keyboard',
    imgPosition: 'object-center',
    description:
      'Understand how the keyboard is organised, learn the half-step formula that builds every chord, and develop fluency through structured levels on a virtual piano.',
    items: [
      'Identify every key by name',
      'Build major and minor chords by formula',
      'Play C, F, and G progressions',
      'Record and review your session',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Open Piano',
    meta: '2 Courses · 3 Levels',
  },
  {
    url: '/voice/posture-breath-voice',
    subDiscipline: 'voice',
    name: 'Voice & Singing',
    img: '/images/voice.jpg',
    imgAlt: 'Voice and singing',
    imgPosition: 'object-top',
    description:
      'Develop proper posture and diaphragmatic breathing, train your ear to match pitch in real time, and sing through the musical scale with live microphone feedback.',
    items: [
      'Set up posture and breathing technique',
      'Match pitch with live microphone feedback',
      'Sing through the C major scale',
      'Record and save your vocal performance',
    ],
    accent: 'border-t-primary',
    btn: 'bg-primary hover:bg-primary-dark',
    label: 'Open Voice & Singing',
    meta: '2 Courses · 3 Levels',
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
          Music Module: Choose Your Practice
        </h1>
        <p className="text-text-secondary text-sm mb-1">
          Select your favourite part of music today and advance your skills.
        </p>
        <p className="text-text-muted text-sm mb-8">
          Two foundation courses lead into three graded levels, each with dedicated practice and demonstration stages, then a sharpening phase and a final production part that you save under your portfolio.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {paths.map((path) => (
            <div
              key={path.url}
              className={`bg-white rounded-2xl border-2 border-surface-border border-t-4 ${path.accent} flex flex-col overflow-hidden group`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-white">
                <img
                  src={path.img}
                  alt={path.imgAlt}
                  className={`w-full h-full object-contain ${path.imgPosition} transition-transform duration-500 group-hover:scale-105`}
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-text-primary font-bold text-xl">{path.name}</h2>
                  <span className="shrink-0 text-xs text-text-muted font-medium bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 mt-0.5">
                    {path.meta}
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {path.description}
                </p>

                <div className="mt-auto">
                  <p className="text-text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                    Expectations for this Module
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
