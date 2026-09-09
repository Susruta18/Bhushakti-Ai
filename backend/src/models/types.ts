import { ObjectId } from 'mongodb';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'AUTHORITY' | 'FIELD_OFFICER' | 'CITIZEN';
  region?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskZoneDocument {
  _id?: ObjectId;
  name: string;
  code: string;
  description: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  currentProbability: number;
  location: GeoPoint;
  populationExposure: number;
  criticalAssetCount: number;
  slope?: number;
  elevation?: number;
  landUse?: string;
  historicalSusceptibility?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentalDataDocument {
  _id?: ObjectId;
  zoneId: ObjectId;
  location: GeoPoint;
  rainfall?: number;
  rainfallDuration?: number;
  soilMoisture?: number;
  slope?: number;
  elevation?: number;
  landUse?: string;
  recordedAt: Date;
  source: 'SENSOR' | 'API' | 'MANUAL' | 'DATASET';
  createdAt: Date;
}

export interface RiskPredictionFactor {
  factorName: string;
  value: number | string;
  contribution: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface EnvironmentalDataQuality {
  complete: boolean;
  missingFeatures: string[];
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


export interface RiskPredictionDocument {
  _id?: ObjectId;
  zoneId: ObjectId;
  probability: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: RiskPredictionFactor[];
  modelVersion: string;
  inputData?: Record<string, unknown>;
  predictedAt: Date;
  createdAt: Date;
}

export interface AlertDocument {
  _id?: ObjectId;
  zoneId: ObjectId;
  title: string;
  message: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  probability: number;
  trigger: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldReportDocument {
  _id?: ObjectId;
  reportedBy: ObjectId;
  hazardType: 'GROUND_CRACK' | 'SOIL_MOVEMENT' | 'ROCKFALL' | 'ROAD_DAMAGE' | 'LANDSLIDE' | 'DRAINAGE_BLOCKAGE';
  description: string;
  photoUrl?: string;
  location: GeoPoint;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  aiClassification?: string;
  aiConfidence?: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ESCALATED';
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InfrastructureDocument {
  _id?: ObjectId;
  name: string;
  type: 'ROAD' | 'BRIDGE' | 'HOSPITAL' | 'SCHOOL' | 'EMERGENCY_SHELTER' | 'GOVERNMENT_FACILITY';
  location: GeoPoint;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  criticality: number; // numeric score
  distanceFromHazard?: number;
  status: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponsePriorityDocument {
  _id?: ObjectId;
  zoneId: ObjectId;
  hazardScore: number;
  exposureScore: number;
  infrastructureScore: number;
  accessibilityScore: number;
  overallScore: number;
  priorityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseActionDocument {
  _id?: ObjectId;
  priorityId: ObjectId;
  zoneId: ObjectId;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: ObjectId;
  dueAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'AUTHORITY' | 'FIELD_OFFICER' | 'CITIZEN';
}

export interface JwtPayload {
  userId: string;
  role: 'AUTHORITY' | 'FIELD_OFFICER' | 'CITIZEN';
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
}

export interface SensorReadingDocument {
  _id?: ObjectId;
  deviceId: string;
  zoneId?: ObjectId;
  soilMoisture?: number; // 0-100 percentage
  rainfall?: number; // calibrated mm
  rainRaw?: number; // raw ADC or sensor ticks
  recordedAt: Date;
  createdAt: Date;
}

export interface NotificationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  alertId: ObjectId;
  zoneId: ObjectId;
  title: string;
  message: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: Date;
}
