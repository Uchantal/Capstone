import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSchoolStudents } from '../../services/adminApi'
import { fetchAdminStudentProfile } from '../../services/api'

interface Student {
  _id: string
  fullName: string
  username: string
  email: string
  discipline: string | null
  isActive: boolean
  createdAt: string
  school: { name: string; district: string } | null
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
  piano: 'Piano',
  guitar: 'Guitar',
  voice: 'Voice & Singing',
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

function StudentProfilePanel({ profile, onClose }: { profile: StudentProfile; onClose: () => void }) {
  const { student, engagementScores } = profile
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-surface-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-text-primary font-bold text-base">Student Performance</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-text-primary font-bold text-lg">{student.fullName}</h3>
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
                <div key={doc.discipline} className="bg-white border border-surface-border rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-text-primary font-bold text-sm">
                      {DISC_LABEL[doc.discipline] ?? doc.discipline} — Engagement
                    </h4>
                    {doc.scores.overallEngagement !== null && (
                      <div className="text-right">
                        <p className="text-text-muted text-xs uppercase tracking-wide">Overall</p>
                        <p className={`font-bold text-base ${overallColor}`}>
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
      </div>
    </div>
  )
}

export default function AdminSchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const schoolName = searchParams.get('name') ?? 'School'

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const handleDownloadReport = () => {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    const rows: string[][] = [
      [`School Report: ${schoolName}`],
      [`Generated: ${date}`],
      [],
      ['Name', 'Username', 'Email', 'Discipline', 'Status'],
      ...students.map(s => [
        s.fullName,
        s.username,
        s.email,
        DISC_LABEL[s.discipline ?? ''] ?? 'Not enrolled',
        s.isActive ? 'Active' : 'Inactive',
      ]),
    ]
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schoolName.replace(/\s+/g, '_')}_report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!id) return
    getAdminSchoolStudents(id)
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleViewPerformance = async (studentId: string) => {
    setProfileLoading(true)
    try {
      const res = await fetchAdminStudentProfile(studentId)
      setSelectedProfile(res.data)
    } catch {
      // silently fail
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/schools')}
            className="flex items-center gap-1.5 text-text-secondary text-sm hover:text-text-primary transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Schools
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-text-primary font-bold text-2xl truncate">{schoolName}</h1>
          </div>
          {!loading && students.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-text-secondary text-sm">
                {students.length} student{students.length !== 1 ? 's' : ''} enrolled
              </span>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Report
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading || profileLoading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : students.length === 0 ? (
          <div className="bg-white border border-surface-border rounded-2xl p-8 text-center">
            <p className="text-text-secondary text-sm">No students enrolled in this school yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-[#F9F7F4] border-b border-surface-border">
                <tr>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Name</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Username</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Discipline</th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary text-xs font-bold">
                            {student.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-text-primary font-medium">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{student.username}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {DISC_LABEL[student.discipline ?? ''] ?? 'Not enrolled'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.isActive ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewPerformance(student._id)}
                        className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        View Performance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Side panel overlay */}
      {selectedProfile && (
        <StudentProfilePanel
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </AdminLayout>
  )
}
