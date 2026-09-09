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
      // Web dev server
      config.frontendUrl,
      // Capacitor Android WebView — serves from https://localhost (HTTPS)
      'https://localhost',
      'capacitor://localhost',
      'http://localhost',
      // LAN IP — Android phone hitting the dev PC backend directly
      'http://192.168.1.103:3000',
      'http://192.168.1.103:5000',
    ];


    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log and allow; in production, reject unknown origins
      if (config.nodeEnv === 'development') {
        console.warn(`[CORS] Unexpected origin in dev: ${origin} — allowing`);
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    }
  },
  credentials: true
}));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);

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