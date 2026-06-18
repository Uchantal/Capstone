import mongoose, { Document, Schema } from 'mongoose'

export interface IJourneyProgress extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  completedStages: string[]
  updatedAt: Date
}

const journeyProgressSchema = new Schema<IJourneyProgress>(
  {
    user:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discipline:      { type: String, required: true },
    completedStages: { type: [String], default: [] },
  },
  { timestamps: true }
)

journeyProgressSchema.index({ user: 1, discipline: 1 }, { unique: true })

export default mongoose.model<IJourneyProgress>('JourneyProgress', journeyProgressSchema)
