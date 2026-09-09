import { Router } from 'express';

import {
    predictRisk,
} from '../controllers/riskPredictionController';

import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// ---------------------------------------------------------
// AI Landslide Risk Prediction
// ---------------------------------------------------------

router.post(
    '/predict',
    authenticate,
    predictRisk
);

// ---------------------------------------------------------
// Export router
// ---------------------------------------------------------

export default router;