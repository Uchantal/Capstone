import mongoose, { Document, Schema } from 'mongoose'

export interface IDraft extends Document {
  user: mongoose.Types.ObjectId
  discipline: 'visual-arts' | 'graphic-design'
  snapshot: string       // JSON string of canvas state
  thumbnailData?: string
  updatedAt: Date
}

const draftSchema = new Schema<IDraft>(
  {
    user:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discipline:    { type: String, required: true, enum: ['visual-arts', 'graphic-design'] },
    snapshot:      { type: String, required: true },
    thumbnailData: { type: String },
  },
  { timestamps: true }
)

// One draft per student per discipline
draftSchema.index({ user: 1, discipline: 1 }, { unique: true })

export default mongoose.model<IDraft>('Draft', draftSchema)
