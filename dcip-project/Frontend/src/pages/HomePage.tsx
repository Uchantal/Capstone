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

function StepImg({ index }: { index: number }) {
  const src = [
    '/images/Register%20icon.jpg',
    '/images/disciplines%20icon.jpg',
    '/images/learn.png',
    '/images/graduate.jpg',
    '/images/unclock%20icon.png',
  ]
  const alt = [
    'Register at your school',
    'Choose your discipline',
    'Learn with AI support',
    'Graduate your discipline',
    'Unlock DCIP Studio',
  ]
  return <img src={src[index]} alt={alt[index]} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
}

function FeatureIcon({ id }: { id: string }) {
  const src: Record<string, string> = {
    studio:    '/studio%20icons.png',
    ai:        '/2nd%20Ai%20icons.png',
    portfolio: '/portifolio%20icon.png',
    offline:   '/Offline%20icon.png',
  }
  const alt: Record<string, string> = {
    studio:    'DCIP Studio icon',
    ai:        'AI-Powered Learning icon',
    portfolio: 'Portfolio icon',
    offline:   'Works Offline icon',
  }
  return <img src={src[id] ?? src.studio} alt={alt[id] ?? ''} loading="lazy" className="w-full h-full object-contain" />
}

const disciplines = [
  {
    name: 'Music',
    img: '/new%20musci.jpg',
    imgAlt: 'Rwandan youth in music session',
    color: '#ffffff',
    cardBg: 'bg-[#1a2030]',
    paths: ['Guitar', 'Piano', 'Voice & Singing'],
    description: 'Play instruments and record your voice using the Web Audio API. Each session takes you from your first note to a saved composition.',
  },
  {
    name: 'Visual Arts',
    img: '/images/visual-arts.jpg',
    imgAlt: 'Rwandan youth in drawing session',
    color: '#ffffff',
    cardBg: 'bg-[#0d1a12]',
    paths: ['Gesture drawing', 'Colour & tone study', 'Composition'],
    description: 'Draw and paint on a digital canvas. Learn colour, form, and composition through structured beginner-friendly exercises.',
  },
  {
    name: 'Graphic Design',
    img: '/images/New Graphic design.png',
    imgAlt: 'Students at computers learning digital skills',
    color: '#ffffff',
    cardBg: 'bg-[#1a1408]',
    paths: ['Typography basics', 'Layout & grid', 'Poster design'],
    description: 'Learn layouts, typography, and visual communication. Create posters and graphic works through practical guided sessions.',
  },
]

const features = [
  { id: 'studio',    title: 'DCIP Studio',        desc: 'A professional workspace where you save, organise, and revisit your creative work across all disciplines: drawing, playing, singing, and designing in one place.' },
  { id: 'ai',        title: 'AI-Powered Learning', desc: 'Get instant AI critique on your artwork and AI-generated hints when you are stuck. Intelligent support built right into every step of the curriculum.' },
  { id: 'portfolio', title: 'Your Portfolio',       desc: 'Every completed exercise and production saves automatically to your portfolio. Track your creative growth and see how far you have come across every level.' },
  { id: 'offline',   title: 'Works Offline',        desc: 'Use DCIP in your school lab without a reliable connection. Sessions and work save locally and sync automatically the moment you reconnect.' },
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
    title: 'Learn with AI support',
    desc: 'Work through structured foundation lessons and levelled courses. Use AI-powered hints whenever you need a nudge in the right direction.',
  },
  {
    title: 'Graduate your discipline',
    desc: 'Complete your production challenge to prove your skills. Passing unlocks your graduation badge and your portfolio grows with every piece you submit.',
  },
  {
    title: 'Unlock DCIP Studio',
    desc: 'Studio is your reward. Once you graduate, it opens as a free creative hub where you save, organise, and get AI critique on your original work.',
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
          {['About', 'Features', 'Disciplines', 'How It Works'].map((label) => (
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
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0D1B35]">
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

        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B35]/95 via-[#0D1B35]/75 to-[#0D1B35]/20" />

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
            Practise music, visual arts, and graphic design in your school's computer lab.
            AI-powered feedback, a creative Studio, and step-by-step sessions. Online or offline.
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
      <section id="about" className="bg-white py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <FadeIn delay={0}>
            <div className="flex items-center gap-2 mb-4">
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
                src="/mudasobwa.jpg"
                alt="Students in a school computer lab"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-[#0D1B35] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn delay={0} className="text-center mb-14">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="font-sans font-extrabold text-white text-3xl lg:text-4xl leading-tight">
              More than a classroom.<br />A full creative studio.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mt-4 max-w-md mx-auto">
              DCIP comes with tools that support your entire creative journey, from your first lesson to graduating with an advanced badge and unlocking a creative studio.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.id} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 p-2">
                    <FeatureIcon id={f.id} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1.5">{f.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* DISCIPLINES */}
      <section id="disciplines" className="bg-white py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase">Creative Disciplines</span>
            </div>
            <h2
              className="font-sans font-extrabold text-[#1A1A1A] mt-4"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
            >
              Three disciplines.<br />Every talent.
            </h2>
            <p className="text-[#555555] text-sm leading-relaxed mt-4 max-w-sm mx-auto">
              Choose a discipline and follow guided sessions at your own pace.
              No prior experience needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {disciplines.map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.1}>
                <div className="relative rounded-2xl overflow-hidden h-96 cursor-pointer group shadow-md">

                  <img
                    src={d.img}
                    alt={d.imgAlt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50 backdrop-blur-[2px]">
                    <h3 className="font-sans font-bold text-white text-2xl mb-2">{d.name}</h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-4">{d.description}</p>
                    <Link
                      to="/register"
                      className="inline-block bg-primary text-white font-semibold text-sm rounded-lg px-5 py-2 hover:bg-primary-dark transition-colors"
                    >
                      Explore {d.name}
                    </Link>
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20">
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
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md p-2">
                    <StepImg index={i} />
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
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md p-1.5">
                    <StepImg index={i} />
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
      <section className="bg-[#0D1B35] py-16 md:py-12 lg:py-24 px-6 md:px-8 lg:px-20 text-center relative overflow-hidden">
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
