import { RiskZoneDocument } from '../models/types';

/**
 * Validates a subset or full set of fields for a Risk Zone.
 * Stores probability as a decimal (0-1). Frontend displays as a percentage.
 */
export const validateRiskZoneInput = (data: Partial<RiskZoneDocument>) => {
  const errors: string[] = [];

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }

  if (data.code !== undefined && (typeof data.code !== 'string' || data.code.trim() === '')) {
    errors.push('code must be a non-empty string');
  }

  if (data.riskLevel !== undefined) {
    if (!['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(data.riskLevel)) {
      errors.push('riskLevel must be LOW, MODERATE, HIGH, or CRITICAL');
    }
  }

  // Expecting probability as a decimal (0.0 to 1.0)
  if (data.currentProbability !== undefined) {
    if (typeof data.currentProbability !== 'number' || !Number.isFinite(data.currentProbability) || data.currentProbability < 0 || data.currentProbability > 1) {
      errors.push('currentProbability must be a number between 0 and 1');
    }
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
  }

  if (data.populationExposure !== undefined) {
    if (typeof data.populationExposure !== 'number' || !Number.isFinite(data.populationExposure)) {
      errors.push('populationExposure must be a number');
    }
  }

  if (data.criticalAssetCount !== undefined) {
    if (typeof data.criticalAssetCount !== 'number' || !Number.isFinite(data.criticalAssetCount)) {
      errors.push('criticalAssetCount must be a number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateNearbyQuery = (lat: number, lng: number, radius: number) => {
  const errors: string[] = [];
  
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.push('latitude must be a valid number between -90 and 90');
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.push('longitude must be a valid number between -180 and 180');
  }
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0 || radius > 100000) { // arbitrary 100km limit
    errors.push('radius must be a positive number and reasonably bounded (e.g., max 100000 meters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
