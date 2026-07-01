import mongoose, { Document, Schema } from 'mongoose'

export interface IStudioFolder extends Document {
  user: mongoose.Types.ObjectId
  name: string
  createdAt: Date
}

const studioFolderSchema = new Schema<IStudioFolder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

export default mongoose.model<IStudioFolder>('StudioFolder', studioFolderSchema)
