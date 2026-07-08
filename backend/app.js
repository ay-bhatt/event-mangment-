import { createApp } from './src/app.js'
import { env } from './src/config/env.js'
import { closePool, testDatabaseConnection } from './src/config/database.js'

let server = null

function formatApiUrl() {
  return `http://localhost:${env.port}${env.apiBasePath}`
}

function handleShutdown(signal) {
  return async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`)
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await closePool()
    process.exit(0)
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

process.on('SIGINT', handleShutdown('SIGINT'))
process.on('SIGTERM', handleShutdown('SIGTERM'))

async function startServer() {
  let dbConnected = false

  try {
    await testDatabaseConnection()
    dbConnected = true
  } catch (error) {
    console.error('Failed to connect to database:', error)
    if (env.nodeEnv !== 'development') {
      console.error('Database connection is required in non-development environments. Exiting.')
      process.exit(1)
    }
    console.warn('Continuing startup in development mode without a database connection.')
  }

  try {
    const app = createApp()
    server = app.listen(env.port, () => {
      if (dbConnected) {
        console.log('✓ Database Connected')
      } else {
        console.log('⚠️  Running without database connection (development mode)')
      }
      console.log(`✓ Environment: ${env.nodeEnv}`)
      console.log('✓ API Running')
      console.log(`✓ Port: ${env.port}`)
      console.log(`✓ API URL: ${formatApiUrl()}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
