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

export const updateDiscipline = (discipline: string) =>
  api.patch('/auth/discipline', { discipline })

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

export const getAdminReports = () => api.get('/admin/reports')

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

export const getSupervisorSchoolAnalytics = () => api.get('/supervisor/school-analytics')

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

export default api
