import mongoose, { Document, Schema } from 'mongoose'

export interface IPortfolioItem extends Document {
  user: mongoose.Types.ObjectId
  session: mongoose.Types.ObjectId
  discipline: string
  title: string
  fileType: string
  fileData: string
  snapshot?: string  // raw canvas state for re-editing (VA and GD only)
  syncStatus: 'synced' | 'pending'
  createdAt: Date
}

const portfolioItemSchema = new Schema<IPortfolioItem>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'PracticeSession' },
  discipline: { type: String, required: true },
  title: { type: String, required: true },
  fileType: { type: String, default: 'image/png' },
  fileData: { type: String, required: true },
  snapshot: { type: String },
  syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IPortfolioItem>('PortfolioItem', portfolioItemSchema)
