import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateDiscipline } from '../services/api'
import TopNav from '../components/TopNav'
import Footer from '../components/Footer'

const disciplines = [
  {
    id: 'music',
    name: 'Music',
    sub: 'Guitar · Piano · Voice & Singing',
    desc: 'Play instruments and record your voice. Step-by-step sessions from your first note to a saved composition.',
    accent: 'border-primary',
    accentText: 'text-primary',
    accentBg: 'bg-primary',
  },
  {
    id: 'visual-arts',
    name: 'Visual Arts',
    sub: 'Drawing · Colour · Composition',
    desc: 'Create digital artworks on an HTML canvas. Explore colour, form, and composition through guided exercises.',
    accent: 'border-secondary',
    accentText: 'text-secondary',
    accentBg: 'bg-secondary',
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    sub: 'Layouts · Typography · Posters',
    desc: 'Learn visual communication fundamentals and create poster designs step by step.',
    accent: 'border-surface-border',
    accentText: 'text-text-primary',
    accentBg: 'bg-surface-canvas',
  },
]

export default function DisciplineSelectPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const DISC_URLS: Record<string, string> = {
    music: '/session/music',
    'visual-arts': '/visual-arts/virtual-canvas',
    'graphic-design': '/graphic-design/virtual-studio',
  }

  const handleSelect = async (id: string) => {
    const url = DISC_URLS[id] ?? '/dashboard'
    try {
      const res = await updateDiscipline(id)
      updateUser({ discipline: res.data.discipline })
      navigate(url)
    } catch {
      navigate(url)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-12">
        <h1 className="text-text-primary font-bold text-2xl mb-1">Choose your discipline</h1>
        <p className="text-text-secondary text-sm mb-8">
          {user?.discipline
            ? `You are currently practising ${user.discipline.replace('-', ' ')}. You can switch anytime.`
            : 'Select the creative area you want to practise today.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {disciplines.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              className={`text-left bg-white border-2 rounded-2xl p-6 hover:shadow-md transition-all ${
                user?.discipline === d.id ? d.accent : 'border-surface-border hover:border-gray-300'
              }`}
            >
              <p className="text-text-primary font-bold text-base mb-1">{d.name}</p>
              <p className={`text-xs mb-3 ${d.accentText}`}>{d.sub}</p>
              <p className="text-text-secondary text-xs leading-relaxed">{d.desc}</p>
              {user?.discipline === d.id && (
                <div className={`mt-4 text-xs font-medium ${d.accentText}`}>
                  ✓ Current discipline
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 text-text-secondary text-sm hover:text-text-primary transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
      <Footer />
    </div>
  )
}
