import mongoose, { Document, Schema } from 'mongoose'

export type UserRole = 'student' | 'admin'

export interface IUser extends Document {
  fullName: string
  username: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  school: mongoose.Types.ObjectId | null
  discipline: string | null
  subDiscipline: string | null
  graduated: boolean
  graduatedAt: Date | undefined
  graduatedDisciplines: string[]
  passwordResetToken: string | undefined
  passwordResetExpires: Date | undefined
  createdAt: Date
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  school: { type: Schema.Types.ObjectId, ref: 'School', default: null },
  discipline: {
    type: String,
    enum: ['music', 'visual-arts', 'graphic-design', null],
    default: null,
  },
  subDiscipline: {
    type: String,
    enum: ['piano', 'guitar', 'voice', null],
    default: null,
  },
  graduated:             { type: Boolean, default: false },
  graduatedAt:           { type: Date },
  graduatedDisciplines:  [{ type: String }],
  passwordResetToken:    { type: String },
  passwordResetExpires:  { type: Date },
  createdAt:             { type: Date, default: Date.now },
})

export default mongoose.model<IUser>('User', userSchema)
