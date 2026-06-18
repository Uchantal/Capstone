import { Router, Response } from 'express'
import { createSession, getMySessions, getMyStats } from '../controllers/sessionController'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import PracticeSession from '../models/PracticeSession'
import StudentProgress from '../models/StudentProgress'
import CurriculumLevel from '../models/CurriculumLevel'

const router = Router()

router.use(protect)
router.post('/', createSession)
router.get('/', getMySessions)
router.get('/stats', getMyStats)

// GET /api/sessions/progress — all disciplines for current user
router.get('/progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const progress = await StudentProgress.find({ user: req.userId })
    res.json(progress)
  } catch {
    res.status(500).json({ message: 'Could not fetch progress' })
  }
})

// GET /api/sessions/progress/:discipline
router.get('/progress/:discipline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const progress = await StudentProgress.findOne({
      user: req.userId,
      discipline: req.params.discipline,
    })
    if (!progress) {
      res.json({
        discipline: req.params.discipline,
        currentLevel: 1,
        sessionsAtCurrentLevel: 0,
        totalSessions: 0,
        totalMinutes: 0,
        levelBadges: [],
        streakDays: 0,
        skillLabel: 'Beginner',
      })
      return
    }
    res.json(progress)
  } catch {
    res.status(500).json({ message: 'Could not fetch progress' })
  }
})

// GET /api/sessions/curriculum/:discipline
router.get('/curriculum/:discipline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const levels = await CurriculumLevel.find({
      discipline: req.params.discipline,
      isActive: true,
    }).sort({ level: 1 })
    res.json(levels)
  } catch {
    res.status(500).json({ message: 'Could not fetch curriculum' })
  }
})

// GET /api/sessions/analytics
router.get('/analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await PracticeSession.find({ user: req.userId }).sort({ createdAt: 1 })

    // Weekly activity — last 8 weeks
    const weeklyActivity: { week: string; sessions: number; minutes: number }[] = []
    const now = new Date()
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - w * 7 - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.createdAt)
        return d >= weekStart && d < weekEnd
      })

      weeklyActivity.push({
        week: weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        sessions: weekSessions.length,
        minutes: weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      })
    }

    // Discipline breakdown
    const disciplineCounts: Record<string, { sessions: number; minutes: number }> = {}
    sessions.forEach((s) => {
      const key = s.discipline
      if (!disciplineCounts[key]) disciplineCounts[key] = { sessions: 0, minutes: 0 }
      disciplineCounts[key].sessions += 1
      disciplineCounts[key].minutes += s.durationMinutes
    })
    const total = sessions.length || 1
    const disciplineBreakdown = Object.entries(disciplineCounts).map(([discipline, data]) => ({
      discipline,
      sessions: data.sessions,
      minutes: data.minutes,
      percentage: Math.round((data.sessions / total) * 100),
    }))

    // Monthly growth — last 6 months
    const monthlyGrowth: { month: string; sessions: number }[] = []
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = sessions.filter((s) => {
        const sd = new Date(s.createdAt)
        return sd >= monthStart && sd < monthEnd
      }).length
      monthlyGrowth.push({
        month: monthStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        sessions: count,
      })
    }

    // Session quality
    const sessionQuality = {
      short: sessions.filter((s) => s.durationMinutes < 10).length,
      standard: sessions.filter((s) => s.durationMinutes >= 10 && s.durationMinutes <= 30).length,
      deep: sessions.filter((s) => s.durationMinutes > 30).length,
    }

    res.json({ weeklyActivity, disciplineBreakdown, monthlyGrowth, sessionQuality })
  } catch {
    res.status(500).json({ message: 'Could not fetch analytics' })
  }
})

export default router
