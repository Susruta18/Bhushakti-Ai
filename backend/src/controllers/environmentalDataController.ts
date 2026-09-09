import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import * as envDataService from '../services/environmentalDataService';
import { validateEnvironmentalDataInput } from '../validators/environmentalDataValidator';

export const getEnvironmentalData = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    const filter: any = {};
    if (req.query.zoneId && ObjectId.isValid(req.query.zoneId as string)) {
      filter.zoneId = new ObjectId(req.query.zoneId as string);
    }
    if (req.query.source) filter.source = req.query.source;
    
    if (req.query.from || req.query.to) {
      filter.recordedAt = {};
      if (req.query.from) filter.recordedAt.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.recordedAt.$lte = new Date(req.query.to as string);
    }

    const result = await envDataService.getEnvironmentalData(filter, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEnvironmentalDataById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const record = await envDataService.getEnvironmentalDataById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Environmental data not found' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEnvironmentalDataByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.params.zoneId as string;
    if (!ObjectId.isValid(zoneId)) {
      res.status(400).json({ success: false, message: 'Invalid Zone ID format' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    const filter: any = {};
    if (req.query.from || req.query.to) {
      filter.recordedAt = {};
      if (req.query.from) filter.recordedAt.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.recordedAt.$lte = new Date(req.query.to as string);
    }

    const result = await envDataService.getEnvironmentalDataByZone(zoneId, filter, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLatestEnvironmentalData = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.params.zoneId as string;
    if (!ObjectId.isValid(zoneId)) {
      res.status(400).json({ success: false, message: 'Invalid Zone ID format' });
      return;
    }

    const record = await envDataService.getLatestEnvironmentalData(zoneId);
    if (!record) {
      res.status(404).json({ success: false, message: 'No environmental data found for this zone' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEnvironmentalData = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateEnvironmentalDataInput(req.body);
    
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      return;
    }

    const payload = {
      ...req.body,
      zoneId: new ObjectId(req.body.zoneId),
      recordedAt: new Date(req.body.recordedAt),
    };

    // Strip unallowed fields
    delete payload._id;
    delete payload.createdAt;

    const newRecord = await envDataService.createEnvironmentalData(payload);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    if (error.message === 'Risk Zone not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { getEnvironmentalFeaturesForZone } from '../services/environmentalFeatureService';

export const getEnvironmentalFeatures = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.params.zoneId as string;
    if (!ObjectId.isValid(zoneId)) {
      res.status(400).json({ success: false, message: 'Invalid Zone ID format' });
      return;
    }

    let windowHours = 24;
    if (req.query.windowHours) {
      const parsed = parseInt(req.query.windowHours as string, 10);
      if (isNaN(parsed) || parsed <= 0 || parsed > 720) { // arbitrary max of 30 days
        res.status(400).json({ success: false, message: 'Invalid windowHours parameter' });
        return;
      }
      windowHours = parsed;
    }

    const features = await getEnvironmentalFeaturesForZone(zoneId, windowHours);
    if (!features) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }

    res.status(200).json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
