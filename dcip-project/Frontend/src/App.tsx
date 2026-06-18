import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DisciplineSelectPage from './pages/DisciplineSelectPage'
import MusicSelectPage from './pages/MusicSelectPage'
import SessionPage from './pages/SessionPage'
import PortfolioPage from './pages/PortfolioPage'
import SkillSummaryPage from './pages/SkillSummaryPage'
import UnderstandingPianoPage from './pages/piano/UnderstandingPianoPage'
import NotesBuildChordsPage from './pages/piano/NotesBuildChordsPage'
import Level1Page from './pages/piano/Level1Page'
import Level2Page from './pages/piano/Level2Page'
import Level3Page from './pages/piano/Level3Page'
import SharpeningMyselfPage from './pages/piano/SharpeningMyselfPage'
import ProductionPage from './pages/piano/ProductionPage'
import GDVirtualStudioPage from './pages/graphic-design/VirtualStudioPage'
import GDCourse1Page from './pages/graphic-design/GDCourse1Page'
import GDCourse2Page from './pages/graphic-design/GDCourse2Page'
import GDLevel1Page from './pages/graphic-design/GDLevel1Page'
import GDLevel2Page from './pages/graphic-design/GDLevel2Page'
import GDLevel3Page from './pages/graphic-design/GDLevel3Page'
import GDSharpeningPage from './pages/graphic-design/GDSharpeningPage'
import GDProductionPage from './pages/graphic-design/GDProductionPage'
import GuitarVirtualInstrumentPage from './pages/guitar/VirtualInstrumentPage'
import GuitarReadingFretboardPage from './pages/guitar/ReadingFretboardPage'
import GuitarNotesAcrossNeckPage from './pages/guitar/NotesAcrossNeckPage'
import GuitarLevel1Page from './pages/guitar/Level1Page'
import GuitarLevel2Page from './pages/guitar/Level2Page'
import GuitarLevel3Page from './pages/guitar/Level3Page'
import GuitarSharpeningPage from './pages/guitar/SharpeningMyselfPage'
import GuitarProductionPage from './pages/guitar/ProductionPage'
import VirtualCanvasPage from './pages/visual-arts/VirtualCanvasPage'
import VAcourse1Page from './pages/visual-arts/Course1Page'
import VAcourse2Page from './pages/visual-arts/Course2Page'
import VALevel1Page from './pages/visual-arts/Level1Page'
import VALevel2Page from './pages/visual-arts/Level2Page'
import VALevel3Page from './pages/visual-arts/Level3Page'
import VASharpeningPage from './pages/visual-arts/SharpeningPage'
import VAProductionPage from './pages/visual-arts/VAProductionPage'
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
        <Route path="/skill-summary" element={<StudentRoute><SkillSummaryPage /></StudentRoute>} />

        <Route path="/piano/understanding-the-piano" element={<StudentRoute><UnderstandingPianoPage /></StudentRoute>} />
        <Route path="/piano/notes-build-chords" element={<StudentRoute><NotesBuildChordsPage /></StudentRoute>} />
        <Route path="/piano/level-1" element={<StudentRoute><Level1Page /></StudentRoute>} />
        <Route path="/piano/level-2" element={<StudentRoute><Level2Page /></StudentRoute>} />
        <Route path="/piano/level-3" element={<StudentRoute><Level3Page /></StudentRoute>} />
        <Route path="/piano/sharpening-myself" element={<StudentRoute><SharpeningMyselfPage /></StudentRoute>} />
        <Route path="/piano/production" element={<StudentRoute><ProductionPage /></StudentRoute>} />

        <Route path="/guitar/virtual-instrument" element={<StudentRoute><GuitarVirtualInstrumentPage /></StudentRoute>} />
        <Route path="/guitar/reading-the-fretboard" element={<StudentRoute><GuitarReadingFretboardPage /></StudentRoute>} />
        <Route path="/guitar/notes-across-the-neck" element={<StudentRoute><GuitarNotesAcrossNeckPage /></StudentRoute>} />
        <Route path="/guitar/level-1" element={<StudentRoute><GuitarLevel1Page /></StudentRoute>} />
        <Route path="/guitar/level-2" element={<StudentRoute><GuitarLevel2Page /></StudentRoute>} />
        <Route path="/guitar/level-3" element={<StudentRoute><GuitarLevel3Page /></StudentRoute>} />
        <Route path="/guitar/sharpening-myself" element={<StudentRoute><GuitarSharpeningPage /></StudentRoute>} />
        <Route path="/guitar/production" element={<StudentRoute><GuitarProductionPage /></StudentRoute>} />

        <Route path="/graphic-design/virtual-studio" element={<StudentRoute><GDVirtualStudioPage /></StudentRoute>} />
        <Route path="/graphic-design/course-1" element={<StudentRoute><GDCourse1Page /></StudentRoute>} />
        <Route path="/graphic-design/course-2" element={<StudentRoute><GDCourse2Page /></StudentRoute>} />
        <Route path="/graphic-design/level-1" element={<StudentRoute><GDLevel1Page /></StudentRoute>} />
        <Route path="/graphic-design/level-2" element={<StudentRoute><GDLevel2Page /></StudentRoute>} />
        <Route path="/graphic-design/level-3" element={<StudentRoute><GDLevel3Page /></StudentRoute>} />
        <Route path="/graphic-design/sharpening" element={<StudentRoute><GDSharpeningPage /></StudentRoute>} />
        <Route path="/graphic-design/production" element={<StudentRoute><GDProductionPage /></StudentRoute>} />

        <Route path="/visual-arts/virtual-canvas" element={<StudentRoute><VirtualCanvasPage /></StudentRoute>} />
        <Route path="/visual-arts/course-1" element={<StudentRoute><VAcourse1Page /></StudentRoute>} />
        <Route path="/visual-arts/course-2" element={<StudentRoute><VAcourse2Page /></StudentRoute>} />
        <Route path="/visual-arts/level-1" element={<StudentRoute><VALevel1Page /></StudentRoute>} />
        <Route path="/visual-arts/level-2" element={<StudentRoute><VALevel2Page /></StudentRoute>} />
        <Route path="/visual-arts/level-3" element={<StudentRoute><VALevel3Page /></StudentRoute>} />
        <Route path="/visual-arts/sharpening" element={<StudentRoute><VASharpeningPage /></StudentRoute>} />
        <Route path="/visual-arts/production" element={<StudentRoute><VAProductionPage /></StudentRoute>} />

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
