import { EnvironmentalDataDocument } from '../models/types';
import { ObjectId } from 'mongodb';

/**
 * Validates Environmental Data fields before insertion.
 */
export const validateEnvironmentalDataInput = (data: any) => {
  const errors: string[] = [];

  if (!data.zoneId || typeof data.zoneId !== 'string' || !ObjectId.isValid(data.zoneId)) {
    errors.push('zoneId must be a valid MongoDB ObjectId string');
  }

  if (data.location !== undefined) {
    if (
      !data.location.type ||
      data.location.type !== 'Point' ||
      !Array.isArray(data.location.coordinates) ||
      data.location.coordinates.length !== 2
    ) {
      errors.push('location must be a valid GeoJSON Point');
    } else {
      const [longitude, latitude] = data.location.coordinates;
      if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        errors.push('longitude must be between -180 and 180');
      }
      if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        errors.push('latitude must be between -90 and 90');
      }
    }
  } else {
    errors.push('location is required');
  }

  if (data.rainfall !== undefined) {
    if (typeof data.rainfall !== 'number' || !Number.isFinite(data.rainfall) || data.rainfall < 0) {
      errors.push('rainfall must be a non-negative number');
    }
  }

  if (data.rainfallDuration !== undefined) {
    if (typeof data.rainfallDuration !== 'number' || !Number.isFinite(data.rainfallDuration) || data.rainfallDuration < 0) {
      errors.push('rainfallDuration must be a non-negative number');
    }
  }

  if (data.soilMoisture !== undefined) {
    if (typeof data.soilMoisture !== 'number' || !Number.isFinite(data.soilMoisture) || data.soilMoisture < 0 || data.soilMoisture > 100) {
      errors.push('soilMoisture must be a number between 0 and 100');
    }
  }

  if (data.slope !== undefined) {
    if (typeof data.slope !== 'number' || !Number.isFinite(data.slope) || data.slope < 0 || data.slope > 90) {
      errors.push('slope must be a number between 0 and 90');
    }
  }

  if (data.elevation !== undefined) {
    if (typeof data.elevation !== 'number' || !Number.isFinite(data.elevation) || data.elevation < 0) {
      errors.push('elevation must be a non-negative number');
    }
  }

  if (data.landUse !== undefined && typeof data.landUse !== 'string') {
    errors.push('landUse must be a string');
  }

  if (!data.recordedAt || isNaN(new Date(data.recordedAt).getTime())) {
    errors.push('recordedAt must be a valid ISO date');
  }

  if (!data.source || !['SENSOR', 'API', 'MANUAL', 'DATASET'].includes(data.source)) {
    errors.push('source must be SENSOR, API, MANUAL, or DATASET');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
