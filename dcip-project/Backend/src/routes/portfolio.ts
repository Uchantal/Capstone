import { Router } from 'express'
import {
  savePortfolioItem,
  getMyPortfolio,
  getPortfolioItem,
  deletePortfolioItem,
} from '../controllers/portfolioController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)
router.post('/', savePortfolioItem)
router.get('/', getMyPortfolio)
router.get('/:id', getPortfolioItem)
router.delete('/:id', deletePortfolioItem)

export default router
