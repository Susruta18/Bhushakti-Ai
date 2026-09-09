import React from 'react';
import type { RiskLevel } from '../../types';
import { getRiskBadgeStyle, getRiskLevelText } from '../../utils/riskUtils';
import { cn } from '../../utils/cn';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className }) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase',
      getRiskBadgeStyle(level),
      className
    )}
  >
    {getRiskLevelText(level)}
  </span>
);
