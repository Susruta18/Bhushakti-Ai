import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'moderate' | 'low' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const styles: Record<string, string> = {
    critical: 'bg-error-container text-on-error',
    high: 'bg-tertiary-container text-on-tertiary-container',
    moderate: 'bg-secondary-container text-on-secondary-container',
    low: 'bg-risk-low/20 text-risk-low',
    default: 'bg-surface-container-high text-on-surface-variant',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
