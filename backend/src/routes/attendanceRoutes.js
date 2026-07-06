import { Router } from 'express'
import * as attendanceController from '../controllers/attendanceController.js'

const router = Router()

router.post('/check-in', attendanceController.checkIn)
router.post('/check-out', attendanceController.checkOut)
router.get('/logs', attendanceController.getLogs)

export default router
