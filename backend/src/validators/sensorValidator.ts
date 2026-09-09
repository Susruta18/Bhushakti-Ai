import { ObjectId } from 'mongodb';

export const validateSensorReadingInput = (data: any) => {
  const errors: string[] = [];

  if (!data.deviceId || typeof data.deviceId !== 'string' || data.deviceId.trim() === '') {
    errors.push('deviceId is required and must be a non-empty string');
  }

  if (data.zoneId !== undefined && data.zoneId !== null) {
    if (typeof data.zoneId !== 'string' || !ObjectId.isValid(data.zoneId)) {
      errors.push('zoneId must be a valid MongoDB ObjectId string');
    }
  }

  if (data.soilMoisture !== undefined && data.soilMoisture !== null) {
    if (typeof data.soilMoisture !== 'number' || isNaN(data.soilMoisture) || !isFinite(data.soilMoisture)) {
      errors.push('soilMoisture must be a finite number');
    } else if (data.soilMoisture < 0 || data.soilMoisture > 100) {
      errors.push('soilMoisture must be between 0 and 100');
    }
  }

  if (data.rainfall !== undefined && data.rainfall !== null) {
    if (typeof data.rainfall !== 'number' || isNaN(data.rainfall) || !isFinite(data.rainfall)) {
      errors.push('rainfall must be a finite number');
    } else if (data.rainfall < 0) {
      errors.push('rainfall must be non-negative');
    }
  }

  if (data.rainRaw !== undefined && data.rainRaw !== null) {
    if (typeof data.rainRaw !== 'number' || isNaN(data.rainRaw) || !isFinite(data.rainRaw)) {
      errors.push('rainRaw must be a finite number');
    }
  }

  if (data.recordedAt !== undefined && data.recordedAt !== null) {
    if (!data.recordedAt || isNaN(new Date(data.recordedAt).getTime())) {
      errors.push('recordedAt must be a valid ISO date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
