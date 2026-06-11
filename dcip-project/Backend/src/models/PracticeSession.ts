import mongoose, { Document, Schema } from 'mongoose'

export interface IPracticeSession extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  durationMinutes: number
  syncStatus: 'synced' | 'pending'
  createdAt: Date
}

const sessionSchema = new Schema<IPracticeSession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discipline: { type: String, required: true },
  durationMinutes: { type: Number, default: 0 },
  syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IPracticeSession>('PracticeSession', sessionSchema)
