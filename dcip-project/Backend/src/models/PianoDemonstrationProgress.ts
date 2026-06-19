import mongoose, { Document, Schema } from 'mongoose'

export type PianoSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface IPianoDemonstrationProgress extends Document {
  user: mongoose.Types.ObjectId
  level1DemonstrationPassed: boolean
  level1DemonstrationPassedAt?: Date
  level2DemonstrationPassed: boolean
  level2DemonstrationPassedAt?: Date
  level3DemonstrationPassed: boolean
  level3DemonstrationPassedAt?: Date
  productionPassed: boolean
  productionPassedAt?: Date
  pianoSkillLevel: PianoSkillLevel
  createdAt: Date
  updatedAt: Date
}

const pianoDemonstrationProgressSchema = new Schema<IPianoDemonstrationProgress>(
  {
    user:                        { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    level1DemonstrationPassed:   { type: Boolean, default: false },
    level1DemonstrationPassedAt: { type: Date },
    level2DemonstrationPassed:   { type: Boolean, default: false },
    level2DemonstrationPassedAt: { type: Date },
    level3DemonstrationPassed:   { type: Boolean, default: false },
    level3DemonstrationPassedAt: { type: Date },
    productionPassed:            { type: Boolean, default: false },
    productionPassedAt:          { type: Date },
    pianoSkillLevel:             { type: String, enum: ['not-started', 'beginner', 'intermediate', 'advanced'], default: 'not-started' },
  },
  { timestamps: true }
)

export function computePianoSkillLevel(doc: Pick<
  IPianoDemonstrationProgress,
  'productionPassed' | 'level3DemonstrationPassed' | 'level2DemonstrationPassed' | 'level1DemonstrationPassed'
>): PianoSkillLevel {
  if (doc.productionPassed) return 'advanced'
  if (doc.level3DemonstrationPassed || doc.level2DemonstrationPassed) return 'intermediate'
  if (doc.level1DemonstrationPassed) return 'beginner'
  return 'not-started'
}

export default mongoose.model<IPianoDemonstrationProgress>('PianoDemonstrationProgress', pianoDemonstrationProgressSchema)
