import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setupDatabase() {
  // First connection - to create database
  const conn1 = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  })

  try {
    // Create database
    await conn1.query('CREATE DATABASE IF NOT EXISTS vldxjhks_caumas_eventmanager')
    console.log('✅ Database created')
  } finally {
    await conn1.end()
  }

  // Second connection - with database selected
  const conn2 = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vldxjhks_caumas_eventmanager',
  })

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split by semicolons and filter out comments and empty statements
    const statements = schema
      .split(';')
      .map(stmt => {
        // Remove leading/trailing whitespace
        return stmt.trim()
          // Remove SQL comments
          .split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--')
            return commentIndex === -1 ? line : line.substring(0, commentIndex)
          })
          .join('\n')
          .trim()
      })
      .filter(stmt => stmt.length > 0)

    // Execute each statement
    let executed = 0
    let skipped = 0
    for (const statement of statements) {
      try {
        await conn2.query(statement)
        executed++
      } catch (err) {
        // Skip expected errors (like table already exists)
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️ ${err.message}`)
        }
        skipped++
      }
    }

    console.log(`✅ Database schema imported: ${executed} queries executed, ${skipped} skipped`)
  } catch (error) {
    console.error('❌ Schema import failed:', error.message)
  } finally {
    await conn2.end()
  }
}

setupDatabase()

