import { query, queryOne } from '../config/database.js'
import { createAuditLog } from './auditService.js'
import { resolveEventId } from './eventService.js'
import { getPassStatus } from './statusService.js'

export async function recordScan({
  eventId,
  externalPassId,
  scanType = 'entry',
  scannerUserId,
  rawPayload = null,
  result,
  message = null,
  attendeeId = null,
  meta = {},
}) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    const err = new Error('No active event configured')
    err.status = 400
    throw err
  }

  const duplicate = await queryOne(
    `SELECT id FROM scan_logs
     WHERE event_id = ? AND external_pass_id = ? AND scan_type = ?
       AND result = 'valid' AND scanned_at > DATE_SUB(NOW(), INTERVAL 15 SECOND)`,
    [resolvedEventId, externalPassId, scanType],
  )

  if (duplicate) {
    const duplicateMessage = 'Duplicate scan prevented'
    await query(
      `INSERT INTO scan_logs
        (event_id, external_pass_id, scan_type, scanner_user_id, raw_payload, result, attendee_id, message,
         user_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedEventId,
        externalPassId,
        scanType,
        scannerUserId,
        rawPayload,
        'duplicate',
        attendeeId,
        duplicateMessage,
        scannerUserId,
        scannerUserId,
        scannerUserId,
      ],
    )

    await createAuditLog({
      eventId: resolvedEventId,
      userId: scannerUserId,
      action: 'qr_validation',
      entityType: 'pass',
      entityId: externalPassId,
      details: { scanType, result: 'duplicate', message: duplicateMessage },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      createdBy: scannerUserId,
    })

    return { eventId: resolvedEventId, externalPassId, result: 'duplicate', message: duplicateMessage }
  }

  await query(
    `INSERT INTO scan_logs
      (event_id, external_pass_id, scan_type, scanner_user_id, raw_payload, result, attendee_id, message,
       user_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolvedEventId,
      externalPassId,
      scanType,
      scannerUserId,
      rawPayload,
      result,
      attendeeId,
      message,
      scannerUserId,
      scannerUserId,
      scannerUserId,
    ],
  )

  await createAuditLog({
    eventId: resolvedEventId,
    userId: scannerUserId,
    action: 'qr_validation',
    entityType: 'pass',
    entityId: externalPassId,
    details: { scanType, result, message },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: scannerUserId,
  })

  return { eventId: resolvedEventId, externalPassId, result, message }
}

export async function validateQrScan({
  eventId,
  externalPassId,
  scanType = 'entry',
  scannerUserId,
  rawPayload = null,
  meta = {},
}) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) {
    const err = new Error('No active event configured')
    err.status = 400
    throw err
  }

  const attendee = await queryOne(
    `SELECT id, name, external_pass_id, pass_type FROM attendees
     WHERE event_id = ? AND external_pass_id = ?`,
    [resolvedEventId, externalPassId],
  )

  const volunteer = !attendee
    ? await queryOne(
        `SELECT id, name, external_pass_id FROM volunteers
         WHERE event_id = ? AND external_pass_id = ?`,
        [resolvedEventId, externalPassId],
      )
    : null

  const isValid = Boolean(attendee || volunteer)
  const result = isValid ? 'valid' : 'not_found'
  const message = isValid
    ? `Valid pass for ${(attendee || volunteer).name}`
    : 'Pass not found in database'

  const scanResult = await recordScan({
    eventId: resolvedEventId,
    externalPassId,
    scanType,
    scannerUserId,
    rawPayload,
    result,
    message,
    attendeeId: attendee?.id ?? null,
    meta,
  })

  const status = await getPassStatus(resolvedEventId, externalPassId)

  return {
    valid: isValid,
    result: scanResult.result,
    message: scanResult.message,
    attendee: attendee || volunteer || null,
    status,
    eventId: resolvedEventId,
  }
}

export async function getRecentScans(eventId, limit = 50) {
  const resolvedEventId = await resolveEventId(eventId)
  if (!resolvedEventId) return []

  return query(
    `SELECT sl.*, u.username AS scanner_username
     FROM scan_logs sl
     LEFT JOIN users u ON u.id = sl.scanner_user_id
     WHERE sl.event_id = ?
     ORDER BY sl.scanned_at DESC
     LIMIT ?`,
    [resolvedEventId, limit],
  )
}
