/**
 * Seed default event, admin users, and volunteers from src/data/example.json
 * Run: npm run seed (from backend/)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { getPool, query, queryOne } from '../config/database.js'
import { env } from '../config/env.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const exampleJsonPath = path.resolve(__dirname, '../../src/data/example.json')

const USERS = [
  {
    username: 'jatra 2026',
    password: 'jatrafestival@2026',
    role: 'super_admin',
    fullName: 'Jatra Super Admin',
    email: 'admin@jatra2026.local',
  },
  {
    username: 'caumas',
    password: 'Caumas@Admin2026',
    role: 'event_admin',
    fullName: 'CAUMAS Event Admin',
    email: 'admin@caumas.local',
  },
  {
    username: 'gateadmin',
    password: 'Gate@Scan2026',
    role: 'scanner',
    fullName: 'Gate Scanner',
    email: 'scanner@caumas.local',
  },
]

async function seedUsers() {
  const userIds = {}
  for (const u of USERS) {
    const existing = await queryOne(
      `SELECT id FROM users WHERE LOWER(username) = LOWER(?)`,
      [u.username],
    )
    if (existing) {
      userIds[u.username] = existing.id
      console.log(`User exists: ${u.username}`)
      continue
    }
    const hash = await bcrypt.hash(u.password, 12)
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, full_name, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [u.username, u.email, hash, u.role, u.fullName],
    )
    userIds[u.username] = result.insertId
    console.log(`Created user: ${u.username} (${u.role})`)
  }
  return userIds
}

async function seedEvent(adminUserId) {
  let event = await queryOne(`SELECT id FROM events WHERE slug = ?`, [env.defaultEventSlug])
  if (event) {
    console.log(`Event exists: ${env.defaultEventSlug}`)
    return event.id
  }
  const result = await query(
    `INSERT INTO events (name, slug, description, qr_prefix, is_active, created_by, user_id)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [
      env.defaultEventName,
      env.defaultEventSlug,
      'Caumas Event Manager default event',
      'JATRA-VOL',
      adminUserId,
      adminUserId,
    ],
  )
  console.log(`Created event: ${env.defaultEventName}`)
  return result.insertId
}

async function seedVolunteers(eventId, adminUserId) {
  if (!fs.existsSync(exampleJsonPath)) {
    console.warn(`example.json not found at ${exampleJsonPath}, skipping volunteer seed`)
    return
  }

  const registryPath = path.resolve(__dirname, '../../src/data/id-registry.json')
  const roster = JSON.parse(fs.readFileSync(exampleJsonPath, 'utf8'))
  const registry = fs.existsSync(registryPath)
    ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    : { assignments: {} }

  let count = 0

  for (const v of roster) {
    const fingerprint = `${v.name}|${v.email}|${v.phone}`.toLowerCase().trim()
    const passId = registry.assignments?.[fingerprint]
    if (!passId) {
      console.warn(`No pass ID for: ${v.name}`)
      continue
    }

    const existing = await queryOne(
      `SELECT id FROM volunteers WHERE event_id = ? AND external_pass_id = ?`,
      [eventId, passId],
    )
    if (existing) continue

    await query(
      `INSERT INTO volunteers
        (event_id, external_pass_id, name, email, phone, team, role, created_by, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        passId,
        v.name,
        v.email ?? null,
        v.phone ?? null,
        v.team ?? null,
        v.role ?? null,
        adminUserId,
        adminUserId,
      ],
    )

    await query(
      `INSERT INTO attendees
        (event_id, external_pass_id, name, email, phone, pass_type, created_by, user_id)
       VALUES (?, ?, ?, ?, ?, 'volunteer', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [eventId, passId, v.name, v.email ?? null, v.phone ?? null, adminUserId, adminUserId],
    )

    await query(
      `INSERT INTO registrations (event_id, attendee_id, status, created_by, user_id)
       SELECT ?, a.id, 'confirmed', ?, ?
       FROM attendees a
       WHERE a.event_id = ? AND a.external_pass_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM registrations r WHERE r.attendee_id = a.id AND r.event_id = ?
       )`,
      [eventId, adminUserId, adminUserId, eventId, passId, eventId],
    )

    count++
  }

  console.log(`Seeded ${count} volunteers/attendees from example.json`)
}

async function main() {
  try {
    await getPool().query('SELECT 1')
    console.log('Database connected')

    const userIds = await seedUsers()
    const adminId = userIds['jatra 2026'] || userIds['caumas']
    const eventId = await seedEvent(adminId)
    await seedVolunteers(eventId, adminId)

    console.log('\nSeed complete.')
    console.log('Login accounts:')
    USERS.forEach((u) => console.log(`  ${u.username} / ${u.password} (${u.role})`))
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

main()
