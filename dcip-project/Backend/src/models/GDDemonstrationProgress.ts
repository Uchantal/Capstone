import mongoose, { Document } from 'mongoose'

export type GDSkillLevel = 'not-started' | 'beginner' | 'intermediate' | 'advanced'

export interface IGDDemonstrationProgress extends Document {
  user: mongoose.Types.ObjectId
  level1DemonstrationPassed: boolean
  level1DemonstrationPassedAt?: Date
  level1PosterSnapshot?: string
  level2DemonstrationPassed: boolean
  level2DemonstrationPassedAt?: Date
  level2PosterSnapshot?: string
  level3DemonstrationPassed: boolean
  level3DemonstrationPassedAt?: Date
  level3PosterSnapshot?: string
  productionPassed: boolean
  productionPassedAt?: Date
  graphicDesignSkillLevel: GDSkillLevel
}

export function computeGDSkillLevel(doc: Partial<IGDDemonstrationProgress>): GDSkillLevel {
  if (doc.productionPassed) return 'advanced'
  if (doc.level3DemonstrationPassed || doc.level2DemonstrationPassed) return 'intermediate'
  if (doc.level1DemonstrationPassed) return 'beginner'
  return 'not-started'
}

const schema = new mongoose.Schema<IGDDemonstrationProgress>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    level1DemonstrationPassed:   { type: Boolean, default: false },
    level1DemonstrationPassedAt: Date,
    level1PosterSnapshot:        String,
    level2DemonstrationPassed:   { type: Boolean, default: false },
    level2DemonstrationPassedAt: Date,
    level2PosterSnapshot:        String,
    level3DemonstrationPassed:   { type: Boolean, default: false },
    level3DemonstrationPassedAt: Date,
    level3PosterSnapshot:        String,
    productionPassed:   { type: Boolean, default: false },
    productionPassedAt: Date,
    graphicDesignSkillLevel: {
      type: String,
      enum: ['not-started', 'beginner', 'intermediate', 'advanced'],
      default: 'not-started',
    },
  },
  { timestamps: true }
)

export default mongoose.model<IGDDemonstrationProgress>('GDDemonstrationProgress', schema)
