import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,

  nodeEnv:
    process.env.NODE_ENV || 'development',

  frontendUrl:
    process.env.FRONTEND_URL ||
    'http://localhost:3000',

  // Python ML Risk Prediction API
  mlApiUrl:
    process.env.ML_API_URL ||
    'http://127.0.0.1:8000',

  mongoDbUri:
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/bhushakti_ai',

  mongoDbName:
    process.env.MONGODB_DB_NAME ||
    'bhushakti_ai',

  deviceApiKey:
    process.env.DEVICE_API_KEY ||
    (process.env.NODE_ENV === 'production' ? (() => { throw new Error('DEVICE_API_KEY is missing in production'); })() : 'dev-sensor-secret-key-1234'),
};