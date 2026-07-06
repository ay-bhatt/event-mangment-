import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { authenticateUser, loadUser } from '../middleware/auth.js'

const router = Router()

router.post('/login', authController.login)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

router.use(authenticateUser, loadUser)
router.post('/logout', authController.logout)
router.get('/me', authController.me)
router.get('/validate', authController.validateSession)

export default router
