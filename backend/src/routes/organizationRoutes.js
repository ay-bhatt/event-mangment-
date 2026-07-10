import express from 'express';
import { getMyOrganization, updateOrganization } from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyOrganization);
router.put('/', protect, updateOrganization);

export default router;
