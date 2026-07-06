import { Router } from 'express'
import * as dashboardController from '../controllers/dashboardController.js'

const router = Router()

router.get('/stats', dashboardController.stats)
router.get('/activity/:userId?', dashboardController.activity)
router.get('/event', dashboardController.getEvent)
router.get('/status/:passId', dashboardController.getStatus)
router.put('/status/:passId', dashboardController.updateStatus)

export default router
