// =========================================================
// BHUSHAKTI AI — Types Index
// Re-exports all types for easy importing
// =========================================================

export type { User, UserRole, AuthState, LoginCredentials, AlertPreference } from './auth';
export type {
  RiskLevel, RiskZone, RiskFactor, RiskFactorLevel,
  RiskPrediction, PredictionInput, RiskTrendPoint,
} from './risk';
export type {
  Alert, AlertStatus, AlertAction, AlertFilter,
} from './alert';
export type {
  FieldReport, HazardType, ReportStatus, ReportFormData,
} from './report';
export type {
  ResponsePriority, ResponseAction, ResponsePlan,
} from './response';
export type {
  InfrastructureAsset, AssetType, AssetStatus, CriticalityLevel,
} from './infrastructure';
export type {
  AnalyticsOverview, RiskDistribution, AnalyticsRiskTrendPoint, AlertTrendPoint, EnvironmentalTrendPoint,
} from './analytics';
export type { AppNotification } from './notification';

// Shared utility types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  zoneId?: string;
  soilMoisture?: number;
  rainfall?: number;
  rainRaw?: number;
  recordedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
