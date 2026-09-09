import { Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';

export const checkHealth = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'BHUSHAKTI AI Backend',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
};
