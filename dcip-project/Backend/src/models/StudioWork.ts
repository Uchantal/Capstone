import mongoose, { Document, Schema } from 'mongoose'

export interface IStudioWork extends Document {
  user: mongoose.Types.ObjectId
  title: string
  discipline: string
  fileData?: string
  fileUrl?: string
  cloudinaryPublicId?: string
  fileType: string
  width: number
  height: number
  format: string
  createdAt: Date
  updatedAt: Date
}

const studioWorkSchema = new Schema<IStudioWork>(
  {
    user:                { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:               { type: String, required: true },
    discipline:          { type: String, required: true },
    fileData:            { type: String },
    fileUrl:             { type: String },
    cloudinaryPublicId:  { type: String },
    fileType:            { type: String, default: 'image/png' },
    width:               { type: Number, default: 1920 },
    height:              { type: Number, default: 1080 },
    format:              { type: String, default: 'HD 16:9' },
  },
  { timestamps: true },
)

export default mongoose.model<IStudioWork>('StudioWork', studioWorkSchema)
