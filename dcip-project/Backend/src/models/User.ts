import mongoose, { Document, Schema } from 'mongoose'

export type UserRole = 'student' | 'supervisor' | 'admin'

export interface IUser extends Document {
  fullName: string
  username: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  school: mongoose.Types.ObjectId | null
  discipline: string | null
  createdAt: Date
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'supervisor', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  school: { type: Schema.Types.ObjectId, ref: 'School', default: null },
  discipline: {
    type: String,
    enum: ['music', 'visual-arts', 'graphic-design', null],
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IUser>('User', userSchema)
