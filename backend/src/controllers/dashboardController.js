import * as dashboardService from '../services/dashboardService.js'
import { getDefaultEvent } from '../services/eventService.js'
import { getPassStatus, upsertPassStatus } from '../services/statusService.js'
import { createAuditLog } from '../services/auditService.js'
import { resolveEventId } from '../services/eventService.js'

export async function stats(req, res, next) {
  try {
    const data = await dashboardService.getDashboardStats(req.query.eventId)
    res.json({ success: true, stats: data })
  } catch (err) {
    next(err)
  }
}

export async function activity(req, res, next) {
  try {
    const logs = await dashboardService.getVolunteerActivity(
      req.params.userId || 1,
      Number(req.query.limit) || 50,
    )
    res.json({ success: true, activity: logs })
  } catch (err) {
    next(err)
  }
}

export async function getEvent(req, res, next) {
  try {
    const event = await getDefaultEvent()
    res.json({ success: true, event })
  } catch (err) {
    next(err)
  }
}

export async function getStatus(req, res, next) {
  try {
    const { passId } = req.params
    const eventId = await resolveEventId(req.query.eventId)
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'No active event' })
    }
    const status = await getPassStatus(eventId, passId)
    res.json({ success: true, status })
  } catch (err) {
    next(err)
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { passId } = req.params
    const eventId = await resolveEventId(req.body.eventId)
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'No active event' })
    }
    const status = await upsertPassStatus(eventId, passId, req.body.status, req.dbUser?.id ?? null)

    await createAuditLog({
      eventId,
      userId: req.dbUser?.id ?? null,
      action: 'status_update',
      entityType: 'pass',
      entityId: passId,
      details: req.body.status,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      createdBy: req.dbUser?.id ?? null,
    })

    res.json({ success: true, status })
  } catch (err) {
    next(err)
  }
}
