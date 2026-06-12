import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/requireRole'
import User from '../models/User'
import Module from '../models/Module'
import PracticeSession from '../models/PracticeSession'
import PortfolioItem from '../models/PortfolioItem'
import School from '../models/School'

const router = Router()

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

router.patch('/students/:id/toggle', protect, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
    if (!student) {
      res.status(404).json({ message: 'Student not found' })
      return
    }
    student.isActive = !student.isActive
    await student.save()
    res.json({ isActive: student.isActive })
  } catch {
    res.status(500).json({ message: 'Could not update student' })
  }
})

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
    if (!mod) {
      res.status(404).json({ message: 'Module not found' })
      return
    }
    mod.isActive = !mod.isActive
    await mod.save()
    res.json({ isActive: mod.isActive })
  } catch {
    res.status(500).json({ message: 'Could not update module' })
  }
})

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
    if (!school) {
      res.status(400).json({ message: 'School not found' })
      return
    }
    const taken = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] })
    if (taken) {
      res.status(400).json({ message: 'Username or email already in use' })
      return
    }
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

router.get('/reports', protect, requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalStudents, totalSessions, totalPortfolioItems, activeSchools, disciplineSessions] =
      await Promise.all([
        User.countDocuments({ role: 'student', isActive: true }),
        PracticeSession.countDocuments(),
        PortfolioItem.countDocuments(),
        School.countDocuments(),
        PracticeSession.aggregate([
          { $group: { _id: '$discipline', count: { $sum: 1 } } },
        ]),
      ])
    res.json({
      totalStudents,
      totalSessions,
      totalPortfolioItems,
      activeSchools,
      sessionsByDiscipline: disciplineSessions,
    })
  } catch {
    res.status(500).json({ message: 'Could not fetch reports' })
  }
})

export default router
