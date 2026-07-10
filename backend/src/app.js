<<<<<<< HEAD
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes-mock.js';
import organizationRoutes from './routes/organizationRoutes-mock.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());

const corsOptions = {
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
=======
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
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
