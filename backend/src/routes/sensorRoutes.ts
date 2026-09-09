import { Router } from 'express';
import { createSensorReading, getLatestReadingByZone } from '../controllers/sensorController';
import { authenticateDevice } from '../middleware/deviceAuthMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Device endpoint (requires device API key)
router.post('/', authenticateDevice, createSensorReading);

// Client endpoint (requires user JWT)
router.get('/latest/:zoneId', authenticate, getLatestReadingByZone);

export default router;
