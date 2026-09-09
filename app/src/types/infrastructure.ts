// =========================================================
// BHUSHAKTI AI — Infrastructure Types
// =========================================================

import type { RiskLevel } from './risk';

export type AssetType =
  | 'road'
  | 'bridge'
  | 'hospital'
  | 'school'
  | 'emergency_shelter'
  | 'government_facility';

export type AssetStatus = 'operational' | 'at_risk' | 'damaged' | 'closed';

export type CriticalityLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: AssetType;
  riskLevel: RiskLevel;
  criticality: CriticalityLevel;
  status: AssetStatus;
  distanceFromHazard: number; // km
  zone: string;
  coordinates: { lat: number; lng: number };
  populationServed?: number;
  lastInspected?: string;
  notes?: string;
}
