import dotenv from 'dotenv'
import { connectDB } from './config/db'
import School from './models/School'

dotenv.config()

const seed = async () => {
  await connectDB()

  await School.deleteMany({})

  await School.insertMany([
    { name: 'G.S Kigeme-A', district: 'Nyamagabe' },
    { name: 'G.S Kigeme-B', district: 'Nyamagabe' },
    { name: 'G.S Mushubi', district: 'Nyamagabe' },
    { name: 'E.S Groupe Scolaire Gitarama', district: 'Muhanga' },
    { name: 'E.S Groupe Scolaire Ruhango', district: 'Ruhango' },
  ])

  console.log('Schools seeded successfully')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
