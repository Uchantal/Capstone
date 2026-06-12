import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DisciplineSelectPage from './pages/DisciplineSelectPage'
import MusicSelectPage from './pages/MusicSelectPage'
import SessionPage from './pages/SessionPage'
import PortfolioPage from './pages/PortfolioPage'
import { useAuth } from './hooks/useAuth'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return null
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return null
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/disciplines" element={<ProtectedRoute><DisciplineSelectPage /></ProtectedRoute>} />
        <Route path="/session/music" element={<ProtectedRoute><MusicSelectPage /></ProtectedRoute>} />
        <Route path="/session/:discipline" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
