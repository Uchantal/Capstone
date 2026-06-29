import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import Draft from '../models/Draft'

const router = Router()
router.use(protect)

// Save or update draft — one slot per student per discipline
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, snapshot, thumbnailData } = req.body
    if (!discipline || !snapshot) {
      res.status(400).json({ message: 'Missing required fields' })
      return
    }
    const update: Record<string, unknown> = { snapshot, updatedAt: new Date() }
    if (thumbnailData) update.thumbnailData = thumbnailData
    const draft = await Draft.findOneAndUpdate(
      { user: req.userId, discipline },
      update,
      { upsert: true, new: true }
    )
    const { snapshot: _s, thumbnailData: _t, ...meta } = draft.toObject()
    res.json(meta)
  } catch {
    res.status(500).json({ message: 'Failed to save draft' })
  }
})

// Get the current draft for a discipline
router.get('/:discipline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline } = req.params
    const draft = await Draft.findOne({ user: req.userId, discipline })
    if (!draft) { res.status(404).json({ message: 'No draft found' }); return }
    res.json(draft)
  } catch {
    res.status(500).json({ message: 'Failed to fetch draft' })
  }
})

// Delete the draft for a discipline (called after submitting to portfolio)
router.delete('/:discipline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline } = req.params
    await Draft.findOneAndDelete({ user: req.userId, discipline })
    res.json({ message: 'Draft deleted' })
  } catch {
    res.status(500).json({ message: 'Failed to delete draft' })
  }
})

export default router
