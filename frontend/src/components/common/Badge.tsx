import React from 'react';
import { RiskLevel } from '../../types';

interface BadgeProps {
  variant?: 'critical' | 'warning' | 'info' | 'safe' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const styles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    safe: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border tracking-tight ${styles[variant]} ${sizeClasses[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'critical'
                ? 'bg-rose-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'critical'
                ? 'bg-rose-600'
                : variant === 'warning'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; size?: 'sm' | 'md' }> = ({
  level,
  size = 'sm',
}) => {
  switch (level) {
    case 'CRITICAL':
      return (
        <Badge variant="critical" size={size} pulse>
          CRITICAL
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="warning" size={size}>
          HIGH RISK
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="warning" size={size}>
          MEDIUM
        </Badge>
      );
    case 'LOW':
    case 'SAFE':
      return (
        <Badge variant="safe" size={size}>
          SAFE / LOW
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size={size}>
          {level}
        </Badge>
      );
  }
};
