import { Router } from 'express'
import { register, login, getSchools, updateDiscipline, changePassword, getMe, forgotPassword, resetPassword } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/schools', getSchools)
router.patch('/discipline', protect, updateDiscipline)
router.put('/change-password', protect, changePassword)
router.get('/me', protect, getMe)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
