import { Router } from 'express';
import { 
  getEnvironmentalData, 
  getEnvironmentalDataById, 
  getEnvironmentalDataByZone, 
  getLatestEnvironmentalData, 
  createEnvironmentalData,
  getEnvironmentalFeatures
} from '../controllers/environmentalDataController';
import { authenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { ROLES } from '../config/permissions';

const router = Router();

// Protected Feature Route
router.get('/features/:zoneId', authenticate, authorizeRoles(ROLES.AUTHORITY, ROLES.FIELD_OFFICER), getEnvironmentalFeatures);

// Public / Authenticated Routes
router.get('/', authenticate, getEnvironmentalData);
router.get('/:id', authenticate, getEnvironmentalDataById);
router.get('/zone/:zoneId', authenticate, getEnvironmentalDataByZone);
router.get('/latest/:zoneId', authenticate, getLatestEnvironmentalData);

// Protected Authority and Field Officer Routes
router.post('/', authenticate, authorizeRoles(ROLES.AUTHORITY, ROLES.FIELD_OFFICER), createEnvironmentalData);

export default router;
