import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { AlertDocument, RiskPredictionDocument, RiskPredictionFactor } from '../models/types';
import { getEnvironmentalFeaturesForZone } from './environmentalFeatureService';
import { predictLandslideRisk, RiskPredictionInput } from './riskPredictionService';
import { createNotificationsForAlert } from './notificationService';

export const evaluateCurrentRisk = async (zoneId: string): Promise<{ success: boolean; message: string; alert?: AlertDocument }> => {
  if (!ObjectId.isValid(zoneId)) {
    throw new Error('Invalid zone ID');
  }

  // 1. Fetch Environmental Data
  const envData = await getEnvironmentalFeaturesForZone(zoneId);
  if (!envData) {
    return { success: false, message: 'Zone not found or no environmental data' };
  }

  // 2. Validate Completeness
  const { rainfall24h, soilMoisture, elevation, slope } = envData.features;
  if (rainfall24h === null || soilMoisture === null || elevation === null || slope === null) {
    return { success: false, message: 'Insufficient environmental data for ML prediction' };
  }

  // 3. Predict Risk
  const input: RiskPredictionInput = {
    rainfall24h,
    elevation,
    slope,
    soilMoisture
  };

  const predictionResponse = await predictLandslideRisk(input);
  const { risk_probability, risk_level, warning } = predictionResponse.prediction;

  // Persist the prediction
  const db = getDatabase();
  const predictionsCollection = db.collection<RiskPredictionDocument>('risk_predictions');
  
  const factors: RiskPredictionFactor[] = [
    { factorName: 'Rainfall', value: rainfall24h, contribution: 0, severity: 'MODERATE' }, // Placeholder severity, actual is handled by ML but not returned granularly
    { factorName: 'Soil Moisture', value: soilMoisture, contribution: 0, severity: 'MODERATE' },
    { factorName: 'Elevation', value: elevation, contribution: 0, severity: 'LOW' },
    { factorName: 'Slope', value: slope, contribution: 0, severity: 'LOW' }
  ];

  await predictionsCollection.insertOne({
    zoneId: new ObjectId(zoneId),
    probability: risk_probability,
    riskLevel: risk_level as 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
    confidence: 0.9, // Defaulting as ML doesn't return confidence explicitly
    factors,
    modelVersion: '1.0.0',
    inputData: { rainfall24h, soilMoisture, elevation, slope },
    predictedAt: new Date(),
    createdAt: new Date()
  });

  // 4. Determine Warning
  if (!warning) {
    return { success: true, message: 'Risk evaluated safely. No warning required.' };
  }

  // 5. Deduplication Strategy
  const alertsCollection = db.collection<AlertDocument>('alerts');

  // Severity Mapping
  const severity: 'MODERATE' | 'HIGH' | 'CRITICAL' = 
    (risk_level === 'CRITICAL' || risk_level === 'HIGH' || risk_level === 'MODERATE') 
      ? risk_level 
      : 'MODERATE'; // Default fallback if warning is true but risk_level is not standard

  const existingAlert = await alertsCollection.findOne({
    zoneId: new ObjectId(zoneId),
    status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
  });

  if (existingAlert) {
    if (existingAlert.severity === severity) {
      return { success: true, message: 'Active alert already exists for this severity.', alert: existingAlert };
    } else {
      // Resolve old alert due to severity change
      await alertsCollection.updateOne(
        { _id: existingAlert._id },
        { 
          $set: { 
            status: 'RESOLVED', 
            resolvedAt: new Date(), 
            updatedAt: new Date() 
          } 
        }
      );
    }
  }

  // Create new alert
  const newAlert: AlertDocument = {
    zoneId: new ObjectId(zoneId),
    title: `${severity} Landslide Risk Alert`,
    message: `${severity.toLowerCase()} landslide risk detected for this zone. Immediate attention may be required.`,
    severity,
    probability: risk_probability,
    trigger: 'AUTOMATIC_ML_EVALUATION',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await alertsCollection.insertOne(newAlert);
  newAlert._id = result.insertedId;

  // 6. Real-time Notification Dispatch
  await createNotificationsForAlert(newAlert).catch(e => {
    console.error('Failed to create notifications for alert:', e);
  });

  return { success: true, message: 'New alert generated successfully.', alert: newAlert };
};

export const getAlerts = async (filter: any, page: number = 1, limit: number = 20) => {
  const db = getDatabase();
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.collection<AlertDocument>('alerts')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<AlertDocument>('alerts').countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getAlertById = async (id: string): Promise<AlertDocument | null> => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDatabase();
  return await db.collection<AlertDocument>('alerts').findOne({ _id: new ObjectId(id) });
};

export const acknowledgeAlert = async (id: string, userId: string): Promise<boolean> => {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) return false;
  const db = getDatabase();
  
  const result = await db.collection<AlertDocument>('alerts').updateOne(
    { _id: new ObjectId(id), status: 'ACTIVE' },
    { 
      $set: { 
        status: 'ACKNOWLEDGED', 
        acknowledgedBy: new ObjectId(userId),
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      } 
    }
  );

  return result.modifiedCount > 0;
};
