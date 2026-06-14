import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DisciplineSelectPage from './pages/DisciplineSelectPage'
import MusicSelectPage from './pages/MusicSelectPage'
import SessionPage from './pages/SessionPage'
import PortfolioPage from './pages/PortfolioPage'
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminModulesPage from './pages/admin/AdminModulesPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSupervisorsPage from './pages/admin/AdminSupervisorsPage'
import AdminSchoolsPage from './pages/admin/AdminSchoolsPage'
import { useAuth } from './hooks/useAuth'

const roleHome = (role?: string) => {
  if (role === 'admin') return '/admin/overview'
  if (role === 'supervisor') return '/supervisor'
  return '/dashboard'
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (token) return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'student') return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

function SupervisorRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'supervisor') return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        <Route path="/dashboard" element={<StudentRoute><DashboardPage /></StudentRoute>} />
        <Route path="/disciplines" element={<StudentRoute><DisciplineSelectPage /></StudentRoute>} />
        <Route path="/session/music" element={<StudentRoute><MusicSelectPage /></StudentRoute>} />
        <Route path="/session/:discipline" element={<StudentRoute><SessionPage /></StudentRoute>} />
        <Route path="/portfolio" element={<StudentRoute><PortfolioPage /></StudentRoute>} />

        <Route path="/supervisor" element={<SupervisorRoute><SupervisorDashboardPage /></SupervisorRoute>} />

        <Route path="/admin" element={<AdminRoute><Navigate to="/admin/overview" replace /></AdminRoute>} />
        <Route path="/admin/overview" element={<AdminRoute><AdminOverviewPage /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><AdminStudentsPage /></AdminRoute>} />
        <Route path="/admin/schools" element={<AdminRoute><AdminSchoolsPage /></AdminRoute>} />
        <Route path="/admin/modules" element={<AdminRoute><AdminModulesPage /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="/admin/supervisors" element={<AdminRoute><AdminSupervisorsPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
