import { Router } from 'express'
import * as scanController from '../controllers/scanController.js'

const router = Router()

router.post('/validate', scanController.validateScan)
router.get('/logs', scanController.getScans)

export default router
