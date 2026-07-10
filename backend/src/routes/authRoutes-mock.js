import express from 'express'
import {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/authController-mock.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', (req, res, next) => {
  // For mock, we'll skip auth
  req.user = { userId: 1 }
  getMe(req, res, next)
})

export default router
