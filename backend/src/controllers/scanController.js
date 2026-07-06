import * as scanService from '../services/scanService.js'

export async function validateScan(req, res, next) {
  try {
    const { externalPassId, eventId, scanType, rawPayload } = req.body
    if (!externalPassId) {
      return res.status(400).json({ success: false, error: 'externalPassId required' })
    }
    const result = await scanService.validateQrScan({
      eventId,
      externalPassId,
      scanType: scanType || 'entry',
      scannerUserId: req.dbUser?.id ?? null,
      rawPayload,
      meta: { ipAddress: req.ip, userAgent: req.get('user-agent') },
    })
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function getScans(req, res, next) {
  try {
    const scans = await scanService.getRecentScans(req.query.eventId, Number(req.query.limit) || 50)
    res.json({ success: true, scans })
  } catch (err) {
    next(err)
  }
}
