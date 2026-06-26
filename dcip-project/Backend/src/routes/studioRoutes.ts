import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import {
  saveStudioWork,
  getStudioWorks,
  getStudioWork,
  deleteStudioWork,
} from '../controllers/studioController'

const router = Router()
router.use(protect)

router.post('/',       saveStudioWork)
router.get('/',        getStudioWorks)
router.get('/:id',     getStudioWork)
router.delete('/:id',  deleteStudioWork)

export default router
