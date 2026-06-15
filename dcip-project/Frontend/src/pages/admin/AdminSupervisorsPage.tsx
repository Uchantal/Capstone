import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'
import { getAdminSupervisors, createSupervisor, fetchSchools } from '../../services/api'

interface Supervisor {
  _id: string
  fullName: string
  username: string
  email: string
  school: { _id: string; name: string; district: string } | null
}

interface School {
  _id: string
  name: string
  district: string
}

const EMPTY_FORM = { fullName: '', username: '', email: '', password: '', schoolId: '' }

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getAdminSupervisors(), fetchSchools()])
      .then(([supRes, schoolRes]) => {
        setSupervisors(supRes.data)
        setSchools(schoolRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { fullName, username, email, password, schoolId } = form
    if (!fullName || !username || !email || !password || !schoolId) {
      setFormError('All fields are required')
      return
    }
    setSaving(true)
    try {
      const res = await createSupervisor(form)
      setSupervisors((prev) => [...prev, res.data])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setFormError(message || 'Could not create supervisor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Supervisors</h1>
            <p className="text-text-secondary text-sm">
              One supervisor account per pilot school. Each supervisor only sees their own school's data.
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError('') }}
            className="shrink-0 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Supervisor'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-border rounded-2xl p-6 mb-6 space-y-4"
          >
            <h2 className="text-text-primary font-semibold">New Supervisor Account</h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-1 lg:grid-cols-2">
              <div>
                <label className="text-text-primary text-sm font-medium block mb-1.5">Full name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Supervisor Kigeme A"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-primary text-sm font-medium block mb-1.5">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. sup.kigeme.a"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-primary text-sm font-medium block mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. sup.kigeme.a@dcip.rw"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-primary text-sm font-medium block mb-1.5">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Initial password"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">School</label>
              <select
                name="schoolId"
                value={form.schoolId}
                onChange={handleChange}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select school…</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}, {s.district}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="text-accent text-sm">{formError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Supervisor'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : supervisors.length === 0 ? (
          <p className="text-text-secondary text-sm">No supervisors yet. Add one above.</p>
        ) : (
          <div className="bg-white border border-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left text-text-secondary font-medium px-6 py-3.5">Name</th>
                  <th className="text-left text-text-secondary font-medium px-6 py-3.5">Username</th>
                  <th className="text-left text-text-secondary font-medium px-6 py-3.5">School</th>
                  <th className="text-left text-text-secondary font-medium px-6 py-3.5">District</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supervisors.map((sup) => (
                  <tr key={sup._id}>
                    <td className="px-6 py-4 text-text-primary font-medium">{sup.fullName}</td>
                    <td className="px-6 py-4 text-text-secondary">{sup.username}</td>
                    <td className="px-6 py-4 text-text-secondary">{sup.school?.name ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-text-secondary">{sup.school?.district ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
