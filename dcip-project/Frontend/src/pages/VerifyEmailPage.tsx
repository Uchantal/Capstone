import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../services/api'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setErrorMessage('No verification token found in the link.')
      setStatus('error')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        setErrorMessage(msg || 'Verification link is invalid or has expired.')
        setStatus('error')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0">
            <span className="text-white font-bold text-sm">DC</span>
          </Link>
          <span className="text-text-primary font-semibold text-sm">Digital Creative Platform</span>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-12 text-text-secondary text-sm">
            <svg className="animate-spin w-8 h-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Verifying your email…
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Email verified!</h1>
            <p className="text-text-secondary text-sm mb-8">
              Your email address has been confirmed. You can now log in to your DCIP account.
            </p>
            <Link
              to="/login"
              className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center"
            >
              Log in
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Verification failed</h1>
            <p className="text-text-secondary text-sm mb-6">{errorMessage}</p>
            <div className="bg-surface-warm border border-surface-border rounded-lg px-4 py-3 mb-6">
              <p className="text-text-secondary text-sm">
                The link may have expired (valid for 24 hours). Try registering again or contact your school supervisor for help.
              </p>
            </div>
            <Link
              to="/register"
              className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center"
            >
              Back to Register
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
