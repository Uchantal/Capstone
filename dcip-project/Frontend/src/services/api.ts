import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach JWT token to every request
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

export default api
