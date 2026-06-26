import {} from 'react'
import { useNavigate } from 'react-router-dom'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsProgress } from '../../hooks/useVisualArtsProgress'

export default function VirtualCanvasPage() {
  const navigate = useNavigate()
  const { markComplete } = useVisualArtsProgress()

  const handleContinue = async () => {
    await markComplete('va-virtual-canvas')
    navigate('/visual-arts/course-1')
  }

  const sidebarFooter = (
    <div className="space-y-5">
      <div>
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-2">Welcome</p>
        <h2 className="text-text-primary font-bold text-base mb-2">Visual Arts</h2>
        <p className="text-text-secondary text-xs leading-relaxed">
          Visual Arts is the practice of creating work that communicates ideas, emotions, and observations through
          shape, colour, line, and composition. It is one of the oldest and most universal human skills, and on
          this platform, you will develop it step by step using a digital canvas.
        </p>
      </div>

      <div>
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-2">What you will learn</p>
        <ul className="space-y-2">
          {[
            { stage: 'Course 1', desc: 'Lines, shapes, and tools. You will learn how lines and curves combine to form shapes and how to control the drawing tools on your canvas.' },
            { stage: 'Course 2', desc: 'Colour and light. You will explore the colour wheel, warm and cool colours, and how shading creates the illusion of depth and volume.' },
            { stage: 'Level 1', desc: 'Shapes, tools, and basic composition. You will practise organising elements on a canvas with purpose and intention.' },
            { stage: 'Level 2', desc: 'Colour theory and shading. You will apply what you learned about colour and light directly in your own drawings.' },
            { stage: 'Level 3', desc: 'Advanced techniques including layering, texture, and building a consistent personal visual style.' },
            { stage: 'Sharpening', desc: 'Refinement exercises that help you consolidate everything you have practised across all three levels.' },
            { stage: 'Production', desc: 'Create one complete original composition as your capstone work. This is what earns your Advanced badge.' },
          ].map(({ stage, desc }) => (
            <li key={stage} className="flex gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-text-secondary leading-snug">
                <span className="font-semibold text-text-primary">{stage}: </span>{desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-2">Real-world application</p>
        <p className="text-text-secondary text-xs leading-relaxed">
          The skills you build here transfer directly into illustration, graphic communication, architecture,
          product design, and fine art. Learning to notice shape, proportion, and colour in the world
          around you will change how you think and create, both digitally and on paper.
        </p>
      </div>

      <div className="bg-[#F9F7F4] border border-surface-border rounded-xl p-4">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-1.5">Right now</p>
        <p className="text-text-secondary text-xs leading-relaxed">
          This is your digital canvas. Explore the tools on the right. Try drawing with the pencil, use the
          shapes, experiment with colour. There is no task here and no right answer. This is simply your space
          to get comfortable before the course begins.
        </p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => navigate('/disciplines')}
            className="inline-flex items-center gap-1 text-text-secondary text-xs hover:text-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs text-text-muted">Visual Arts / Virtual Canvas</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Continue to Door To Know Visual Arts
        </button>
      </div>

      <VisualArtsModule step={5} sidebarFooter={sidebarFooter} />
    </div>
  )
}
