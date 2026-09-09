// =========================================================
// BHUSHAKTI AI — Alert Types
// =========================================================

import type { RiskLevel } from './risk';

export type AlertStatus = 'active' | 'acknowledged' | 'assigned' | 'escalated' | 'resolved';

export interface Alert {
  id: string;
  zoneId: string;
  zoneName: string;
  riskLevel: RiskLevel;
  probability: number;
  status: AlertStatus;
  trigger: string;
  description: string;
  timestamp: string;
  acknowledgedBy?: string;
  assignedTo?: string;
  actions: AlertAction[];
  rainfall?: number;
  soilMoisture?: number;
  populationExposure?: number;
  criticalAssets?: number;
  responseRequired?: string;
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'acknowledge' | 'assign' | 'escalate' | 'resolve';
  requiresInput?: boolean;
}

export type AlertFilter = 'all' | RiskLevel | 'resolved';
