import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/requireRole'
import User from '../models/User'
import PracticeSession from '../models/PracticeSession'
import PortfolioItem from '../models/PortfolioItem'

const router = Router()

router.get('/sessions/active', protect, requireRole('supervisor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supervisor = await User.findById(req.userId).select('school')
    if (!supervisor?.school) {
      res.status(400).json({ message: 'Supervisor has no school assigned' })
      return
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const students = await User.find({ role: 'student', school: supervisor.school }).select('_id')
    const studentIds = students.map((s) => s._id)

    const sessions = await PracticeSession.find({
      user: { $in: studentIds },
      createdAt: { $gte: twoHoursAgo },
    })
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 })

    res.json(sessions)
  } catch {
    res.status(500).json({ message: 'Could not fetch active sessions' })
  }
})

router.get('/students', protect, requireRole('supervisor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supervisor = await User.findById(req.userId).select('school')
    if (!supervisor?.school) {
      res.status(400).json({ message: 'Supervisor has no school assigned' })
      return
    }

    const students = await User.find({ role: 'student', school: supervisor.school })
      .sort({ fullName: 1 })
      .select('-password')

    res.json(students)
  } catch {
    res.status(500).json({ message: 'Could not fetch students' })
  }
})

router.get('/progress', protect, requireRole('supervisor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supervisor = await User.findById(req.userId).select('school')
    if (!supervisor?.school) {
      res.status(400).json({ message: 'Supervisor has no school assigned' })
      return
    }

    const students = await User.find({ role: 'student', school: supervisor.school })
      .sort({ fullName: 1 })
      .select('_id username fullName discipline')

    const studentIds = students.map((s) => s._id)

    const [sessionCounts, portfolioCounts] = await Promise.all([
      PracticeSession.aggregate([
        { $match: { user: { $in: studentIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
      PortfolioItem.aggregate([
        { $match: { user: { $in: studentIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
    ])

    const sessionMap = new Map<string, number>(sessionCounts.map((s) => [s._id.toString(), s.count]))
    const portfolioMap = new Map<string, number>(portfolioCounts.map((p) => [p._id.toString(), p.count]))

    const progress = students.map((student) => ({
      id: student._id,
      username: student.username,
      fullName: student.fullName,
      discipline: student.discipline,
      sessions: sessionMap.get(student._id.toString()) ?? 0,
      portfolioItems: portfolioMap.get(student._id.toString()) ?? 0,
    }))

    res.json(progress)
  } catch {
    res.status(500).json({ message: 'Could not fetch progress' })
  }
})

export default router
