import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import * as alertService from '../services/alertService';

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    const filter: any = {};
    if (req.query.zoneId && ObjectId.isValid(req.query.zoneId as string)) {
      filter.zoneId = new ObjectId(req.query.zoneId as string);
    }
    if (req.query.status && typeof req.query.status === 'string') {
      filter.status = req.query.status;
    }
    
    const result = await alertService.getAlerts(filter, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAlertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Alert ID format' });
      return;
    }

    const alert = await alertService.getAlertById(id);
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Alert ID format' });
      return;
    }
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const success = await alertService.acknowledgeAlert(id, userId);
    
    if (!success) {
      res.status(400).json({ success: false, message: 'Alert not found or already acknowledged/resolved' });
      return;
    }

    res.status(200).json({ success: true, message: 'Alert acknowledged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const evaluateRiskAndCreateAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.params.zoneId as string;
    if (!ObjectId.isValid(zoneId)) {
      res.status(400).json({ success: false, message: 'Invalid Zone ID format' });
      return;
    }

    const result = await alertService.evaluateCurrentRisk(zoneId);
    
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Evaluation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during evaluation' });
  }
};
