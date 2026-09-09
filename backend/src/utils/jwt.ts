import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { JwtPayload } from '../models/types';

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
};
