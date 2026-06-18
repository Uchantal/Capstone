import { Router } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import ProductionResult from '../models/ProductionResult'

const router = Router()

router.post('/result', protect, async (req: AuthRequest, res) => {
  try {
    const { discipline, totalPrompts, correctCount, outcome, attemptDetails, noteEvents, verificationResult } = req.body
    if (!discipline || !outcome) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    const doc: Record<string, unknown> = {
      user: req.userId,
      discipline,
      totalPrompts: totalPrompts ?? 0,
      correctCount: correctCount ?? 0,
      outcome,
      attemptDetails: attemptDetails ?? [],
    }
    if (noteEvents !== undefined) doc.noteEvents = noteEvents
    if (verificationResult !== undefined) doc.verificationResult = verificationResult
    const result = await ProductionResult.create(doc)
    res.status(201).json(result)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/result/me', protect, async (req: AuthRequest, res) => {
  try {
    const { discipline } = req.query
    const query: Record<string, unknown> = { user: req.userId }
    if (discipline) query.discipline = discipline
    const results = await ProductionResult.find(query).sort({ createdAt: -1 }).limit(10)
    res.json(results)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
