import mongoose, { Document, Schema } from 'mongoose'

export interface IModule extends Document {
  key: string
  name: string
  description: string
  isActive: boolean
}

const moduleSchema = new Schema<IModule>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
})

export default mongoose.model<IModule>('Module', moduleSchema)
