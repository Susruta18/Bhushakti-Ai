export interface AnalyticsOverview {
  activeAlerts: number;
  highestRisk: number;
  maxRainfall24h: number | null;
  reportsFiled: string;
}

export interface RiskDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface AnalyticsRiskTrendPoint {
  date: string;
  averageProbability: number;
  predictionCount: number;
}

export interface AlertTrendPoint {
  date: string;
  critical: number;
  high: number;
  moderate: number;
}

export interface EnvironmentalTrendPoint {
  date: string;
  averageRainfall: number | null;
  averageSoilMoisture: number | null;
}
