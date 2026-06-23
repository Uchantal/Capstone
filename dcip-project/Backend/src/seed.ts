import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from './config/db'
import School from './models/School'
import User from './models/User'
import Module from './models/Module'

dotenv.config()

// One supervisor per participating school.
// Username pattern: sup.<short-key>  Password: Supervisor2025
const SCHOOL_SUPERVISORS = [
  { name: 'GS Kigeme A',              district: 'Nyamagabe', province: 'Southern Province', supUsername: 'sup.kigeme',  supFullName: 'Supervisor GS Kigeme A',              supEmail: 'sup.kigeme@dcip.rw'  },
  { name: 'ES Mushubi',               district: 'Nyamagabe', province: 'Southern Province', supUsername: 'sup.mushubi', supFullName: 'Supervisor ES Mushubi',               supEmail: 'sup.mushubi@dcip.rw' },
  { name: 'ES Ruhango',               district: 'Ruhango',   province: 'Southern Province', supUsername: 'sup.ruhango', supFullName: 'Supervisor ES Ruhango',               supEmail: 'sup.ruhango@dcip.rw' },
  { name: 'GS Shyogwe',               district: 'Muhanga',   province: 'Southern Province', supUsername: 'sup.shyogwe', supFullName: 'Supervisor GS Shyogwe',               supEmail: 'sup.shyogwe@dcip.rw' },
  { name: 'College Ste Marie Kibuye', district: 'Karongi',   province: 'Western Province',  supUsername: 'sup.kibuye',  supFullName: 'Supervisor College Ste Marie Kibuye', supEmail: 'sup.kibuye@dcip.rw'  },
]

const seed = async () => {
  await connectDB()

  await School.deleteMany({})
  await User.deleteMany({ role: { $in: ['admin', 'supervisor'] } })
  await Module.deleteMany({})

  const schools = await School.insertMany(
    SCHOOL_SUPERVISORS.map(({ name, district, province }) => ({ name, district, province, isActive: true }))
  )

  console.log('Schools seeded')

  await Module.insertMany([
    { key: 'music',          name: 'Music',          description: 'Guitar, piano, and vocal practice',           isActive: true },
    { key: 'visual-arts',    name: 'Visual Arts',    description: 'Drawing, painting, and digital illustration', isActive: true },
    { key: 'graphic-design', name: 'Graphic Design', description: 'Layout, typography, and digital design',      isActive: true },
  ])

  console.log('Modules seeded')

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

  const supHash = await bcrypt.hash('Supervisor2025', 10)
  for (let i = 0; i < SCHOOL_SUPERVISORS.length; i++) {
    const { supUsername, supFullName, supEmail } = SCHOOL_SUPERVISORS[i]
    await User.create({
      fullName: supFullName,
      username: supUsername,
      email: supEmail,
      password: supHash,
      role: 'supervisor',
      school: schools[i]._id,
      discipline: null,
    })
    console.log(`  Supervisor seeded: ${supUsername} → ${SCHOOL_SUPERVISORS[i].name}`)
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
