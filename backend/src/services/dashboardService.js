import { query, queryOne } from '../config/database.js'
import { resolveEventId } from './eventService.js'

async function countRows(sql, params) {
  const rows = await query(sql, params)
  return Number(rows[0]?.count ?? 0)
}

export async function getDashboardStats(eventId) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    return {
      totalRegistrations: 0,
      totalAttendees: 0,
      checkedInUsers: 0,
      mealsServed: 0,
      pendingMeals: 0,
      qrScans: 0,
      volunteerActivity: 0,
      entryVerified: 0,
      kitReceived: 0,
      totalVolunteers: 0,
      entryRate: 0,
    }
  }

  const [
    totalRegistrations,
    totalAttendees,
    totalVolunteers,
    checkedInUsers,
    mealsServed,
    pendingMeals,
    qrScans,
    volunteerActivity,
    entryVerified,
    kitReceived,
  ] = await Promise.all([
    countRows(`SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?`, [resolvedEventId]),
    countRows(`SELECT COUNT(*) AS count FROM attendees WHERE event_id = ?`, [resolvedEventId]),
    countRows(`SELECT COUNT(*) AS count FROM volunteers WHERE event_id = ?`, [resolvedEventId]),
    countRows(
      `SELECT COUNT(DISTINCT external_pass_id) AS count FROM attendance_logs
       WHERE event_id = ? AND is_duplicate = 0`,
      [resolvedEventId],
    ),
    countRows(
      `SELECT COUNT(*) AS count FROM meal_logs WHERE event_id = ? AND result = 'approved'`,
      [resolvedEventId],
    ),
    countRows(
      `SELECT COUNT(*) AS count FROM meal_logs
       WHERE event_id = ? AND result IN ('no_passes', 'already_collected')`,
      [resolvedEventId],
    ),
    countRows(`SELECT COUNT(*) AS count FROM scan_logs WHERE event_id = ?`, [resolvedEventId]),
    countRows(
      `SELECT COUNT(*) AS count FROM audit_logs
       WHERE event_id = ? AND action IN ('qr_validation', 'attendance', 'meal_collection')`,
      [resolvedEventId],
    ),
    countRows(
      `SELECT COUNT(*) AS count FROM pass_status WHERE event_id = ? AND entry_verified = 1`,
      [resolvedEventId],
    ),
    countRows(
      `SELECT COUNT(*) AS count FROM pass_status WHERE event_id = ? AND kit_received = 1`,
      [resolvedEventId],
    ),
  ])

  return {
    totalRegistrations,
    totalAttendees,
    checkedInUsers,
    mealsServed,
    pendingMeals,
    qrScans,
    volunteerActivity,
    entryVerified,
    kitReceived,
    totalVolunteers,
    entryRate:
      totalVolunteers > 0 ? Math.round((entryVerified / totalVolunteers) * 100) : 0,
  }
}

export async function getVolunteerActivity(userId, limit = 50) {
  return query(
    `SELECT action, entity_type, entity_id, details, created_at
     FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
  )
}
