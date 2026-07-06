import { Router } from 'express'
import * as mealController from '../controllers/mealController.js'

const router = Router()

router.post('/collect', mealController.collect)
router.get('/logs', mealController.getLogs)

export default router
