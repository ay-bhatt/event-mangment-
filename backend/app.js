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
  try {
    await testDatabaseConnection()
    const app = createApp()
    server = app.listen(env.port, () => {
      console.log('✓ Database Connected')
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
