import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminModules, activateModule, deactivateModule, createModule } from '../../services/adminApi'

interface Module {
  _id: string
  key: string
  name: string
  description: string
  isActive: boolean
}

const EMPTY_FORM = { name: '', description: '' }

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAdminModules()
      .then((res) => setModules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (mod: Module) => {
    setActionId(mod._id)
    try {
      if (mod.isActive) {
        await deactivateModule(mod._id)
        setModules((prev) => prev.map((m) => (m._id === mod._id ? { ...m, isActive: false } : m)))
      } else {
        await activateModule(mod._id)
        setModules((prev) => prev.map((m) => (m._id === mod._id ? { ...m, isActive: true } : m)))
      }
    } catch {
      // silently fail
    } finally {
      setActionId(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, description } = form
    if (!name.trim() || !description.trim()) {
      setFormError('Name and description are required')
      return
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setSaving(true)
    try {
      const res = await createModule({ name: name.trim(), description: description.trim(), slug })
      setModules((prev) => [...prev, res.data])
      setForm(EMPTY_FORM)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setFormError(message || 'Could not create discipline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <h1 className="text-text-primary font-bold text-2xl mb-1">Creative Modules</h1>
        <p className="text-text-secondary text-sm mb-8">
          Enable or disable disciplines available to students.
        </p>

        {loading ? (
          <p className="text-text-secondary text-sm mb-10">Loading...</p>
        ) : (
          <div className="space-y-4 mb-10">
            {modules.map((mod) => (
              <div
                key={mod._id}
                className="bg-white border border-surface-border rounded-2xl p-6 flex items-center justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-text-primary font-semibold">{mod.name}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mod.isActive ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {mod.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm">{mod.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(mod)}
                  disabled={actionId === mod._id}
                  className={`shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                    mod.isActive
                      ? 'border border-accent text-accent hover:bg-accent/5'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {mod.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-surface-border rounded-2xl p-6">
          <h2 className="text-text-primary font-semibold mb-5">Add New Discipline</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Dance"
                className="w-full border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of this discipline"
                className="w-full border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
            {formError && <p className="text-accent text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add Discipline'}
            </button>
          </form>
        </div>
      </main>
    </AdminLayout>
  )
}
