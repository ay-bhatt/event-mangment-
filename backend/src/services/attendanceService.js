import { query, queryOne } from '../config/database.js'
import { createAuditLog } from './auditService.js'
import { resolveEventId } from './eventService.js'
import { getPassStatus, upsertPassStatus } from './statusService.js'

export async function checkInAttendee({
  eventId,
  externalPassId,
  scannerUserId,
  notes = null,
  meta = {},
}) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    const err = new Error('No active event configured')
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
  if (!person) {
    const err = new Error('Participant not found')
    err.status = 404
    throw err
  }

  const existingToday = await queryOne(
    `SELECT id FROM attendance_logs
     WHERE event_id = ? AND external_pass_id = ?
       AND DATE(check_in_at) = CURDATE() AND is_duplicate = 0`,
    [resolvedEventId, externalPassId],
  )

  const isDuplicate = Boolean(existingToday)

  await query(
    `INSERT INTO attendance_logs
      (event_id, attendee_id, external_pass_id, scanner_user_id, is_duplicate, notes,
       user_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolvedEventId,
      attendee?.id ?? null,
      externalPassId,
      scannerUserId,
      isDuplicate ? 1 : 0,
      notes,
      scannerUserId,
      scannerUserId,
      scannerUserId,
    ],
  )

  let status = await getPassStatus(resolvedEventId, externalPassId)

  if (!isDuplicate) {
    status = await upsertPassStatus(
      resolvedEventId,
      externalPassId,
      { ...status, attendanceDays: (status.attendanceDays ?? 0) + 1, entryVerified: true },
      scannerUserId,
    )
  }

  await createAuditLog({
    eventId: resolvedEventId,
    userId: scannerUserId,
    action: 'attendance',
    entityType: 'pass',
    entityId: externalPassId,
    details: { isDuplicate, name: person.name },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: scannerUserId,
  })

  return {
    success: !isDuplicate,
    isDuplicate,
    message: isDuplicate
      ? 'Attendance already recorded today'
      : `${person.name} checked in successfully`,
    status,
    name: person.name,
  }
}

export async function checkOutAttendee({
  eventId,
  externalPassId,
  scannerUserId,
  notes = null,
  meta = {},
}) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    const err = new Error('No active event configured')
    err.status = 400
    throw err
  }

  const attendance = await queryOne(
    `SELECT id, attendee_id, check_out_at FROM attendance_logs
     WHERE event_id = ? AND external_pass_id = ?
     ORDER BY check_in_at DESC LIMIT 1`,
    [resolvedEventId, externalPassId],
  )

  if (!attendance || attendance.check_out_at) {
    const err = new Error('No active check-in found for this pass')
    err.status = 400
    throw err
  }

  await query(
    `UPDATE attendance_logs SET check_out_at = NOW(), notes = ?, updated_by = ?, user_id = ? WHERE id = ?`,
    [notes, scannerUserId, scannerUserId, attendance.id],
  )

  await createAuditLog({
    eventId: resolvedEventId,
    userId: scannerUserId,
    action: 'attendance',
    entityType: 'pass',
    entityId: externalPassId,
    details: { eventId: resolvedEventId, action: 'check_out', notes },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: scannerUserId,
  })

  return {
    success: true,
    message: 'Check-out recorded successfully',
    attendanceId: attendance.id,
  }
}

export async function getAttendanceLogs(eventId, limit = 100) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) return []

  return query(
    `SELECT al.*, u.username AS scanner_username
     FROM attendance_logs al
     LEFT JOIN users u ON u.id = al.scanner_user_id
     WHERE al.event_id = ?
     ORDER BY al.check_in_at DESC
     LIMIT ?`,
    [resolvedEventId, limit],
  )
}
