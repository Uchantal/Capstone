import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from './config/db'
import School from './models/School'
import User from './models/User'
import Module from './models/Module'

dotenv.config()

const SCHOOLS = [
  { name: 'GS Kigeme A',              district: 'Nyamagabe', province: 'Southern Province' },
  { name: 'ES Mushubi',               district: 'Nyamagabe', province: 'Southern Province' },
  { name: 'ES Ruhango',               district: 'Ruhango',   province: 'Southern Province' },
  { name: 'GS Shyogwe',               district: 'Muhanga',   province: 'Southern Province' },
  { name: 'College Ste Marie Kibuye', district: 'Karongi',   province: 'Western Province'  },
]

const seed = async () => {
  await connectDB()

  const schoolCount = await School.countDocuments()
  if (schoolCount === 0) {
    await School.insertMany(SCHOOLS.map(s => ({ ...s, isActive: true })))
    console.log('Schools seeded')
  } else {
    console.log(`Schools skipped — ${schoolCount} already exist`)
  }

  const moduleCount = await Module.countDocuments()
  if (moduleCount === 0) {
    await Module.insertMany([
      { key: 'music',          name: 'Music',          description: 'Guitar, piano, and vocal practice',           isActive: true },
      { key: 'visual-arts',    name: 'Visual Arts',    description: 'Drawing, painting, and digital illustration', isActive: true },
      { key: 'graphic-design', name: 'Graphic Design', description: 'Layout, typography, and digital design',      isActive: true },
    ])
    console.log('Modules seeded')
  } else {
    console.log(`Modules skipped — ${moduleCount} already exist`)
  }

  const adminExists = await User.findOne({ role: 'admin' })
  if (!adminExists) {
    const adminHash = await bcrypt.hash('Admin2025', 10)
    await User.create({
      fullName: 'Platform Administrator',
      username: 'admin',
      email: 'admin@dcip.rw',
      password: adminHash,
      role: 'admin',
      school: null,
      discipline: null,
    })
    console.log('Admin seeded  →  username: admin  /  password: Admin2025')
  } else {
    console.log('Admin skipped — already exists')
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
