import { Document, Schema, model } from 'mongoose'

export interface ISchool extends Document {
  name: string
  district: string
  province: string
  isActive: boolean
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true, unique: true, trim: true },
  district: { type: String, required: true, trim: true },
  province: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: false },
})

export default model<ISchool>('School', schoolSchema)
