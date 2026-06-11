import { Router } from 'express'
import { register, login, getSchools, updateDiscipline } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/schools', getSchools)
router.patch('/discipline', protect, updateDiscipline)

export default router
