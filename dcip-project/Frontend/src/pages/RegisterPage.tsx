import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, fetchSchools } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface School {
  _id: string
  name: string
  district: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { saveAuth } = useAuth()
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

  useEffect(() => {
    fetchSchools()
      .then((res) => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubmitError('Could not load schools. Check your connection.'))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setSubmitError('')
  }

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

    if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    }

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }

    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.username || !form.email || !form.password || !form.confirmPassword || !form.schoolId) {
      setSubmitError('All fields are required')
      return
    }

    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const res = await registerUser({ fullName: form.fullName, username: form.username, email: form.email, password: form.password, schoolId: form.schoolId })
      saveAuth(res.data.token, res.data.user)
      navigate('/disciplines')
    } catch (err) {
      setSubmitError((err as any)?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#C8960C] w-2/5 p-12">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg w-9 h-9 flex items-center justify-center">
            <span className="text-[#C8960C] font-bold text-sm">DC</span>
          </div>
          <span className="text-white font-semibold text-sm">Digital Creative Platform</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-3xl leading-tight mb-4">
            Your creativity<br />starts here.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-8">
            Register with your school to access structured music, visual arts, and graphic design
            sessions inside the computer lab already at your school.
          </p>
          <div className="space-y-3 text-sm text-white/80">
            {['No installation required', 'Works offline, syncs when connected', 'Verified schools only'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/60 text-xs">For students at verified participating schools</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
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
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
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
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
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
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
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
                  className="w-full border border-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
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
                  className="w-full border border-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
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
              <label className="text-text-primary text-sm font-medium block mb-1.5">School</label>
              <select
                name="schoolId"
                value={form.schoolId}
                onChange={handleChange}
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select your school</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}, {s.district}
                  </option>
                ))}
              </select>
              <p className="text-text-secondary text-xs mt-1.5">
                Only verified participating schools are listed.
              </p>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-accent text-sm px-4 py-3 rounded-lg">
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
        </div>
      </div>
    </div>
  )
}
