import dotenv from 'dotenv'
import { connectDB } from '../config/db'
import School from '../models/School'
import User from '../models/User'

dotenv.config()

const run = async () => {
  await connectDB()

  const schoolA = await School.findOne({ name: 'GS Kigeme A' })
  if (!schoolA) {
    console.error('GS Kigeme A not found. Run the seed script first.')
    process.exit(1)
  }

  // Collect all valid school IDs currently in the database
  const validIds = await School.find({}).distinct('_id')

  // Match students where school is null OR references an ID that no longer exists
  const result = await User.updateMany(
    {
      role: 'student',
      $or: [
        { school: null },
        { school: { $not: { $in: validIds } } },
      ],
    },
    { $set: { school: schoolA._id } }
  )

  console.log(`Migration complete. Updated ${result.modifiedCount} student(s) to ${schoolA.name}.`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
