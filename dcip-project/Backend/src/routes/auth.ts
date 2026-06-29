import { Router } from 'express'
import { register, login, getSchools, updateDiscipline, updateSchool, changePassword, getMe, forgotPassword, resetPassword, verifyEmail } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.get('/schools', getSchools)
router.patch('/discipline', protect, updateDiscipline)
router.patch('/school', protect, updateSchool)
router.put('/change-password', protect, changePassword)
router.get('/me', protect, getMe)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
