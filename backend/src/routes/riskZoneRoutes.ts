import { Router } from 'express';
import { getRiskZones, getRiskZoneById, getNearbyRiskZones, createRiskZone, updateRiskZone } from '../controllers/riskZoneController';
import { authenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { ROLES } from '../config/permissions';

const router = Router();

// Public / Authenticated Routes
router.get('/', authenticate, getRiskZones);
router.get('/nearby', authenticate, getNearbyRiskZones);
router.get('/:id', authenticate, getRiskZoneById);

// Protected Authority Routes
router.post('/', authenticate, authorizeRoles(ROLES.AUTHORITY), createRiskZone);
router.patch('/:id', authenticate, authorizeRoles(ROLES.AUTHORITY), updateRiskZone);

export default router;
