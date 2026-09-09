import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getOverviewMetrics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRiskDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getRiskDistribution();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRiskTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await analyticsService.getRiskTrend(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAlertsTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await analyticsService.getAlertsTrend(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEnvironmentalTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await analyticsService.getEnvironmentalTrend(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
