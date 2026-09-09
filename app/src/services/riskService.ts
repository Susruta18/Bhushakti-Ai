import { apiFetch } from './api';
import { environmentalDataService } from './environmentalDataService';
import { MOCK_PREDICTION, MOCK_RISK_TREND } from '../data/mockData';
import type { RiskZone, RiskPrediction, PredictionInput, RiskTrendPoint, RiskLevel, RiskFactorLevel } from '../types';

interface PredictionResponse {
  success: boolean;
  data: {
    risk_probability: number;
    risk_percentage: number;
    risk_level: string;
    warning: boolean;
  };
  input: {
    rainfall24h: number;
    elevation: number;
    slope: number;
    soilMoisture: number;
  };
  model: string;
}

const mapBackendRiskLevel = (level: string): RiskLevel => {
  if (!level) return 'low';
  const upper = level.toUpperCase();
  if (upper === 'CRITICAL') return 'critical';
  if (upper === 'HIGH') return 'high';
  if (upper === 'MODERATE') return 'moderate';
  return 'low';
};

const mapHistorical = (val: number | null | undefined): 'high' | 'moderate' | 'low' => {
  if (val === undefined || val === null) return 'low';
  if (val >= 0.7) return 'high';
  if (val >= 0.3) return 'moderate';
  return 'low';
};

const mapBackendZoneToFrontend = (backendZone: any, envFeatures?: any): RiskZone => {
  return {
    id: backendZone._id || backendZone.id,
    name: backendZone.name || 'Unknown',
    region: backendZone.description || 'Unknown Region',
    riskLevel: mapBackendRiskLevel(backendZone.riskLevel),
    probability: backendZone.currentProbability || 0,
    coordinates: {
      lat: backendZone.location?.coordinates?.[1] || 0,
      lng: backendZone.location?.coordinates?.[0] || 0,
    },
    populationExposure: backendZone.populationExposure || 0,
    criticalAssets: backendZone.criticalAssetCount || 0,
    historicalSusceptibility: mapHistorical(envFeatures?.historicalSusceptibility ?? backendZone.historicalSusceptibility),
    lastUpdated: backendZone.updatedAt || backendZone.createdAt || new Date().toISOString(),
    trend: 'stable', // backend doesn't have trend yet
    rainfall24h: envFeatures?.rainfall24h ?? null,
    soilMoisture: envFeatures?.soilMoisture ?? null,
    slope: envFeatures?.slope ?? backendZone.slope ?? null,
    elevation: envFeatures?.elevation ?? backendZone.elevation ?? null,
    landUse: envFeatures?.landUse ?? backendZone.landUse ?? null,
  };
};

export const riskService = {
  async getRiskZones(): Promise<RiskZone[]> {
    try {
      const response = await apiFetch<{success: boolean, data: any[]}>('/risk-zones');
      if (response && response.success && Array.isArray(response.data)) {
        return response.data.map(zone => mapBackendZoneToFrontend(zone));
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch risk zones:', e);
      return [];
    }
  },

  async getRiskZone(id: string): Promise<RiskZone> {
    const response = await apiFetch<{success: boolean, data: any}>(`/risk-zones/${id}`);
    if (!response || !response.success || !response.data) {
      throw new Error(`Zone ${id} not found`);
    }
    const zone = response.data;
    
    const features = await environmentalDataService.getFeatures(id);
    
    return mapBackendZoneToFrontend(zone, features?.features);
  },

  async getCurrentRisk(): Promise<RiskZone> {
    const response = await apiFetch<{success: boolean, data: any[]}>('/risk-zones?isActive=true&limit=1');
    if (!response || !response.success || !response.data || response.data.length === 0) {
      throw new Error('No active risk zones found');
    }
    const zone = response.data[0];
    
    const features = await environmentalDataService.getFeatures(zone._id || zone.id);
    
    return mapBackendZoneToFrontend(zone, features?.features);
  },

  async getRiskTrend(_zoneId: string): Promise<RiskTrendPoint[]> {
    return MOCK_RISK_TREND;
  },

  async predictRisk(input: PredictionInput): Promise<RiskPrediction> {
    const payload = {
      rainfall24h: input.rainfall,
      elevation: input.elevation,
      slope: input.slope,
      soilMoisture: input.soilMoisture,
    };

    const response = await apiFetch<PredictionResponse>('/risk-prediction/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const { data } = response;
    
    const mappedRiskLevel = mapBackendRiskLevel(data.risk_level);

    const getLevel = (val: number, highThresh: number, modThresh: number): RiskFactorLevel => {
      if (val >= highThresh) return 'high';
      if (val >= modThresh) return 'moderate';
      return 'low';
    };

    const riskFactors = [
      { name: 'Rainfall (24h)', value: payload.rainfall24h.toString(), unit: 'mm', level: getLevel(payload.rainfall24h, 100, 50), icon: 'CloudRain' },
      { name: 'Soil Moisture', value: payload.soilMoisture.toString(), unit: '%', level: getLevel(payload.soilMoisture, 80, 50), icon: 'Droplets' },
      { name: 'Slope', value: payload.slope.toString(), unit: '°', level: getLevel(payload.slope, 30, 15), icon: 'Mountain' },
      { name: 'Elevation', value: payload.elevation.toString(), unit: 'm', level: 'moderate' as RiskFactorLevel, icon: 'Mountain' },
    ];

    let recommendedActions = [
      'Continue standard monitoring procedures',
      'Review daily weather forecasts'
    ];
    
    if (data.warning || mappedRiskLevel === 'critical' || mappedRiskLevel === 'high') {
      recommendedActions = [
        'Immediate evacuation of high-risk zones recommended',
        'Deploy emergency response teams',
        'Issue public warning alerts',
        'Increase structural monitoring frequency',
        'Inspect primary access roads for damage'
      ];
    } else if (mappedRiskLevel === 'moderate') {
      recommendedActions = [
        'Increase monitoring frequency',
        'Prepare emergency response teams on standby',
        'Alert local authorities'
      ];
    }

    return {
      id: `pred-${Date.now()}`,
      location: input.location,
      probability: data.risk_percentage,
      riskLevel: mappedRiskLevel,
      riskFactors,
      recommendedActions,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      isSimulated: false,
    };
  },
};
