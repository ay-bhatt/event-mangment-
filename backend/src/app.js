import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import scanRoutes from './routes/scanRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import mealRoutes from './routes/mealRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import eventRoutes from './routes/eventRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(limiter)

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many login attempts' },
  })

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok', service: 'caumas-event-manager-api' })
  })

  const api = express.Router()
  api.use('/auth', authLimiter, authRoutes)
  api.use('/events', eventRoutes)
  api.use('/scans', scanRoutes)
  api.use('/attendance', attendanceRoutes)
  api.use('/meals', mealRoutes)
  api.use('/dashboard', dashboardRoutes)

  app.use(env.apiBasePath, api)

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
