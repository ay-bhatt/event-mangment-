import * as eventService from '../services/eventService.js'

export async function listEvents(req, res, next) {
  try {
    const events = await eventService.listEvents()
    res.json({ success: true, events })
  } catch (err) {
    next(err)
  }
}

export async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id)
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' })
    }
    res.json({ success: true, event })
  } catch (err) {
    next(err)
  }
}

export async function getDefaultEvent(req, res, next) {
  try {
    const event = await eventService.getDefaultEvent()
    if (!event) {
      return res.status(404).json({ success: false, message: 'No active event configured' })
    }
    res.json({ success: true, event })
  } catch (err) {
    next(err)
  }
}

export async function createEvent(req, res, next) {
  try {
    const { name, slug, description, qrPrefix, startDate, endDate, isActive } = req.body
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Event name and slug are required' })
    }
    const event = await eventService.createEvent({
      name,
      slug,
      description: description || null,
      qrPrefix: qrPrefix || 'JATRA-VOL',
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive === true || isActive === 'true' ? 1 : 0,
      userId: req.dbUser?.id ?? null,
    })
    res.status(201).json({ success: true, event })
  } catch (err) {
    next(err)
  }
}

export async function updateEvent(req, res, next) {
  try {
    const { name, slug, description, qrPrefix, startDate, endDate, isActive } = req.body
    const event = await eventService.updateEvent(req.params.id, {
      name,
      slug,
      description: description || null,
      qrPrefix: qrPrefix || 'JATRA-VOL',
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive === true || isActive === 'true' ? 1 : 0,
      userId: req.dbUser?.id ?? null,
    })
    res.json({ success: true, event })
  } catch (err) {
    next(err)
  }
}
