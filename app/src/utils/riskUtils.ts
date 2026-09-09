// =========================================================
// BHUSHAKTI AI — Risk Utilities
// =========================================================

import type { RiskLevel } from '../types';

export const getRiskGaugeOffset = (probability: number): number => {
  // SVG circle r=45, circumference = 2*pi*45 ≈ 282.74
  const circumference = 282.74;
  return circumference - (circumference * probability) / 100;
};

export const probabilityToRiskLevel = (probability: number): RiskLevel => {
  if (probability >= 80) return 'critical';
  if (probability >= 60) return 'high';
  if (probability >= 40) return 'moderate';
  return 'low';
};

export const getRiskLevelText = (level: RiskLevel): string => {
  const labels: Record<RiskLevel, string> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW',
  };
  return labels[level];
};

export const getRiskAccentBar = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: 'bg-error',
    high: 'bg-tertiary',
    moderate: 'bg-secondary',
    low: 'bg-risk-low',
  };
  return colors[level];
};

export const getRiskTextColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: 'text-error',
    high: 'text-tertiary',
    moderate: 'text-secondary',
    low: 'text-risk-low',
  };
  return colors[level];
};

export const getRiskBadgeStyle = (level: RiskLevel): string => {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-error-container text-on-error',
    high: 'bg-tertiary-container text-on-tertiary-container',
    moderate: 'bg-secondary-container text-on-secondary-container',
    low: 'bg-risk-low/20 text-risk-low',
  };
  return styles[level];
};

export const getRiskIconBg = (level: RiskLevel): string => {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-error-container/20 border-error-container/50',
    high: 'bg-tertiary-container/20 border-tertiary-container/50',
    moderate: 'bg-secondary-container/20 border-secondary-container/50',
    low: 'bg-risk-low/10 border-risk-low/30',
  };
  return styles[level];
};
