import { query, queryOne, withTransaction } from '../config/database.js'
import { env } from '../config/env.js'

export async function getDefaultEvent() {
  let event = await queryOne(
    `SELECT id, name, slug, qr_prefix, start_date, end_date, is_active
     FROM events WHERE slug = ? AND is_active = 1`,
    [env.defaultEventSlug],
  )

  if (!event) {
    event = await queryOne(
      `SELECT id, name, slug, qr_prefix, start_date, end_date, is_active
       FROM events WHERE is_active = 1 ORDER BY id ASC LIMIT 1`,
    )
  }

  return event
}

export async function getEventById(eventId) {
  return queryOne(
    `SELECT id, name, slug, description, qr_prefix, start_date, end_date, is_active
     FROM events WHERE id = ?`,
    [eventId],
  )
}

export async function listEvents() {
  return query(
    `SELECT id, name, slug, description, qr_prefix, start_date, end_date, is_active
     FROM events ORDER BY start_date DESC, id DESC`,
  )
}

export async function createEvent({ name, slug, description, qrPrefix, startDate, endDate, isActive, userId }) {
  const existing = await queryOne(`SELECT id FROM events WHERE slug = ?`, [slug])
  if (existing) {
    const error = new Error('Event slug already exists')
    error.status = 409
    throw error
  }

  const result = await query(
    `INSERT INTO events
      (name, slug, description, qr_prefix, start_date, end_date, is_active, user_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, description, qrPrefix, startDate, endDate, isActive ? 1 : 0, userId, userId, userId],
  )

  return getEventById(result.insertId)
}

export async function updateEvent(eventId, { name, slug, description, qrPrefix, startDate, endDate, isActive, userId }) {
  const event = await getEventById(eventId)
  if (!event) {
    const error = new Error('Event not found')
    error.status = 404
    throw error
  }

  if (slug && slug !== event.slug) {
    const exists = await queryOne(`SELECT id FROM events WHERE slug = ? AND id != ?`, [slug, eventId])
    if (exists) {
      const error = new Error('Event slug already exists')
      error.status = 409
      throw error
    }
  }

  await query(
    `UPDATE events SET name = ?, slug = ?, description = ?, qr_prefix = ?, start_date = ?, end_date = ?, is_active = ?, updated_by = ?, user_id = ?, updated_at = NOW() WHERE id = ?`,
    [
      name,
      slug,
      description,
      qrPrefix,
      startDate,
      endDate,
      isActive ? 1 : 0,
      userId,
      userId,
      eventId,
    ],
  )

  return getEventById(eventId)
}

export async function resolveEventId(eventId) {
  if (eventId) {
    const event = await getEventById(eventId)
    if (event) return event.id
  }
  const def = await getDefaultEvent()
  return def?.id ?? null
}
