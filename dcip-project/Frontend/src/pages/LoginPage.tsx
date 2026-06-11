import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { saveAuth } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    try {
      const res = await loginUser(form)
      saveAuth(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DC</span>
          </div>
          <span className="text-text-primary font-semibold text-sm">Digital Creative Platform</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Welcome back</h1>
        <p className="text-text-secondary text-sm mb-8">
          No account yet?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register here
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-text-primary text-sm font-medium block mb-1.5">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Your username"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-text-primary text-sm font-medium block mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-accent text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
