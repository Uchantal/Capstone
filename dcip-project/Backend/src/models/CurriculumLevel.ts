import mongoose, { Document, Schema } from 'mongoose'

export interface ICurriculumLevel extends Document {
  discipline: string
  level: number
  title: string
  description: string
  requiredSessions: number
  isActive: boolean
}

const curriculumLevelSchema = new Schema<ICurriculumLevel>({
  discipline: { type: String, required: true },
  level: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSessions: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
})

curriculumLevelSchema.index({ discipline: 1, level: 1 }, { unique: true })

export default mongoose.model<ICurriculumLevel>('CurriculumLevel', curriculumLevelSchema)
