import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'
import { getAdminModules, toggleModule } from '../../services/api'

interface Module {
  _id: string
  key: string
  name: string
  description: string
  isActive: boolean
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getAdminModules()
      .then((res) => setModules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await toggleModule(id)
      setModules((prev) => prev.map((m) => (m._id === id ? { ...m, isActive: res.data.isActive } : m)))
    } catch {
      // silently fail
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-text-primary font-bold text-2xl mb-1">Creative Modules</h1>
        <p className="text-text-secondary text-sm mb-8">
          Enable or disable disciplines available to students in the pilot programme.
        </p>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : (
          <div className="space-y-4">
            {modules.map((mod) => (
              <div
                key={mod._id}
                className="bg-white border border-border rounded-2xl p-6 flex items-center justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-text-primary font-semibold">{mod.name}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mod.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {mod.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm">{mod.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(mod._id)}
                  disabled={togglingId === mod._id}
                  className={`shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                    mod.isActive
                      ? 'border border-accent text-accent hover:bg-red-50'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {mod.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
