import { useEffect, useState } from 'react'
import { getAdminStudents, toggleStudentStatus } from '../../services/api'
import AdminLayout from '../../components/AdminLayout'

interface Student {
  _id: string
  fullName: string
  username: string
  email: string
  discipline: string | null
  isActive: boolean
  school: { name: string; district: string } | null
  createdAt: string
}

const disciplineLabel = (d: string | null) => {
  if (d === 'music') return 'Music'
  if (d === 'visual-arts') return 'Visual Arts'
  if (d === 'graphic-design') return 'Graphic Design'
  return 'N/A'
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getAdminStudents()
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await toggleStudentStatus(id)
      setStudents((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: res.data.isActive } : s)))
    } catch {
      // silently fail
    } finally {
      setTogglingId(null)
    }
  }

  const visible = students.filter((s) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.school?.name.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Students</h1>
            <p className="text-text-secondary text-sm">
              {students.length} registered student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or school…"
            className="border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary w-64 shrink-0"
          />
        </div>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="text-text-secondary text-sm">No students found.</p>
        ) : (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[#F9F7F4] border-b border-surface-border">
                <tr>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Name</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Username</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">School</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Discipline</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visible.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 text-text-primary font-medium">{student.fullName}</td>
                    <td className="px-6 py-4 text-text-secondary">{student.username}</td>
                    <td className="px-6 py-4 text-text-secondary">{student.school?.name ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-text-secondary">{disciplineLabel(student.discipline)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isActive
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(student._id)}
                        disabled={togglingId === student._id}
                        className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {student.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
