import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import {
  saveStudioWork,
  getStudioWorks,
  getStudioWork,
  deleteStudioWork,
  moveStudioWork,
  getFolders,
  createFolder,
  deleteFolder,
} from '../controllers/studioController'

const router = Router()
router.use(protect)

router.get('/folders',     getFolders)
router.post('/folders',    createFolder)
router.delete('/folders/:id', deleteFolder)

router.post('/',       saveStudioWork)
router.get('/',        getStudioWorks)
router.get('/:id',     getStudioWork)
router.delete('/:id',  deleteStudioWork)
router.patch('/:id/folder', moveStudioWork)

export default router
