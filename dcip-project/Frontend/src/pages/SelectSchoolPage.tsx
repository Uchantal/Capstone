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
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedSchoolName, setConfirmedSchoolName] = useState('')
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

    // Show a "still working" nudge after 2 s so students don't think it froze
    const slowTimer = setTimeout(() => setSlow(true), 2000)

    try {
      const res = await updateUserSchool(schoolId)
      clearTimeout(slowTimer)
      setSlow(false)

      // Update auth context immediately so the guard passes
      updateUser({ school: res.data.school })

      // Show a clear success confirmation for 1.5 s before navigating
      setConfirmedSchoolName(res.data.school.name)
      setConfirmed(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch {
      clearTimeout(slowTimer)
      setSlow(false)
      setSubmitting(false)
      setError('Could not save your school. Please try again.')
    }
  }, [schoolId, updateUser, navigate])

  const selected = schools.find(s => s._id === schoolId)

  // ── Success state ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-surface-border w-full max-w-md p-8 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary/10 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-text-primary font-bold text-xl mb-1">School confirmed!</h2>
          <p className="text-text-secondary text-sm mb-1">Your account is now linked to</p>
          <p className="text-text-primary font-semibold text-base mb-5">{confirmedSchoolName}</p>
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <svg className="animate-spin w-3.5 h-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Taking you to your dashboard…
          </div>
        </div>
      </div>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
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

        {slow && !error && (
          <div className="flex items-center gap-2 bg-surface-warm border border-surface-border rounded-lg px-3 py-2.5 mb-4">
            <svg className="animate-spin w-3.5 h-3.5 text-primary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-text-secondary text-xs">Saving your school — please wait, do not close or refresh this page.</p>
          </div>
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
