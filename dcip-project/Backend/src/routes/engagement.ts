import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import EngagementScore from '../models/EngagementScore'

const router = Router()

const VALID_STAGES = new Set([
  'course1', 'course2',
  'level1Learn', 'level1Practise', 'level1Demonstrate',
  'level2Learn', 'level2Practise', 'level2Demonstrate',
  'level3Learn', 'level3Practise', 'level3Demonstrate',
  'sharpening', 'production',
])

function computeOverall(scores: Record<string, unknown>): number | null {
  const values: number[] = []
  for (const key of VALID_STAGES) {
    const v = scores[key]
    if (typeof v === 'number') values.push(v)
  }
  return values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null
}

router.post('/:discipline/:stage', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { discipline, stage } = req.params
  const { score } = req.body

  if (!VALID_STAGES.has(stage)) {
    res.status(400).json({ message: 'Invalid stage' })
    return
  }
  if (typeof score !== 'number' || score < 0 || score > 100) {
    res.status(400).json({ message: 'Score must be a number 0-100' })
    return
  }

  try {
    const existing = await EngagementScore.findOne({ user: req.userId, discipline })
    const current: Record<string, unknown> = {}
    if (existing?.scores) {
      const s = existing.scores as unknown as Record<string, unknown>
      for (const key of VALID_STAGES) {
        if (typeof s[key] === 'number') current[key] = s[key]
      }
    }
    const updated = { ...current, [stage]: score }
    const overallEngagement = computeOverall(updated)

    await EngagementScore.findOneAndUpdate(
      { user: req.userId, discipline },
      {
        $set: {
          [`scores.${stage}`]: score,
          'scores.overallEngagement': overallEngagement,
        },
      },
      { upsert: true, new: true }
    )

    res.json({ score, overallEngagement })
  } catch (error) {
    console.error('Save engagement error:', error)
    res.status(500).json({ message: 'Could not save engagement score' })
  }
})

router.get('/:discipline', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { discipline } = req.params
  try {
    const doc = await EngagementScore.findOne({ user: req.userId, discipline })
    res.json(doc?.scores ?? null)
  } catch (error) {
    console.error('Get engagement error:', error)
    res.status(500).json({ message: 'Could not fetch engagement scores' })
  }
})

export default router
