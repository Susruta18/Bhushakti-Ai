import { apiFetch } from './api';

export interface EnvironmentalDataQuality {
  complete: boolean;
  missingFeatures: string[];
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface EnvironmentalFeatures {
  zoneId: string;
  features: {
    rainfall24h: number | null;
    rainfallDuration24h: number | null;
    soilMoisture: number | null;
    slope: number | null;
    elevation: number | null;
    landUse: string | null;
    historicalSusceptibility: number | null;
    location: GeoPoint | null;
  };
  dataQuality: EnvironmentalDataQuality;
  featureTimestamp: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const environmentalDataService = {
  async getFeatures(zoneId: string, windowHours: number = 24): Promise<EnvironmentalFeatures | null> {
    try {
      const response = await apiFetch<ApiResponse<EnvironmentalFeatures>>(`/environmental-data/features/${zoneId}?windowHours=${windowHours}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch environmental features for zone ${zoneId}:`, error);
      return null; // Return null instead of crashing, for graceful fallback
    }
  },
  
  async getLatest(zoneId: string): Promise<any | null> {
    try {
      const response = await apiFetch<ApiResponse<any>>(`/environmental-data/latest/${zoneId}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch latest environmental data for zone ${zoneId}:`, error);
      return null;
    }
  }
};
