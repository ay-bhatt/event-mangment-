import dotenv from 'dotenv'

dotenv.config()

function parseOrigins(value) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const corsOrigin = parseOrigins(process.env.CORS_ORIGIN || '')

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  port: Number(process.env.PORT || 3001),
  apiBasePath: process.env.API_BASE_PATH?.trim() || '/api',
  db: {
    host: process.env.DB_HOST?.trim() || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER?.trim() || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME?.trim() || 'vldxjhks_caumas_eventmanager',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  corsOrigin:
    process.env.NODE_ENV === 'production'
      ? corsOrigin
      : Array.from(new Set([...corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'])),
  defaultEventSlug: process.env.DEFAULT_EVENT_SLUG || 'jatra-2026',
  defaultEventName: process.env.DEFAULT_EVENT_NAME || 'Jatra Festival 2026',
}
