import { query, queryOne } from '../config/database.js'
import { createAuditLog } from './auditService.js'
import { resolveEventId } from './eventService.js'
import {
  getPassStatus,
  upsertPassStatus,
  getMealRemaining,
  MAX_MEAL_PASSES,
} from './statusService.js'

export async function collectMeal({
  eventId,
  externalPassId,
  mealType,
  scannerUserId,
  meta = {},
}) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    const err = new Error('No active event configured')
    err.status = 400
    throw err
  }

  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
    const err = new Error('Invalid meal type')
    err.status = 400
    throw err
  }

  const attendee = await queryOne(
    `SELECT id, name FROM attendees WHERE event_id = ? AND external_pass_id = ?`,
    [resolvedEventId, externalPassId],
  )

  const volunteer = !attendee
    ? await queryOne(
        `SELECT id, name FROM volunteers WHERE event_id = ? AND external_pass_id = ?`,
        [resolvedEventId, externalPassId],
      )
    : null

  const person = attendee || volunteer

  let result = 'approved'
  let message = ''
  let isDuplicate = 0

  if (!person) {
    result = 'not_found'
    message = 'Participant not found'
  } else {
    const recentDuplicate = await queryOne(
      `SELECT id FROM meal_logs
       WHERE event_id = ? AND external_pass_id = ? AND meal_type = ?
         AND result = 'approved' AND collected_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)`,
      [resolvedEventId, externalPassId, mealType],
    )

    if (recentDuplicate) {
      result = 'already_collected'
      message = 'Meal Already Collected'
      isDuplicate = 1
    } else {
      const status = await getPassStatus(resolvedEventId, externalPassId)
      const remaining = getMealRemaining(status, mealType)

      if (remaining <= 0) {
        result = 'no_passes'
        message = `No remaining ${mealType} passes for this participant`
        isDuplicate = 1
      } else {
        const usedKey = `${mealType}Used`
        const nextStatus = {
          ...status,
          [usedKey]: (status[usedKey] ?? 0) + 1,
        }
        await upsertPassStatus(resolvedEventId, externalPassId, nextStatus, scannerUserId)
        message = `${person.name} successfully recorded for ${mealType}`
      }
    }
  }

  await query(
    `INSERT INTO meal_logs
      (event_id, attendee_id, external_pass_id, meal_type, scanner_user_id, is_duplicate, result, message,
       user_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolvedEventId,
      attendee?.id ?? null,
      externalPassId,
      mealType,
      scannerUserId,
      isDuplicate,
      result,
      message,
      scannerUserId,
      scannerUserId,
      scannerUserId,
    ],
  )

  await createAuditLog({
    eventId: resolvedEventId,
    userId: scannerUserId,
    action: 'meal_collection',
    entityType: 'pass',
    entityId: externalPassId,
    details: { mealType, result, message },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: scannerUserId,
  })

  const updatedStatus = await getPassStatus(resolvedEventId, externalPassId)

  return {
    success: result === 'approved',
    result,
    message: result === 'already_collected' ? 'Meal Already Collected' : message,
    status: updatedStatus,
    name: person?.name ?? null,
    maxPasses: MAX_MEAL_PASSES,
  }
}

export async function getMealLogs(eventId, limit = 100) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) return []

  return query(
    `SELECT ml.*, u.username AS scanner_username
     FROM meal_logs ml
     LEFT JOIN users u ON u.id = ml.scanner_user_id
     WHERE ml.event_id = ?
     ORDER BY ml.collected_at DESC
     LIMIT ?`,
    [resolvedEventId, limit],
  )
}
