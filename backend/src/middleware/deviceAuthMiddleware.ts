import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const authenticateDevice = (req: Request, res: Response, next: NextFunction): void => {
  const deviceKey = req.headers['x-device-key'];
  
  if (!deviceKey) {
    res.status(401).json({ success: false, message: 'Device key is missing' });
    return;
  }

  // Use DEVICE_API_KEY from env, fallback if not set to prevent accepting empty string
  const expectedKey = config.deviceApiKey;
  if (!expectedKey || deviceKey !== expectedKey) {
    res.status(403).json({ success: false, message: 'Invalid device key' });
    return;
  }

  next();
};
