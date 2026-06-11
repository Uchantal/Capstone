import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  fullName: string
  username: string
  password: string
  school: mongoose.Types.ObjectId
  discipline: string | null
  createdAt: Date
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  school: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  discipline: {
    type: String,
    enum: ['music', 'visual-arts', 'graphic-design', null],
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IUser>('User', userSchema)
