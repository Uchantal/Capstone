import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import PosterSurface, { DEFAULT_POSTER, PosterState } from '../../components/graphic-design/PosterSurface'
import { useGDProgress, STAGE_PATHS, STAGE_NAMES } from '../../hooks/useGDProgress'

const QUICK_REF = [
  {
    heading: 'Text Alignment',
    items: [
      { name: 'Left', desc: 'Formal and editorial. Good for information-heavy designs.' },
      { name: 'Centre', desc: 'Symmetrical and ceremonial. Good for events and invitations.' },
      { name: 'Right', desc: 'Dynamic and modern. Use deliberately, not by default.' },
    ],
  },
  {
    heading: 'Rule of Thirds Reminder',
    items: [
      { name: 'Grid', desc: 'Divide your poster into a 3 by 3 grid.' },
      { name: 'Intersections', desc: 'Place your most important element at or near a grid intersection, not dead centre.' },
      { name: 'Whitespace', desc: 'Leave at least one third of the space empty. It gives the title room to breathe.' },
    ],
  },
  {
    heading: 'Contrast Reminder',
    items: [
      { name: 'Dark on light', desc: 'Dark text on a light background is always readable.' },
      { name: 'Light on dark', desc: 'Light text on a dark background works when contrast is high.' },
      { name: 'Avoid similar tones', desc: 'Grey text on a dark grey background fails the contrast test.' },
    ],
  },
]

export default function GDSharpeningPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [poster, setPoster] = useState<PosterState>(DEFAULT_POSTER)
  const { completedStages, loading, markComplete } = useGDProgress()

  useEffect(() => {
    if (loading) return
    if (!completedStages.includes('gd-level-3')) {
      navigate(STAGE_PATHS['gd-level-3'], {
        replace: true,
        state: { lockedMessage: `Complete ${STAGE_NAMES['gd-level-3']} first.` },
      })
    }
  }, [loading, completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (completedStages.includes('gd-level-3')) {
      markComplete('gd-sharpening')
    }
  }, [loading, completedStages, markComplete])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
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

        <h1 className="text-text-primary font-bold text-2xl mb-1">Sharpening Myself</h1>
        <p className="text-text-secondary text-sm mb-6">
          Practice freely. Use everything you have learned. There is no pass or fail here, this is where you build confidence.
        </p>

        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <PosterSurface value={poster} onChange={setPoster} canvasRef={canvasRef} showDrawLayer />
        </div>

        <div className="space-y-4 mb-8">
          {QUICK_REF.map(section => (
            <div key={section.heading} className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
                <p className="text-text-muted text-xs uppercase tracking-wide font-medium">{section.heading}</p>
              </div>
              <div className="divide-y divide-border">
                {section.items.map(item => (
                  <div key={item.name} className="flex px-5 py-3 gap-3">
                    <p className="text-text-primary font-semibold text-xs w-36 flex-shrink-0">{item.name}</p>
                    <p className="text-text-secondary text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/graphic-design/production')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready. Continue to Production
          </button>
        </div>
      </div>
    </div>
  )
}
