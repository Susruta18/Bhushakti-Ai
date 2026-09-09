// =========================================================
// BHUSHAKTI AI — Field Report Types
// =========================================================

import type { RiskLevel } from './risk';

export type HazardType =
  | 'ground_crack'
  | 'soil_movement'
  | 'rockfall'
  | 'road_damage'
  | 'landslide'
  | 'drainage_blockage';

export type ReportStatus = 'submitted' | 'under_review' | 'verified' | 'resolved' | 'rejected';

export interface FieldReport {
  id: string;
  title: string;
  hazardType: HazardType;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  riskLevel: RiskLevel;
  status: ReportStatus;
  reportedBy: string;
  reportedAt: string;
  verifiedAt?: string;
  photoUrl?: string;
  photoUrls?: string[];
  zone: string;
}

export interface ReportFormData {
  hazardType: HazardType;
  location: string;
  description: string;
  photos: File[];
}
