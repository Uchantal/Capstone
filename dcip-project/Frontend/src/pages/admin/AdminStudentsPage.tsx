import { useEffect, useState } from 'react'
import { getAdminStudents, toggleStudentStatus, fetchAdminStudentProfile } from '../../services/api'
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

interface EngagementScores {
  course1: number | null
  course2: number | null
  level1Learn: number | null
  level1Practise: number | null
  level1Demonstrate: number | null
  level2Learn: number | null
  level2Practise: number | null
  level2Demonstrate: number | null
  level3Learn: number | null
  level3Practise: number | null
  level3Demonstrate: number | null
  sharpening: number | null
  production: number | null
  overallEngagement: number | null
}

interface EngagementDoc {
  discipline: string
  scores: EngagementScores
}

interface StudentProfile {
  student: Student
  engagementScores: EngagementDoc[]
}

const STAGE_LABELS: Record<string, string> = {
  course1: 'Course 1',
  course2: 'Course 2',
  level1Learn: 'Level 1: Learn',
  level1Practise: 'Level 1: Practise',
  level1Demonstrate: 'Level 1: Demonstrate',
  level2Learn: 'Level 2: Learn',
  level2Practise: 'Level 2: Practise',
  level2Demonstrate: 'Level 2: Demonstrate',
  level3Learn: 'Level 3: Learn',
  level3Practise: 'Level 3: Practise',
  level3Demonstrate: 'Level 3: Demonstrate',
  sharpening: 'Sharpening',
  production: 'Production',
}

const STAGE_KEYS = Object.keys(STAGE_LABELS)

const DISC_LABEL: Record<string, string> = {
  music: 'Music',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
  piano: 'Piano', guitar: 'Guitar', voice: 'Voice & Singing',
}

function gradeInfo(score: number | null): { label: string; color: string } {
  if (score === null) return { label: '—', color: 'text-text-muted' }
  if (score >= 80) return { label: 'Excellent', color: 'text-[#2D6A4F]' }
  if (score >= 60) return { label: 'Good', color: 'text-primary' }
  if (score >= 40) return { label: 'Fair', color: 'text-orange-500' }
  return { label: 'Needs Improvement', color: 'text-accent' }
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-text-muted text-xs">Not attempted</span>
  const { label, color } = gradeInfo(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-text-secondary w-7 text-right">{score}%</span>
      <span className={`text-xs font-medium w-28 ${color}`}>{label}</span>
    </div>
  )
}

function StudentDetail({ profile, onBack }: { profile: StudentProfile; onBack: () => void }) {
  const { student, engagementScores } = profile

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-text-secondary text-sm hover:text-text-primary transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Students
      </button>

      <div className="bg-white border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-text-primary font-bold text-xl">{student.fullName}</h2>
            <p className="text-text-secondary text-sm mt-0.5">@{student.username} · {student.email}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            student.isActive ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
          }`}>
            {student.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wide mb-0.5">School</p>
            <p className="text-text-primary">{student.school?.name ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wide mb-0.5">Discipline</p>
            <p className="text-text-primary">{DISC_LABEL[student.discipline ?? ''] ?? 'N/A'}</p>
          </div>
        </div>
      </div>


      {engagementScores.length === 0 ? (
        <div className="bg-white border border-surface-border rounded-2xl p-6 text-center">
          <p className="text-text-secondary text-sm">No engagement data yet — student has not completed any course stages.</p>
        </div>
      ) : (
        engagementScores.map(doc => {
          const { label: overallLabel, color: overallColor } = gradeInfo(doc.scores.overallEngagement)
          return (
            <div key={doc.discipline} className="bg-white border border-surface-border rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-text-primary font-bold text-base">
                  {DISC_LABEL[doc.discipline] ?? doc.discipline} — Engagement
                </h3>
                {doc.scores.overallEngagement !== null && (
                  <div className="text-right">
                    <p className="text-text-muted text-xs uppercase tracking-wide">Overall</p>
                    <p className={`font-bold text-lg ${overallColor}`}>
                      {doc.scores.overallEngagement}% <span className="text-sm font-medium">{overallLabel}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {STAGE_KEYS.map(key => {
                  const score = doc.scores[key as keyof EngagementScores] as number | null
                  if (score === null) return null
                  return (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-3 items-center">
                      <p className="text-text-secondary text-xs">{STAGE_LABELS[key]}</p>
                      <ScoreBar score={score} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    getAdminStudents()
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleView = async (id: string) => {
    setProfileLoading(true)
    try {
      const res = await fetchAdminStudentProfile(id)
      setSelectedProfile(res.data)
    } catch {
      // silently fail
    } finally {
      setProfileLoading(false)
    }
  }

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
        {selectedProfile ? (
          <StudentDetail profile={selectedProfile} onBack={() => setSelectedProfile(null)} />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
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
                className="border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary w-full sm:w-48 md:w-64"
              />
            </div>

            {loading || profileLoading ? (
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
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-text-primary font-medium">{student.fullName}</td>
                        <td className="px-6 py-4 text-text-secondary">{student.username}</td>
                        <td className="px-6 py-4 text-text-secondary">{student.school?.name ?? 'N/A'}</td>
                        <td className="px-6 py-4 text-text-secondary">
                          {DISC_LABEL[student.discipline ?? ''] ?? 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                          }`}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(student._id)}
                              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleToggle(student._id)}
                              disabled={togglingId === student._id}
                              className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              {student.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </AdminLayout>
  )
}
