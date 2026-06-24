import { Router, Response } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/requireRole'
import User from '../models/User'
import School from '../models/School'
import PracticeSession from '../models/PracticeSession'
import PortfolioItem from '../models/PortfolioItem'
import StudentProgress from '../models/StudentProgress'

const router = Router()

router.get(
  '/sessions/active',
  protect,
  requireRole('supervisor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
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
  }
)

router.get(
  '/students',
  protect,
  requireRole('supervisor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
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
  }
)

router.get(
  '/progress',
  protect,
  requireRole('supervisor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
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

      const sessionMap = new Map<string, number>(
        sessionCounts.map((s) => [s._id.toString(), s.count])
      )
      const portfolioMap = new Map<string, number>(
        portfolioCounts.map((p) => [p._id.toString(), p.count])
      )

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
  }
)

// GET /api/supervisor/live-activity — enhanced live activity with level info
router.get(
  '/live-activity',
  protect,
  requireRole('supervisor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const supervisor = await User.findById(req.userId).select('school')
      if (!supervisor?.school) {
        res.status(400).json({ message: 'Supervisor has no school assigned' })
        return
      }

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const students = await User.find({ role: 'student', school: supervisor.school }).select('_id fullName')
      const studentIds = students.map((s) => s._id)

      const sessions = await PracticeSession.find({
        user: { $in: studentIds },
        createdAt: { $gte: twoHoursAgo },
      })
        .populate('user', 'fullName')
        .sort({ createdAt: -1 })

      // Fetch StudentProgress for level info
      const progressDocs = await StudentProgress.find({ user: { $in: studentIds } })
      const progressMap = new Map<string, { currentLevel: number; skillLabel: string }>()
      progressDocs.forEach((p) => {
        const key = `${p.user.toString()}_${p.discipline}`
        progressMap.set(key, { currentLevel: p.currentLevel, skillLabel: p.skillLabel })
      })

      const activity = sessions.map((s) => {
        const userPop = s.user as unknown as { _id: string; fullName: string }
        const key = `${userPop._id.toString()}_${s.discipline}`
        const prog = progressMap.get(key)
        return {
          _id: s._id,
          studentName: userPop.fullName,
          discipline: s.discipline,
          durationMinutes: s.durationMinutes,
          createdAt: s.createdAt,
          currentLevel: prog?.currentLevel ?? 1,
          skillLabel: prog?.skillLabel ?? 'Beginner',
        }
      })

      res.json(activity)
    } catch {
      res.status(500).json({ message: 'Could not fetch live activity' })
    }
  }
)

// GET /api/supervisor/school-analytics
router.get(
  '/school-analytics',
  protect,
  requireRole('supervisor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const supervisor = await User.findById(req.userId).select('school')
      if (!supervisor?.school) {
        res.status(400).json({ message: 'Supervisor has no school assigned' })
        return
      }

      const students = await User.find({ role: 'student', school: supervisor.school })
        .select('_id fullName discipline subDiscipline createdAt')

      const studentIds = students.map((s) => s._id)
      const totalStudents = students.length

      const period = req.query.period as string | undefined
      const reqNow = new Date()
      let startDate: Date | null = null
      let endDate: Date | null = null
      if (period === '1m') {
        startDate = new Date(reqNow.getFullYear(), reqNow.getMonth() - 1, 1)
        endDate = new Date(reqNow.getFullYear(), reqNow.getMonth(), 0, 23, 59, 59, 999)
      } else if (period === '3m') {
        startDate = new Date(reqNow.getFullYear(), reqNow.getMonth() - 3, reqNow.getDate())
      } else if (period === '6m') {
        startDate = new Date(reqNow.getFullYear(), reqNow.getMonth() - 6, reqNow.getDate())
      } else if (period === '1y') {
        startDate = new Date(reqNow.getFullYear() - 1, reqNow.getMonth(), reqNow.getDate())
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const activeWindowStart = startDate ?? sevenDaysAgo

      const createdAtFilter: Record<string, Date> = {}
      if (startDate) createdAtFilter.$gte = startDate
      if (endDate) createdAtFilter.$lte = endDate

      const sessionFilter = startDate
        ? { user: { $in: studentIds }, createdAt: createdAtFilter }
        : { user: { $in: studentIds } }

      const [allSessions, recentSessionUsers, progressDocs] = await Promise.all([
        PracticeSession.find(sessionFilter),
        PracticeSession.distinct('user', {
          user: { $in: studentIds },
          createdAt: { $gte: activeWindowStart },
        }),
        StudentProgress.find({ user: { $in: studentIds } }),
      ])

      const activeThisWeek = recentSessionUsers.length
      const totalPracticeHours = Math.round(
        allSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60
      )
      const avgSessionsPerStudent =
        totalStudents > 0 ? Math.round((allSessions.length / totalStudents) * 10) / 10 : 0

      const musicSubDiscs = ['piano', 'guitar', 'voice']

      // Sessions are stored with two conventions: 'guitar' (journey) and 'music-guitar' (production)
      const subKeys = (sd: string) => [sd, `music-${sd}`]
      const allMusicSessionKeys = [...musicSubDiscs.flatMap(subKeys), 'music']

      const calcAvgLevel = (docs: typeof progressDocs): number | null =>
        docs.length > 0
          ? Math.round((docs.reduce((sum, p) => sum + p.currentLevel, 0) / docs.length) * 10) / 10
          : null

      // Discipline stats — music sessions/progress are stored under sub-discipline keys
      const disciplines = ['music', 'visual-arts', 'graphic-design']
      const disciplineStats = disciplines.map((disc) => {
        const discStudents = students.filter((s) => s.discipline === disc)
        const sessionKeys = disc === 'music' ? allMusicSessionKeys : [disc]
        const discSessions = allSessions.filter((s) => sessionKeys.includes(s.discipline))
        const discProgress = progressDocs.filter((p) => sessionKeys.includes(p.discipline))

        type SubStat = { discipline: string; studentCount: number; totalSessions: number; avgLevel: number | null }
        const result: { discipline: string; studentCount: number; totalSessions: number; avgLevel: number | null; subDisciplines?: SubStat[] } = {
          discipline: disc,
          studentCount: discStudents.length,
          totalSessions: discSessions.length,
          avgLevel: calcAvgLevel(discProgress),
        }

        if (disc === 'music') {
          result.subDisciplines = musicSubDiscs.map((sd) => ({
            discipline: sd,
            studentCount: discStudents.filter((s) => s.subDiscipline === sd).length,
            totalSessions: allSessions.filter((s) => subKeys(sd).includes(s.discipline)).length,
            avgLevel: calcAvgLevel(progressDocs.filter((p) => subKeys(sd).includes(p.discipline))),
          }))
        }

        return result
      })

      // Student progress table
      const progressByUser = new Map<string, { currentLevel: number; skillLabel: string; totalSessions: number; lastActive: Date | null }>()
      progressDocs.forEach((p) => {
        const uid = p.user.toString()
        const existing = progressByUser.get(uid)
        if (!existing || p.totalSessions > (existing?.totalSessions ?? 0)) {
          progressByUser.set(uid, {
            currentLevel: p.currentLevel,
            skillLabel: p.skillLabel,
            totalSessions: p.totalSessions,
            lastActive: p.lastActiveDate,
          })
        }
      })

      const sessionCountByUser = new Map<string, number>()
      allSessions.forEach((s) => {
        const uid = s.user.toString()
        sessionCountByUser.set(uid, (sessionCountByUser.get(uid) ?? 0) + 1)
      })

      const now = new Date()
      const studentProgress = students.map((student) => {
        const uid = student._id.toString()
        const prog = progressByUser.get(uid)
        const lastActive = prog?.lastActive ?? null
        let status = 'Dormant'
        if (lastActive) {
          const daysSince = (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSince <= 7) status = 'Active'
          else if (daysSince <= 30) status = 'Inactive'
        }

        return {
          id: uid,
          name: student.fullName,
          discipline: student.discipline ?? 'N/A',
          subDiscipline: student.subDiscipline ?? null,
          currentLevel: prog?.currentLevel ?? 1,
          skillLabel: prog?.skillLabel ?? 'Beginner',
          totalSessions: sessionCountByUser.get(uid) ?? 0,
          lastActive,
          status,
        }
      })

      studentProgress.sort((a, b) => {
        if (!a.lastActive) return 1
        if (!b.lastActive) return -1
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      })

      res.json({
        totalStudents,
        activeThisWeek,
        totalPracticeHours,
        avgSessionsPerStudent,
        disciplineStats,
        studentProgress,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Could not fetch school analytics' })
    }
  }
)

export default router
