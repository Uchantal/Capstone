import mongoose, { Document, Schema } from 'mongoose'

export interface IGDLevelPoster extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  level: number
  title: string
  subtitle: string
  fontSize: string
  alignment: string
  bgColour: string
  titleColour: string
  reasoning: string
  elementsJson: string
}

const gdLevelPosterSchema = new Schema<IGDLevelPoster>(
  {
    user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discipline:  { type: String, required: true, default: 'graphic-design' },
    level:       { type: Number, required: true },
    title:       { type: String, default: '' },
    subtitle:    { type: String, default: '' },
    fontSize:    { type: String, default: 'medium' },
    alignment:   { type: String, default: 'left' },
    bgColour:    { type: String, default: '#1A1A1A' },
    titleColour: { type: String, default: '#C8960C' },
    reasoning:    { type: String, default: '' },
    elementsJson: { type: String, default: '' },
  },
  { timestamps: true }
)

gdLevelPosterSchema.index({ user: 1, discipline: 1, level: 1 }, { unique: true })

export default mongoose.model<IGDLevelPoster>('GDLevelPoster', gdLevelPosterSchema)
