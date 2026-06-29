import { Router, Request, Response } from 'express'
import Feedback from '../models/Feedback'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Public: submit feedback
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, feedbackType, discipline, message, screenshotData } = req.body

    if (!feedbackType) {
      res.status(400).json({ message: 'Feedback type is required.' })
      return
    }
    if (!message || message.trim().length < 10) {
      res.status(400).json({ message: 'Message must be at least 10 characters.' })
      return
    }

    await Feedback.create({
      name: name?.trim() || undefined,
      email: email?.trim() || undefined,
      feedbackType,
      discipline: discipline || undefined,
      message: message.trim(),
      screenshotData: screenshotData || undefined,
      userAgent: req.headers['user-agent'],
    })

    res.status(201).json({ success: true })
  } catch {
    res.status(500).json({ message: 'Could not save feedback.' })
  }
})

// Admin: view all feedback
router.get('/', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissions = await Feedback.find().sort({ submittedAt: -1 })
    res.json(submissions)
  } catch {
    res.status(500).json({ message: 'Could not fetch feedback.' })
  }
})

// Admin: count submissions
router.get('/count', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Feedback.countDocuments()
    res.json({ count })
  } catch {
    res.status(500).json({ message: 'Could not count feedback.' })
  }
})

export default router
