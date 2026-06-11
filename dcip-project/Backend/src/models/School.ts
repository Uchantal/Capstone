import mongoose, { Document, Schema } from 'mongoose'

export interface ISchool extends Document {
  name: string
  district: string
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true, unique: true, trim: true },
  district: { type: String, required: true, trim: true },
})

export default mongoose.model<ISchool>('School', schoolSchema)
