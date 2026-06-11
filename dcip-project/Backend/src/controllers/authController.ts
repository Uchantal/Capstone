import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import School, { ISchool } from '../models/School'
import { AuthRequest } from '../middleware/authMiddleware'

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '7d' })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, username, email, password, schoolId } = req.body

    if (!fullName || !username || !email || !password || !schoolId) {
      res.status(400).json({ message: 'All fields are required' })
      return
    }

    const school = await School.findById(schoolId)
    if (!school) {
      res.status(400).json({ message: 'School not found or not verified for this pilot' })
      return
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() })
    if (existingUsername) {
      res.status(400).json({ message: 'Username already taken' })
      return
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      res.status(400).json({ message: 'An account with this email already exists' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ fullName, username, email, password: hashed, school: schoolId })

    res.status(201).json({
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        school: { id: school._id, name: school.name, district: school.district },
        discipline: user.discipline,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' })
      return
    }

    const user = await User.findOne({ username: username.toLowerCase() }).populate('school')
    if (!user) {
      res.status(400).json({ message: 'Invalid username or password' })
      return
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      res.status(400).json({ message: 'Invalid username or password' })
      return
    }

    const school = user.school as unknown as ISchool
    res.json({
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        school: { id: school._id, name: school.name, district: school.district },
        discipline: user.discipline,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}

export const getSchools = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schools = await School.find().sort({ name: 1 })
    res.json(schools)
  } catch (error) {
    console.error('Get schools error:', error)
    res.status(500).json({ message: 'Could not fetch schools' })
  }
}

export const updateDiscipline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline } = req.body
    const valid = ['music', 'visual-arts', 'graphic-design']
    if (!valid.includes(discipline)) {
      res.status(400).json({ message: 'Invalid discipline' })
      return
    }
    const user = await User.findByIdAndUpdate(req.userId, { discipline }, { new: true }).populate('school')
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    const school = user.school as unknown as ISchool
    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      school: { id: school._id, name: school.name, district: school.district },
      discipline: user.discipline,
    })
  } catch (error) {
    console.error('Update discipline error:', error)
    res.status(500).json({ message: 'Could not update discipline' })
  }
}
