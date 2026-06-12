import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from './config/db'
import School from './models/School'
import User from './models/User'
import Module from './models/Module'

dotenv.config()

// One supervisor per pilot school.
// Username pattern: sup.<short-key>  Password: Supervisor2025
const SCHOOL_SUPERVISORS = [
  { name: 'G.S Kigeme-A',                 district: 'Nyamagabe', supUsername: 'sup.kigeme.a',  supFullName: 'Supervisor Kigeme A',  supEmail: 'sup.kigeme.a@dcip.rw' },
  { name: 'G.S Kigeme-B',                 district: 'Nyamagabe', supUsername: 'sup.kigeme.b',  supFullName: 'Supervisor Kigeme B',  supEmail: 'sup.kigeme.b@dcip.rw' },
  { name: 'G.S Mushubi',                  district: 'Nyamagabe', supUsername: 'sup.mushubi',   supFullName: 'Supervisor Mushubi',   supEmail: 'sup.mushubi@dcip.rw' },
  { name: 'E.S Groupe Scolaire Gitarama', district: 'Muhanga',   supUsername: 'sup.gitarama',  supFullName: 'Supervisor Gitarama',  supEmail: 'sup.gitarama@dcip.rw' },
  { name: 'E.S Groupe Scolaire Ruhango',  district: 'Ruhango',   supUsername: 'sup.ruhango',   supFullName: 'Supervisor Ruhango',   supEmail: 'sup.ruhango@dcip.rw' },
]

const seed = async () => {
  await connectDB()

  await School.deleteMany({})
  await User.deleteMany({ role: { $in: ['admin', 'supervisor'] } })
  await Module.deleteMany({})

  const schools = await School.insertMany(
    SCHOOL_SUPERVISORS.map(({ name, district }) => ({ name, district }))
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
