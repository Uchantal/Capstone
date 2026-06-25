import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'
import Footer from '../components/Footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setSubmitted(true)
    } catch {
      setError('Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0">
              <span className="text-white font-bold text-sm">DC</span>
            </Link>
            <span className="text-text-primary font-semibold text-sm">Digital Creative Platform</span>
          </div>

          {submitted ? (
            /* ── Success state ── */
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-text-primary font-bold text-2xl mb-1">Check your email</h1>
              <p className="text-text-secondary text-sm mb-6">
                If an account exists for{' '}
                <span className="text-text-primary font-medium">{email}</span>,
                a password reset link has been sent. The link expires in 1 hour.
              </p>

              <div className="bg-surface-warm border border-surface-border rounded-lg px-4 py-3 mb-6">
                <p className="text-text-secondary text-sm">
                  Didn't receive anything? Check your spam folder or contact your school supervisor for assistance.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <div>
              <h1 className="text-text-primary font-bold text-2xl mb-1">Reset your password</h1>
              <p className="text-text-secondary text-sm mb-8">
                Enter the email address linked to your account and we'll send reset instructions.{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Back to login
                </Link>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="text-text-primary text-sm font-medium block mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                  />
                  {error && (
                    <p className="text-accent text-xs mt-1.5">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send Reset Instructions'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  )
}
