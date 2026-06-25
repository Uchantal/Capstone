import { useEffect, useRef, useState } from 'react'
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
  const [error, setError] = useState('')
  const schoolRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSchools()
      .then(res => setSchools(res.data.sort((a: School, b: School) => a.name.localeCompare(b.name))))
      .catch(() => setError('Could not load schools. Check your connection.'))
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

  const handleSubmit = async () => {
    if (!schoolId) { setError('Please select your school to continue.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await updateUserSchool(schoolId)
      updateUser({ school: res.data.school })
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Could not save your school. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
        </div>

        {error && <p className="text-accent text-xs mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!schoolId || submitting}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Confirm School'}
        </button>
      </div>
    </div>
  )
}
