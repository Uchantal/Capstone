import { Router } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import VAProductionResult from '../models/VAProductionResult'
import GDLevelPoster from '../models/GDLevelPoster'
import GDProductionResult from '../models/GDProductionResult'

const router = Router()

// GET /api/journey/progress?discipline=visual-arts
router.get('/progress', protect, async (req: AuthRequest, res) => {
  try {
    const { discipline } = req.query
    if (!discipline) {
      return res.status(400).json({ message: 'discipline query param required' })
    }
    const record = await JourneyProgress.findOne({ user: req.userId, discipline })
    res.json({ completedStages: record?.completedStages ?? [] })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/journey/complete-stage
// body: { discipline: string, stageId: string }
router.post('/complete-stage', protect, async (req: AuthRequest, res) => {
  try {
    const { discipline, stageId } = req.body
    if (!discipline || !stageId) {
      return res.status(400).json({ message: 'discipline and stageId are required' })
    }
    await JourneyProgress.findOneAndUpdate(
      { user: req.userId, discipline },
      { $addToSet: { completedStages: stageId } },
      { upsert: true, new: true }
    )
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/journey/va-production
// body: { finalImageData: string, checklistConfirmed: {...} }
router.post('/va-production', protect, async (req: AuthRequest, res) => {
  try {
    const { finalImageData, checklistConfirmed } = req.body
    if (!finalImageData || !checklistConfirmed) {
      return res.status(400).json({ message: 'finalImageData and checklistConfirmed are required' })
    }
    const result = await VAProductionResult.create({
      user: req.userId,
      discipline: 'visual-arts',
      finalImageData,
      checklistConfirmed,
      submittedAt: new Date(),
    })
    res.status(201).json(result)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/journey/gd-level-poster?level=0
// level 0 = course-1 planning text; 1-3 = completed level poster state
router.get('/gd-level-poster', protect, async (req: AuthRequest, res) => {
  try {
    const level = Number(req.query.level)
    if (isNaN(level)) return res.status(400).json({ message: 'level query param required' })
    const record = await GDLevelPoster.findOne({ user: req.userId, discipline: 'graphic-design', level })
    res.json(record ?? null)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/journey/gd-level-poster
// body: { level, title?, subtitle?, fontSize?, alignment?, bgColour?, titleColour?, reasoning }
router.post('/gd-level-poster', protect, async (req: AuthRequest, res) => {
  try {
    const { level, title, subtitle, fontSize, alignment, bgColour, titleColour, reasoning, elementsJson } = req.body
    if (level === undefined) return res.status(400).json({ message: 'level is required' })
    const record = await GDLevelPoster.findOneAndUpdate(
      { user: req.userId, discipline: 'graphic-design', level },
      { title, subtitle, fontSize, alignment, bgColour, titleColour, reasoning, elementsJson },
      { upsert: true, new: true }
    )
    res.json(record)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/journey/gd-production
router.post('/gd-production', protect, async (req: AuthRequest, res) => {
  try {
    const {
      posterTitle, posterSubtitle, fontSize, alignment, bgColour, titleColour,
      finalImageData, reasoningText, checklistConfirmed,
    } = req.body
    if (!finalImageData || !reasoningText || !checklistConfirmed) {
      return res.status(400).json({ message: 'finalImageData, reasoningText, and checklistConfirmed are required' })
    }
    const result = await GDProductionResult.create({
      user: req.userId,
      discipline: 'graphic-design',
      posterTitle, posterSubtitle, fontSize, alignment, bgColour, titleColour,
      finalImageData, reasoningText, checklistConfirmed,
      submittedAt: new Date(),
    })
    res.status(201).json(result)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
