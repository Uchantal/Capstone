import mongoose, { Document, Schema } from 'mongoose'

export interface IFeedback extends Document {
  name?: string
  email?: string
  feedbackType: string
  discipline?: string
  message: string
  submittedAt: Date
  userAgent?: string
}

const feedbackSchema = new Schema<IFeedback>(
  {
    name:         { type: String },
    email:        { type: String },
    feedbackType: { type: String, required: true },
    discipline:   { type: String },
    message:      { type: String, required: true, minlength: 10 },
    submittedAt:  { type: Date, default: Date.now },
    userAgent:    { type: String },
  }
)

export default mongoose.model<IFeedback>('Feedback', feedbackSchema)
