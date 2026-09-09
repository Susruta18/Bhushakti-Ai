// =========================================================
// BHUSHAKTI AI — Risk Level Configuration
// =========================================================

import type { RiskLevel } from '../types';

export interface RiskLevelConfig {
  label: string;
  color: string;          // Tailwind text color
  bgColor: string;        // Tailwind bg color
  borderColor: string;    // Tailwind border color
  badgeBg: string;        // Hex for badge background
  textHex: string;        // Hex for text
  barHex: string;         // Hex for accent bar/indicators
}

export const RISK_LEVELS: Record<RiskLevel, RiskLevelConfig> = {
  critical: {
    label: 'CRITICAL',
    color: 'text-error',
    bgColor: 'bg-error-container',
    borderColor: 'border-error-container',
    badgeBg: '#93000a',
    textHex: '#ffb4ab',
    barHex: '#ffb4ab',
  },
  high: {
    label: 'HIGH',
    color: 'text-tertiary',
    bgColor: 'bg-tertiary-container',
    borderColor: 'border-tertiary-container',
    badgeBg: '#35260c',
    textHex: '#ddc39d',
    barHex: '#ddc39d',
  },
  moderate: {
    label: 'MODERATE',
    color: 'text-secondary',
    bgColor: 'bg-secondary-container',
    borderColor: 'border-secondary-container',
    badgeBg: '#39485a',
    textHex: '#b9c8de',
    barHex: '#b9c8de',
  },
  low: {
    label: 'LOW',
    color: 'text-risk-low',
    bgColor: 'bg-risk-low/20',
    borderColor: 'border-risk-low/40',
    badgeBg: 'rgba(34, 197, 94, 0.2)',
    textHex: '#22C55E',
    barHex: '#22C55E',
  },
};

export const getRiskConfig = (level: RiskLevel): RiskLevelConfig => RISK_LEVELS[level];
