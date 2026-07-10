<<<<<<< HEAD
import express from 'express';
import { body } from 'express-validator';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('organizationName').notEmpty().withMessage('Organization name is required')
  ],
  register
);

router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

export default router;
=======
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
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
