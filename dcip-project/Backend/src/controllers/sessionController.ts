import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import PracticeSession from '../models/PracticeSession'

export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, durationMinutes } = req.body
    const session = await PracticeSession.create({
      user: req.userId,
      discipline,
      durationMinutes: durationMinutes || 0,
      syncStatus: 'synced',
    })
    res.status(201).json(session)
  } catch (error) {
    res.status(500).json({ message: 'Could not save session' })
  }
}

export const getMySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await PracticeSession.find({ user: req.userId }).sort({ createdAt: -1 })
    res.json(sessions)
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch sessions' })
  }
}

export const getMyStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await PracticeSession.find({ user: req.userId })
    res.json({
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    })
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch stats' })
  }
}
