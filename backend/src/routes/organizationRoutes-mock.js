import express from 'express'
import {
  getOrganization,
  updateOrganization
} from '../controllers/organizationController-mock.js'

const router = express.Router()

router.get('/', (req, res, next) => {
  // For mock, skip auth
  req.user = { userId: 1 }
  getOrganization(req, res, next)
})
router.put('/', (req, res, next) => {
  // For mock, skip auth
  req.user = { userId: 1 }
  updateOrganization(req, res, next)
})

export default router
