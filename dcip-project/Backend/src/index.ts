import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import authRoutes from './routes/auth'
import sessionRoutes from './routes/sessions'
import portfolioRoutes from './routes/portfolio'
import adminRoutes from './routes/admin'
import supervisorRoutes from './routes/supervisor'
import productionRoutes from './routes/production'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Exiting.')
  process.exit(1)
}

const app = express()

const allowedOrigin = (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
  if (!origin || origin.startsWith('http://localhost:') || origin === process.env.CLIENT_URL) {
    cb(null, true)
  } else {
    cb(new Error(`CORS: origin ${origin} not allowed`))
  }
}
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/supervisor', supervisorRoutes)
app.use('/api/production', productionRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
