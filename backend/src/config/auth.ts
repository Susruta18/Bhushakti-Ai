import dotenv from 'dotenv';
dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET is missing in production'); })() : 'fallback_secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
