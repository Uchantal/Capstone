import api from './api'

export const getAdminStats = () =>
  api.get<{ activeStudents: number; totalSessions: number; portfolioItems: number; pilotSchools: number }>('/admin/stats')

export const getAdminSchools = () => api.get('/admin/schools')
export const activateSchool = (id: string) => api.patch(`/admin/schools/${id}/activate`)
export const deactivateSchool = (id: string) => api.patch(`/admin/schools/${id}/deactivate`)

export const getAdminStudents = () => api.get('/admin/students')
export const activateStudent = (id: string) => api.patch(`/admin/students/${id}/activate`)
export const deactivateStudent = (id: string) => api.patch(`/admin/students/${id}/deactivate`)

export const getAdminModules = () => api.get('/admin/modules')
export const activateModule = (id: string) => api.patch(`/admin/modules/${id}/activate`)
export const deactivateModule = (id: string) => api.patch(`/admin/modules/${id}/deactivate`)
export const createModule = (data: { name: string; description: string; slug: string }) =>
  api.post('/admin/modules', data)

export const getAdminReports = () => api.get('/admin/reports')

export const getAdminSupervisors = () => api.get('/admin/supervisors')
export const createSupervisor = (data: {
  fullName: string
  username: string
  email: string
  password: string
  schoolId: string
}) => api.post('/admin/supervisors', data)
