import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/requireRole'
import User from '../models/User'
import Module from '../models/Module'
import PracticeSession from '../models/PracticeSession'
import PortfolioItem from '../models/PortfolioItem'
import School from '../models/School'
import EngagementScore from '../models/EngagementScore'
import StudioWork from '../models/StudioWork'
import VisualArtsDemonstrationProgress from '../models/VisualArtsDemonstrationProgress'
import GDDemonstrationProgress from '../models/GDDemonstrationProgress'
import GuitarDemonstrationProgress from '../models/GuitarDemonstrationProgress'
import PianoDemonstrationProgress from '../models/PianoDemonstrationProgress'
import VoiceDemonstrationProgress from '../models/VoiceDemonstrationProgress'

const router = Router()

// === STUDENTS ===

router.get('/students', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('school', 'name district')
      .sort({ createdAt: -1 })
      .select('-password')
    res.json(students)
  } catch {
    res.status(500).json({ message: 'Could not fetch students' })
  }
})

router.get('/students/:id/profile', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('school', 'name district')
      .select('-password')
    if (!student) { res.status(404).json({ message: 'Student not found' }); return }
    const engagementScores = await EngagementScore.find({ user: req.params.id })
    res.json({ student, engagementScores })
  } catch {
    res.status(500).json({ message: 'Could not fetch student profile' })
  }
})

router.patch('/students/:id/toggle', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
    if (!student) { res.status(404).json({ message: 'Student not found' }); return }
    student.isActive = !student.isActive
    await student.save()
    res.json({ isActive: student.isActive })
  } catch {
    res.status(500).json({ message: 'Could not update student' })
  }
})

router.patch('/students/:id/activate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: 'student' }, { isActive: true }, { new: true })
    if (!student) { res.status(404).json({ message: 'Student not found' }); return }
    res.json({ isActive: student.isActive })
  } catch {
    res.status(500).json({ message: 'Could not activate student' })
  }
})

router.patch('/students/:id/deactivate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: 'student' }, { isActive: false }, { new: true })
    if (!student) { res.status(404).json({ message: 'Student not found' }); return }
    res.json({ isActive: student.isActive })
  } catch {
    res.status(500).json({ message: 'Could not deactivate student' })
  }
})

// === MODULES ===

router.get('/modules', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const modules = await Module.find()
    res.json(modules)
  } catch {
    res.status(500).json({ message: 'Could not fetch modules' })
  }
})

router.patch('/modules/:id/toggle', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await Module.findById(req.params.id)
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return }
    mod.isActive = !mod.isActive
    await mod.save()
    res.json({ isActive: mod.isActive })
  } catch {
    res.status(500).json({ message: 'Could not update module' })
  }
})

router.patch('/modules/:id/activate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await Module.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return }
    res.json({ isActive: mod.isActive })
  } catch {
    res.status(500).json({ message: 'Could not activate module' })
  }
})

router.patch('/modules/:id/deactivate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await Module.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return }
    res.json({ isActive: mod.isActive })
  } catch {
    res.status(500).json({ message: 'Could not deactivate module' })
  }
})

router.post('/modules', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, slug } = req.body
    if (!name || !description || !slug) {
      res.status(400).json({ message: 'Name, description and slug are required' })
      return
    }
    const key = (slug as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const existing = await Module.findOne({ key })
    if (existing) { res.status(400).json({ message: 'A module with this slug already exists' }); return }
    const mod = await Module.create({ key, name, description })
    res.status(201).json(mod)
  } catch {
    res.status(500).json({ message: 'Could not create module' })
  }
})

// === SUPERVISORS ===

router.get('/supervisors', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supervisors = await User.find({ role: 'supervisor' })
      .populate('school', 'name district')
      .sort({ createdAt: 1 })
      .select('-password')
    res.json(supervisors)
  } catch {
    res.status(500).json({ message: 'Could not fetch supervisors' })
  }
})

router.post('/supervisors', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, username, email, password, schoolId } = req.body
    if (!fullName || !username || !email || !password || !schoolId) {
      res.status(400).json({ message: 'All fields are required' })
      return
    }
    const school = await School.findById(schoolId)
    if (!school) { res.status(400).json({ message: 'School not found' }); return }
    const taken = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] })
    if (taken) { res.status(400).json({ message: 'Username or email already in use' }); return }
    const hashed = await bcrypt.hash(password, 10)
    const supervisor = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashed,
      role: 'supervisor',
      school: schoolId,
      discipline: null,
    })
    const populated = await supervisor.populate('school', 'name district')
    const { password: _pw, ...safe } = populated.toObject()
    res.status(201).json(safe)
  } catch {
    res.status(500).json({ message: 'Could not create supervisor' })
  }
})

// === SCHOOLS ===

router.get('/schools', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schools = await School.find().sort({ name: 1 })
    res.json(schools)
  } catch {
    res.status(500).json({ message: 'Could not fetch schools' })
  }
})

router.post('/schools', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, district, province } = req.body
    if (!name?.trim() || !district?.trim() || !province?.trim()) {
      res.status(400).json({ message: 'Name, district and province are required' })
      return
    }
    const school = await School.create({ name: name.trim(), district: district.trim(), province: province.trim() })
    res.status(201).json(school)
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'A school with that name already exists' })
      return
    }
    res.status(500).json({ message: 'Could not create school' })
  }
})

router.patch('/schools/:id', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, district, province } = req.body
    if (!name?.trim() || !district?.trim() || !province?.trim()) {
      res.status(400).json({ message: 'Name, district and province are required' })
      return
    }
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), district: district.trim(), province: province.trim() },
      { new: true, runValidators: true }
    )
    if (!school) { res.status(404).json({ message: 'School not found' }); return }
    res.json(school)
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'A school with that name already exists' })
      return
    }
    res.status(500).json({ message: 'Could not update school' })
  }
})

router.patch('/schools/:id/activate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
    if (!school) { res.status(404).json({ message: 'School not found' }); return }
    res.json({ isActive: school.isActive })
  } catch {
    res.status(500).json({ message: 'Could not activate school' })
  }
})

router.patch('/schools/:id/deactivate', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!school) { res.status(404).json({ message: 'School not found' }); return }
    res.json({ isActive: school.isActive })
  } catch {
    res.status(500).json({ message: 'Could not deactivate school' })
  }
})

router.get('/schools/:id/students', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await User.find({ role: 'student', school: req.params.id })
      .populate('school', 'name district')
      .sort({ fullName: 1 })
      .select('fullName username email discipline isActive createdAt school')
    res.json(students)
  } catch {
    res.status(500).json({ message: 'Could not fetch students for school' })
  }
})

// === STATS & REPORTS ===

router.get('/stats', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [activeStudents, totalSessions, portfolioItems, pilotSchools] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      PracticeSession.countDocuments(),
      PortfolioItem.countDocuments(),
      School.countDocuments({ isActive: true }),
    ])
    res.json({ activeStudents, totalSessions, portfolioItems, pilotSchools })
  } catch {
    res.status(500).json({ message: 'Could not fetch stats' })
  }
})

router.get('/reports', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null

    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      const range: Record<string, Date> = {}
      if (startDate) range.$gte = startDate
      if (endDate) range.$lte = endDate
      dateFilter.createdAt = range
    }

    const matchStage = Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []

    const [totalStudents, totalSessions, totalPortfolioItems, activeSchools, disciplineSessions] =
      await Promise.all([
        User.countDocuments({ role: 'student', isActive: true }),
        PracticeSession.countDocuments(dateFilter),
        PortfolioItem.countDocuments(dateFilter),
        School.countDocuments({ isActive: true }),
        PracticeSession.aggregate([
          ...matchStage,
          { $group: { _id: '$discipline', count: { $sum: 1 } } },
        ]),
      ])
    res.json({ totalStudents, totalSessions, totalPortfolioItems, activeSchools, sessionsByDiscipline: disciplineSessions })
  } catch {
    res.status(500).json({ message: 'Could not fetch reports' })
  }
})

// === STUDIO (admin view of all student studio works) ===

router.get('/studio', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const works = await StudioWork.find()
      .select('-fileData')
      .populate('user', 'fullName username school discipline')
      .sort({ createdAt: -1 })
    res.json(works.filter(w => w.user != null))
  } catch {
    res.status(500).json({ message: 'Could not fetch studio works' })
  }
})

router.get('/studio/stats', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalWorks, graduatedCount, byDiscipline] = await Promise.all([
      StudioWork.countDocuments(),
      User.countDocuments({ role: 'student', graduated: true }),
      StudioWork.aggregate([{ $group: { _id: '$discipline', count: { $sum: 1 } } }]),
    ])
    res.json({ totalWorks, graduatedCount, byDiscipline })
  } catch {
    res.status(500).json({ message: 'Could not fetch studio stats' })
  }
})

router.get('/studio/:id', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const work = await StudioWork.findById(req.params.id)
      .populate('user', 'fullName username school discipline')
    if (!work) { res.status(404).json({ message: 'Not found' }); return }
    res.json(work)
  } catch {
    res.status(500).json({ message: 'Could not fetch studio work' })
  }
})

router.delete('/studio/:id', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await StudioWork.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Could not delete studio work' })
  }
})

// === ANALYTICS ===

router.get('/analytics', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const DISCIPLINES = [
      { key: 'visual-arts',    label: 'Visual Arts',    model: VisualArtsDemonstrationProgress },
      { key: 'graphic-design', label: 'Graphic Design', model: GDDemonstrationProgress },
      { key: 'guitar',         label: 'Guitar',         model: GuitarDemonstrationProgress },
      { key: 'piano',          label: 'Piano',          model: PianoDemonstrationProgress },
      { key: 'voice',          label: 'Voice',          model: VoiceDemonstrationProgress },
    ]

    // 1. Discipline popularity — how many students per discipline (engagement scores)
    const disciplinePopularity = await Promise.all(
      DISCIPLINES.map(async d => ({
        discipline: d.label,
        students: await EngagementScore.countDocuments({ discipline: d.key }),
      }))
    )

    // 2. Level completion rates per discipline
    const levelCompletion = await Promise.all(
      DISCIPLINES.map(async d => {
        const total = await d.model.countDocuments()
        const l1    = await d.model.countDocuments({ level1DemonstrationPassed: true })
        const l2    = await d.model.countDocuments({ level2DemonstrationPassed: true })
        const l3    = await d.model.countDocuments({ level3DemonstrationPassed: true })
        return {
          discipline: d.label,
          level1: total > 0 ? Math.round((l1 / total) * 100) : 0,
          level2: total > 0 ? Math.round((l2 / total) * 100) : 0,
          level3: total > 0 ? Math.round((l3 / total) * 100) : 0,
        }
      })
    )

    // 3. Average engagement score per discipline
    const engagementByDiscipline = await Promise.all(
      DISCIPLINES.map(async d => {
        const docs = await EngagementScore.find({ discipline: d.key }).select('scores.overallEngagement')
        const values = docs
          .map(doc => doc.scores?.overallEngagement)
          .filter((v): v is number => typeof v === 'number')
        const avg = values.length > 0
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0
        return { discipline: d.label, avgEngagement: avg }
      })
    )

    // 4. Studio works saved over last 8 weeks
    const now = new Date()
    const weeklyStudio = await Promise.all(
      Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - (7 * (7 - i)))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        return StudioWork.countDocuments({ createdAt: { $gte: weekStart, $lt: weekEnd } })
          .then(count => ({ week: `W${i + 1}`, works: count }))
      })
    )

    // 5. Engagement score distribution (buckets 0-20, 21-40, 41-60, 61-80, 81-100)
    const allEngagement = await EngagementScore.find().select('scores.overallEngagement')
    const buckets = [
      { range: '0-20',   count: 0 },
      { range: '21-40',  count: 0 },
      { range: '41-60',  count: 0 },
      { range: '61-80',  count: 0 },
      { range: '81-100', count: 0 },
    ]
    for (const doc of allEngagement) {
      const v = doc.scores?.overallEngagement
      if (typeof v !== 'number') continue
      if (v <= 20)       buckets[0].count++
      else if (v <= 40)  buckets[1].count++
      else if (v <= 60)  buckets[2].count++
      else if (v <= 80)  buckets[3].count++
      else               buckets[4].count++
    }

    res.json({
      disciplinePopularity,
      levelCompletion,
      engagementByDiscipline,
      weeklyStudio,
      engagementDistribution: buckets,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ message: 'Could not fetch analytics' })
  }
})

export default router
