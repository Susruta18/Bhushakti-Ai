import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};
