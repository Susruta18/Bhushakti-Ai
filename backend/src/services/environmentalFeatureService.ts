import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { 
  EnvironmentalDataDocument, 
  RiskZoneDocument, 
  EnvironmentalFeatures,
  SensorReadingDocument
} from '../models/types';

export const getEnvironmentalFeaturesForZone = async (zoneId: string, windowHours: number = 24): Promise<EnvironmentalFeatures | null> => {
  if (!ObjectId.isValid(zoneId)) return null;
  const db = getDatabase();

  const zone = await db.collection<RiskZoneDocument>('risk_zones').findOne({ _id: new ObjectId(zoneId) });
  if (!zone) return null;

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  // Get observations within the window
  const observations = await db.collection<EnvironmentalDataDocument>('environmental_data')
    .find({
      zoneId: new ObjectId(zoneId),
      recordedAt: { $gte: windowStart, $lte: now }
    })
    .sort({ recordedAt: -1 })
    .toArray();

  const sensorReadings = await db.collection<SensorReadingDocument>('sensor_readings')
    .find({
      zoneId: new ObjectId(zoneId),
      recordedAt: { $gte: windowStart, $lte: now }
    })
    .sort({ recordedAt: -1 })
    .toArray();

  const latestEnvData = await db.collection<EnvironmentalDataDocument>('environmental_data')
    .findOne({ zoneId: new ObjectId(zoneId) }, { sort: { recordedAt: -1 } });
    
  const latestSensorData = await db.collection<SensorReadingDocument>('sensor_readings')
    .findOne({ zoneId: new ObjectId(zoneId) }, { sort: { recordedAt: -1 } });

  let rainfall24h: number | null = null;
  let rainfallDuration24h: number | null = null;
  let soilMoisture: number | null = null;

  // Process Sensor Readings First
  if (sensorReadings.length > 0) {
    const recordsWithRainfall = sensorReadings.filter(obs => obs.rainfall !== undefined && obs.rainfall !== null);
    if (recordsWithRainfall.length > 0) {
      rainfall24h = recordsWithRainfall.reduce((sum, obs) => sum + (obs.rainfall || 0), 0);
    }
    const latestSoilMoisture = sensorReadings.find(o => o.soilMoisture !== undefined && o.soilMoisture !== null);
    if (latestSoilMoisture) {
      soilMoisture = latestSoilMoisture.soilMoisture as number;
    }
  }

  if (soilMoisture === null && latestSensorData?.soilMoisture != null) {
    soilMoisture = latestSensorData.soilMoisture;
  }
  
  // Fallback to environmental_data if sensor data is unavailable
  if (observations.length > 0) {
    const recordsWithRainfall = observations.filter(obs => obs.rainfall !== undefined && obs.rainfall !== null);
    if (rainfall24h === null && recordsWithRainfall.length > 0) {
      rainfall24h = recordsWithRainfall.reduce((sum, obs) => sum + (obs.rainfall || 0), 0);
      rainfallDuration24h = recordsWithRainfall.reduce((sum, obs) => sum + (obs.rainfallDuration || 0), 0);
    }
    
    if (soilMoisture === null) {
      const latestEnvSoil = observations.find(o => o.soilMoisture !== undefined && o.soilMoisture !== null);
      if (latestEnvSoil) {
        soilMoisture = latestEnvSoil.soilMoisture as number;
      }
    }
  }

  if (soilMoisture === null && latestEnvData?.soilMoisture != null) {
    soilMoisture = latestEnvData.soilMoisture;
  }

  // Get most recent non-null values for other features
  const getLatest = (key: keyof EnvironmentalDataDocument) => {
    const obs = observations.find(o => o[key] !== undefined && o[key] !== null);
    if (obs) return obs[key];
    if (latestEnvData && latestEnvData[key] !== undefined && latestEnvData[key] !== null) return latestEnvData[key];
    return null;
  };
  
  // Prefer observation, fallback to zone
  const slope = (getLatest('slope') as number | null) ?? zone.slope ?? null;
  const elevation = (getLatest('elevation') as number | null) ?? zone.elevation ?? null;
  const landUse = (getLatest('landUse') as string | null) ?? zone.landUse ?? null;
  const historicalSusceptibility = zone.historicalSusceptibility ?? null;
  const location = zone.location ?? null;

  const missingFeatures: string[] = [];
  if (rainfall24h === null) missingFeatures.push('rainfall24h');
  if (rainfallDuration24h === null) missingFeatures.push('rainfallDuration24h');
  if (soilMoisture === null) missingFeatures.push('soilMoisture');
  if (slope === null) missingFeatures.push('slope');
  if (elevation === null) missingFeatures.push('elevation');
  if (landUse === null) missingFeatures.push('landUse');
  if (historicalSusceptibility === null) missingFeatures.push('historicalSusceptibility');
  if (location === null) missingFeatures.push('location');

  return {
    zoneId: zoneId,
    features: {
      rainfall24h,
      rainfallDuration24h,
      soilMoisture,
      slope,
      elevation,
      landUse,
      historicalSusceptibility,
      location,
    },
    dataQuality: {
      complete: missingFeatures.length === 0,
      missingFeatures
    },
    featureTimestamp: now.toISOString()
  };
};
