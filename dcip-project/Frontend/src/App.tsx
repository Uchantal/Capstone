import { lazy, Suspense, createContext, useContext, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { fetchMe } from './services/api'
import { useAuth, AuthProvider } from './hooks/useAuth'
import PreviewNavBar from './components/PreviewNavBar'



// Public
const HomePage             = lazy(() => import('./pages/HomePage'))
const RegisterPage         = lazy(() => import('./pages/RegisterPage'))
const LoginPage            = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage   = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage    = lazy(() => import('./pages/ResetPasswordPage'))
const FeedbackPage         = lazy(() => import('./pages/FeedbackPage'))

// Core student pages
const DashboardPage        = lazy(() => import('./pages/DashboardPage'))
const SelectSchoolPage     = lazy(() => import('./pages/SelectSchoolPage'))
const DisciplineSelectPage = lazy(() => import('./pages/DisciplineSelectPage'))
const MusicSelectPage      = lazy(() => import('./pages/MusicSelectPage'))
const PortfolioPage        = lazy(() => import('./pages/PortfolioPage'))
const SkillSummaryPage     = lazy(() => import('./pages/SkillSummaryPage'))
const SettingsPage         = lazy(() => import('./pages/student/SettingsPage'))
const StudioPage           = lazy(() => import('./pages/StudioPage'))
const DisciplineDetailPage = lazy(() => import('./pages/DisciplineDetailPage'))

// Piano
const PianoVirtualInstrumentPage = lazy(() => import('./pages/piano/VirtualInstrumentPage'))
const UnderstandingPianoPage     = lazy(() => import('./pages/piano/UnderstandingPianoPage'))
const NotesBuildChordsPage       = lazy(() => import('./pages/piano/NotesBuildChordsPage'))
const Level1Page                 = lazy(() => import('./pages/piano/Level1Page'))
const Level2Page                 = lazy(() => import('./pages/piano/Level2Page'))
const Level3Page                 = lazy(() => import('./pages/piano/Level3Page'))
const SharpeningMyselfPage       = lazy(() => import('./pages/piano/SharpeningMyselfPage'))
const ProductionPage             = lazy(() => import('./pages/piano/ProductionPage'))
const Level1PractisePage         = lazy(() => import('./pages/piano/Level1PractisePage'))
const Level1DemonstratePage      = lazy(() => import('./pages/piano/Level1DemonstratePage'))
const Level2PractisePage         = lazy(() => import('./pages/piano/Level2PractisePage'))
const Level2DemonstratePage      = lazy(() => import('./pages/piano/Level2DemonstratePage'))
const Level3PractisePage         = lazy(() => import('./pages/piano/Level3PractisePage'))
const Level3DemonstratePage      = lazy(() => import('./pages/piano/Level3DemonstratePage'))

// Guitar
const GuitarVirtualInstrumentPage  = lazy(() => import('./pages/guitar/VirtualInstrumentPage'))
const GuitarReadingFretboardPage    = lazy(() => import('./pages/guitar/ReadingFretboardPage'))
const GuitarNotesAcrossNeckPage     = lazy(() => import('./pages/guitar/NotesAcrossNeckPage'))
const GuitarLevel1Page              = lazy(() => import('./pages/guitar/Level1Page'))
const GuitarLevel1PractisePage      = lazy(() => import('./pages/guitar/Level1PractisePage'))
const GuitarLevel1DemonstratePage   = lazy(() => import('./pages/guitar/Level1DemonstratePage'))
const GuitarLevel2Page              = lazy(() => import('./pages/guitar/Level2Page'))
const GuitarLevel2PractisePage      = lazy(() => import('./pages/guitar/Level2PractisePage'))
const GuitarLevel2DemonstratePage   = lazy(() => import('./pages/guitar/Level2DemonstratePage'))
const GuitarLevel3Page              = lazy(() => import('./pages/guitar/Level3Page'))
const GuitarLevel3PractisePage      = lazy(() => import('./pages/guitar/Level3PractisePage'))
const GuitarLevel3DemonstratePage   = lazy(() => import('./pages/guitar/Level3DemonstratePage'))
const GuitarSharpeningPage          = lazy(() => import('./pages/guitar/SharpeningMyselfPage'))
const GuitarProductionPage          = lazy(() => import('./pages/guitar/ProductionPage'))

// Graphic Design
const GDOverviewPage        = lazy(() => import('./pages/graphic-design/GDOverviewPage'))
const GDVirtualStudioPage   = lazy(() => import('./pages/graphic-design/VirtualStudioPage'))
const GDCourse1Page         = lazy(() => import('./pages/graphic-design/GDCourse1Page'))
const GDCourse2Page         = lazy(() => import('./pages/graphic-design/GDCourse2Page'))
const GDLevel1Page          = lazy(() => import('./pages/graphic-design/GDLevel1Page'))
const GDLevel1PractisePage  = lazy(() => import('./pages/graphic-design/GDLevel1PractisePage'))
const GDLevel1DemonstratePage = lazy(() => import('./pages/graphic-design/GDLevel1DemonstratePage'))
const GDLevel2Page          = lazy(() => import('./pages/graphic-design/GDLevel2Page'))
const GDLevel2PractisePage  = lazy(() => import('./pages/graphic-design/GDLevel2PractisePage'))
const GDLevel2DemonstratePage = lazy(() => import('./pages/graphic-design/GDLevel2DemonstratePage'))
const GDLevel3Page          = lazy(() => import('./pages/graphic-design/GDLevel3Page'))
const GDLevel3PractisePage  = lazy(() => import('./pages/graphic-design/GDLevel3PractisePage'))
const GDLevel3DemonstratePage = lazy(() => import('./pages/graphic-design/GDLevel3DemonstratePage'))
const GDSharpeningPage      = lazy(() => import('./pages/graphic-design/GDSharpeningPage'))
const GDProductionPage      = lazy(() => import('./pages/graphic-design/GDProductionPage'))

// Visual Arts
const VirtualCanvasPage       = lazy(() => import('./pages/visual-arts/VirtualCanvasPage'))
const VAcourse1Page           = lazy(() => import('./pages/visual-arts/Course1Page'))
const VAcourse2Page           = lazy(() => import('./pages/visual-arts/Course2Page'))
const VALevel1Page            = lazy(() => import('./pages/visual-arts/Level1Page'))
const VALevel1PractisePage    = lazy(() => import('./pages/visual-arts/Level1PractisePage'))
const VALevel1DemonstratePage = lazy(() => import('./pages/visual-arts/Level1DemonstratePage'))
const VALevel2Page            = lazy(() => import('./pages/visual-arts/Level2Page'))
const VALevel2PractisePage    = lazy(() => import('./pages/visual-arts/Level2PractisePage'))
const VALevel2DemonstratePage = lazy(() => import('./pages/visual-arts/Level2DemonstratePage'))
const VALevel3Page            = lazy(() => import('./pages/visual-arts/Level3Page'))
const VALevel3PractisePage    = lazy(() => import('./pages/visual-arts/Level3PractisePage'))
const VALevel3DemonstratePage = lazy(() => import('./pages/visual-arts/Level3DemonstratePage'))
const VASharpeningPage        = lazy(() => import('./pages/visual-arts/SharpeningPage'))
const VAProductionPage        = lazy(() => import('./pages/visual-arts/VAProductionPage'))

// Voice
const VoiceStudioPage          = lazy(() => import('./pages/voice/VoiceStudioPage'))
const VoiceCourse1Page         = lazy(() => import('./pages/voice/VoiceCourse1Page'))
const VoiceCourse2Page         = lazy(() => import('./pages/voice/VoiceCourse2Page'))
const VoiceLevel1Page          = lazy(() => import('./pages/voice/VoiceLevel1Page'))
const VoiceLevel1PractisePage  = lazy(() => import('./pages/voice/VoiceLevel1PractisePage'))
const VoiceLevel1DemonstratePage = lazy(() => import('./pages/voice/VoiceLevel1DemonstratePage'))
const VoiceLevel2Page          = lazy(() => import('./pages/voice/VoiceLevel2Page'))
const VoiceLevel2PractisePage  = lazy(() => import('./pages/voice/VoiceLevel2PractisePage'))
const VoiceLevel2DemonstratePage = lazy(() => import('./pages/voice/VoiceLevel2DemonstratePage'))
const VoiceLevel3Page          = lazy(() => import('./pages/voice/VoiceLevel3Page'))
const VoiceLevel3PractisePage  = lazy(() => import('./pages/voice/VoiceLevel3PractisePage'))
const VoiceLevel3DemonstratePage = lazy(() => import('./pages/voice/VoiceLevel3DemonstratePage'))
const VoiceSharpeningPage      = lazy(() => import('./pages/voice/VoiceSharpeningPage'))
const VoiceProductionPage      = lazy(() => import('./pages/voice/VoiceProductionPage'))

// Admin
const AdminOverviewPage     = lazy(() => import('./pages/admin/AdminOverviewPage'))
const AdminStudentsPage     = lazy(() => import('./pages/admin/AdminStudentsPage'))
const AdminModulesPage      = lazy(() => import('./pages/admin/AdminModulesPage'))
const AdminReportsPage      = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminSupervisorsPage  = lazy(() => import('./pages/admin/AdminSupervisorsPage'))
const AdminSchoolsPage      = lazy(() => import('./pages/admin/AdminSchoolsPage'))
const AdminSchoolDetailPage = lazy(() => import('./pages/admin/AdminSchoolDetailPage'))
const AdminFeedbackPage     = lazy(() => import('./pages/admin/AdminFeedbackPage'))
const AdminPreviewPage      = lazy(() => import('./pages/admin/AdminPreviewPage'))
const AdminStudioPage       = lazy(() => import('./pages/admin/AdminStudioPage'))
const AdminAnalyticsPage    = lazy(() => import('./pages/admin/AdminAnalyticsPage'))

// Glossaries
const GlossaryPage              = lazy(() => import('./pages/guitar/GlossaryPage'))
const PianoGlossaryPage         = lazy(() => import('./pages/piano/GlossaryPage'))
const VoiceGlossaryPage         = lazy(() => import('./pages/voice/VoiceGlossaryPage'))

// Loading fallback
function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

// Route guards
const PreviewContext = createContext(false)

function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreview, setIsPreview] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role !== 'admin') { setIsPreview(false); return }
    if (location.pathname.startsWith('/admin')) { setIsPreview(false); return }
    if (new URLSearchParams(location.search).get('preview') === 'true') setIsPreview(true)
  }, [location, user?.role])

  return <PreviewContext.Provider value={isPreview}>{children}</PreviewContext.Provider>
}

const roleHome = (role?: string) => {
  if (role === 'admin') return '/admin/overview'
  return '/disciplines'
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (token) return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

const _studentRefreshed = { done: false }

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { token, user, updateUser } = useAuth()
  const { search, pathname } = useLocation()
  const isAdminPreview = useContext(PreviewContext)
  const urlPreview = user?.role === 'admin' && new URLSearchParams(search).get('preview') === 'true'
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current || _studentRefreshed.done || !token || user?.role !== 'student') return
    ranRef.current = true
    _studentRefreshed.done = true
    fetchMe().then(res => updateUser(res.data)).catch(() => {})
  }, [token, user?.role])

  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'student' && !isAdminPreview && !urlPreview) return <Navigate to={roleHome(user?.role)} replace />
  if (user?.role === 'student' && !user.school && pathname !== '/select-school') return <Navigate to="/select-school" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to={roleHome(user?.role)} replace />
  return <>{children}</>
}

// Routes
function AppContent() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isPreview = useContext(PreviewContext) && !pathname.startsWith('/admin') && user?.role === 'admin'

  const S = (C: React.ComponentType) => <StudentRoute><C /></StudentRoute>
  const A = (C: React.ComponentType) => <AdminRoute><C /></AdminRoute>

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/"               element={<HomePage />} />
        <Route path="/register"       element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/feedback"       element={<FeedbackPage />} />

        {/* Core student */}
        <Route path="/dashboard"      element={S(DashboardPage)} />
        <Route path="/select-school"  element={S(SelectSchoolPage)} />
        <Route path="/disciplines"    element={S(DisciplineSelectPage)} />
        <Route path="/session/music"  element={S(MusicSelectPage)} />
        <Route path="/portfolio"      element={S(PortfolioPage)} />
        <Route path="/skill-summary"  element={S(SkillSummaryPage)} />
        <Route path="/settings"       element={S(SettingsPage)} />
        <Route path="/studio"         element={S(StudioPage)} />
        <Route path="/discipline/:key" element={S(DisciplineDetailPage)} />

        {/* Piano */}
        <Route path="/piano/virtual-instrument"    element={S(PianoVirtualInstrumentPage)} />
        <Route path="/piano/understanding-the-piano" element={S(UnderstandingPianoPage)} />
        <Route path="/piano/notes-build-chords"    element={S(NotesBuildChordsPage)} />
        <Route path="/piano/level-1"               element={S(Level1Page)} />
        <Route path="/piano/level-2"               element={S(Level2Page)} />
        <Route path="/piano/level-3"               element={S(Level3Page)} />
        <Route path="/piano/sharpening-myself"     element={S(SharpeningMyselfPage)} />
        <Route path="/piano/production"            element={S(ProductionPage)} />
        <Route path="/piano/glossary"              element={S(PianoGlossaryPage)} />
        <Route path="/piano/level-1/practise"      element={S(Level1PractisePage)} />
        <Route path="/piano/level-1/demonstrate"   element={S(Level1DemonstratePage)} />
        <Route path="/piano/level-2/practise"      element={S(Level2PractisePage)} />
        <Route path="/piano/level-2/demonstrate"   element={S(Level2DemonstratePage)} />
        <Route path="/piano/level-3/practise"      element={S(Level3PractisePage)} />
        <Route path="/piano/level-3/demonstrate"   element={S(Level3DemonstratePage)} />

        {/* Guitar */}
        <Route path="/guitar/virtual-instrument"   element={S(GuitarVirtualInstrumentPage)} />
        <Route path="/guitar/reading-the-fretboard" element={S(GuitarReadingFretboardPage)} />
        <Route path="/guitar/notes-across-the-neck" element={S(GuitarNotesAcrossNeckPage)} />
        <Route path="/guitar/level-1"              element={S(GuitarLevel1Page)} />
        <Route path="/guitar/level-1/practise"     element={S(GuitarLevel1PractisePage)} />
        <Route path="/guitar/level-1/demonstrate"  element={S(GuitarLevel1DemonstratePage)} />
        <Route path="/guitar/level-2"              element={S(GuitarLevel2Page)} />
        <Route path="/guitar/level-2/practise"     element={S(GuitarLevel2PractisePage)} />
        <Route path="/guitar/level-2/demonstrate"  element={S(GuitarLevel2DemonstratePage)} />
        <Route path="/guitar/level-3"              element={S(GuitarLevel3Page)} />
        <Route path="/guitar/level-3/practise"     element={S(GuitarLevel3PractisePage)} />
        <Route path="/guitar/level-3/demonstrate"  element={S(GuitarLevel3DemonstratePage)} />
        <Route path="/guitar/sharpening-myself"    element={S(GuitarSharpeningPage)} />
        <Route path="/guitar/production"           element={S(GuitarProductionPage)} />
        <Route path="/guitar/glossary"             element={S(GlossaryPage)} />

        {/* Graphic Design */}
        <Route path="/graphic-design/overview"            element={S(GDOverviewPage)} />
        <Route path="/graphic-design/virtual-studio"      element={S(GDVirtualStudioPage)} />
        <Route path="/graphic-design/course-1"            element={S(GDCourse1Page)} />
        <Route path="/graphic-design/course-2"            element={S(GDCourse2Page)} />
        <Route path="/graphic-design/level-1"             element={S(GDLevel1Page)} />
        <Route path="/graphic-design/level-1/practise"    element={S(GDLevel1PractisePage)} />
        <Route path="/graphic-design/level-1/demonstrate" element={S(GDLevel1DemonstratePage)} />
        <Route path="/graphic-design/level-2"             element={S(GDLevel2Page)} />
        <Route path="/graphic-design/level-2/practise"    element={S(GDLevel2PractisePage)} />
        <Route path="/graphic-design/level-2/demonstrate" element={S(GDLevel2DemonstratePage)} />
        <Route path="/graphic-design/level-3"             element={S(GDLevel3Page)} />
        <Route path="/graphic-design/level-3/practise"    element={S(GDLevel3PractisePage)} />
        <Route path="/graphic-design/level-3/demonstrate" element={S(GDLevel3DemonstratePage)} />
        <Route path="/graphic-design/sharpening"          element={S(GDSharpeningPage)} />
        <Route path="/graphic-design/production"          element={S(GDProductionPage)} />

        {/* Visual Arts */}
        <Route path="/visual-arts/virtual-canvas"       element={S(VirtualCanvasPage)} />
        <Route path="/visual-arts/course-1"             element={S(VAcourse1Page)} />
        <Route path="/visual-arts/course-2"             element={S(VAcourse2Page)} />
        <Route path="/visual-arts/level-1"              element={S(VALevel1Page)} />
        <Route path="/visual-arts/level-1/practise"     element={S(VALevel1PractisePage)} />
        <Route path="/visual-arts/level-1/demonstrate"  element={S(VALevel1DemonstratePage)} />
        <Route path="/visual-arts/level-2"              element={S(VALevel2Page)} />
        <Route path="/visual-arts/level-2/practise"     element={S(VALevel2PractisePage)} />
        <Route path="/visual-arts/level-2/demonstrate"  element={S(VALevel2DemonstratePage)} />
        <Route path="/visual-arts/level-3"              element={S(VALevel3Page)} />
        <Route path="/visual-arts/level-3/practise"     element={S(VALevel3PractisePage)} />
        <Route path="/visual-arts/level-3/demonstrate"  element={S(VALevel3DemonstratePage)} />
        <Route path="/visual-arts/sharpening"           element={S(VASharpeningPage)} />
        <Route path="/visual-arts/production"           element={S(VAProductionPage)} />

        {/* Voice */}
        <Route path="/voice/studio"                  element={S(VoiceStudioPage)} />
        <Route path="/voice/posture-breath-voice"    element={S(VoiceCourse1Page)} />
        <Route path="/voice/pitch-and-scale"         element={S(VoiceCourse2Page)} />
        <Route path="/voice/level-1"                 element={S(VoiceLevel1Page)} />
        <Route path="/voice/level-1/practise"        element={S(VoiceLevel1PractisePage)} />
        <Route path="/voice/level-1/demonstrate"     element={S(VoiceLevel1DemonstratePage)} />
        <Route path="/voice/level-2"                 element={S(VoiceLevel2Page)} />
        <Route path="/voice/level-2/practise"        element={S(VoiceLevel2PractisePage)} />
        <Route path="/voice/level-2/demonstrate"     element={S(VoiceLevel2DemonstratePage)} />
        <Route path="/voice/level-3"                 element={S(VoiceLevel3Page)} />
        <Route path="/voice/level-3/practise"        element={S(VoiceLevel3PractisePage)} />
        <Route path="/voice/level-3/demonstrate"     element={S(VoiceLevel3DemonstratePage)} />
        <Route path="/voice/sharpening-myself"       element={S(VoiceSharpeningPage)} />
        <Route path="/voice/production"              element={S(VoiceProductionPage)} />
        <Route path="/voice/glossary"                element={S(VoiceGlossaryPage)} />

        {/* Admin */}
        <Route path="/admin"                element={A(() => <Navigate to="/admin/overview" replace />)} />
        <Route path="/admin/overview"       element={A(AdminOverviewPage)} />
        <Route path="/admin/students"       element={A(AdminStudentsPage)} />
        <Route path="/admin/schools"        element={A(AdminSchoolsPage)} />
        <Route path="/admin/schools/:id"    element={A(AdminSchoolDetailPage)} />
        <Route path="/admin/modules"        element={A(AdminModulesPage)} />
        <Route path="/admin/reports"        element={A(AdminReportsPage)} />
        <Route path="/admin/analytics"      element={A(AdminAnalyticsPage)} />
        <Route path="/admin/supervisors"    element={A(AdminSupervisorsPage)} />
        <Route path="/admin/feedback"       element={A(AdminFeedbackPage)} />
        <Route path="/admin/preview"        element={A(AdminPreviewPage)} />
        <Route path="/admin/studio"         element={A(AdminStudioPage)} />

        {/* Catch-all — redirect unmatched paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PreviewProvider>
          <AppContent />
        </PreviewProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
