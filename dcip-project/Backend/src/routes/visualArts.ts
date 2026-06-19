import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import VisualArtsDemonstrationProgress, { computeVisualArtsSkillLevel } from '../models/VisualArtsDemonstrationProgress'
import PortfolioItem from '../models/PortfolioItem'

const router = Router()
router.use(protect)

// GET /api/visual-arts/progress
router.get('/progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [journey, demo] = await Promise.all([
      JourneyProgress.findOne({ user: req.userId, discipline: 'visual-arts' }),
      VisualArtsDemonstrationProgress.findOne({ user: req.userId }),
    ])
    res.json({
      completedStages: journey?.completedStages ?? [],
      level1DemonstrationPassed: demo?.level1DemonstrationPassed ?? false,
      level2DemonstrationPassed: demo?.level2DemonstrationPassed ?? false,
      level3DemonstrationPassed: demo?.level3DemonstrationPassed ?? false,
      productionPassed: demo?.productionPassed ?? false,
      visualArtsSkillLevel: demo?.visualArtsSkillLevel ?? 'not-started',
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/visual-arts/demonstration/:level/complete
router.post('/demonstration/:level/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const level = parseInt(req.params.level, 10)
  if (![1, 2, 3].includes(level)) {
    res.status(400).json({ message: 'Invalid level' })
    return
  }
  const { passed, canvasSnapshot } = req.body as { passed: boolean; canvasSnapshot?: string }
  try {
    if (!passed) {
      const demo = await VisualArtsDemonstrationProgress.findOne({ user: req.userId })
      res.json({ visualArtsSkillLevel: demo?.visualArtsSkillLevel ?? 'not-started' })
      return
    }
    const passedField = `level${level}DemonstrationPassed`
    const dateField   = `level${level}DemonstrationPassedAt`
    const snapField   = `level${level}DemonstrationCanvasSnapshot`

    const updateFields: Record<string, unknown> = {
      [passedField]: true,
      [dateField]: new Date(),
    }
    if (canvasSnapshot) updateFields[snapField] = canvasSnapshot

    const demo = await VisualArtsDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: updateFields },
      { new: true, upsert: true },
    )
    const skillLevel = computeVisualArtsSkillLevel(demo)
    await VisualArtsDemonstrationProgress.updateOne(
      { user: req.userId },
      { $set: { visualArtsSkillLevel: skillLevel } }
    )

    if (canvasSnapshot) {
      await PortfolioItem.create({
        user: req.userId,
        discipline: 'visual-arts',
        title: `Level ${level} Demonstration`,
        fileType: 'image/png',
        fileData: canvasSnapshot,
        syncStatus: 'synced',
      })
    }

    res.json({ visualArtsSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/visual-arts/production/complete
router.post('/production/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const { passed } = req.body as { passed: boolean }
  try {
    if (!passed) {
      const demo = await VisualArtsDemonstrationProgress.findOne({ user: req.userId })
      res.json({ visualArtsSkillLevel: demo?.visualArtsSkillLevel ?? 'not-started' })
      return
    }
    const demo = await VisualArtsDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { productionPassed: true, productionPassedAt: new Date() } },
      { new: true, upsert: true },
    )
    const skillLevel = computeVisualArtsSkillLevel(demo)
    await VisualArtsDemonstrationProgress.updateOne(
      { user: req.userId },
      { $set: { visualArtsSkillLevel: skillLevel } }
    )
    res.json({ visualArtsSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
