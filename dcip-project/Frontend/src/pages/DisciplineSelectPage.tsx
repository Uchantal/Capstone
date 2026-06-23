import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateDiscipline } from '../services/api'
import MainLayout from '../components/MainLayout'

const disciplines = [
  {
    id: 'music',
    name: 'Music',
    sub: 'Guitar · Piano · Voice & Singing',
    desc: 'Play instruments and record your voice. Step-by-step sessions from your first note to a saved composition.',
    img: '/images/music.jpg',
    imgAlt: 'Music instruments',
    accent: 'border-primary',
    accentText: 'text-primary',
  },
  {
    id: 'visual-arts',
    name: 'Visual Arts',
    sub: 'Drawing · Colour · Composition',
    desc: 'Create digital artworks on an HTML canvas. Explore colour, form, and composition through guided exercises.',
    img: '/images/visual-arts.jpg',
    imgAlt: 'Visual arts',
    accent: 'border-secondary',
    accentText: 'text-secondary',
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    sub: 'Layouts · Typography · Posters',
    desc: 'Learn visual communication fundamentals and create poster designs step by step.',
    img: '/images/graphic-design.jpg',
    imgAlt: 'Graphic design',
    accent: 'border-primary',
    accentText: 'text-primary',
  },
]

export default function DisciplineSelectPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const DISC_URLS: Record<string, string> = {
    music: '/session/music',
    'visual-arts': '/visual-arts/virtual-canvas',
    'graphic-design': '/graphic-design/overview',
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
    <MainLayout>
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
              className={`text-left bg-white border-2 rounded-2xl overflow-hidden hover:shadow-md transition-all group ${
                user?.discipline === d.id ? d.accent : 'border-surface-border hover:border-gray-300'
              }`}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={d.img}
                  alt={d.imgAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {user?.discipline === d.id && (
                  <div className="absolute top-3 right-3 bg-white/90 text-xs font-semibold text-secondary px-2.5 py-1 rounded-full">
                    ✓ Current
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-text-primary font-bold text-base mb-1">{d.name}</p>
                <p className={`text-xs mb-3 ${d.accentText}`}>{d.sub}</p>
                <p className="text-text-secondary text-xs leading-relaxed">{d.desc}</p>
              </div>
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
    </MainLayout>
  )
}
