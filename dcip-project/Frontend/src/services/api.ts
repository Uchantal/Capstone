import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const registerUser = (data: {
  fullName: string
  username: string
  email: string
  password: string
  schoolId: string
}) => api.post('/auth/register', data)

export const loginUser = (data: { username: string; password: string }) =>
  api.post('/auth/login', data)

export const fetchSchools = () => api.get('/auth/schools')

export const updateDiscipline = (discipline: string, subDiscipline?: string) =>
  api.patch('/auth/discipline', { discipline, ...(subDiscipline ? { subDiscipline } : {}) })

export const fetchMe = () => api.get('/auth/me')

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put('/auth/change-password', { currentPassword, newPassword })

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword })

// Sessions
export const createSession = (data: { discipline: string; durationMinutes: number }) =>
  api.post('/sessions', data)

export const fetchSessions = () => api.get('/sessions')

export const fetchStats = () => api.get('/sessions/stats')

// Portfolio
export const savePortfolioItem = (data: {
  discipline: string
  title: string
  fileType: string
  fileData: string
  durationMinutes: number
}) => api.post('/portfolio', data)

export const fetchPortfolio = () => api.get('/portfolio')

export const fetchPortfolioItem = (id: string) => api.get(`/portfolio/${id}`)

export const deletePortfolioItem = (id: string) => api.delete(`/portfolio/${id}`)

// Admin
export const getAdminStudents = () => api.get('/admin/students')

export const toggleStudentStatus = (id: string) => api.patch(`/admin/students/${id}/toggle`)

export const getAdminModules = () => api.get('/admin/modules')

export const toggleModule = (id: string) => api.patch(`/admin/modules/${id}/toggle`)

export const getAdminReports = (params?: { startDate?: string; endDate?: string }) => {
  const q = new URLSearchParams()
  if (params?.startDate) q.set('startDate', params.startDate)
  if (params?.endDate) q.set('endDate', params.endDate)
  const qs = q.toString()
  return api.get(`/admin/reports${qs ? `?${qs}` : ''}`)
}

export const getAdminSupervisors = () => api.get('/admin/supervisors')

export const createSupervisor = (data: {
  fullName: string
  username: string
  email: string
  password: string
  schoolId: string
}) => api.post('/admin/supervisors', data)

// Sessions: progress and analytics
export const fetchProgress = () => api.get('/sessions/progress')

export const fetchProgressByDiscipline = (discipline: string) =>
  api.get(`/sessions/progress/${discipline}`)

export const fetchAnalytics = () => api.get('/sessions/analytics')

export const fetchCurriculum = (discipline: string) =>
  api.get(`/sessions/curriculum/${discipline}`)

// Supervisor
export const getSupervisorActiveSessions = () => api.get('/supervisor/sessions/active')

export const getSupervisorStudents = () => api.get('/supervisor/students')

export const getSupervisorProgress = () => api.get('/supervisor/progress')

export const getSupervisorLiveActivity = () => api.get('/supervisor/live-activity')

export const getSupervisorSchoolAnalytics = (period?: string) => api.get(`/supervisor/school-analytics${period ? `?period=${period}` : ''}`)

// Production
export const saveProductionResult = (data: {
  discipline: string
  totalPrompts: number
  correctCount: number
  outcome: 'demonstrated' | 'needs-more-practice'
  attemptDetails: { chordSymbol: string; correct: boolean; timeTakenMs: number }[]
  noteEvents?: object[]
  verificationResult?: object
}) => api.post('/production/result', data)

export const fetchMyProductionResults = (discipline?: string) =>
  api.get('/production/result/me', { params: discipline ? { discipline } : {} })

// Journey (Visual Arts structured progression)
export const fetchJourneyProgress = (discipline: string) =>
  api.get('/journey/progress', { params: { discipline } })

export const completeJourneyStage = (data: { discipline: string; stageId: string }) =>
  api.post('/journey/complete-stage', data)

export const saveVAProductionResult = (data: {
  finalImageData: string
  checklistConfirmed: {
    hasThreeShapes: boolean
    usedColourIntentionally: boolean
    hasVisibleShading: boolean
    isOriginalWork: boolean
  }
}) => api.post('/journey/va-production', data)

// Journey (Graphic Design structured progression)
export const fetchGDLevelPoster = (level: number) =>
  api.get('/journey/gd-level-poster', { params: { level } })

export const saveGDLevelPoster = (data: {
  level: number
  title?: string
  subtitle?: string
  fontSize?: string
  alignment?: string
  bgColour?: string
  titleColour?: string
  reasoning: string
  elementsJson?: string
}) => api.post('/journey/gd-level-poster', data)

export const saveGDProductionResult = (data: {
  posterTitle: string
  posterSubtitle: string
  fontSize: string
  alignment: string
  bgColour: string
  titleColour: string
  finalImageData: string
  reasoningText: string
  checklistConfirmed: {
    hasTitleAndSubtitle: boolean
    hasStrongContrast: boolean
    hasIntentionalLayout: boolean
    hasReasoningText: boolean
    isOriginalWork: boolean
  }
}) => api.post('/journey/gd-production', data)

// Piano demonstration-based progression
export const fetchPianoProgress = () =>
  api.get('/piano/progress')

export const completePianoDemonstration = (level: 1 | 2 | 3, passed: boolean) =>
  api.post(`/piano/demonstration/${level}/complete`, { passed })

export const completePianoProduction = (passed: boolean) =>
  api.post('/piano/production/complete', { passed })

// Guitar demonstration-based progression
export const fetchGuitarProgress = () => api.get('/guitar/progress')
export const completeGuitarDemonstration = (level: 1 | 2 | 3, passed: boolean) =>
  api.post(`/guitar/demonstration/${level}/complete`, { passed })
export const completeGuitarProduction = (passed: boolean) =>
  api.post('/guitar/production/complete', { passed })

// Visual Arts demonstration-based progression
export const fetchVisualArtsProgress = () => api.get('/visual-arts/progress')
export const completeVisualArtsDemonstration = (level: 1 | 2 | 3, passed: boolean, canvasSnapshot: string) =>
  api.post(`/visual-arts/demonstration/${level}/complete`, { passed, canvasSnapshot })
export const completeVisualArtsProduction = (passed: boolean) =>
  api.post('/visual-arts/production/complete', { passed })

// Graphic Design demonstration-based progression
export const fetchGDProgress = () => api.get('/graphic-design/progress')
export const completeGDDemonstration = (level: 1 | 2 | 3, passed: boolean, posterSnapshot: string, imageData: string) =>
  api.post(`/graphic-design/demonstration/${level}/complete`, { passed, posterSnapshot, imageData })
export const completeGDProduction = (passed: boolean) =>
  api.post('/graphic-design/production/complete', { passed })

// Voice demonstration-based progression
export const fetchVoiceProgress = () => api.get('/voice/progress')
export const completeVoiceDemonstration = (level: 1 | 2 | 3, passed: boolean) =>
  api.post(`/voice/demonstration/${level}/complete`, { passed })
export const completeVoiceProduction = (passed: boolean) =>
  api.post('/voice/production/complete', { passed })

// Unified skill summary — all disciplines, stage-based skill levels
export const fetchProgressSummary = () => api.get('/progress/summary')

// Feedback
export const submitFeedback = (data: {
  name?: string
  email?: string
  feedbackType: string
  discipline?: string
  message: string
}) => api.post('/feedback', data)

export const getAdminFeedback = () => api.get('/feedback')
export const getAdminFeedbackCount = () => api.get('/feedback/count')

// Engagement tracking
export const saveEngagementScore = (discipline: string, stage: string, score: number) =>
  api.post(`/engagement/${discipline}/${stage}`, { score })

export const fetchEngagementScores = (discipline: string) =>
  api.get(`/engagement/${discipline}`)

export const fetchAdminStudentProfile = (id: string) =>
  api.get(`/admin/students/${id}/profile`)

export default api
