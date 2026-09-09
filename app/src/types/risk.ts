// =========================================================
// BHUSHAKTI AI — Risk Types
// =========================================================

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface RiskZone {
  id: string;
  name: string;
  region: string;
  riskLevel: RiskLevel;
  probability: number; // 0-100
  coordinates: {
    lat: number;
    lng: number;
  };
  rainfall24h?: number | null; // mm
  soilMoisture?: number | null; // %
  slope?: number | null; // degrees
  elevation?: number | null; // meters
  landUse?: string | null;
  populationExposure: number;
  criticalAssets: number;
  historicalSusceptibility: 'high' | 'moderate' | 'low';
  lastUpdated: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export type RiskFactorLevel = 'high' | 'moderate' | 'low';

export interface RiskFactor {
  name: string;
  value: string;
  unit: string;
  level: RiskFactorLevel;
  icon: string;
}

export interface RiskPrediction {
  id: string;
  location: string;
  probability: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  generatedAt: string;
  validUntil: string;
  isSimulated: boolean;
}

export interface PredictionInput {
  location: string;
  rainfall: number;
  rainfallDuration: number;
  soilMoisture: number;
  slope: number;
  elevation: number;
  landUse: string;
  historicalSusceptibility: string;
}

export interface RiskTrendPoint {
  time: string;
  probability: number;
}
