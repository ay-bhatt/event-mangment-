import { query, queryOne } from '../config/database.js'

const MAX_MEAL_PASSES = 5

const EMPTY_STATUS = {
  attendanceDays: 0,
  breakfast: false,
  lunch: false,
  dinner: false,
  breakfastUsed: 0,
  lunchUsed: 0,
  dinnerUsed: 0,
  kitReceived: false,
  certificateReceived: false,
  entryVerified: false,
  updatedAt: null,
}

function rowToStatus(row) {
  if (!row) return { ...EMPTY_STATUS }
  return {
    attendanceDays: row.attendance_days ?? 0,
    breakfast: Boolean(row.breakfast),
    lunch: Boolean(row.lunch),
    dinner: Boolean(row.dinner),
    breakfastUsed: row.breakfast_used ?? 0,
    lunchUsed: row.lunch_used ?? 0,
    dinnerUsed: row.dinner_used ?? 0,
    kitReceived: Boolean(row.kit_received),
    certificateReceived: Boolean(row.certificate_received),
    entryVerified: Boolean(row.entry_verified),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }
}

export async function getPassStatus(eventId, externalPassId) {
  const row = await queryOne(
    `SELECT * FROM pass_status WHERE event_id = ? AND external_pass_id = ?`,
    [eventId, externalPassId],
  )
  return rowToStatus(row)
}

export async function upsertPassStatus(eventId, externalPassId, status, userId) {
  const existing = await queryOne(
    `SELECT id FROM pass_status WHERE event_id = ? AND external_pass_id = ?`,
    [eventId, externalPassId],
  )

  if (existing) {
    await query(
      `UPDATE pass_status SET
        attendance_days = ?, breakfast_used = ?, lunch_used = ?, dinner_used = ?,
        breakfast = ?, lunch = ?, dinner = ?,
        kit_received = ?, certificate_received = ?, entry_verified = ?,
        updated_by = ?, user_id = ?
       WHERE id = ?`,
      [
        status.attendanceDays ?? 0,
        status.breakfastUsed ?? 0,
        status.lunchUsed ?? 0,
        status.dinnerUsed ?? 0,
        status.breakfast ? 1 : 0,
        status.lunch ? 1 : 0,
        status.dinner ? 1 : 0,
        status.kitReceived ? 1 : 0,
        status.certificateReceived ? 1 : 0,
        status.entryVerified ? 1 : 0,
        userId,
        userId,
        existing.id,
      ],
    )
  } else {
    await query(
      `INSERT INTO pass_status
        (event_id, external_pass_id, attendance_days, breakfast_used, lunch_used, dinner_used,
         breakfast, lunch, dinner, kit_received, certificate_received, entry_verified,
         user_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        externalPassId,
        status.attendanceDays ?? 0,
        status.breakfastUsed ?? 0,
        status.lunchUsed ?? 0,
        status.dinnerUsed ?? 0,
        status.breakfast ? 1 : 0,
        status.lunch ? 1 : 0,
        status.dinner ? 1 : 0,
        status.kitReceived ? 1 : 0,
        status.certificateReceived ? 1 : 0,
        status.entryVerified ? 1 : 0,
        userId,
        userId,
        userId,
      ],
    )
  }

  return getPassStatus(eventId, externalPassId)
}

export function getMealRemaining(status, meal) {
  const usedKey = `${meal}Used`
  const used = status[usedKey] ?? 0
  return Math.max(0, MAX_MEAL_PASSES - used)
}

export { MAX_MEAL_PASSES, EMPTY_STATUS, rowToStatus }
