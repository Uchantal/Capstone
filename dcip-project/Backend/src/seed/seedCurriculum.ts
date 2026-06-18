import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { setDefaultResultOrder } from 'dns'
import CurriculumLevel from '../models/CurriculumLevel'

dotenv.config()
setDefaultResultOrder('ipv4first')

const levels = [
  { discipline: 'music', level: 1, title: 'Rhythm Foundations', description: 'Learn basic rhythm patterns and timing' },
  { discipline: 'music', level: 2, title: 'Melody Basics', description: 'Create simple melodies using the keyboard' },
  { discipline: 'music', level: 3, title: 'Harmony Introduction', description: 'Combine melody and rhythm' },
  { discipline: 'music', level: 4, title: 'Composition', description: 'Build a complete musical piece' },
  { discipline: 'music', level: 5, title: 'Performance', description: 'Record and refine a full performance' },
  { discipline: 'visual-arts', level: 1, title: 'Line and Shape', description: 'Master basic drawing elements' },
  { discipline: 'visual-arts', level: 2, title: 'Colour and Tone', description: 'Explore colour relationships and shading' },
  { discipline: 'visual-arts', level: 3, title: 'Composition', description: 'Arrange elements in a balanced composition' },
  { discipline: 'visual-arts', level: 4, title: 'Expression', description: 'Develop a personal visual style' },
  { discipline: 'visual-arts', level: 5, title: 'Portfolio Piece', description: 'Create a finished artwork for showcase' },
  { discipline: 'graphic-design', level: 1, title: 'Typography Basics', description: 'Understand font and text layout' },
  { discipline: 'graphic-design', level: 2, title: 'Layout and Grid', description: 'Structure visual information' },
  { discipline: 'graphic-design', level: 3, title: 'Colour in Design', description: 'Apply colour theory to design work' },
  { discipline: 'graphic-design', level: 4, title: 'Poster Design', description: 'Create complete poster compositions' },
  { discipline: 'graphic-design', level: 5, title: 'Brand Identity', description: 'Design a consistent visual identity' },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not set')
    process.exit(1)
  }
  await mongoose.connect(uri, { family: 4 })
  await CurriculumLevel.deleteMany({})
  await CurriculumLevel.insertMany(levels)
  console.log('Curriculum seeded: 15 levels across 3 disciplines.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
