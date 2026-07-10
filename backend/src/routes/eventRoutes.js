import { Router } from 'express'
import * as eventController from '../controllers/eventController.js'

const router = Router()

router.get('/', eventController.listEvents)
router.get('/default', eventController.getDefaultEvent)
router.get('/:id', eventController.getEvent)

router.post('/', eventController.createEvent)
router.put('/:id', eventController.updateEvent)

export default router
