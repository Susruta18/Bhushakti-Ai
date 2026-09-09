// =========================================================
// BHUSHAKTI AI — Response Types
// =========================================================

import type { RiskLevel } from './risk';

export interface ResponsePriority {
  id: string;
  rank: number;
  zoneId: string;
  zoneName: string;
  riskLevel: RiskLevel;
  probability: number;
  populationExposure: number;
  criticalAssets: number;
  accessibilityScore: number; // 0-100
  priorityScore: number; // composite score
  actionRequired: string;
  estimatedDeployment: string;
}

export interface ResponseAction {
  id: string;
  label: string;
  completed: boolean;
  category: 'inspection' | 'communication' | 'evacuation' | 'monitoring' | 'reporting';
  priority: 'immediate' | 'high' | 'normal';
}

export interface ResponsePlan {
  id: string;
  zoneId: string;
  zoneName: string;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed';
  actions: ResponseAction[];
  assignedTeam?: string;
  notes?: string;
}
