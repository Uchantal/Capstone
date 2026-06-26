import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSchools, updateUserSchool } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface School {
  _id: string
  name: string
  district: string
}

export default function SelectSchoolPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slow, setSlow] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [error, setError] = useState('')
  const schoolRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoadingSchools(true)
    fetchSchools()
      .then(res => {
        setSchools(res.data.sort((a: School, b: School) => a.name.localeCompare(b.name)))
      })
      .catch(() => setError('Could not load schools. Check your connection.'))
      .finally(() => setLoadingSchools(false))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) {
        setSchoolOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!schoolId) { setError('Please select your school to continue.'); return }
    setSubmitting(true)
    setSlow(false)
    setError('')

    // After 8 s with no response, tell the student to keep waiting instead of
    // letting them think the platform crashed.
    const slowTimer = setTimeout(() => setSlow(true), 8000)

    try {
      const res = await updateUserSchool(schoolId)
      clearTimeout(slowTimer)
      updateUser({ school: res.data.school })
      navigate('/dashboard', { replace: true })
    } catch {
      clearTimeout(slowTimer)
      setSlow(false)
      setError('Could not save your school. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [schoolId, updateUser, navigate])

  const selected = schools.find(s => s._id === schoolId)

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-surface-border w-full max-w-md p-8">
        <div className="mb-6">
          <h1 className="text-text-primary font-bold text-2xl mb-1">Select your school</h1>
          <p className="text-text-secondary text-sm">
            Welcome, {user?.fullName?.split(' ')[0]}. Please confirm which school you attend so your account is correctly linked.
          </p>
        </div>

        <div className="mb-5">
          <label className="text-text-primary text-sm font-medium block mb-1.5">School</label>
          {loadingSchools ? (
            <div className="w-full border border-surface-border rounded-lg px-4 py-3 flex items-center gap-3 bg-white">
              <svg className="animate-spin w-4 h-4 text-primary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm text-gray-400">Loading schools…</span>
            </div>
          ) : (
          <div className="relative" ref={schoolRef}>
            <button
              type="button"
              onClick={() => setSchoolOpen(v => !v)}
              className="w-full border border-surface-border rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:border-primary"
            >
              <span className={selected ? 'text-text-primary' : 'text-gray-400'}>
                {selected ? `${selected.name} — ${selected.district}` : 'Select your school'}
              </span>
              <svg className={`w-4 h-4 text-text-secondary transition-transform ${schoolOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {schoolOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-surface-border rounded-lg shadow-md overflow-hidden">
                <div className="p-2 border-b border-surface-border">
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={schoolSearch}
                    onChange={e => setSchoolSearch(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-md focus:outline-none focus:border-primary text-text-primary placeholder-gray-400"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {schools
                    .filter(s => `${s.name} ${s.district}`.toLowerCase().includes(schoolSearch.toLowerCase()))
                    .map(s => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSchoolId(s._id)
                          setSchoolOpen(false)
                          setSchoolSearch('')
                          setError('')
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          schoolId === s._id ? 'bg-primary/10 text-primary font-medium' : 'text-text-primary hover:bg-gray-50'
                        }`}
                      >
                        {s.name} — {s.district}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {error && <p className="text-accent text-xs mb-4">{error}</p>}

        {slow && (
          <p className="text-text-secondary text-xs mb-3 text-center">
            Still saving — the server is warming up, please don't close this page…
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!schoolId || submitting || loadingSchools}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && (
            <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {submitting ? 'Saving…' : 'Confirm School'}
        </button>
      </div>
    </div>
  )
}
