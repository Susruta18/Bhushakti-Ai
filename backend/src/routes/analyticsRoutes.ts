import { Router } from 'express';
import { getOverview, getRiskDistribution, getRiskTrend, getAlertsTrend, getEnvironmentalTrend } from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Analytics endpoints - all require authentication
router.get('/overview', authenticate, getOverview);
router.get('/risk-distribution', authenticate, getRiskDistribution);
router.get('/risk-trend', authenticate, getRiskTrend);
router.get('/alerts-trend', authenticate, getAlertsTrend);
router.get('/environmental-trend', authenticate, getEnvironmentalTrend);

export default router;
