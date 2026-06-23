import mongoose, { Document, Schema } from 'mongoose'

export interface ISchool extends Document {
  name: string
  district: string
  province: string
  isActive: boolean
  labSessionOpen: boolean
  labSessionOpenedAt: Date | null
  labSessionOpenedBy: mongoose.Types.ObjectId | null
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true, unique: true, trim: true },
  district: { type: String, required: true, trim: true },
  province: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: false },
  labSessionOpen: { type: Boolean, default: false },
  labSessionOpenedAt: { type: Date, default: null },
  labSessionOpenedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
})

export default mongoose.model<ISchool>('School', schoolSchema)
