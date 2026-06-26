import { Router } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import PianoDemonstrationProgress, { computePianoSkillLevel } from '../models/PianoDemonstrationProgress'
import User from '../models/User'

const router = Router()

// GET /api/piano/progress
// Returns all piano progress: journey stages + demonstration pass states + skill level
router.get('/progress', protect, async (req: AuthRequest, res) => {
  try {
    const [journey, demo] = await Promise.all([
      JourneyProgress.findOne({ user: req.userId, discipline: 'piano' }),
      PianoDemonstrationProgress.findOne({ user: req.userId }),
    ])
    res.json({
      completedStages: journey?.completedStages ?? [],
      level1DemonstrationPassed:   demo?.level1DemonstrationPassed   ?? false,
      level1DemonstrationPassedAt: demo?.level1DemonstrationPassedAt ?? null,
      level2DemonstrationPassed:   demo?.level2DemonstrationPassed   ?? false,
      level2DemonstrationPassedAt: demo?.level2DemonstrationPassedAt ?? null,
      level3DemonstrationPassed:   demo?.level3DemonstrationPassed   ?? false,
      level3DemonstrationPassedAt: demo?.level3DemonstrationPassedAt ?? null,
      productionPassed:            demo?.productionPassed            ?? false,
      productionPassedAt:          demo?.productionPassedAt          ?? null,
      pianoSkillLevel:             demo?.pianoSkillLevel             ?? 'not-started',
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/piano/demonstration/:level/complete
// body: { passed: boolean }
// Updates the corresponding demonstration field and recomputes pianoSkillLevel.
// Only records a pass — a false passed value is a no-op (students can retry freely).
router.post('/demonstration/:level/complete', protect, async (req: AuthRequest, res) => {
  try {
    const level = parseInt(req.params.level)
    const { passed } = req.body

    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({ message: 'level must be 1, 2, or 3' })
    }
    if (typeof passed !== 'boolean') {
      return res.status(400).json({ message: 'passed must be a boolean' })
    }

    if (!passed) {
      return res.json({ ok: true, pianoSkillLevel: null })
    }

    const fieldMap: Record<number, { passed: string; passedAt: string }> = {
      1: { passed: 'level1DemonstrationPassed', passedAt: 'level1DemonstrationPassedAt' },
      2: { passed: 'level2DemonstrationPassed', passedAt: 'level2DemonstrationPassedAt' },
      3: { passed: 'level3DemonstrationPassed', passedAt: 'level3DemonstrationPassedAt' },
    }

    const fields = fieldMap[level]
    const now = new Date()

    const updated = await PianoDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
          [fields.passed]:   true,
          [fields.passedAt]: now,
        },
      },
      { upsert: true, new: true }
    )

    const skillLevel = computePianoSkillLevel(updated)
    await PianoDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { pianoSkillLevel: skillLevel } }
    )

    res.json({ ok: true, pianoSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/piano/production/complete
// body: { passed: boolean }
// Called after the production verification result is known.
router.post('/production/complete', protect, async (req: AuthRequest, res) => {
  try {
    const { passed } = req.body
    if (typeof passed !== 'boolean') {
      return res.status(400).json({ message: 'passed must be a boolean' })
    }

    if (!passed) {
      return res.json({ ok: true, pianoSkillLevel: null })
    }

    const now = new Date()
    const updated = await PianoDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { productionPassed: true, productionPassedAt: now } },
      { upsert: true, new: true }
    )

    const skillLevel = computePianoSkillLevel(updated)
    await PianoDemonstrationProgress.findOneAndUpdate(
      { user: req.userId },
      { $set: { pianoSkillLevel: skillLevel } }
    )
    await User.findByIdAndUpdate(req.userId, {
      $set:      { graduated: true, graduatedAt: new Date() },
      $addToSet: { graduatedDisciplines: 'piano' },
    })

    res.json({ ok: true, pianoSkillLevel: skillLevel })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
