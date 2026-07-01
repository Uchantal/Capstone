import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import { testAI, critiqueArtwork, askCourseHint } from '../controllers/aiController'

const router = Router()
router.use(protect)

router.get('/test',       testAI)
router.post('/critique',  critiqueArtwork)
router.post('/hint',      askCourseHint)

export default router
