import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import { usePianoProgress } from '../../hooks/usePianoProgress'
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

function IntervalStep({ from, to, steps, result }: { from: string; to: string; steps: number; result?: string }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-sm">{from}</span>
      <div className="flex items-center gap-1">
        <div className="w-6 h-px bg-surface-border" />
        <span className="text-text-muted text-xs whitespace-nowrap">+{steps} half steps</span>
        <div className="w-6 h-px bg-surface-border" />
      </div>
      <span className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-sm">{to}</span>
      {result && <span className="text-text-muted text-xs">= {result}</span>}
    </div>
  )
}

export default function NotesBuildChordsPage() {
  const navigate = useNavigate()
  const { markStageVisited } = usePianoProgress()
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('piano', 'course2')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = () => {
      markStageVisited('piano-notes-chords')
      navigate('/piano/level-1')
    }
    if (score < 40) {
      setLowEngagement(true)
      setTimeout(proceed, 3000)
    } else {
      proceed()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/piano/understanding-the-piano')} className="hover:text-text-primary transition-colors">
            Piano
          </button>
          <span>/</span>
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">How Notes Build Chords</span>
        </div>

        <ProgressBar value={2} total={2} label="Course 2 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">How Notes Build Chords</h1>
        <p className="text-text-secondary text-sm mb-8">
          A chord is three or more notes played at the same time. Every chord is built from a simple mathematical pattern of half steps.
        </p>

        {/* Section 1: Half steps */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Half Steps</h2>
          <p className="text-text-secondary text-sm mb-3">
            A <span className="font-semibold">half step</span> is the distance between any two adjacent keys on the piano, white or black.
            Moving from C to C# is one half step. Moving from E to F is also one half step (there is no black key between them).
          </p>
          <div className="bg-[#F9F7F4] rounded-xl p-4">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Examples</p>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>C → C# = <span className="font-semibold text-text-primary">1 half step</span></p>
              <p>C → D = <span className="font-semibold text-text-primary">2 half steps</span></p>
              <p>C → E = <span className="font-semibold text-text-primary">4 half steps</span></p>
              <p>C → G = <span className="font-semibold text-text-primary">7 half steps</span></p>
            </div>
          </div>
        </div>

        {/* Section 2: Major chord */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Building a Major Chord</h2>
          <p className="text-text-secondary text-sm mb-4">
            A <span className="font-semibold">major chord</span> is built with this formula:
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
            <p className="text-text-primary font-semibold text-sm">
              Root + 4 half steps + 3 more half steps
            </p>
            <p className="text-text-muted text-xs mt-1">
              Positions: Root (1st), Major Third (3rd), Perfect Fifth (5th)
            </p>
          </div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Worked example: C major</p>
          <div className="space-y-3">
            <IntervalStep from="C" to="E" steps={4} result="major third" />
            <IntervalStep from="E" to="G" steps={3} result="perfect fifth" />
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-text-secondary text-sm">C major =</span>
            {['C', 'E', 'G'].map(n => (
              <span key={n} className="bg-primary text-white font-bold px-3 py-1.5 rounded-lg text-sm">{n}</span>
            ))}
          </div>
        </div>

        {/* Section 3: Minor chord */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Building a Minor Chord</h2>
          <p className="text-text-secondary text-sm mb-4">
            A <span className="font-semibold">minor chord</span> swaps the order of the first two intervals: it starts with a smaller step, giving it a darker sound.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
            <p className="text-text-primary font-semibold text-sm">
              Root + 3 half steps + 4 more half steps
            </p>
            <p className="text-text-muted text-xs mt-1">
              Positions: Root (1st), Minor Third (3rd), Perfect Fifth (5th)
            </p>
          </div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Worked example: A minor</p>
          <div className="space-y-3">
            <IntervalStep from="A" to="C" steps={3} result="minor third" />
            <IntervalStep from="C" to="E" steps={4} result="perfect fifth" />
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-text-secondary text-sm">A minor =</span>
            {['A', 'C', 'E'].map(n => (
              <span key={n} className="bg-text-primary text-white font-bold px-3 py-1.5 rounded-lg text-sm">{n}</span>
            ))}
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-8">
          <div className="bg-[#F9F7F4] px-6 py-3 border-b border-surface-border">
            <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Chord Formula Summary</p>
          </div>
          <div className="divide-y divide-surface-border">
            <div className="flex px-6 py-4 gap-6">
              <div className="w-24 flex-shrink-0">
                <p className="text-text-primary font-semibold text-sm">Major</p>
                <p className="text-text-muted text-xs">bright sound</p>
              </div>
              <p className="text-text-secondary text-sm">
                Root, Root + 4 half steps, Root + 7 half steps
              </p>
            </div>
            <div className="flex px-6 py-4 gap-6">
              <div className="w-24 flex-shrink-0">
                <p className="text-text-primary font-semibold text-sm">Minor</p>
                <p className="text-text-muted text-xs">dark sound</p>
              </div>
              <p className="text-text-secondary text-sm">
                Root, Root + 3 half steps, Root + 7 half steps
              </p>
            </div>
          </div>
        </div>

        {/* Continue */}
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
