import mongoose, { Document, Schema } from 'mongoose'

export interface IProductionResult extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  totalPrompts: number
  correctCount: number
  outcome: 'demonstrated' | 'needs-more-practice'
  attemptDetails: { chordSymbol: string; correct: boolean; timeTakenMs: number }[]
  createdAt: Date
}

const productionResultSchema = new Schema<IProductionResult>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discipline: { type: String, required: true },
  totalPrompts: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  outcome: { type: String, enum: ['demonstrated', 'needs-more-practice'], required: true },
  attemptDetails: [{ chordSymbol: String, correct: Boolean, timeTakenMs: Number }],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<IProductionResult>('ProductionResult', productionResultSchema)
