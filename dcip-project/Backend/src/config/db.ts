import mongoose from 'mongoose'
import { setDefaultResultOrder } from 'dns'

// The dev network has DNS64 (NAT64-synthesized IPv6) but no IPv6 default
// route. Setting ipv4first stops Node.js from trying the dead IPv6 path.
// family:4 in the driver options is the belt-and-suspenders guarantee.
setDefaultResultOrder('ipv4first')

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      family: 4,
    })
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
