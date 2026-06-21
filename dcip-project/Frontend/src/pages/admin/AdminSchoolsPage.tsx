import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSchools, activateSchool, deactivateSchool } from '../../services/adminApi'

interface School {
  _id: string
  name: string
  district: string
  province: string
  isActive: boolean
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    getAdminSchools()
      .then((res) => setSchools(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleActivate = async (id: string) => {
    setActionId(id)
    try {
      await activateSchool(id)
      setSchools((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: true } : s)))
    } catch {
      // silently fail
    } finally {
      setActionId(null)
    }
  }

  const handleDeactivate = async (id: string) => {
    setActionId(id)
    try {
      await deactivateSchool(id)
      setSchools((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: false } : s)))
    } catch {
      // silently fail
    } finally {
      setActionId(null)
    }
  }

  const visible = schools.filter((s) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      (s.province || '').toLowerCase().includes(q)
    )
  })

  const activeCount = schools.filter((s) => s.isActive).length

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Schools</h1>
            <p className="text-text-secondary text-sm">
              {activeCount} of {schools.length} school{schools.length !== 1 ? 's' : ''} active
            </p>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or district…"
            className="border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary w-64 shrink-0"
          />
        </div>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="text-text-secondary text-sm">No schools found.</p>
        ) : (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-[#F9F7F4] border-b border-surface-border">
                <tr>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Name</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">District</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Province</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visible.map((school) => (
                  <tr key={school._id}>
                    <td className="px-6 py-4 text-text-primary font-medium">{school.name}</td>
                    <td className="px-6 py-4 text-text-secondary">{school.district}</td>
                    <td className="px-6 py-4 text-text-secondary">{school.province || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.isActive
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {school.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {school.isActive ? (
                        <button
                          onClick={() => handleDeactivate(school._id)}
                          disabled={actionId === school._id}
                          className="border border-accent text-accent text-xs px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(school._id)}
                          disabled={actionId === school._id}
                          className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminLayout>
  )
}
