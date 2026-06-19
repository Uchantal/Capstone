import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

function StepIcon({ index }: { index: number }) {
  const svg = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'w-5 h-5',
  }
  if (index === 0) return (
    <svg {...svg}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
  if (index === 1) return (
    <svg {...svg}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
  if (index === 2) return (
    <svg {...svg}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
  if (index === 3) return (
    <svg {...svg}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
  return (
    <svg {...svg}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const disciplines = [
  {
    name: 'Music',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4hrFxBXkVp7G6H45NH-d8U8ZhHPw-kB86KSkHD9DSfA&s=10',
    imgAlt: 'Rwandan youth in music session',
    color: '#ffffff',
    cardBg: 'bg-[#1a2030]',
    paths: ['Guitar', 'Piano', 'Voice & Singing'],
    description: 'Play instruments and record your voice using the Web Audio API. Each session takes you from your first note to a saved composition.',
  },
  {
    name: 'Visual Arts',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWuTGPFiUGX2a-Ry0-717R8XMe5XwwN5elmjl_OVIJSw&s=10',
    imgAlt: 'Rwandan youth in drawing session',
    color: '#ffffff',
    cardBg: 'bg-[#0d1a12]',
    paths: ['Gesture drawing', 'Colour & tone study', 'Composition'],
    description: 'Draw and paint on a digital canvas. Learn colour, form, and composition through structured beginner-friendly exercises.',
  },
  {
    name: 'Graphic Design',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6onXecRLNIGg4NZdHw_fQMdC73sQ00rZ6dzNk63pEOA&s=10',
    imgAlt: 'Students at computers learning digital skills',
    color: '#ffffff',
    cardBg: 'bg-[#1a1408]',
    paths: ['Typography basics', 'Layout & grid', 'Poster design'],
    description: 'Learn layouts, typography, and visual communication. Create posters and graphic works through practical guided sessions.',
  },
]

const steps = [
  {
    title: 'Register at your school',
    desc: 'Create an account and select your school from the verified list. Only participating schools are accepted.',
  },
  {
    title: 'Choose your discipline',
    desc: 'Pick Music, Visual Arts, or Graphic Design. Music splits further into Guitar, Piano, or Voice and Singing.',
  },
  {
    title: 'Learn the foundations',
    desc: 'Every discipline starts with short foundation lessons covering the basics, before you move on to guided practice levels.',
  },
  {
    title: 'Practise and grow',
    desc: 'Work through three graduated levels, then practise freely, and finish with a production challenge that shows what you have learned.',
  },
  {
    title: 'Build your portfolio',
    desc: 'Your finished work saves to your portfolio automatically. Offline? It saves locally and syncs when you reconnect.',
  },
]


export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="font-sans overflow-x-hidden">

      {/* NAV */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-8 lg:px-16 transition-all duration-300 bg-white border-b border-[#E8E4DC] ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-sm">DCIP</span>
          </div>
          <span className="font-sans font-bold text-[15px] text-[#1A1A1A] tracking-tight hidden lg:inline">
            Digital Creative Infrastructure Platform
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4 lg:gap-8">
          {['About', 'Disciplines', 'How It Works'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-[#555555] hover:text-primary transition-colors hidden md:inline"
            >
              {label}
            </a>
          ))}
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-primary text-primary bg-white hover:bg-primary/10 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="text-sm font-bold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0E1117]">
        <div className="absolute top-0 left-0 right-0 flex h-1.5 z-10">
          <div className="flex-1 bg-accent" />
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-secondary" />
        </div>

        <img
          src="/mudasobwa.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0E1117]/95 via-[#0E1117]/75 to-[#0E1117]/20" />

        <div className="relative z-10 px-6 md:px-8 lg:px-20 pt-16 max-w-3xl">
          <div className="inline-flex items-center rounded-full px-3.5 py-1.5 mb-7 bg-primary/10 border border-primary/30">
            <span className="text-[11px] font-semibold text-primary tracking-wide">
              FOR RWANDA'S SECONDARY SCHOOLS
            </span>
          </div>

          <h1 className="font-sans font-extrabold text-white text-5xl lg:text-7xl tracking-tight leading-tight">
            Your Creative
          </h1>
          <h1 className="font-sans font-extrabold text-primary text-5xl lg:text-7xl tracking-tight leading-tight mb-8">
            Talent Has a Home.
          </h1>

          <p className="text-white/70 text-lg max-w-xl mb-10 leading-relaxed">
            Practise music, visual arts, and graphic design using the computer lab at your school.
            Step-by-step sessions, online or offline.
          </p>

          <div className="flex gap-3.5 flex-wrap">
            <Link
              to="/register"
              className="bg-primary text-white font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Create Your Account
            </Link>
            <Link
              to="/login"
              className="border border-white/30 text-white/70 font-semibold text-sm px-6 py-3.5 rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              Log In →
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-[#F9F7F4] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <FadeIn delay={0}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-primary" />
              <span className="text-primary text-xs font-semibold tracking-widest uppercase">About the Platform</span>
            </div>
            <h2 className="text-[#1A1A1A] font-extrabold text-3xl lg:text-4xl leading-tight mb-5">
              The talent is in every district.<br />The studio is now too.
            </h2>
            <p className="text-[#555555] text-sm leading-relaxed">
              Creative talent is everywhere in Rwanda. This platform helps students use their school computer labs to learn,
              practise, and develop their creative skills in a structured and supportive environment.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="rounded-2xl overflow-hidden bg-[#1a2030] aspect-[4/3]">
              <img
                src="https://pbs.twimg.com/media/EQu0eZTX0AIyQBU.jpg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* DISCIPLINES */}
      <section id="disciplines" className="bg-[#0E1117] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-px bg-primary" />
              <span className="text-primary text-xs font-semibold tracking-widest uppercase">Creative Disciplines</span>
            </div>
            <h2
              className="font-sans font-extrabold text-white mt-4"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
            >
              Three disciplines.<br />Every talent.
            </h2>
            <p
              className="text-sm leading-relaxed mt-4 max-w-sm mx-auto"
              style={{ color: 'rgba(245,243,238,0.55)' }}
            >
              Choose a discipline and follow guided sessions at your own pace.
              No prior experience needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {disciplines.map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.1}>
                <div className="relative rounded-xl overflow-hidden h-96 cursor-pointer group">

                  <img
                    src={d.img}
                    alt={d.imgAlt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-sans font-bold text-white text-2xl mb-2">{d.name}</h3>
                    <p className="text-white/85 text-sm leading-relaxed mb-4">{d.description}</p>
                    <Link
                      to="/register"
                      className="inline-block text-white font-semibold text-sm border border-white/60 rounded-lg px-5 py-2 hover:bg-white/10 transition-colors"
                    >
                      Explore {d.name}
                    </Link>
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-1 bg-white" />

                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F9F7F4] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn delay={0} className="text-center mb-16">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="font-sans font-extrabold text-[#1A1A1A] text-3xl lg:text-4xl">
              School computer to saved portfolio.<br />Five steps.
            </h2>
          </FadeIn>

          {/* Desktop: horizontal connected flow (lg and above) */}
          <FadeIn delay={0.05} className="hidden lg:block">
            {/* Badge row with connector line */}
            <div className="relative flex mb-6">
              <div className="absolute left-[10%] right-[10%] top-6 h-px bg-primary/20" />
              {steps.map((_s, i) => (
                <div key={i} className="w-1/5 flex flex-col items-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                    <StepIcon index={i} />
                  </div>
                  <p className="text-[10px] font-semibold tracking-widest text-[#555555] uppercase mt-3">
                    Step {i + 1}
                  </p>
                </div>
              ))}
            </div>
            {/* Card row */}
            <div className="grid grid-cols-5 gap-3">
              {steps.map((s, i) => (
                <div key={i} className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-[#1A1A1A] mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-[#555555] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Mobile: vertical timeline (below lg) */}
          <div className="lg:hidden flex flex-col">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0 w-10">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                    <StepIcon index={i} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px bg-primary/20 flex-1 mt-2" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${i < steps.length - 1 ? 'pb-6' : ''}`}>
                  <p className="text-[10px] font-semibold tracking-widest text-[#555555] uppercase mb-2 mt-1.5">
                    Step {i + 1}
                  </p>
                  <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-sm text-[#1A1A1A] mb-1.5 leading-snug">{s.title}</h3>
                    <p className="text-xs text-[#555555] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0E1117] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-accent" />
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-secondary" />
        </div>

        <FadeIn delay={0} className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-sans font-extrabold text-white text-3xl lg:text-5xl leading-tight mb-4">
            Ready to start <span className="text-primary">practising?</span>
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-10">
            Your school already has everything you need. Start building your creative skills today.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link
              to="/register"
              className="bg-primary text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Create Your Account
            </Link>
            <Link
              to="/login"
              className="border border-white/30 text-white/70 font-semibold text-sm px-7 py-3.5 rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              Log In →
            </Link>
          </div>
          <p className="mt-5 text-[11px] tracking-wide text-white/20">
            For students in Rwandan schools only.
          </p>
        </FadeIn>
      </section>

      <Footer />

    </div>
  )
}
