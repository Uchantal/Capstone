import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import { useGDProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useGDProgress'

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

export default function GDCourse2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { completedStages, loading, markComplete } = useGDProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('gd-course-1')) {
      navigate(STAGE_PATHS['gd-course-1'], {
        replace: true,
        state: { lockedMessage: `Complete ${STAGE_NAMES['gd-course-1']} first.` },
      })
    }
  }, [loading, completedStages, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const handleContinue = async () => {
    await markComplete('gd-course-2')
    navigate('/graphic-design/level-1')
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/graphic-design/virtual-studio')} className="hover:text-text-primary transition-colors">
            Graphic Design
          </button>
          <span>/</span>
          <span>Door To Know Graphic Design</span>
          <span>/</span>
          <span className="text-text-primary">Colour and Composition</span>
        </div>

        <ProgressBar value={2} total={2} label="Course 2 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Colour and Composition</h1>
        <p className="text-text-secondary text-sm mb-8">
          Colour sets the mood. Composition controls where the eye travels. Together, they determine whether a design communicates or confuses.
        </p>

        {/* Card A: Colour and Contrast */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Colour and Contrast</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Text must contrast clearly against its background to be readable. A dark background demands light text.
            A light background demands dark text. Low contrast does not just look weak, it makes your message
            inaccessible to anyone who is not reading in ideal conditions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[#1A1A1A] px-5 py-4">
                <p className="text-[#C8960C] font-bold text-lg leading-tight">CREATIVE NIGHT</p>
                <p className="text-gray-300 text-sm mt-1">Friday 7 December</p>
              </div>
              <div className="bg-[#F9F7F4] px-4 py-2 border-t border-border">
                <p className="text-green-600 text-xs font-medium">Strong contrast: easy to read</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[#555555] px-5 py-4">
                <p className="text-[#888888] font-bold text-lg leading-tight">CREATIVE NIGHT</p>
                <p className="text-[#666666] text-sm mt-1">Friday 7 December</p>
              </div>
              <div className="bg-[#F9F7F4] px-4 py-2 border-t border-border">
                <p className="text-accent text-xs font-medium">Weak contrast: hard to read</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Warm and Cool Colour Moods */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Warm and Cool Colour Moods</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Colours carry emotional weight that affects how a viewer feels before they read a single word.
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Warm colours</p>
              <div className="flex gap-2 mb-3">
                {['#D62828', '#E86829', '#F4C430'].map(c => (
                  <div key={c} className="w-8 h-8 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Red, orange, yellow feel energetic and urgent. Good for event announcements, sales, or calls to action.
              </p>
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Cool colours</p>
              <div className="flex gap-2 mb-3">
                {['#2D6A4F', '#1e3a5f', '#6B48B7'].map(c => (
                  <div key={c} className="w-8 h-8 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Blue, green, purple feel calm and trustworthy. Good for formal announcements, invitations, and informational designs.
              </p>
            </div>
          </div>
        </div>

        {/* Card C: Whitespace and Balance */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Whitespace and Balance</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Empty space is not wasted space. Whitespace gives a design room to breathe and directs attention
            to what matters. Cluttered designs overwhelm the viewer. Balanced designs guide the eye clearly.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[#1A1A1A] px-4 py-3 space-y-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-2 bg-gray-600 rounded" style={{ width: `${70 + Math.sin(i) * 20}%` }} />
                ))}
              </div>
              <div className="bg-[#F9F7F4] px-4 py-2 border-t border-border">
                <p className="text-accent text-xs font-medium">Cluttered: too many elements</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[#1A1A1A] px-4 py-5 space-y-4">
                <div className="h-3 bg-[#C8960C] rounded w-3/4" />
                <div className="h-2 bg-gray-500 rounded w-1/2" />
              </div>
              <div className="bg-[#F9F7F4] px-4 py-2 border-t border-border">
                <p className="text-green-600 text-xs font-medium">Balanced: space gives the title room</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card D: Putting It Together */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Putting It Together</h2>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold text-sm w-6 flex-shrink-0">1</span>
              <p className="text-text-secondary text-sm leading-relaxed">
                In Level 1, you will design a poster for a real school announcement using hierarchy and alignment.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold text-sm w-6 flex-shrink-0">2</span>
              <p className="text-text-secondary text-sm leading-relaxed">
                In Level 2, you will redesign the same poster for a different audience using colour and mood.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold text-sm w-6 flex-shrink-0">3</span>
              <p className="text-text-secondary text-sm leading-relaxed">
                In Level 3, you will create a two-piece campaign: both versions must look like they belong to the same event.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Level 1
          </button>
        </div>
      </div>
    </div>
  )
}
