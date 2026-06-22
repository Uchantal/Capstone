import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAdminStats } from '../../services/adminApi'

interface Stats {
  activeStudents: number
  totalSessions: number
  portfolioItems: number
  pilotSchools: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getAdminStats().then((res) => setStats(res.data)).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Administrator Overview</h1>
          <p className="text-text-secondary text-sm">Platform overview for DCIP</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['Active Students', stats?.activeStudents],
              ['Total Sessions', stats?.totalSessions],
              ['Portfolio Items', stats?.portfolioItems],
              ['Active Schools', stats?.pilotSchools],
            ] as [string, number | undefined][]
          ).map(([label, value]) => (
            <div key={label} className="bg-white border border-surface-border rounded-2xl p-6">
              <p className="text-text-secondary text-xs mb-2">{label}</p>
              <p className="text-text-primary font-bold text-3xl">{value ?? 'N/A'}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-6 mb-4">
          <p className="text-text-primary font-semibold mb-1">Platform Preview</p>
          <p className="text-text-secondary text-sm mb-4">
            Navigate and test any part of the platform directly. Enter any discipline or level without completing prior stages.
          </p>
          <Link
            to="/admin/preview"
            className="inline-block bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Open Preview Navigator
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/admin/students"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Manage Students</p>
            <p className="text-text-secondary text-sm">View all registered students, activate or deactivate accounts</p>
          </Link>
          <Link
            to="/admin/schools"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Manage Schools</p>
            <p className="text-text-secondary text-sm">Activate or deactivate schools</p>
          </Link>
          <Link
            to="/admin/modules"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Configure Modules</p>
            <p className="text-text-secondary text-sm">Enable or disable creative disciplines and add new ones</p>
          </Link>
          <Link
            to="/admin/supervisors"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Supervisors</p>
            <p className="text-text-secondary text-sm">Manage supervisor accounts for each school</p>
          </Link>
          <Link
            to="/admin/reports"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">View Reports</p>
            <p className="text-text-secondary text-sm">Session and portfolio statistics across all schools</p>
          </Link>
          <Link
            to="/admin/feedback"
            className="bg-white border border-surface-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Feedback</p>
            <p className="text-text-secondary text-sm">View feedback submissions from students and visitors</p>
          </Link>
        </div>
      </main>
    </AdminLayout>
  )
}
