import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { registerUser, fetchSchools } from '../services/api'
import Footer from '../components/Footer'

interface School {
  _id: string
  name: string
  district: string
  province: string
}

export default function RegisterPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  // School searchable dropdown
  const [schoolOpen, setSchoolOpen]     = useState(false)
  const [schoolSearch, setSchoolSearch] = useState('')
  const schoolRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSchools()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setSchools(list.sort((a: School, b: School) => a.name.localeCompare(b.name)))
      })
      .catch(() => setSubmitError('Could not load schools. Check your connection.'))
  }, [])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) {
        setSchoolOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setSubmitError('')
  }

  const pwRules = [
    { label: 'At least 8 characters',        test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter (A-Z)',    test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number (0-9)',              test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character (!@#...)',test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ]

  const validate = () => {
    const next: Record<string, string> = {}

    if (!form.fullName.trim()) {
      next.fullName = 'Full name is required.'
    }

    if (!form.email.trim()) {
      next.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Please enter a valid email address.'
    }

    const allPwRulesMet = pwRules.every(r => r.test(form.password))
    if (!allPwRulesMet) {
      next.password = 'Please meet all password requirements shown below.'
    }

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }

    if (!form.schoolId) {
      next.schoolId = 'Please select your school to continue'
    }

    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fieldErrors = validate()
    if (!form.fullName || !form.username || !form.email || !form.password || !form.confirmPassword) {
      setSubmitError('All fields are required')
      return
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await registerUser({ fullName: form.fullName, username: form.username, email: form.email, password: form.password, schoolId: form.schoolId })
      setRegistered(true)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setSubmitError(message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1">
      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">

          {registered ? (
            /* ── Check-email success state ── */
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-text-primary font-bold text-2xl mb-1">Check your email</h1>
              <p className="text-text-secondary text-sm mb-6">
                We sent a verification link to{' '}
                <span className="text-text-primary font-medium">{form.email}</span>.
                Click the link in that email to activate your account. The link expires in 24 hours.
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
            /* ── Registration form ── */
            <>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Create your account</h1>
          <p className="text-text-secondary text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Full name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              {errors.fullName && (
                <p className="text-accent text-xs mt-1.5">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              {errors.email && (
                <p className="text-accent text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full border border-surface-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Live strength meter — shown as soon as user starts typing */}
              {form.password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {/* 4-segment progress bar */}
                  <div className="flex gap-1">
                    {pwRules.map((r, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          r.test(form.password) ? 'bg-secondary' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Individual rule indicators */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {pwRules.map((r, i) => {
                      const ok = r.test(form.password)
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          {ok ? (
                            <svg className="w-3.5 h-3.5 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          )}
                          <span className={`text-xs ${ok ? 'text-secondary' : 'text-text-muted'}`}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-accent text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Re-enter Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full border border-surface-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.confirmPassword.length > 0 && (
                form.password === form.confirmPassword
                  ? <p className="text-secondary text-sm mt-1">Passwords match</p>
                  : <p className="text-accent text-sm mt-1">Passwords do not match</p>
              )}
              {errors.confirmPassword && (
                <p className="text-accent text-xs mt-1.5">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              {/* Label row — search icon on the right */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-text-primary text-sm font-medium">School</label>
                <button
                  type="button"
                  onClick={() => { setSchoolOpen(true) }}
                  className="text-text-secondary hover:text-secondary transition-colors"
                  aria-label="Search schools"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                </button>
              </div>

              {/* Custom dropdown */}
              <div className="relative" ref={schoolRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setSchoolOpen(v => !v)}
                  className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:border-primary"
                >
                  <span className={form.schoolId ? 'text-text-primary' : 'text-gray-400'}>
                    {form.schoolId
                      ? (() => { const s = schools.find(x => x._id === form.schoolId); return s ? `${s.name} — ${s.district}` : 'Select your school' })()
                      : 'Select your school'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-text-secondary transition-transform ${schoolOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {schoolOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-surface-border rounded-lg shadow-md overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-surface-border">
                      <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search schools..."
                          value={schoolSearch}
                          onChange={e => setSchoolSearch(e.target.value)}
                          autoFocus
                          className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-md focus:outline-none focus:border-primary text-text-primary placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* School list */}
                    <div className="max-h-48 overflow-y-auto">
                      {schools
                        .filter(s =>
                          `${s.name} ${s.district}`.toLowerCase().includes(schoolSearch.toLowerCase())
                        )
                        .map(school => (
                          <button
                            key={school._id}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, schoolId: school._id }))
                              setErrors(prev => ({ ...prev, schoolId: '' }))
                              setSubmitError('')
                              setSchoolOpen(false)
                              setSchoolSearch('')
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                              ${form.schoolId === school._id
                                ? 'bg-secondary/10 text-secondary font-medium'
                                : 'text-text-primary hover:bg-surface-warm'}`}
                          >
                            {school.name}
                            <span className="text-text-muted"> — {school.district}</span>
                          </button>
                        ))}
                      {schools.filter(s =>
                        `${s.name} ${s.district}`.toLowerCase().includes(schoolSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="px-4 py-3 text-sm text-text-muted text-center">No schools match your search.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {errors.schoolId ? (
                <p className="text-accent text-xs mt-1.5">{errors.schoolId}</p>
              ) : (
                <p className="text-text-secondary text-xs mt-1.5">
                  Only verified participating schools are listed.
                </p>
              )}
            </div>

            {submitError && (
              <div className="bg-accent/5 border border-accent/20 text-accent text-sm px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (form.confirmPassword.length > 0 && form.password !== form.confirmPassword)}
              className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          </>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}
