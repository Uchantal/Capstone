import { Router } from 'express'
import { createSession, getMySessions, getMyStats } from '../controllers/sessionController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)
router.post('/', createSession)
router.get('/', getMySessions)
router.get('/stats', getMyStats)

export default router
