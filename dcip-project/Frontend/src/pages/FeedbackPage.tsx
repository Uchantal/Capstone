import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { submitFeedback } from '../services/api'

const FEEDBACK_TYPES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Discipline Feedback',
  'Other',
]

const DISCIPLINES = [
  'All disciplines',
  'Music (Guitar)',
  'Music (Piano)',
  'Voice and Singing',
  'Visual Arts',
  'Graphic Design',
]

type Status = 'idle' | 'success' | 'error'

export default function FeedbackPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [feedbackType, setFeedbackType] = useState('General Feedback')
  const [discipline, setDiscipline] = useState('')
  const [message, setMessage] = useState('')
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [screenshotName, setScreenshotName] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisciplineFeedback = feedbackType === 'Discipline Feedback'
  const canSubmit = message.trim().length > 0 && !submitting

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshotData(reader.result as string)
      setScreenshotName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const removeScreenshot = () => {
    setScreenshotData(null)
    setScreenshotName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await submitFeedback({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        feedbackType,
        discipline: isDisciplineFeedback && discipline ? discipline : undefined,
        message: message.trim(),
        screenshotData: screenshotData ?? undefined,
      })
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setFeedbackType('General Feedback')
    setDiscipline('')
    setMessage('')
    setScreenshotData(null)
    setScreenshotName(null)
    setStatus('idle')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F4]">
      <nav className="bg-white border-b border-[#E8E4DC] h-16 flex items-center px-6 md:px-8 lg:px-16 justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">DCIP</span>
          </div>
          <span className="font-bold text-sm text-[#1A1A1A] hidden lg:inline">
            Digital Creative Infrastructure Platform
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-lg border border-primary text-primary bg-white hover:bg-primary/10 transition-colors">
            Log In
          </Link>
          <Link to="/register" className="text-sm font-bold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
            Register
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-[#1A1A1A] font-bold text-3xl">Send Us Feedback</h1>
          <p className="text-[#555555] text-base mt-2">
            Your feedback helps improve the platform for every student. Share what is working well and what could be better.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[#1A1A1A] font-bold text-xl mb-2">Thank you for your feedback.</h2>
            <p className="text-[#555555] text-sm mb-6">
              We have received your message and will use it to improve the platform.
            </p>
            <button
              onClick={handleReset}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
            >
              Send another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-[#E8E4DC] rounded-xl p-8 space-y-6">
            <div>
              <label className="text-[#1A1A1A] text-sm font-medium block mb-1.5">Your Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full border border-[#E8E4DC] rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[#1A1A1A] text-sm font-medium block mb-1.5">Your Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com (optional)"
                className="w-full border border-[#E8E4DC] rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[#1A1A1A] text-sm font-medium block mb-2">Feedback Type</label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      feedbackType === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-[#E8E4DC] text-[#1A1A1A] hover:border-primary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {isDisciplineFeedback && (
              <div>
                <label className="text-[#1A1A1A] text-sm font-medium block mb-1.5">Which discipline does this relate to?</label>
                <select
                  value={discipline}
                  onChange={e => setDiscipline(e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Select a discipline...</option>
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[#1A1A1A] text-sm font-medium block mb-1.5">Your Feedback</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                placeholder="Tell us what you think..."
                className="w-full border border-[#E8E4DC] rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="text-[#1A1A1A] text-sm font-medium block mb-1.5">
                Attach Screenshot (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
              />
              {!screenshotData ? (
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center w-full border border-dashed border-[#E8E4DC] rounded-lg px-4 py-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="text-center">
                    <p className="text-[#555555] text-sm">Click to attach an image or screenshot</p>
                    <p className="text-[#888888] text-xs mt-1">PNG, JPG, WEBP up to 5 MB</p>
                  </div>
                </label>
              ) : (
                <div className="border border-[#E8E4DC] rounded-lg p-3 flex items-start gap-3">
                  <img
                    src={screenshotData}
                    alt="Screenshot preview"
                    loading="lazy"
                    className="w-24 h-16 object-cover rounded border border-[#E8E4DC] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1A1A1A] text-sm font-medium truncate">{screenshotName}</p>
                    <p className="text-[#888888] text-xs mt-0.5">Ready to attach</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="text-[#888888] hover:text-accent text-xs font-medium flex-shrink-0 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {status === 'error' && (
              <p className="text-accent text-sm">
                Something went wrong. Please try again or email us directly at{' '}
                <a href="mailto:uwimachantal025@gmail.com" className="underline">uwimachantal025@gmail.com</a>
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
