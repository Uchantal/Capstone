import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import { useGDProgress } from '../../hooks/useGDProgress'
import { saveGDLevelPoster } from '../../services/api'
import { useReadingEngagement } from '../../hooks/useReadingEngagement'

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

export default function GDCourse1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { markComplete } = useGDProgress()
  const [planningText, setPlanningText] = useState('')
  const [saving, setSaving] = useState(false)
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('graphic-design', 'course1')

  const canContinue = planningText.trim().length > 0

  const handleContinue = async () => {
    if (!canContinue || saving) return
    setSaving(true)
    try {
      await saveGDLevelPoster({ level: 0, reasoning: planningText.trim() })
    } catch {
      // Best-effort
    }
    const score = await computeAndSave()
    const proceed = async () => {
      await markComplete('gd-course-1')
      navigate('/graphic-design/course-2')
    }
    if (score < 40) {
      setLowEngagement(true)
      setSaving(false)
      setTimeout(proceed, 3000)
    } else {
      await proceed()
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

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
          <span className="text-text-primary">Typography and Layout</span>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Typography and Layout</h1>
        <p className="text-text-secondary text-sm mb-8">
          How text looks and where it sits communicates a message before anyone reads a single word.
        </p>

        {/* Card 1: Why Typography Matters */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Why Typography Matters</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Typography is the art of arranging text so it communicates clearly and feels right for the context.
            Long before someone reads what a poster says, they see how it looks. A bold title tells the viewer
            something important. A small subtitle tells them this is supporting information. The eye reads hierarchy
            even before it reads words.
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            The most important text on your poster should be the largest and boldest element on the page. Supporting
            text should be clearly smaller. This is called visual hierarchy, and it is the first thing every graphic
            designer learns.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col gap-2">
              <div className="text-[#C8960C] font-bold text-xl leading-tight">CREATIVE NIGHT</div>
              <div className="text-gray-400 text-xs">Creative Event, School Main Hall</div>
              <p className="text-primary text-xs mt-1">Clear hierarchy: title stands out</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col gap-2">
              <div className="text-[#C8960C] font-medium text-sm leading-tight">Creative Night</div>
              <div className="text-gray-400 text-sm">Creative Event, School Main Hall</div>
              <p className="text-accent text-xs mt-1">Weak hierarchy: title and detail look similar</p>
            </div>
          </div>
        </div>

        {/* Card 2: Alignment and Placement */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Alignment and Placement</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Where text sits on a page tells a viewer how to feel about a design. Left alignment feels editorial
            and formal, like a newspaper. Centre alignment feels symmetrical and important, often used for invitations
            and titles. Right alignment is less common but can feel dynamic and modern.
          </p>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Left', lines: ['left', 'left-shorter', 'left-shortest'], desc: 'Formal, editorial' },
              { label: 'Centre', lines: ['center-med', 'center', 'center-short'], desc: 'Symmetrical, ceremonial' },
              { label: 'Right', lines: ['right', 'right-shorter', 'right-short'], desc: 'Dynamic, modern' },
            ].map(({ label, lines, desc }) => (
              <div key={label} className="flex-1 min-w-32 bg-[#F9F7F4] border border-surface-border rounded-xl p-4">
                <div className="flex flex-col gap-1.5 mb-2">
                  {lines.map((l, i) => {
                    const w = i === 0 ? 'w-full' : i === 1 ? 'w-3/4' : 'w-1/2'
                    const align = label === 'Centre' ? 'mx-auto' : label === 'Right' ? 'ml-auto' : ''
                    return (
                      <div key={l} className={`h-2 bg-text-primary/30 rounded ${w} ${align}`} />
                    )
                  })}
                </div>
                <p className="text-text-primary font-semibold text-xs">{label}</p>
                <p className="text-text-muted text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Rule of Thirds */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The Rule of Thirds</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Divide your design into a 3 by 3 grid. Placing important elements along the grid lines or at the
            intersections creates a more balanced composition than placing everything dead centre or in a corner.
            The human eye naturally moves to these intersection points first.
          </p>
          <div className="flex gap-6 items-start flex-wrap">
            <svg viewBox="0 0 210 140" className="w-52 h-36 flex-shrink-0" aria-label="Rule of thirds grid diagram">
              <rect x="2" y="2" width="206" height="136" rx="4" fill="#1A1A1A" stroke="#E8E4DC" strokeWidth="1.5" />
              {/* Grid lines */}
              <line x1="70" y1="2" x2="70" y2="138" stroke="#C8960C" strokeWidth="1" opacity="0.5" />
              <line x1="140" y1="2" x2="140" y2="138" stroke="#C8960C" strokeWidth="1" opacity="0.5" />
              <line x1="2" y1="47" x2="208" y2="47" stroke="#C8960C" strokeWidth="1" opacity="0.5" />
              <line x1="2" y1="94" x2="208" y2="94" stroke="#C8960C" strokeWidth="1" opacity="0.5" />
              {/* Intersection dot */}
              <circle cx="70" cy="47" r="5" fill="#C8960C" />
              {/* Label */}
              <text x="78" y="38" fontSize="8" fill="#C8960C" fontWeight="bold">Strong placement</text>
              <line x1="70" y1="47" x2="78" y2="40" stroke="#C8960C" strokeWidth="0.8" />
            </svg>
            <div className="flex-1 min-w-48">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">How to apply it</p>
              <div className="space-y-1.5 text-text-secondary text-sm leading-relaxed">
                <p>Place your title along the top horizontal line, not jammed in the corner.</p>
                <p>Let whitespace occupy at least one third of the design.</p>
                <p>Avoid placing everything in the exact centre of the poster.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Sketch Before You Build */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Sketch Before You Build</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            Professional designers plan on paper before opening any software. Where will the title go? What shape
            will the message take? What is the one thing a viewer should notice first? Taking sixty seconds to think
            through your layout saves many minutes of redesigning later.
          </p>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Write your plan in the field below. Where will your title sit, and what is the one thing you want a
            viewer to notice first? This is not graded, but you must write something before continuing. It will
            be shown to you again at the start of Level 1 as a reminder of your own stated plan.
          </p>
          <label className="text-text-primary text-sm font-semibold block mb-2">
            Your design plan
          </label>
          <textarea
            value={planningText}
            onChange={e => setPlanningText(e.target.value)}
            placeholder="For example: My title will sit at the top third of the poster in large bold text. The one thing I want people to notice first is the event name."
            rows={4}
            className="w-full border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
          />
          {!canContinue && (
            <p className="text-text-muted text-xs mt-2">Write at least one sentence to continue.</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {lowEngagement && (
            <p className="text-sm text-amber-600">
              Take your time with this content. Your engagement score for this page was low.
            </p>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue to Colour and Composition'}
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
