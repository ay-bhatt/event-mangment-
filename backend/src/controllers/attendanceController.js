import * as attendanceService from '../services/attendanceService.js'

export async function checkIn(req, res, next) {
  try {
    const { externalPassId, eventId, notes } = req.body
    if (!externalPassId) {
      return res.status(400).json({ success: false, message: 'externalPassId required' })
    }
    const result = await attendanceService.checkInAttendee({
      eventId,
      externalPassId,
      scannerUserId: req.dbUser?.id ?? null,
      notes,
      meta: { ipAddress: req.ip, userAgent: req.get('user-agent') },
    })
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function checkOut(req, res, next) {
  try {
    const { externalPassId, eventId, notes } = req.body
    if (!externalPassId) {
      return res.status(400).json({ success: false, message: 'externalPassId required' })
    }
    const result = await attendanceService.checkOutAttendee({
      eventId,
      externalPassId,
      scannerUserId: req.dbUser?.id ?? null,
      notes,
      meta: { ipAddress: req.ip, userAgent: req.get('user-agent') },
    })
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function getLogs(req, res, next) {
  try {
    const logs = await attendanceService.getAttendanceLogs(
      req.query.eventId,
      Number(req.query.limit) || 100,
    )
    res.json({ success: true, logs })
  } catch (err) {
    next(err)
  }
}
