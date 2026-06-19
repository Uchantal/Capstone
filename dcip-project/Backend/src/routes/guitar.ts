import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import GuitarDemonstrationProgress, { computeGuitarSkillLevel } from '../models/GuitarDemonstrationProgress'

const router = Router()
router.use(protect)

// GET /api/guitar/progress
router.get('/progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [journey, demo] = await Promise.all([
      JourneyProgress.findOne({ user: req.userId, discipline: 'guitar' }),
      GuitarDemonstrationProgress.findOne({ user: req.userId }),
    ])
    res.json({
      completedStages: journey?.completedStages ?? [],
      level1DemonstrationPassed: demo?.level1DemonstrationPassed ?? false,
      level2DemonstrationPassed: demo?.level2DemonstrationPassed ?? false,
      level3DemonstrationPassed: demo?.level3DemonstrationPassed ?? false,
      productionPassed: demo?.productionPassed ?? false,
      guitarSkillLevel: demo?.guitarSkillLevel ?? 'not-started',
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/guitar/demonstration/:level/complete
router.post('/demonstration/:level/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const level = parseInt(req.params.level, 10)
  if (![1, 2, 3].includes(level)) {
    res.status(400).json({ message: 'Invalid level' })
    return
  }
  const { passed } = req.body as { passed: boolean }
  try {
    if (!passed) {
      const demo = await GuitarDemonstrationProgress.findOne({ user: req.userId })
      res.json({ guitarSkillLevel: demo?.guitarSkillLevel ?? 'not-started' })
      return
    }
    const passedField = `level${level}DemonstrationPassed`
    const dateField   = `level${level}DemonstrationPassedAt`
    const demo = await GuitarDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { [passedField]: true, [dateField]: new Date() } },
      { new: true, upsert: true },
    )
    const skillLevel = computeGuitarSkillLevel(demo)
    await GuitarDemonstrationProgress.updateOne({ user: req.userId }, { $set: { guitarSkillLevel: skillLevel } })
    res.json({ guitarSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/guitar/production/complete
router.post('/production/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const { passed } = req.body as { passed: boolean }
  try {
    if (!passed) {
      const demo = await GuitarDemonstrationProgress.findOne({ user: req.userId })
      res.json({ guitarSkillLevel: demo?.guitarSkillLevel ?? 'not-started' })
      return
    }
    const demo = await GuitarDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { productionPassed: true, productionPassedAt: new Date() } },
      { new: true, upsert: true },
    )
    const skillLevel = computeGuitarSkillLevel(demo)
    await GuitarDemonstrationProgress.updateOne({ user: req.userId }, { $set: { guitarSkillLevel: skillLevel } })
    res.json({ guitarSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
