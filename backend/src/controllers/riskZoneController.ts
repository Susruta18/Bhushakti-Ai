import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import * as riskZoneService from '../services/riskZoneService';
import { validateRiskZoneInput, validateNearbyQuery } from '../validators/riskZoneValidator';

export const getRiskZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    const filter: any = {};
    if (req.query.riskLevel && typeof req.query.riskLevel === 'string') filter.riskLevel = req.query.riskLevel;
    if (req.query.isActive !== undefined && typeof req.query.isActive === 'string') filter.isActive = req.query.isActive === 'true';

    const result = await riskZoneService.getRiskZones(filter, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRiskZoneById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Risk Zone ID format' });
      return;
    }

    const zone = await riskZoneService.getRiskZoneById(id);
    if (!zone) {
      res.status(404).json({ success: false, message: 'Risk Zone not found' });
      return;
    }

    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNearbyRiskZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.latitude as string);
    const lng = parseFloat(req.query.longitude as string);
    const radius = parseFloat(req.query.radius as string);

    const validation = validateNearbyQuery(lat, lng, radius);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Invalid query parameters', errors: validation.errors });
      return;
    }

    const zones = await riskZoneService.getNearbyRiskZones(lat, lng, radius);
    res.status(200).json({ success: true, data: zones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createRiskZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRiskZoneInput(req.body);
    
    // We also need to check required fields for creation
    const requiredFields = ['name', 'code', 'description', 'riskLevel', 'currentProbability', 'location', 'populationExposure', 'criticalAssetCount'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined) {
        validation.errors.push(`Missing required field: ${field}`);
        validation.isValid = false;
      }
    }

    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      return;
    }

    const newZone = await riskZoneService.createRiskZone({
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });
    
    res.status(201).json({ success: true, data: newZone });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateRiskZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Risk Zone ID format' });
      return;
    }

    const validation = validateRiskZoneInput(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      return;
    }

    const updatedZone = await riskZoneService.updateRiskZone(id, req.body);
    if (!updatedZone) {
      res.status(404).json({ success: false, message: 'Risk Zone not found' });
      return;
    }

    res.status(200).json({ success: true, data: updatedZone });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
