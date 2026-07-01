import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import AskAIHint from '../../components/ai/AskAIHint'

export default function GDOverviewPage() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <AskAIHint discipline="Graphic Design" context="Graphic Design Overview" />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <span className="text-text-primary">Graphic Design</span>
          <span>/</span>
          <span>Welcome</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Welcome to Graphic Design</h1>
        <p className="text-text-secondary text-sm mb-8">
          Graphic design is about communicating through visual layout, type, and colour.
          On this platform you will design real formats that people use every day.
        </p>

        {/* Card A: What you will design */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">What You Will Design</h2>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            You will work with real design formats used in schools, communities, and professional settings.
            Each format has its own rules, proportions, and purpose.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Posters',        desc: 'A4 and A5 formats for events, announcements, and campaigns' },
              { label: 'Social Media',   desc: 'Instagram posts and stories formatted for digital sharing' },
              { label: 'Digital Covers', desc: 'Facebook covers and wide-format banners for online platforms' },
            ].map(item => (
              <div key={item.label} className="bg-[#F9F7F4] rounded-xl p-3">
                <p className="text-text-primary font-semibold text-sm mb-1">{item.label}</p>
                <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: The tools */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The Tools You Will Use</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Layout and Typography</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Place and size headings, body text, and contact blocks. Control font size, weight,
                and alignment to create clear visual hierarchy.
              </p>
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Shapes and Colour</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Add rectangles, circles, and decorative shapes to structure your layout.
                Choose background and element colours that contrast and communicate the right mood.
              </p>
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Canvas Formats</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Each design starts with a format selection. The canvas resizes to match the real-world
                dimensions of the format you choose, so your design is correctly proportioned from the start.
              </p>
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm mb-2">Images</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Upload photos or images and position them in your layout.
                Combine images with text and shapes to build complete designs.
              </p>
            </div>
          </div>
        </div>

        {/* Card C: Your journey */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Your Learning Journey</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Explore the Canvas',   desc: 'Open the design canvas, choose a format, and try the tools with no pressure.' },
              { step: '2', title: 'Two Foundation Courses', desc: 'Learn typography and layout, then colour and composition, before you design anything assessed.' },
              { step: '3', title: 'Three Levels',          desc: 'Each level has a Learn stage, a Practise stage, and a Demonstrate stage with a design brief to complete.' },
              { step: '4', title: 'Sharpening and Production', desc: 'Refine your skills and produce a final portfolio-quality piece to close out the discipline.' },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start">
                <span className="text-primary font-bold text-sm w-5 flex-shrink-0">{item.step}</span>
                <div>
                  <p className="text-text-primary font-semibold text-sm">{item.title}</p>
                  <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/graphic-design/virtual-studio')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Enter the Graphic Design Canvas
          </button>
        </div>

      </div>
    </MainLayout>
  )
}
