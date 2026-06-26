import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import GDDemonstrationProgress, { computeGDSkillLevel } from '../models/GDDemonstrationProgress'
import PortfolioItem from '../models/PortfolioItem'
import User from '../models/User'

const router = Router()
router.use(protect)

// GET /api/graphic-design/progress
router.get('/progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [journey, demo] = await Promise.all([
      JourneyProgress.findOne({ user: req.userId, discipline: 'graphic-design' }),
      GDDemonstrationProgress.findOne({ user: req.userId }),
    ])
    res.json({
      completedStages: journey?.completedStages ?? [],
      level1DemonstrationPassed: demo?.level1DemonstrationPassed ?? false,
      level2DemonstrationPassed: demo?.level2DemonstrationPassed ?? false,
      level3DemonstrationPassed: demo?.level3DemonstrationPassed ?? false,
      productionPassed: demo?.productionPassed ?? false,
      graphicDesignSkillLevel: demo ? computeGDSkillLevel(demo) : 'not-started',
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/graphic-design/demonstration/:level/complete
router.post('/demonstration/:level/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const level = parseInt(req.params.level, 10)
  if (![1, 2, 3].includes(level)) {
    res.status(400).json({ message: 'Invalid level' })
    return
  }

  const { passed, posterSnapshot, imageData } = req.body
  if (!passed) {
    res.json({ acknowledged: true })
    return
  }

  try {
    const update: Record<string, unknown> = {
      [`level${level}DemonstrationPassed`]: true,
      [`level${level}DemonstrationPassedAt`]: new Date(),
    }
    if (posterSnapshot) update[`level${level}PosterSnapshot`] = posterSnapshot

    const updated = await GDDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: update },
      { upsert: true, new: true }
    )

    updated.graphicDesignSkillLevel = computeGDSkillLevel(updated)
    await updated.save()

    if (imageData) {
      const labels: Record<number, string> = { 1: 'Level 1', 2: 'Level 2', 3: 'Level 3' }
      await PortfolioItem.create({
        user: req.userId,
        discipline: 'graphic-design',
        title: `Graphic Design ${labels[level]} Demonstration`,
        fileType: 'image/png',
        fileData: imageData,
        durationMinutes: 0,
      })
    }

    res.json({ acknowledged: true, graphicDesignSkillLevel: updated.graphicDesignSkillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/graphic-design/production/complete
router.post('/production/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const { passed } = req.body
  if (!passed) {
    res.json({ acknowledged: true })
    return
  }

  try {
    const updated = await GDDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { productionPassed: true, productionPassedAt: new Date() } },
      { upsert: true, new: true }
    )
    updated.graphicDesignSkillLevel = computeGDSkillLevel(updated)
    await updated.save()
    await User.findByIdAndUpdate(req.userId, {
      $set:      { graduated: true, graduatedAt: new Date() },
      $addToSet: { graduatedDisciplines: 'graphic-design' },
    })
    res.json({ acknowledged: true, graphicDesignSkillLevel: updated.graphicDesignSkillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
