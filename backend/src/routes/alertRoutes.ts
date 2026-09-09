import { Router } from 'express';
import { getAlerts, getAlertById, acknowledgeAlert, evaluateRiskAndCreateAlert } from '../controllers/alertController';
import { authenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { ROLES } from '../config/permissions';

const router = Router();

// Public / Authenticated Routes
router.get('/', authenticate, getAlerts);
router.get('/:id', authenticate, getAlertById);

// Protected Authority and Field Officer Routes
router.patch('/:id/acknowledge', authenticate, authorizeRoles(ROLES.AUTHORITY, ROLES.FIELD_OFFICER), acknowledgeAlert);

// Explicit trigger for evaluation (Admin/Authority only to prevent abuse, or could be internal)
router.post('/evaluate/:zoneId', authenticate, authorizeRoles(ROLES.AUTHORITY), evaluateRiskAndCreateAlert);

export default router;
