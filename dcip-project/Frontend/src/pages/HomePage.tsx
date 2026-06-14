import { useState, useEffect, useRef } from 'react'

const IMG_HERO   = '/mudasobwa.jpg'
const IMG_SCHOOL =
  'https://www.newtimes.co.rw/uploads/imported_images/files/main/articles/2021/11/24/students_at_gs_paysannat_l_c_using_tablet.jpeg'
// TODO: download from vecteezy.com/photo/27870997 and place in public/ as music-bg.jpg
const IMG_MUSIC  =
  'https://playingforchange.org/wp-content/uploads/2024/06/ubuntu-sl-4-3.jpg'

interface FadeProps {
  id: string
  className?: string
  style?: React.CSSProperties
  delay?: number
  children: React.ReactNode
}

function FadeIn({ id, className, style, delay = 0, children }: FadeProps) {
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
      id={id}
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="font-display font-extrabold text-3xl text-[#C8960C] leading-none">{value}</div>
      <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{label}</div>
    </div>
  )
}

interface DiscCardProps {
  name: string
  img?: string
  imgAlt: string
  color: string
  paths: string[]
  description: string
  delay: number
}

function DisciplineCard({ name, img, imgAlt, color, paths, description, delay }: DiscCardProps) {
  return (
    <FadeIn id={`disc-${name}`} delay={delay}
      className="rounded-card overflow-hidden flex flex-col"
      style={{ background: '#161B25', border: '0.5px solid rgba(255,255,255,0.07)' }}
    >
      <div className="relative h-44 overflow-hidden">
        {img && (
          <img
            src={img}
            alt={imgAlt}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #161B25 0%, transparent 55%)' }} />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
        <div className="absolute bottom-3 left-4">
          <span className="font-display font-extrabold text-xl text-white">{name}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <p className="text-sm leading-relaxed text-white/55">
          {description}
        </p>
        <div>
          <span className="text-[9px] font-semibold tracking-widest" style={{ color }}>
            PRACTICE PATHS
          </span>
          <div className="mt-2 flex flex-col gap-1">
            {paths.map((p) => (
              <span key={p} className="text-xs text-white/70">{p}</span>
            ))}
          </div>
        </div>
        <a
          href="/register"
          className="mt-auto block text-center text-xs font-semibold py-2.5 rounded-lg border transition-colors"
          style={{ borderColor: color, color }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${color}18` }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          Explore {name} →
        </a>
      </div>
    </FadeIn>
  )
}

function FeatureCard({
  icon, title, description, borderColor,
}: { icon: string; title: string; description: string; borderColor: string }) {
  return (
    <div
      className="p-6 bg-white border-l-[3px] border-t border-r border-b border-gray-200"
      style={{
        borderLeftColor: borderColor,
      }}
    >
      <span className="text-2xl block mb-3">{icon}</span>
      <h3 className="font-semibold text-sm text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

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
        className={`fixed top-0 left-0 right-0 z-50 px-10 h-16 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'bg-[#0E1117]/96 backdrop-blur-md border-b border-[#C8960C]/15' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#C8960C] rounded-lg flex items-center justify-center">
            <span className="font-display font-extrabold text-sm text-[#0E1117]">DCIP</span>
          </div>
          <span className="font-display font-bold text-[15px] text-white tracking-tight">
            Digital Creative Infrastructure Platform
          </span>
        </div>

        <div className="flex items-center gap-8">
          {['About', 'Disciplines', 'How It Works'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm transition-colors duration-200 text-white/55 hover:text-[#C8960C]"
            >
              {label}
            </a>
          ))}
          <a href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#C8960C] text-[#C8960C] transition-colors hover:bg-[#C8960C]/10">
            Log In
          </a>
          <a href="/register"
            className="text-sm font-bold px-5 py-2 rounded-lg bg-[#C8960C] text-[#0E1117] transition-colors hover:bg-[#8B6508]">
            Register
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0E1117]">

        <div className="absolute top-0 left-0 right-0 flex h-1.5 z-10">
          <div className="flex-1 bg-[#D62828]" />
          <div className="flex-1 bg-[#C8960C]" />
          <div className="flex-1 bg-[#2D6A4F]" />
        </div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${IMG_HERO})`,
           
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.32) saturate(0.75)',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(14,17,23,0.97) 0%, rgba(14,17,23,0.78) 52%, rgba(14,17,23,0.18) 100%)',
          }}
        />

        <div className="relative z-10 px-20 pt-16 max-w-3xl">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 bg-[#C8960C]/10 border border-[#C8960C]/30"
          >
            <span className="text-sm">🇷🇼</span>
            <span className="text-[11px] font-semibold text-[#C8960C] tracking-wide">
              FOR RWANDA'S SECONDARY SCHOOLS
            </span>
          </div>

          <h1 className="font-display font-extrabold text-white leading-[1.04] mb-2 text-[clamp(44px,5.5vw,72px)] tracking-[-1.5px]">
            Your Creative
          </h1>
          <h1 className="font-display font-extrabold text-[#C8960C] leading-[1.04] mb-8 text-[clamp(44px,5.5vw,72px)] tracking-[-1.5px]">
            Talent Has a Home.
          </h1>

          {/* PARAGRAPH 1 — edited */}
          <p className="text-[17px] leading-relaxed mb-10 max-w-[520px] text-white/70">
            Practise music, visual arts, and graphic design using the computer lab at your school.
            Step-by-step sessions, online or offline.
          </p>

          <div className="flex gap-3.5 flex-wrap mb-6">
            <a href="/register" className="btn-primary text-sm px-7 py-3.5">
              Create Your Account
            </a>
            <a href="/login" className="btn-ghost text-sm px-6 py-3.5">
              Log In →
            </a>
          </div>

         
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-35">
          
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, #C8960C, transparent)' }} />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-[#F5F3EE] py-24 px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-20 items-center">

          <FadeIn id="about-text" delay={0}>
            <div className="section-label">
              <div className="section-label-bar" />
              <span className="section-label-text">About the Platform</span>
            </div>
            <h2 className="font-display font-extrabold text-[#0E1117] leading-[1.12] mb-5"
              style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>
              The talent is in every district.<br />The studio is now too.
            </h2>
            {/* PARAGRAPH 2 — edited */}
            <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
              Creative talent is everywhere in Rwanda. This platform helps students use their school computer labs to learn, practise, and develop their creative skills in a structured and supportive environment.
            </p>
           
          </FadeIn>

          <FadeIn id="about-img" delay={0.15}
            className="rounded-card overflow-hidden relative"
            style={{ aspectRatio: '4/3', background: '#1a2030' }}
          >
            <img
              src={"https://pbs.twimg.com/media/EQu0eZTX0AIyQBU.jpg"}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 px-5 py-4"
              style={{ background: 'linear-gradient(to top, rgba(14,17,23,0.88), transparent)' }}
            >
             
            </div>
          </FadeIn>
        </div>
      </section>

      {/* DISCIPLINES */}
      <section id="disciplines" className="py-24 px-20 bg-[#0E1117]">
        <div className="max-w-6xl mx-auto">

          <FadeIn id="disc-head" delay={0}
            className="flex justify-between items-end mb-14 flex-wrap gap-5">
            <div>
              <div className="section-label">
                <div className="section-label-bar" />
                
              </div>
              <h2 className="font-display font-extrabold text-white leading-[1.1]"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
                Three disciplines.<br />Every talent.
              </h2>
            </div>
            {/* PARAGRAPH 3 — edited */}
            <p className="text-sm max-w-xs leading-relaxed text-white/45">
              Choose a discipline and follow guided sessions at your own pace.
              No prior experience needed.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-5">
            <DisciplineCard
              name="Music" img={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4hrFxBXkVp7G6H45NH-d8U8ZhHPw-kB86KSkHD9DSfA&s=10'}
              imgAlt="Rwandan youth in music session, Ubuntu Music Program Kigali"
              color="#ffff"
              paths={['🎸  Guitar', '🎹  Piano', '🎤  Voice & Singing']}
              description="Play instruments and record your voice using the Web Audio API. Each session takes you from your first note to a saved composition."
              delay={0}
            />
            <DisciplineCard
              name="Visual Arts" img={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWuTGPFiUGX2a-Ry0-717R8XMe5XwwN5elmjl_OVIJSw&s=10'}
              imgAlt="Rwandan youth in drawing contest"
              color="#ffffff"
              paths={['✏️  Gesture drawing', '🎨  Colour & tone study', '🖼️  Composition']}
              description="Draw and paint on a digital canvas. Learn colour, form, and composition through structured, beginner-friendly exercises."
              delay={0.1}
            />
            <DisciplineCard
              name="Graphic Design" img={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6onXecRLNIGg4NZdHw_fQMdC73sQ00rZ6dzNk63pEOA&s=10"}
              imgAlt="Students at computers learning digital skills"
              color="#ffffff"
              paths={['🔤  Typography basics', '📐  Layout & grid', '🪧  Poster design']}
              description="Learn layouts, typography, and visual communication. Create posters and graphic works through practical guided sessions."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* OUTCOME SECTION */}
      <section className="relative bg-[#0E1117]">
        <div className="px-20 pt-16 pb-0">
          <div className="max-w-6xl mx-auto">
            <div className="section-label">
              <div className="section-label-bar" />
              <span className="section-label-text">From Practice to the World</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ height: '520px' }}>

          <div className="relative overflow-hidden bg-[#0d1a12]">
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(14,17,23,0.94) 0%, rgba(14,17,23,0.2) 55%, transparent 100%)' }}
            />
            <div className="absolute top-5 left-6">
              <span className="text-[9px] font-bold tracking-wider px-2 py-1 rounded bg-[#2D6A4F] text-[#E1F5EE]">
                VISUAL ARTS
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
              <h3 className="font-display font-extrabold text-white mb-2.5 leading-[1.2]"
                style={{ fontSize: '22px' }}>
                A canvas session becomes a real artwork.
              </h3>
              {/* PARAGRAPH 4 — edited */}
              <p className="text-[12px] leading-relaxed text-white/62">
                Colour, composition, and form,  practised in the lab, applied in real life.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#1a1408]">
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(14,17,23,0.95) 0%, rgba(14,17,23,0.18) 65%, transparent 100%)' }}
            />
            <div className="absolute top-5 left-6">
              <span className="text-[9px] font-bold tracking-wider px-2 py-1 rounded bg-[#C8960C] text-[#412402]">
                MUSIC & DESIGN
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
              <h3 className="font-display font-extrabold text-white mb-2.5 leading-[1.2]"
                style={{ fontSize: '22px' }}>
                Digital practice becomes a real creative career.
              </h3>
              {/* PARAGRAPH 5 — edited */}
              <p className="text-[12px] leading-relaxed text-white/62">
                Every skill built on this platform is one a student can take forward independently.
              </p>
            </div>
          </div>

          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center w-80">
            <h2 className="font-display font-extrabold text-[#C8960C] leading-[1.2]"
              style={{ fontSize: '20px', textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>
              What you practise here,<br />you take into the world.
            </h2>
          </div>

          <div
            className="absolute top-0 bottom-0 left-1/2 w-px z-10 border-[#C8960C]/30"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-20 bg-[#111318]">
        <div className="max-w-6xl mx-auto">

          <FadeIn id="how-head" delay={0} className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-px h-5 bg-gold" />
              <span className="section-label-text">How It Works</span>
              <div className="w-px h-5 bg-gold" />
            </div>
            <h2 className="font-display font-extrabold text-white"
              style={{ fontSize: 'clamp(28px, 3vw, 44px)' }}>
              School computer to saved portfolio.<br />Four steps.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-4 gap-0.5">
            {[
              { n: '01', title: 'Register at your school', desc: 'Create an account and select your school from the verified list. Only participating schools are accepted.', color: '#D62828' },
              { n: '02', title: 'Choose your path', desc: 'Pick Music, Visual Arts, or Graphic Design. Music splits further into Guitar, Piano, or Voice & Singing.', color: '#C8960C' },
              { n: '03', title: 'Follow guided steps', desc: 'Every session has 5 structured steps in plain language. No teacher, no prior experience, no installation needed.', color: '#2D6A4F' },
              { n: '04', title: 'Save to your portfolio', desc: 'Your work accumulates session by session. Offline? It saves locally and syncs automatically when you reconnect.', color: '#378ADD' },
            ].map(({ n, title, desc, color }, i) => (
              <FadeIn key={n} id={`step-${i}`} delay={i * 0.1}
                className="p-8"
                style={{ background: '#161B25', borderTop: `3px solid ${color}` }}
              >
                <div className="font-display font-extrabold mb-5 leading-none text-white/5"
                  style={{ fontSize: '48px', letterSpacing: '-3px' }}>
                  {n}
                </div>
                <h3 className="font-display font-bold text-white text-base mb-3 leading-snug">{title}</h3>
                <p className="text-xs leading-relaxed text-white/50">{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-20 bg-[#F5F3EE]">
        <div className="max-w-6xl mx-auto">
          <FadeIn id="feat-head" delay={0} className="mb-14">
            <div className="section-label">
              <div className="section-label-bar" />
              <span className="section-label-text">Built for you at your school</span>
            </div>
            <h2 className="font-display font-extrabold text-[#0E1117]"
              style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
              Designed for how Rwandan schools actually work to help Creative Sector growth.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-3">
            <FeatureCard icon="📡" title="Offline-first" borderColor="#C8960C"
              description="Full access without internet. Work saves to the device and syncs automatically when connection returns." />
            <FeatureCard icon="💻" title="No installation" borderColor="#2D6A4F"
              description="Opens in any Chromium or Firefox browser on school computers. No setup, no downloads, no IT support needed." />
            <FeatureCard icon="👣" title="Step-by-step sessions" borderColor="#D62828"
              description="Every session has 5 guided steps in plain language. Built for students with no prior digital creative experience." />
            <FeatureCard icon="💼" title="Portfolio that grows" borderColor="#378ADD"
              description="Creative work accumulates across sessions. Nothing is lost between lab visits, even if you were offline." />
            <FeatureCard icon="🔒" title="School-verified access" borderColor="#C8960C"
              description="Registration restricted to verified participating schools, keeping the platform safe and purposeful." />
            <FeatureCard icon="🌍" title="Made for Rwanda" borderColor="#2D6A4F"
              description="Designed specifically for the infrastructure, context, and talented youth of rural Rwandan secondary schools." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-20 text-center relative overflow-hidden bg-[#0E1117]">
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-[#D62828]" />
          <div className="flex-1 bg-[#C8960C]" />
          <div className="flex-1 bg-[#2D6A4F]" />
        </div>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(200,150,12,0.07), transparent 70%)' }}
        />

        <FadeIn id="cta" delay={0} className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-white mb-4 leading-[1.1]"
            style={{ fontSize: 'clamp(30px, 4vw, 52px)' }}>
            Ready to start <span className="text-[#C8960C]">practising?</span>
          </h2>
          {/* PARAGRAPH 6 — edited */}
          <p className="text-[15px] leading-relaxed mb-10 text-white/55">
            Your school already has everything you need. Start building your creative skills today.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <a href="/register" className="btn-primary text-[15px] px-8 py-3.5">
              Create Your Account
            </a>
            <a href="/login" className="btn-ghost text-[15px] px-7 py-3.5">
              Log In →
            </a>
          </div>
          <p className="mt-5 text-[11px] tracking-wide text-white/20">
            For students in rwandan schools only.
          </p>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="px-20 pt-12 pb-8 bg-[#080A0E] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start flex-wrap gap-10 mb-10">

            <div className="max-w-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-[#C8960C] rounded-md flex items-center justify-center">
                  <span className="font-display font-extrabold text-xs text-[#0E1117]">DCIP</span>
                </div>
                <span className="font-display font-bold text-sm text-white">
                  Digital Creative Infrastructure Platform
                </span>
              </div>
              {/* PARAGRAPH 7 — edited */}
              <p className="text-xs leading-relaxed text-white/35">
                Digital  infrastructure for talented youth in rural Rwandan secondary schools.
                Improve your skills in Music, visual arts, and graphic design.
              </p>
            </div>

            <div className="flex gap-14">
              <div>
                <p className="text-[9px] font-semibold tracking-widest text-[#C8960C] mb-4">PLATFORM</p>
                <div className="flex flex-col gap-2.5">
                  {['About', 'Disciplines', 'How It Works', 'Register', 'Log In'].map((l) => (
                    <a key={l} href="#"
                      className="text-xs transition-colors text-white/40 hover:text-[#C8960C]">
                      {l}
                    </a>
                  ))}
                </div>
              </div>
              
            </div>
          </div>

          <div className="flex justify-between items-center flex-wrap gap-3 pt-6 border-t border-white/5">
            <span className="text-[10px] text-white/20">
              © 2025 DCIP By Chantal . All rights reserved.
            </span>
            <div className="flex gap-1">
              {['#D62828', '#C8960C', '#2D6A4F'].map((c) => (
                <div key={c} className="w-5 h-1 rounded-sm" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}