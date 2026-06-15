import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../../components/AdminNav'
import { getAdminReports } from '../../services/api'

interface Reports {
  totalStudents: number
  totalSessions: number
  totalPortfolioItems: number
  activeSchools: number
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Reports | null>(null)

  useEffect(() => {
    getAdminReports().then((res) => setReports(res.data)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Administrator Dashboard</h1>
          <p className="text-text-secondary text-sm">Platform overview for the DCIP pilot programme</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ['Active Students', reports?.totalStudents],
              ['Total Sessions', reports?.totalSessions],
              ['Portfolio Items', reports?.totalPortfolioItems],
              ['Pilot Schools', reports?.activeSchools],
            ] as [string, number | undefined][]
          ).map(([label, value]) => (
            <div key={label} className="bg-white border border-border rounded-2xl p-6">
              <p className="text-text-secondary text-xs mb-2">{label}</p>
              <p className="text-text-primary font-bold text-3xl">{value ?? 'N/A'}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/admin/students"
            className="bg-white border border-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Manage Students</p>
            <p className="text-text-secondary text-sm">View all registered students, activate or deactivate accounts</p>
          </Link>
          <Link
            to="/admin/modules"
            className="bg-white border border-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">Configure Modules</p>
            <p className="text-text-secondary text-sm">Enable or disable creative disciplines for the pilot</p>
          </Link>
          <Link
            to="/admin/reports"
            className="bg-white border border-border rounded-2xl p-6 hover:border-primary transition-colors block"
          >
            <p className="text-text-primary font-semibold mb-1">View Reports</p>
            <p className="text-text-secondary text-sm">Session and portfolio statistics across all pilot schools</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
