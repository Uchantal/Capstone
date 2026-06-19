import mongoose, { Document } from 'mongoose'

export type VoiceSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface IVoiceDemonstrationProgress extends Document {
  user: mongoose.Types.ObjectId
  level1DemonstrationPassed: boolean
  level1DemonstrationPassedAt?: Date
  level2DemonstrationPassed: boolean
  level2DemonstrationPassedAt?: Date
  level3DemonstrationPassed: boolean
  level3DemonstrationPassedAt?: Date
  productionPassed: boolean
  productionPassedAt?: Date
  voiceSkillLevel: VoiceSkillLevel
}

export function computeVoiceSkillLevel(doc: Partial<IVoiceDemonstrationProgress>): VoiceSkillLevel {
  if (doc.productionPassed) return 'advanced'
  if (doc.level3DemonstrationPassed || doc.level2DemonstrationPassed) return 'intermediate'
  if (doc.level1DemonstrationPassed) return 'beginner'
  return 'not-started'
}

const schema = new mongoose.Schema<IVoiceDemonstrationProgress>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  level1DemonstrationPassed:   { type: Boolean, default: false },
  level1DemonstrationPassedAt: Date,
  level2DemonstrationPassed:   { type: Boolean, default: false },
  level2DemonstrationPassedAt: Date,
  level3DemonstrationPassed:   { type: Boolean, default: false },
  level3DemonstrationPassedAt: Date,
  productionPassed:   { type: Boolean, default: false },
  productionPassedAt: Date,
  voiceSkillLevel: {
    type: String,
    enum: ['not-started', 'beginner', 'intermediate', 'advanced'],
    default: 'not-started',
  },
}, { timestamps: true })

export default mongoose.model<IVoiceDemonstrationProgress>('VoiceDemonstrationProgress', schema)
