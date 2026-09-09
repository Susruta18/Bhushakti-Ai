import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import * as sensorService from '../services/sensorService';
import { validateSensorReadingInput } from '../validators/sensorValidator';

export const createSensorReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateSensorReadingInput(req.body);
    
    if (!validation.isValid) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      return;
    }

    const payload = {
      deviceId: req.body.deviceId,
      zoneId: req.body.zoneId ? new ObjectId(req.body.zoneId) : undefined,
      soilMoisture: req.body.soilMoisture,
      rainfall: req.body.rainfall,
      rainRaw: req.body.rainRaw,
      recordedAt: req.body.recordedAt ? new Date(req.body.recordedAt) : new Date(),
      createdAt: new Date(),
    };

    const newRecord = await sensorService.createSensorReading(payload);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLatestReadingByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.params.zoneId as string;
    if (!ObjectId.isValid(zoneId)) {
      res.status(400).json({ success: false, message: 'Invalid Zone ID format' });
      return;
    }

    const record = await sensorService.getLatestReadingByZone(zoneId);
    if (!record) {
      res.status(404).json({ success: false, message: 'No sensor reading found for this zone' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
