import React from 'react';
import type { RiskLevel } from '../../types';
import { getRiskGaugeOffset } from '../../utils/riskUtils';
import { cn } from '../../utils/cn';

interface RiskGaugeProps {
  probability: number;
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

const GAUGE_COLORS: Record<RiskLevel, string> = {
  critical: '#ffb4ab',
  high: '#ddc39d',
  moderate: '#b9c8de',
  low: '#22C55E',
};

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  riskLevel,
  size = 'lg',
}) => {
  const offset = getRiskGaugeOffset(probability);
  const color = GAUGE_COLORS[riskLevel];

  const sizeMap = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const textMap: Record<RiskLevel, string> = {
    critical: 'text-error',
    high: 'text-tertiary',
    moderate: 'text-secondary',
    low: 'text-risk-low',
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeMap[size])}>
      {/* SVG Gauge — matches Stitch implementation exactly */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#1E293B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress track */}
        <circle
          className="gauge-circle"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="282.74"
          strokeDashoffset={offset}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textMap[riskLevel], size === 'lg' ? 'text-[28px]' : size === 'md' ? 'text-xl' : 'text-base')}>
          {probability}%
        </span>
        {size !== 'sm' && (
          <span className={cn('text-[10px] font-semibold tracking-wider uppercase mt-0.5', textMap[riskLevel])}>
            {riskLevel} risk
          </span>
        )}
      </div>
    </div>
  );
};
