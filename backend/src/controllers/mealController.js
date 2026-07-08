import * as mealService from '../services/mealService.js'

export async function collect(req, res, next) {
  try {
    const { externalPassId, eventId, mealType } = req.body
    if (!externalPassId || !mealType) {
      return res.status(400).json({ success: false, error: 'externalPassId and mealType required' })
    }
    const result = await mealService.collectMeal({
      eventId,
      externalPassId,
      mealType,
      scannerUserId: req.dbUser?.id ?? null,
      meta: { ipAddress: req.ip, userAgent: req.get('user-agent') },
    })
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function getLogs(req, res, next) {
  try {
    const logs = await mealService.getMealLogs(req.query.eventId, Number(req.query.limit) || 100)
    res.json({ success: true, logs })
  } catch (err) {
    next(err)
  }
}
