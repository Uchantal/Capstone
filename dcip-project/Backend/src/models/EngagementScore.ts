import mongoose, { Document, Schema } from 'mongoose'

export interface IEngagementScores {
  course1:           number | null
  course2:           number | null
  level1Learn:       number | null
  level1Practise:    number | null
  level1Demonstrate: number | null
  level2Learn:       number | null
  level2Practise:    number | null
  level2Demonstrate: number | null
  level3Learn:       number | null
  level3Practise:    number | null
  level3Demonstrate: number | null
  sharpening:        number | null
  production:        number | null
  overallEngagement: number | null
}

export interface IEngagementScore extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  scores: IEngagementScores
}

const scoresSchema = new Schema<IEngagementScores>(
  {
    course1:           { type: Number, default: null },
    course2:           { type: Number, default: null },
    level1Learn:       { type: Number, default: null },
    level1Practise:    { type: Number, default: null },
    level1Demonstrate: { type: Number, default: null },
    level2Learn:       { type: Number, default: null },
    level2Practise:    { type: Number, default: null },
    level2Demonstrate: { type: Number, default: null },
    level3Learn:       { type: Number, default: null },
    level3Practise:    { type: Number, default: null },
    level3Demonstrate: { type: Number, default: null },
    sharpening:        { type: Number, default: null },
    production:        { type: Number, default: null },
    overallEngagement: { type: Number, default: null },
  },
  { _id: false }
)

const engagementScoreSchema = new Schema<IEngagementScore>(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discipline: { type: String, required: true },
    scores:     { type: scoresSchema, default: () => ({}) },
  },
  { timestamps: true }
)

engagementScoreSchema.index({ user: 1, discipline: 1 }, { unique: true })

export default mongoose.model<IEngagementScore>('EngagementScore', engagementScoreSchema)
