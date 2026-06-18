import mongoose, { Document, Schema } from 'mongoose'

interface GDChecklist {
  hasTitleAndSubtitle: boolean
  hasStrongContrast: boolean
  hasIntentionalLayout: boolean
  hasReasoningText: boolean
  isOriginalWork: boolean
}

export interface IGDProductionResult extends Document {
  user: mongoose.Types.ObjectId
  discipline: string
  posterTitle: string
  posterSubtitle: string
  fontSize: string
  alignment: string
  bgColour: string
  titleColour: string
  finalImageData: string
  reasoningText: string
  checklistConfirmed: GDChecklist
  submittedAt: Date
}

const gdProductionResultSchema = new Schema<IGDProductionResult>({
  user:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discipline:     { type: String, required: true, default: 'graphic-design' },
  posterTitle:    { type: String, default: '' },
  posterSubtitle: { type: String, default: '' },
  fontSize:       { type: String, default: 'medium' },
  alignment:      { type: String, default: 'left' },
  bgColour:       { type: String, default: '#1A1A1A' },
  titleColour:    { type: String, default: '#C8960C' },
  finalImageData: { type: String, required: true },
  reasoningText:  { type: String, required: true },
  checklistConfirmed: {
    hasTitleAndSubtitle:  { type: Boolean, required: true },
    hasStrongContrast:    { type: Boolean, required: true },
    hasIntentionalLayout: { type: Boolean, required: true },
    hasReasoningText:     { type: Boolean, required: true },
    isOriginalWork:       { type: Boolean, required: true },
  },
  submittedAt: { type: Date, default: Date.now },
})

export default mongoose.model<IGDProductionResult>('GDProductionResult', gdProductionResultSchema)
