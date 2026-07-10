import { query } from '../config/database.js'

export async function createAuditLog({
  eventId = null,
  userId = null,
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  createdBy = null,
}) {
  await query(
    `INSERT INTO audit_logs
      (event_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      userId,
      action,
      entityType,
      entityId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
      createdBy ?? userId,
      createdBy ?? userId,
    ],
  )
}

export function auditMiddleware(action, entityType = null) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode < 400 && req.dbUser) {
        createAuditLog({
          eventId: req.body?.eventId ?? req.params?.eventId ?? null,
          userId: req.dbUser.id,
          action,
          entityType,
          entityId: req.params?.id ?? req.body?.externalPassId ?? null,
          details: { method: req.method, path: req.originalUrl, body: sanitizeBody(req.body) },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          createdBy: req.dbUser.id,
        }).catch((err) => console.error('Audit log failed:', err))
      }
      return originalJson(body)
    }
    next()
  }
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  const copy = { ...body }
  if (copy.password) copy.password = '[REDACTED]'
  if (copy.newPassword) copy.newPassword = '[REDACTED]'
  return copy
}
