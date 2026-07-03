import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import User from '../models/User'
import School, { ISchool } from '../models/School'
import VisualArtsDemonstrationProgress from '../models/VisualArtsDemonstrationProgress'
import GDDemonstrationProgress from '../models/GDDemonstrationProgress'
import PianoDemonstrationProgress from '../models/PianoDemonstrationProgress'
import GuitarDemonstrationProgress from '../models/GuitarDemonstrationProgress'
import VoiceDemonstrationProgress from '../models/VoiceDemonstrationProgress'
import { AuthRequest } from '../middleware/authMiddleware'

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '5h' })
}

const isStrongPassword = (pw: string): string | null => {
  if (pw.length < 8)           return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw))       return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(pw))       return 'Password must contain at least one number.'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.'
  return null
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, username, email, password, schoolId } = req.body

    if (!fullName || !username || !email || !password || !schoolId) {
      res.status(400).json({ message: 'All fields are required' })
      return
    }

    const pwError = isStrongPassword(password)
    if (pwError) {
      res.status(400).json({ message: pwError })
      return
    }

    const school = await School.findById(schoolId)
    if (!school || !school.isActive) {
      res.status(400).json({ message: 'Please select your school to continue' })
      return
    }

    if (await User.findOne({ username: username.toLowerCase() })) {
      res.status(400).json({ message: 'Username already taken' })
      return
    }

    if (await User.findOne({ email: email.toLowerCase() })) {
      res.status(400).json({ message: 'An account with this email already exists' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      fullName,
      username,
      email,
      password: hashed,
      school: school._id,
      role: 'student',
    })

    if (!user.school) {
      await User.findByIdAndUpdate(user._id, { $set: { school: school._id } })
      user.school = school._id
    }

    const schoolDoc = user.school ? (user.school as unknown as ISchool) : null
    res.status(201).json({
      token: generateToken(user._id.toString(), user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        school: schoolDoc ? { id: schoolDoc._id, name: schoolDoc.name, district: schoolDoc.district } : { id: school._id, name: school.name, district: school.district },
        discipline: user.discipline,
        subDiscipline: user.subDiscipline,
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

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Contact your administrator.' })
      return
    }

    const school = user.school ? (user.school as unknown as ISchool) : null
    res.json({
      token: generateToken(user._id.toString(), user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        school: school ? { id: school._id, name: school.name, district: school.district } : null,
        discipline: user.discipline,
        subDiscipline: user.subDiscipline,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Both current and new password are required.' })
      return
    }
    const pwError = isStrongPassword(newPassword)
    if (pwError) {
      res.status(400).json({ message: pwError })
      return
    }
    const user = await User.findById(req.userId)
    if (!user) {
      res.status(404).json({ message: 'User not found.' })
      return
    }
    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) {
      res.status(400).json({ message: 'Current password is incorrect.' })
      return
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ message: 'Password updated.' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).populate('school')
    if (!user) {
      res.status(404).json({ message: 'User not found.' })
      return
    }
    const school = user.school ? (user.school as unknown as ISchool) : null

    // Auto-detect graduation for students who completed production before the
    // graduated field was introduced. Once set, this branch never runs again.
    let graduated            = user.graduated
    let graduatedDisciplines = user.graduatedDisciplines ?? []
    if (!graduated && user.role === 'student') {
      const detected = await autoDetectGraduation(String(user._id))
      if (detected.graduated) {
        graduated            = true
        graduatedDisciplines = detected.disciplines
      }
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      school: school ? { id: school._id, name: school.name, district: school.district } : null,
      discipline: user.discipline,
      subDiscipline: user.subDiscipline,
      graduated,
      graduatedDisciplines,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
}

// Run once per student who hasn't been marked yet — detects pre-existing graduates
export async function autoDetectGraduation(userId: string): Promise<{ graduated: boolean; disciplines: string[] }> {
  const [va, gd, piano, guitar, voice] = await Promise.all([
    VisualArtsDemonstrationProgress.findOne({ user: userId, productionPassed: true }),
    GDDemonstrationProgress.findOne(        { user: userId, productionPassed: true }),
    PianoDemonstrationProgress.findOne(     { user: userId, productionPassed: true }),
    GuitarDemonstrationProgress.findOne(    { user: userId, productionPassed: true }),
    VoiceDemonstrationProgress.findOne(     { user: userId, productionPassed: true }),
  ])
  const disciplines: string[] = []
  if (va)     disciplines.push('visual-arts')
  if (gd)     disciplines.push('graphic-design')
  if (piano)  disciplines.push('piano')
  if (guitar) disciplines.push('guitar')
  if (voice)  disciplines.push('voice')
  if (disciplines.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $set:      { graduated: true, graduatedAt: new Date() },
      $addToSet: { graduatedDisciplines: { $each: disciplines } },
    })
  }
  return { graduated: disciplines.length > 0, disciplines }
}

export const getSchools = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schools = await School.find({ isActive: true }).sort({ province: 1, district: 1 })
    res.json(schools)
  } catch (error) {
    console.error('Get schools error:', error)
    res.status(500).json({ message: 'Could not fetch schools' })
  }
}

export const updateDiscipline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, subDiscipline } = req.body
    const validDisc = ['music', 'visual-arts', 'graphic-design']
    const validSub = ['piano', 'guitar', 'voice']

    if (!validDisc.includes(discipline)) {
      res.status(400).json({ message: 'Invalid discipline' })
      return
    }

    const update: Record<string, string | null> = { discipline }
    if (discipline === 'music' && subDiscipline) {
      if (!validSub.includes(subDiscipline)) {
        res.status(400).json({ message: 'Invalid sub-discipline' })
        return
      }
      update.subDiscipline = subDiscipline
    } else {
      // clear sub-discipline when switching away from music, or when music is
      // selected without a sub-discipline (student is still on MusicSelectPage)
      update.subDiscipline = null
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).populate('school')
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    const school = user.school ? (user.school as unknown as ISchool) : null
    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      school: school ? { id: school._id, name: school.name, district: school.district } : null,
      discipline: user.discipline,
      subDiscipline: user.subDiscipline,
    })
  } catch (error) {
    console.error('Update discipline error:', error)
    res.status(500).json({ message: 'Could not update discipline' })
  }
}

export const updateSchool = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.body
    if (!schoolId) { res.status(400).json({ message: 'schoolId is required' }); return }

    // Select only what we need — avoids fetching the full document
    const school = await School.findById(schoolId).select('name district isActive')
    if (!school || !school.isActive) { res.status(400).json({ message: 'School not found' }); return }

    // new: false — we don't need the updated document back; school was already fetched above
    const user = await User.findByIdAndUpdate(req.userId, { school: schoolId }, { new: false })
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    // Return only what the frontend needs — no populate query needed
    res.json({
      school: { id: school._id, name: school.name, district: school.district },
    })
  } catch {
    res.status(500).json({ message: 'Could not update school' })
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ message: 'Email is required.' })
      return
    }

    // Always respond with the same message so we don't reveal whether an account exists
    const ok = { message: 'If an account with that email exists, a reset link has been sent.' }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      res.json(ok)
      return
    }

    // Generate a plain token, store its SHA-256 hash
    const plainToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${plainToken}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"DCIP Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your DCIP password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1a1a1a;margin-bottom:8px;">Reset your password</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
            Hello ${user.fullName},<br/>
            We received a request to reset the password for your DCIP account.
            Click the button below — the link is valid for <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#C8960C;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
            If you did not request this, you can safely ignore this email.
            Your password will not change.
          </p>
        </div>
      `,
    })

    res.json(ok)
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Could not send reset email. Please try again later.' })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required.' })
      return
    }
    const pwError = isStrongPassword(newPassword)
    if (pwError) {
      res.status(400).json({ message: pwError })
      return
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user) {
      res.status(400).json({ message: 'Reset link is invalid or has expired.' })
      return
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    res.json({ message: 'Password updated successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Could not reset password. Please try again.' })
  }
}
