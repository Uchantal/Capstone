import mongoose, { Document, Schema } from 'mongoose'

interface ChecklistConfirmed {
  hasThreeShapes: boolean
  usedColourIntentionally: boolean
  hasVisibleShading: boolean
  isOriginalWork: boolean
}

export interface IVAProductionResult extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  finalImageData: string
  checklistConfirmed: ChecklistConfirmed
  submittedAt: Date
}

const vaProductionResultSchema = new Schema<IVAProductionResult>({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discipline: { type: String, required: true, default: 'visual-arts' },
  finalImageData: { type: String, required: true },
  checklistConfirmed: {
    hasThreeShapes:          { type: Boolean, required: true },
    usedColourIntentionally: { type: Boolean, required: true },
    hasVisibleShading:       { type: Boolean, required: true },
    isOriginalWork:          { type: Boolean, required: true },
  },
  submittedAt: { type: Date, default: Date.now },
})

export default mongoose.model<IVAProductionResult>('VAProductionResult', vaProductionResultSchema)
