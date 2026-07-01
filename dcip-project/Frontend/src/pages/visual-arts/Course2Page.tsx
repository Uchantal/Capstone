import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import { useVisualArtsProgress } from '../../hooks/useVisualArtsProgress'
import { useReadingEngagement } from '../../hooks/useReadingEngagement'
import AskAIHint from '../../components/ai/AskAIHint'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

const WHEEL_COLOURS = [
  { name: 'Red',    value: '#D62828', type: 'Primary' },
  { name: 'Orange', value: '#F97316', type: 'Secondary' },
  { name: 'Yellow', value: '#F59E0B', type: 'Primary' },
  { name: 'Green',  value: '#2D6A4F', type: 'Secondary' },
  { name: 'Blue',   value: '#3B82F6', type: 'Primary' },
  { name: 'Purple', value: '#9333EA', type: 'Secondary' },
]

const WARM_COLOURS = [
  { name: 'Red',    value: '#D62828' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#F59E0B' },
]

const COOL_COLOURS = [
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Green',  value: '#2D6A4F' },
  { name: 'Purple', value: '#9333EA' },
]

function ColourSwatch({ name, value, label }: { name: string; value: string; label?: string }) {
  return (
    <div className="text-center">
      <div
        className="w-10 h-10 rounded-full mx-auto mb-1 border border-surface-border"
        style={{ backgroundColor: value }}
      />
      <p className="text-text-primary text-xs font-semibold">{name}</p>
      {label && <p className="text-[9px] text-text-muted">{label}</p>}
    </div>
  )
}

export default function Course2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, markComplete } = useVisualArtsProgress()
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('visual-arts', 'course2')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = async () => {
      await markComplete('va-course-2')
      navigate('/visual-arts/level-1')
    }
    if (score < 40) {
      setLowEngagement(true)
      setTimeout(proceed, 3000)
    } else {
      await proceed()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <MainLayout>
      <AskAIHint discipline="Visual Arts" context="Visual Arts Course 2" />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/visual-arts/virtual-canvas')} className="hover:text-text-primary transition-colors">
            Visual Arts
          </button>
          <span>/</span>
          <span>Door To Know Visual Arts</span>
          <span>/</span>
          <span className="text-text-primary">Colour and Light</span>
        </div>

        <ProgressBar value={2} total={2} label="Course 2 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Colour and Light</h1>
        <p className="text-text-secondary text-sm mb-8">
          Colour and light are inseparable in drawing. Understanding both gives you control over depth, mood, and realism.
        </p>

        {/* Card A: The Colour Wheel */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The Colour Wheel</h2>
          <p className="text-text-secondary text-sm mb-5">
            The colour wheel organises colours in a circle by their relationship to one another.
            There are three <span className="font-semibold text-text-primary">primary colours</span>: red, yellow, and blue.
            These cannot be made by mixing other colours. Mixing any two primaries produces a
            <span className="font-semibold text-text-primary"> secondary colour</span>: red + yellow = orange,
            yellow + blue = green, blue + red = purple.
          </p>
          <div className="flex gap-5 flex-wrap">
            {WHEEL_COLOURS.map(c => (
              <ColourSwatch
                key={c.name}
                name={c.name}
                value={c.value}
                label={c.type}
              />
            ))}
          </div>
          <p className="text-text-muted text-xs mt-4">
            The colours above are shown in wheel order: Red, Orange, Yellow, Green, Blue, Purple.
            Bordered labels mark primary colours.
          </p>
        </div>

        {/* Card B: Complementary Colours */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Complementary Colours</h2>
          <p className="text-text-secondary text-sm mb-5">
            Colours directly opposite each other on the wheel are called complementary pairs. Placed
            side by side, they create strong visual contrast, each making the other appear more vivid.
            Artists use this deliberately to draw the eye and create energy in a composition.
          </p>
          <div className="flex gap-8 flex-wrap">
            {[
              { a: { name: 'Red',    value: '#D62828' }, b: { name: 'Green',  value: '#2D6A4F' } },
              { a: { name: 'Blue',   value: '#3B82F6' }, b: { name: 'Orange', value: '#F97316' } },
              { a: { name: 'Yellow', value: '#F59E0B' }, b: { name: 'Purple', value: '#9333EA' } },
            ].map(pair => (
              <div key={pair.a.name} className="flex items-center gap-3">
                <div className="flex">
                  <div className="w-10 h-10 rounded-l-full border border-surface-border" style={{ backgroundColor: pair.a.value }} />
                  <div className="w-10 h-10 rounded-r-full border border-surface-border border-l-0" style={{ backgroundColor: pair.b.value }} />
                </div>
                <p className="text-text-secondary text-xs">{pair.a.name} + {pair.b.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card C: Warm and Cool Colours */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Warm and Cool Colours</h2>
          <p className="text-text-secondary text-sm mb-5">
            Colours can be grouped into warm and cool families based on the feeling they create.
            Warm colours (reds, oranges, yellows) feel close, energetic, and inviting.
            Cool colours (blues, greens, purples) feel distant, calm, and peaceful.
            This is the same distinction you encountered in your first session when choosing a colour palette.
            Now you have the language to explain it.
          </p>
          <div className="flex gap-10 flex-wrap">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Warm</p>
              <div className="flex gap-3">
                {WARM_COLOURS.map(c => <ColourSwatch key={c.name} name={c.name} value={c.value} />)}
              </div>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Cool</p>
              <div className="flex gap-3">
                {COOL_COLOURS.map(c => <ColourSwatch key={c.name} name={c.name} value={c.value} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Card D: Light and Shading */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Light and Shading: The Sphere Exercise</h2>
          <p className="text-text-secondary text-sm mb-4">
            Shading is what transforms a flat shape into something that looks three-dimensional.
            Every artist practises shading on a simple sphere before anything else, because a sphere
            shows all the fundamental zones of light in one compact form.
          </p>
          <p className="text-text-secondary text-sm mb-5">
            There are five zones to learn. Each zone corresponds to how much light reaches that part of the surface:
          </p>

          <div className="flex gap-8 flex-wrap items-start mb-6">
            {/* Sphere diagram */}
            <svg
              viewBox="0 0 360 240"
              className="w-72 flex-shrink-0"
              aria-label="Sphere shading diagram showing five light zones"
            >
              {/* Cast shadow beneath sphere */}
              <ellipse cx="130" cy="218" rx="78" ry="16" fill="#374151" opacity={0.3} />

              <defs>
                <clipPath id="va-sphere-clip">
                  <circle cx="130" cy="112" r="86" />
                </clipPath>
              </defs>

              {/* Base midtone */}
              <circle cx="130" cy="112" r="86" fill="#9CA3AF" />

              {/* Core shadow band */}
              <rect x="148" y="26" width="52" height="172" fill="#4B5563" clipPath="url(#va-sphere-clip)" />

              {/* Reflected light band */}
              <rect x="188" y="26" width="36" height="172" fill="#6B7280" clipPath="url(#va-sphere-clip)" />

              {/* Highlight */}
              <circle cx="95" cy="76" r="26" fill="white" opacity={0.82} clipPath="url(#va-sphere-clip)" />

              {/* Sphere outline */}
              <circle cx="130" cy="112" r="86" fill="none" stroke="#9CA3AF" strokeWidth="1" />

              {/* Label lines and text */}
              <line x1="95"  y1="76"  x2="240" y2="46"  stroke="#D1D5DB" strokeWidth="1" />
              <text x="245" y="50"  fontSize="10" fontWeight="600" fill="#1A1A1A">Highlight</text>

              <line x1="128" y1="100" x2="240" y2="90"  stroke="#D1D5DB" strokeWidth="1" />
              <text x="245" y="94"  fontSize="10" fontWeight="600" fill="#1A1A1A">Midtone</text>

              <line x1="166" y1="135" x2="240" y2="138" stroke="#D1D5DB" strokeWidth="1" />
              <text x="245" y="142" fontSize="10" fontWeight="600" fill="#1A1A1A">Core Shadow</text>

              <line x1="206" y1="162" x2="240" y2="182" stroke="#D1D5DB" strokeWidth="1" />
              <text x="245" y="186" fontSize="10" fontWeight="600" fill="#1A1A1A">Reflected Light</text>

              <line x1="130" y1="218" x2="240" y2="224" stroke="#D1D5DB" strokeWidth="1" />
              <text x="245" y="228" fontSize="10" fontWeight="600" fill="#1A1A1A">Cast Shadow</text>
            </svg>

            {/* Zone descriptions */}
            <div className="flex-1 min-w-56 space-y-3">
              {[
                { name: 'Highlight',       desc: 'The brightest point, directly facing the light source. Often left white or very light.' },
                { name: 'Midtone',         desc: 'The general surface tone where light falls at an angle, neither bright nor dark.' },
                { name: 'Core Shadow',     desc: 'The darkest band, where the surface curves away from the light and receives none of it.' },
                { name: 'Reflected Light', desc: 'A soft lighter edge at the far shadow side, caused by light bouncing off nearby surfaces.' },
                { name: 'Cast Shadow',     desc: 'The shadow the object throws onto the surface below and behind it.' },
              ].map(z => (
                <div key={z.name}>
                  <p className="text-text-primary font-semibold text-xs">{z.name}</p>
                  <p className="text-text-secondary text-xs leading-relaxed">{z.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-text-primary text-sm font-semibold">
              In Level 2, you will practise this shading technique on your own circle.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {lowEngagement && (
            <p className="text-sm text-amber-600">
              Take your time with this content. Your engagement score for this page was low.
            </p>
          )}
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Start Level 1
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
