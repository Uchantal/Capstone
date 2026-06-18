import mongoose, { Document, Schema } from 'mongoose'

interface LevelBadge {
  level: number
  discipline: string
  earnedAt: Date
}

export interface IStudentProgress extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  currentLevel: number
  sessionsAtCurrentLevel: number
  totalSessions: number
  totalMinutes: number
  levelBadges: LevelBadge[]
  streakDays: number
  lastActiveDate: Date | null
  skillLabel: string
  createdAt: Date
  updatedAt: Date
}

const levelBadgeSchema = new Schema<LevelBadge>(
  {
    level: { type: Number, required: true },
    discipline: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const studentProgressSchema = new Schema<IStudentProgress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discipline: { type: String, required: true },
    currentLevel: { type: Number, default: 1 },
    sessionsAtCurrentLevel: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    levelBadges: { type: [levelBadgeSchema], default: [] },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    skillLabel: { type: String, default: 'Beginner' },
  },
  { timestamps: true }
)

studentProgressSchema.index({ user: 1, discipline: 1 }, { unique: true })

export default mongoose.model<IStudentProgress>('StudentProgress', studentProgressSchema)
