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
      <div className="hidden lg:flex flex-col justify-between bg-[#0e1015] w-2/5 p-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DC</span>
          </div>
          <span className="text-white font-semibold text-sm">Digital Creative Platform</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-3xl leading-tight mb-4">
            Your creativity<br />starts here.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Register with your school to access structured music, visual arts, and graphic design
            sessions inside the computer lab already at your school.
          </p>
          <div className="space-y-3 text-sm text-gray-400">
            {['No installation required', 'Works offline, syncs when connected', 'Verified schools only'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-xs">For students at verified participating schools</p>
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
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              {errors.password && (
                <p className="text-accent text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Re-enter Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
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
              disabled={loading}
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
