import mongoose, { Document } from 'mongoose'

export type VisualArtsSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface IVisualArtsDemonstrationProgress extends Document {
  user: mongoose.Types.ObjectId
  level1DemonstrationPassed: boolean
  level1DemonstrationPassedAt?: Date
  level1DemonstrationCanvasSnapshot?: string
  level2DemonstrationPassed: boolean
  level2DemonstrationPassedAt?: Date
  level2DemonstrationCanvasSnapshot?: string
  level3DemonstrationPassed: boolean
  level3DemonstrationPassedAt?: Date
  level3DemonstrationCanvasSnapshot?: string
  productionPassed: boolean
  productionPassedAt?: Date
  visualArtsSkillLevel: VisualArtsSkillLevel
}

export function computeVisualArtsSkillLevel(doc: Partial<IVisualArtsDemonstrationProgress>): VisualArtsSkillLevel {
  if (doc.productionPassed) return 'advanced'
  if (doc.level3DemonstrationPassed || doc.level2DemonstrationPassed) return 'intermediate'
  if (doc.level1DemonstrationPassed) return 'beginner'
  return 'not-started'
}

const schema = new mongoose.Schema<IVisualArtsDemonstrationProgress>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    level1DemonstrationPassed:          { type: Boolean, default: false },
    level1DemonstrationPassedAt:        Date,
    level1DemonstrationCanvasSnapshot:  String,
    level2DemonstrationPassed:          { type: Boolean, default: false },
    level2DemonstrationPassedAt:        Date,
    level2DemonstrationCanvasSnapshot:  String,
    level3DemonstrationPassed:          { type: Boolean, default: false },
    level3DemonstrationPassedAt:        Date,
    level3DemonstrationCanvasSnapshot:  String,
    productionPassed:   { type: Boolean, default: false },
    productionPassedAt: Date,
    visualArtsSkillLevel: {
      type: String,
      enum: ['not-started', 'beginner', 'intermediate', 'advanced'],
      default: 'not-started',
    },
  },
  { timestamps: true }
)

export default mongoose.model<IVisualArtsDemonstrationProgress>(
  'VisualArtsDemonstrationProgress',
  schema
)
