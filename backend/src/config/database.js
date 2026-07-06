import mysql from 'mysql2/promise'
import { env } from './env.js'

let pool = null

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host || 'localhost',
      port: Number(env.db.port || 3306),
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,

      charset: 'utf8mb4',
      timezone: '+00:00',

      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    })
  }

  return pool
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

export async function testDatabaseConnection() {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()

    console.log('✅ MySQL Database Connected Successfully')
    console.log(`📂 Database: ${env.db.database}`)
    console.log(`👤 User: ${env.db.user}`)
    console.log(`🌐 Host: ${env.db.host}`)

    connection.release()
    return true
  } catch (error) {
    console.error('❌ Database Connection Failed')
    console.error(error.message)
    throw error
  }
}