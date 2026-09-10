import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';

import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import testRoutes from './routes/testRoutes';
import riskZoneRoutes from './routes/riskZoneRoutes';
import riskPredictionRoutes from './routes/riskPredictionRoutes';
import environmentalDataRoutes from './routes/environmentalDataRoutes';
import sensorRoutes from './routes/sensorRoutes';
import alertRoutes from './routes/alertRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';

import {
  notFoundHandler,
  errorHandler
} from './middleware/errorMiddleware';


const app = express();


// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      // Production Render frontend
      'https://bhushakti-ai-frontend.onrender.com',
      // Backend configured FRONTEND_URL (for flexibility)
      config.frontendUrl,
      // Capacitor Android WebView — serves from https://localhost (HTTPS)
      'https://localhost',
      'capacitor://localhost',
      'http://localhost',
      // Local web dev server
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log and allow; in production, reject unknown origins
      if (config.nodeEnv === 'development') {
        console.warn(`[CORS] Unexpected origin in dev: ${origin} — allowing`);
        callback(null, true);
      } else {
        // Pass null (not an Error) to deny without cascading to error handler
        // The cors middleware will respond with a 403 and omit ACAO header
        callback(null, false);
      }
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb'
  })
);

// Global Rate Limiting — 200 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Rate Limiting — stricter: 20 login attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}


// ---------------------------------------------------------
// Root
// ---------------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BHUSHAKTI AI Backend API'
  });
});


// ---------------------------------------------------------
// API Routes
// ---------------------------------------------------------

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/risk-zones', riskZoneRoutes);

app.use(
  '/api/risk-prediction',
  riskPredictionRoutes
);

app.use(
  '/api/environmental-data',
  environmentalDataRoutes
);

app.use('/api/sensor-readings', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);


// ---------------------------------------------------------
// Test Routes
// ---------------------------------------------------------

if (config.nodeEnv === 'development') {
  app.use('/api/test', testRoutes);
}


// ---------------------------------------------------------
// Error Handling
// ---------------------------------------------------------

app.use(notFoundHandler);

app.use(errorHandler);


export default app;