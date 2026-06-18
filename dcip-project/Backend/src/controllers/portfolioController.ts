import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import PortfolioItem from '../models/PortfolioItem'
import PracticeSession from '../models/PracticeSession'
import StudentProgress from '../models/StudentProgress'
import CurriculumLevel from '../models/CurriculumLevel'

const SKILL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Developing',
  3: 'Practising',
  4: 'Consistent Practitioner',
  5: 'Consistent Practitioner',
}

function formatDiscipline(d: string): string {
  if (d === 'music') return 'Music'
  if (d === 'visual-arts') return 'Visual Arts'
  if (d === 'graphic-design') return 'Graphic Design'
  return d
}

export const savePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, title, fileType, fileData, durationMinutes } = req.body

    if (!discipline || !title || !fileData) {
      res.status(400).json({ message: 'discipline, title, and fileData are required' })
      return
    }

    const mins: number = durationMinutes || 0

    // Create session record
    const session = await PracticeSession.create({
      user: req.userId,
      discipline,
      durationMinutes: mins,
      syncStatus: 'synced',
    })

    const item = await PortfolioItem.create({
      user: req.userId,
      session: session._id,
      discipline,
      title,
      fileType: fileType || 'image/png',
      fileData,
      syncStatus: 'synced',
    })

    // Milestone pre-checks (before updating progress)
    const [existingProgressCount, prevDeepCount, totalSessionsNow] = await Promise.all([
      StudentProgress.countDocuments({ user: req.userId }),
      PracticeSession.countDocuments({ user: req.userId, durationMinutes: { $gt: 30 }, _id: { $ne: session._id } }),
      PracticeSession.countDocuments({ user: req.userId }),
    ])

    // Find or initialise StudentProgress for this discipline
    let progress = await StudentProgress.findOne({ user: req.userId, discipline })
    const isFirstSession = !progress

    if (!progress) {
      progress = new StudentProgress({
        user: req.userId,
        discipline,
        currentLevel: 1,
        sessionsAtCurrentLevel: 0,
        totalSessions: 0,
        totalMinutes: 0,
        levelBadges: [],
        streakDays: 1,
        lastActiveDate: new Date(),
        skillLabel: 'Beginner',
      })
    }

    const prevTotalSessions = progress.totalSessions
    progress.totalSessions += 1
    progress.totalMinutes += mins
    progress.sessionsAtCurrentLevel += 1

    // Streak calculation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (progress.lastActiveDate) {
      const lastDate = new Date(progress.lastActiveDate)
      lastDate.setHours(0, 0, 0, 0)
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        progress.streakDays += 1
      } else if (diffDays > 1) {
        progress.streakDays = 1
      }
    }
    progress.lastActiveDate = new Date()

    // Level up check
    let levelJustCompleted = false
    let newLevelTitle: string | null = null

    if (progress.sessionsAtCurrentLevel >= 5 && progress.currentLevel < 5) {
      levelJustCompleted = true
      const completedLevel = progress.currentLevel
      progress.levelBadges.push({
        level: completedLevel,
        discipline,
        earnedAt: new Date(),
      })
      progress.currentLevel += 1
      progress.sessionsAtCurrentLevel = 0
      progress.skillLabel = SKILL_LABELS[progress.currentLevel] || 'Consistent Practitioner'

      const nextLevel = await CurriculumLevel.findOne({ discipline, level: progress.currentLevel })
      newLevelTitle = nextLevel?.title ?? null
    } else {
      progress.skillLabel = SKILL_LABELS[progress.currentLevel] || 'Beginner'
    }

    await progress.save()

    // Session quality
    const sessionQuality: 'short' | 'standard' | 'deep' =
      mins < 10 ? 'short' : mins <= 30 ? 'standard' : 'deep'

    // Milestones
    const milestones: string[] = []
    if (isFirstSession && existingProgressCount === 0) {
      milestones.push('First session complete! Your creative journey begins.')
    } else if (isFirstSession && existingProgressCount > 0) {
      milestones.push(`First ${formatDiscipline(discipline)} session! You are expanding your creative skills.`)
    }
    if (!isFirstSession && prevTotalSessions < 10 && progress.totalSessions >= 10) {
      milestones.push('10 sessions milestone! You are building a real practice habit.')
    }
    if (totalSessionsNow === 10) {
      if (!milestones.some((m) => m.includes('10 sessions'))) {
        milestones.push('10 sessions milestone! You are building a real practice habit.')
      }
    }
    if (prevDeepCount === 0 && mins > 30) {
      milestones.push('First Deep Practice session! You stayed focused for over 30 minutes.')
    }

    const progressUpdate = {
      currentLevel: progress.currentLevel,
      sessionsAtCurrentLevel: progress.sessionsAtCurrentLevel,
      levelJustCompleted,
      newLevelTitle,
      skillLabel: progress.skillLabel,
      totalSessions: progress.totalSessions,
      sessionQuality,
      milestones,
    }

    res.status(201).json({ ...item.toObject(), progressUpdate })
  } catch (error) {
    res.status(500).json({ message: 'Could not save portfolio item' })
  }
}

export const getMyPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await PortfolioItem.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select('-fileData')
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch portfolio' })
  }
}

export const getPortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findOne({ _id: req.params.id, user: req.userId })
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch item' })
  }
}

export const deletePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Could not delete item' })
  }
}
