import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSchools, activateSchool, deactivateSchool, updateSchool, createSchool } from '../../services/adminApi'

interface School {
  _id: string
  name: string
  district: string
  province: string
  isActive: boolean
}

interface FieldDraft {
  name: string
  district: string
  province: string
}

const emptyDraft = (): FieldDraft => ({ name: '', district: '', province: '' })

export default function AdminSchoolsPage() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState<School[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<FieldDraft>(emptyDraft())
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  // add state
  const [showAdd, setShowAdd] = useState(false)
  const [addDraft, setAddDraft] = useState<FieldDraft>(emptyDraft())
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    getAdminSchools()
      .then((res) => setSchools(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── edit handlers ──────────────────────────────────────────────────────────
  const startEdit = (school: School) => {
    setEditingId(school._id)
    setEditDraft({ name: school.name, district: school.district, province: school.province })
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const saveEdit = async (id: string) => {
    if (!editDraft.name.trim() || !editDraft.district.trim() || !editDraft.province.trim()) {
      setEditError('All three fields are required')
      return
    }
    setSaving(true)
    try {
      const res = await updateSchool(id, {
        name: editDraft.name.trim(),
        district: editDraft.district.trim(),
        province: editDraft.province.trim(),
      })
      setSchools((prev) => prev.map((s) => (s._id === id ? res.data : s)))
      setEditingId(null)
      setEditError('')
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  // ── add handlers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setAddDraft(emptyDraft())
    setAddError('')
    setShowAdd(true)
    setEditingId(null)
  }

  const cancelAdd = () => {
    setShowAdd(false)
    setAddError('')
  }

  const submitAdd = async () => {
    if (!addDraft.name.trim() || !addDraft.district.trim() || !addDraft.province.trim()) {
      setAddError('All three fields are required')
      return
    }
    setAdding(true)
    try {
      const res = await createSchool({
        name: addDraft.name.trim(),
        district: addDraft.district.trim(),
        province: addDraft.province.trim(),
      })
      setSchools((prev) => [...prev, res.data])
      setShowAdd(false)
      setAddDraft(emptyDraft())
      setAddError('')
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Could not create school')
    } finally {
      setAdding(false)
    }
  }

  // ── activate / deactivate ──────────────────────────────────────────────────
  const handleActivate = async (id: string) => {
    setActionId(id)
    try {
      await activateSchool(id)
      setSchools((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: true } : s)))
    } catch {
      //
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
      //
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

  const inputCls =
    'w-full border border-surface-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary'

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* header row */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Schools</h1>
            <p className="text-text-secondary text-sm">
              {activeCount} of {schools.length} school{schools.length !== 1 ? 's' : ''} active
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name or district..."
              className="border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary w-56"
            />
            <button
              onClick={openAdd}
              className="bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              Add School
            </button>
          </div>
        </div>

        {/* add form */}
        {showAdd && (
          <div className="mb-6 bg-white border border-primary/30 rounded-2xl p-5">
            <h2 className="text-text-primary font-semibold text-base mb-4">Add new school</h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">School name</label>
                <input
                  value={addDraft.name}
                  onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. GS Kigeme A"
                  className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">District</label>
                <input
                  value={addDraft.district}
                  onChange={(e) => setAddDraft((d) => ({ ...d, district: e.target.value }))}
                  placeholder="e.g. Nyamagabe"
                  className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Province</label>
                <input
                  value={addDraft.province}
                  onChange={(e) => setAddDraft((d) => ({ ...d, province: e.target.value }))}
                  placeholder="e.g. Southern Province"
                  className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            {addError && <p className="text-accent text-xs mb-3">{addError}</p>}
            <p className="text-text-muted text-xs mb-4">
              The school will be added as Inactive. Activate it once ready so students can select it during registration.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelAdd}
                disabled={adding}
                className="border border-surface-border text-text-secondary text-sm px-4 py-2 rounded-lg hover:bg-surface-warm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAdd}
                disabled={adding}
                className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add School'}
              </button>
            </div>
          </div>
        )}

        {/* table */}
        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="text-text-secondary text-sm">No schools found.</p>
        ) : (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
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
                {visible.map((school) => {
                  const isEditing = editingId === school._id
                  return (
                    <tr key={school._id} className={isEditing ? 'bg-primary/5' : undefined}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            className={inputCls}
                          />
                        ) : (
                          <span className="text-text-primary font-medium px-2">{school.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editDraft.district}
                            onChange={(e) => setEditDraft((d) => ({ ...d, district: e.target.value }))}
                            className={inputCls}
                          />
                        ) : (
                          <span className="text-text-secondary px-2">{school.district}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editDraft.province}
                            onChange={(e) => setEditDraft((d) => ({ ...d, province: e.target.value }))}
                            className={inputCls}
                          />
                        ) : (
                          <span className="text-text-secondary px-2">{school.province || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-2">
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-surface-warm transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(school._id)}
                                disabled={saving}
                                className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                            {editError && <p className="text-accent text-xs">{editError}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/schools/${school._id}?name=${encodeURIComponent(school.name)}`)}
                              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              View Students
                            </button>
                            <button
                              onClick={() => startEdit(school)}
                              disabled={!!actionId}
                              className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-surface-warm transition-colors disabled:opacity-50"
                            >
                              Edit
                            </button>
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
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminLayout>
  )
}
