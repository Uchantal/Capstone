import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DisciplineSelectPage from './pages/DisciplineSelectPage'
import MusicSelectPage from './pages/MusicSelectPage'
import PianoVirtualInstrumentPage from './pages/piano/VirtualInstrumentPage'
import PortfolioPage from './pages/PortfolioPage'
import SkillSummaryPage from './pages/SkillSummaryPage'
import UnderstandingPianoPage from './pages/piano/UnderstandingPianoPage'
import NotesBuildChordsPage from './pages/piano/NotesBuildChordsPage'
import Level1Page from './pages/piano/Level1Page'
import Level2Page from './pages/piano/Level2Page'
import Level3Page from './pages/piano/Level3Page'
import SharpeningMyselfPage from './pages/piano/SharpeningMyselfPage'
import ProductionPage from './pages/piano/ProductionPage'
import Level1PractisePage from './pages/piano/Level1PractisePage'
import Level1DemonstratePage from './pages/piano/Level1DemonstratePage'
import Level2PractisePage from './pages/piano/Level2PractisePage'
import Level2DemonstratePage from './pages/piano/Level2DemonstratePage'
import Level3PractisePage from './pages/piano/Level3PractisePage'
import Level3DemonstratePage from './pages/piano/Level3DemonstratePage'
import GDOverviewPage from './pages/graphic-design/GDOverviewPage'
import GDVirtualStudioPage from './pages/graphic-design/VirtualStudioPage'
import GDCourse1Page from './pages/graphic-design/GDCourse1Page'
import GDCourse2Page from './pages/graphic-design/GDCourse2Page'
import GDLevel1Page from './pages/graphic-design/GDLevel1Page'
import GDLevel1PractisePage from './pages/graphic-design/GDLevel1PractisePage'
import GDLevel1DemonstratePage from './pages/graphic-design/GDLevel1DemonstratePage'
import GDLevel2Page from './pages/graphic-design/GDLevel2Page'
import GDLevel2PractisePage from './pages/graphic-design/GDLevel2PractisePage'
import GDLevel2DemonstratePage from './pages/graphic-design/GDLevel2DemonstratePage'
import GDLevel3Page from './pages/graphic-design/GDLevel3Page'
import GDLevel3PractisePage from './pages/graphic-design/GDLevel3PractisePage'
import GDLevel3DemonstratePage from './pages/graphic-design/GDLevel3DemonstratePage'
import GDSharpeningPage from './pages/graphic-design/GDSharpeningPage'
import GDProductionPage from './pages/graphic-design/GDProductionPage'
import GuitarVirtualInstrumentPage from './pages/guitar/VirtualInstrumentPage'
import GuitarLevel1PractisePage from './pages/guitar/Level1PractisePage'
import GuitarLevel1DemonstratePage from './pages/guitar/Level1DemonstratePage'
import GuitarLevel2PractisePage from './pages/guitar/Level2PractisePage'
import GuitarLevel2DemonstratePage from './pages/guitar/Level2DemonstratePage'
import GuitarLevel3PractisePage from './pages/guitar/Level3PractisePage'
import GuitarLevel3DemonstratePage from './pages/guitar/Level3DemonstratePage'
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
import VALevel1PractisePage from './pages/visual-arts/Level1PractisePage'
import VALevel1DemonstratePage from './pages/visual-arts/Level1DemonstratePage'
import VALevel2Page from './pages/visual-arts/Level2Page'
import VALevel2PractisePage from './pages/visual-arts/Level2PractisePage'
import VALevel2DemonstratePage from './pages/visual-arts/Level2DemonstratePage'
import VALevel3Page from './pages/visual-arts/Level3Page'
import VALevel3PractisePage from './pages/visual-arts/Level3PractisePage'
import VALevel3DemonstratePage from './pages/visual-arts/Level3DemonstratePage'
import VASharpeningPage from './pages/visual-arts/SharpeningPage'
import VAProductionPage from './pages/visual-arts/VAProductionPage'
import VoiceStudioPage from './pages/voice/VoiceStudioPage'
import VoiceCourse1Page from './pages/voice/VoiceCourse1Page'
import VoiceCourse2Page from './pages/voice/VoiceCourse2Page'
import VoiceLevel1Page from './pages/voice/VoiceLevel1Page'
import VoiceLevel1PractisePage from './pages/voice/VoiceLevel1PractisePage'
import VoiceLevel1DemonstratePage from './pages/voice/VoiceLevel1DemonstratePage'
import VoiceLevel2Page from './pages/voice/VoiceLevel2Page'
import VoiceLevel2PractisePage from './pages/voice/VoiceLevel2PractisePage'
import VoiceLevel2DemonstratePage from './pages/voice/VoiceLevel2DemonstratePage'
import VoiceLevel3Page from './pages/voice/VoiceLevel3Page'
import VoiceLevel3PractisePage from './pages/voice/VoiceLevel3PractisePage'
import VoiceLevel3DemonstratePage from './pages/voice/VoiceLevel3DemonstratePage'
import VoiceSharpeningPage from './pages/voice/VoiceSharpeningPage'
import VoiceProductionPage from './pages/voice/VoiceProductionPage'
import SettingsPage from './pages/student/SettingsPage'
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminModulesPage from './pages/admin/AdminModulesPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSupervisorsPage from './pages/admin/AdminSupervisorsPage'
import AdminSchoolsPage from './pages/admin/AdminSchoolsPage'
import AdminSchoolDetailPage from './pages/admin/AdminSchoolDetailPage'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage'
import FeedbackPage from './pages/FeedbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminPreviewPage from './pages/admin/AdminPreviewPage'
import PreviewNavBar from './components/PreviewNavBar'
import { useAuth } from './hooks/useAuth'

const PreviewContext = createContext(false)

function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreview, setIsPreview] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role !== 'admin') { setIsPreview(false); return }
    if (location.pathname.startsWith('/admin')) { setIsPreview(false); return }
    if (new URLSearchParams(location.search).get('preview') === 'true') setIsPreview(true)
    // Student page without ?preview=true → preserve current value (keep preview alive)
  }, [location, user?.role])

  return <PreviewContext.Provider value={isPreview}>{children}</PreviewContext.Provider>
}

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
  const { search } = useLocation()
  const isAdminPreview = useContext(PreviewContext)
  const urlPreview = user?.role === 'admin' && new URLSearchParams(search).get('preview') === 'true'
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'student' && !isAdminPreview && !urlPreview) return <Navigate to={roleHome(user?.role)} replace />
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

function AppContent() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isPreview = useContext(PreviewContext) && !pathname.startsWith('/admin') && user?.role === 'admin'

  const routes = (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        <Route path="/dashboard" element={<StudentRoute><DashboardPage /></StudentRoute>} />
        <Route path="/disciplines" element={<StudentRoute><DisciplineSelectPage /></StudentRoute>} />
        <Route path="/session/music" element={<StudentRoute><MusicSelectPage /></StudentRoute>} />
        <Route path="/portfolio" element={<StudentRoute><PortfolioPage /></StudentRoute>} />
        <Route path="/skill-summary" element={<StudentRoute><SkillSummaryPage /></StudentRoute>} />

        <Route path="/piano/virtual-instrument" element={<StudentRoute><PianoVirtualInstrumentPage /></StudentRoute>} />
        <Route path="/piano/understanding-the-piano" element={<StudentRoute><UnderstandingPianoPage /></StudentRoute>} />
        <Route path="/piano/notes-build-chords" element={<StudentRoute><NotesBuildChordsPage /></StudentRoute>} />
        <Route path="/piano/level-1" element={<StudentRoute><Level1Page /></StudentRoute>} />
        <Route path="/piano/level-2" element={<StudentRoute><Level2Page /></StudentRoute>} />
        <Route path="/piano/level-3" element={<StudentRoute><Level3Page /></StudentRoute>} />
        <Route path="/piano/sharpening-myself" element={<StudentRoute><SharpeningMyselfPage /></StudentRoute>} />
        <Route path="/piano/production" element={<StudentRoute><ProductionPage /></StudentRoute>} />
        <Route path="/piano/level-1/practise" element={<StudentRoute><Level1PractisePage /></StudentRoute>} />
        <Route path="/piano/level-1/demonstrate" element={<StudentRoute><Level1DemonstratePage /></StudentRoute>} />
        <Route path="/piano/level-2/practise" element={<StudentRoute><Level2PractisePage /></StudentRoute>} />
        <Route path="/piano/level-2/demonstrate" element={<StudentRoute><Level2DemonstratePage /></StudentRoute>} />
        <Route path="/piano/level-3/practise" element={<StudentRoute><Level3PractisePage /></StudentRoute>} />
        <Route path="/piano/level-3/demonstrate" element={<StudentRoute><Level3DemonstratePage /></StudentRoute>} />

        <Route path="/guitar/virtual-instrument" element={<StudentRoute><GuitarVirtualInstrumentPage /></StudentRoute>} />
        <Route path="/guitar/reading-the-fretboard" element={<StudentRoute><GuitarReadingFretboardPage /></StudentRoute>} />
        <Route path="/guitar/notes-across-the-neck" element={<StudentRoute><GuitarNotesAcrossNeckPage /></StudentRoute>} />
        <Route path="/guitar/level-1" element={<StudentRoute><GuitarLevel1Page /></StudentRoute>} />
        <Route path="/guitar/level-1/practise" element={<StudentRoute><GuitarLevel1PractisePage /></StudentRoute>} />
        <Route path="/guitar/level-1/demonstrate" element={<StudentRoute><GuitarLevel1DemonstratePage /></StudentRoute>} />
        <Route path="/guitar/level-2" element={<StudentRoute><GuitarLevel2Page /></StudentRoute>} />
        <Route path="/guitar/level-2/practise" element={<StudentRoute><GuitarLevel2PractisePage /></StudentRoute>} />
        <Route path="/guitar/level-2/demonstrate" element={<StudentRoute><GuitarLevel2DemonstratePage /></StudentRoute>} />
        <Route path="/guitar/level-3" element={<StudentRoute><GuitarLevel3Page /></StudentRoute>} />
        <Route path="/guitar/level-3/practise" element={<StudentRoute><GuitarLevel3PractisePage /></StudentRoute>} />
        <Route path="/guitar/level-3/demonstrate" element={<StudentRoute><GuitarLevel3DemonstratePage /></StudentRoute>} />
        <Route path="/guitar/sharpening-myself" element={<StudentRoute><GuitarSharpeningPage /></StudentRoute>} />
        <Route path="/guitar/production" element={<StudentRoute><GuitarProductionPage /></StudentRoute>} />

        <Route path="/graphic-design/overview" element={<StudentRoute><GDOverviewPage /></StudentRoute>} />
        <Route path="/graphic-design/virtual-studio" element={<StudentRoute><GDVirtualStudioPage /></StudentRoute>} />
        <Route path="/graphic-design/course-1" element={<StudentRoute><GDCourse1Page /></StudentRoute>} />
        <Route path="/graphic-design/course-2" element={<StudentRoute><GDCourse2Page /></StudentRoute>} />
        <Route path="/graphic-design/level-1" element={<StudentRoute><GDLevel1Page /></StudentRoute>} />
        <Route path="/graphic-design/level-1/practise" element={<StudentRoute><GDLevel1PractisePage /></StudentRoute>} />
        <Route path="/graphic-design/level-1/demonstrate" element={<StudentRoute><GDLevel1DemonstratePage /></StudentRoute>} />
        <Route path="/graphic-design/level-2" element={<StudentRoute><GDLevel2Page /></StudentRoute>} />
        <Route path="/graphic-design/level-2/practise" element={<StudentRoute><GDLevel2PractisePage /></StudentRoute>} />
        <Route path="/graphic-design/level-2/demonstrate" element={<StudentRoute><GDLevel2DemonstratePage /></StudentRoute>} />
        <Route path="/graphic-design/level-3" element={<StudentRoute><GDLevel3Page /></StudentRoute>} />
        <Route path="/graphic-design/level-3/practise" element={<StudentRoute><GDLevel3PractisePage /></StudentRoute>} />
        <Route path="/graphic-design/level-3/demonstrate" element={<StudentRoute><GDLevel3DemonstratePage /></StudentRoute>} />
        <Route path="/graphic-design/sharpening" element={<StudentRoute><GDSharpeningPage /></StudentRoute>} />
        <Route path="/graphic-design/production" element={<StudentRoute><GDProductionPage /></StudentRoute>} />

        <Route path="/visual-arts/virtual-canvas" element={<StudentRoute><VirtualCanvasPage /></StudentRoute>} />
        <Route path="/visual-arts/course-1" element={<StudentRoute><VAcourse1Page /></StudentRoute>} />
        <Route path="/visual-arts/course-2" element={<StudentRoute><VAcourse2Page /></StudentRoute>} />
        <Route path="/visual-arts/level-1" element={<StudentRoute><VALevel1Page /></StudentRoute>} />
        <Route path="/visual-arts/level-1/practise" element={<StudentRoute><VALevel1PractisePage /></StudentRoute>} />
        <Route path="/visual-arts/level-1/demonstrate" element={<StudentRoute><VALevel1DemonstratePage /></StudentRoute>} />
        <Route path="/visual-arts/level-2" element={<StudentRoute><VALevel2Page /></StudentRoute>} />
        <Route path="/visual-arts/level-2/practise" element={<StudentRoute><VALevel2PractisePage /></StudentRoute>} />
        <Route path="/visual-arts/level-2/demonstrate" element={<StudentRoute><VALevel2DemonstratePage /></StudentRoute>} />
        <Route path="/visual-arts/level-3" element={<StudentRoute><VALevel3Page /></StudentRoute>} />
        <Route path="/visual-arts/level-3/practise" element={<StudentRoute><VALevel3PractisePage /></StudentRoute>} />
        <Route path="/visual-arts/level-3/demonstrate" element={<StudentRoute><VALevel3DemonstratePage /></StudentRoute>} />
        <Route path="/visual-arts/sharpening" element={<StudentRoute><VASharpeningPage /></StudentRoute>} />
        <Route path="/visual-arts/production" element={<StudentRoute><VAProductionPage /></StudentRoute>} />

        <Route path="/voice/studio" element={<StudentRoute><VoiceStudioPage /></StudentRoute>} />
        <Route path="/voice/posture-breath-voice" element={<StudentRoute><VoiceCourse1Page /></StudentRoute>} />
        <Route path="/voice/pitch-and-scale" element={<StudentRoute><VoiceCourse2Page /></StudentRoute>} />
        <Route path="/voice/level-1" element={<StudentRoute><VoiceLevel1Page /></StudentRoute>} />
        <Route path="/voice/level-1/practise" element={<StudentRoute><VoiceLevel1PractisePage /></StudentRoute>} />
        <Route path="/voice/level-1/demonstrate" element={<StudentRoute><VoiceLevel1DemonstratePage /></StudentRoute>} />
        <Route path="/voice/level-2" element={<StudentRoute><VoiceLevel2Page /></StudentRoute>} />
        <Route path="/voice/level-2/practise" element={<StudentRoute><VoiceLevel2PractisePage /></StudentRoute>} />
        <Route path="/voice/level-2/demonstrate" element={<StudentRoute><VoiceLevel2DemonstratePage /></StudentRoute>} />
        <Route path="/voice/level-3" element={<StudentRoute><VoiceLevel3Page /></StudentRoute>} />
        <Route path="/voice/level-3/practise" element={<StudentRoute><VoiceLevel3PractisePage /></StudentRoute>} />
        <Route path="/voice/level-3/demonstrate" element={<StudentRoute><VoiceLevel3DemonstratePage /></StudentRoute>} />
        <Route path="/voice/sharpening-myself" element={<StudentRoute><VoiceSharpeningPage /></StudentRoute>} />
        <Route path="/voice/production" element={<StudentRoute><VoiceProductionPage /></StudentRoute>} />
        <Route path="/settings" element={<StudentRoute><SettingsPage /></StudentRoute>} />

        <Route path="/supervisor" element={<SupervisorRoute><SupervisorDashboardPage /></SupervisorRoute>} />

        <Route path="/admin" element={<AdminRoute><Navigate to="/admin/overview" replace /></AdminRoute>} />
        <Route path="/admin/overview" element={<AdminRoute><AdminOverviewPage /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><AdminStudentsPage /></AdminRoute>} />
        <Route path="/admin/schools" element={<AdminRoute><AdminSchoolsPage /></AdminRoute>} />
        <Route path="/admin/schools/:id" element={<AdminRoute><AdminSchoolDetailPage /></AdminRoute>} />
        <Route path="/admin/modules" element={<AdminRoute><AdminModulesPage /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="/admin/supervisors" element={<AdminRoute><AdminSupervisorsPage /></AdminRoute>} />
        <Route path="/admin/feedback" element={<AdminRoute><AdminFeedbackPage /></AdminRoute>} />
        <Route path="/admin/preview" element={<AdminRoute><AdminPreviewPage /></AdminRoute>} />

        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
  )

  if (isPreview) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <PreviewNavBar />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {routes}
        </div>
      </div>
    )
  }

  return routes
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PreviewProvider>
        <AppContent />
      </PreviewProvider>
    </BrowserRouter>
  )
}
