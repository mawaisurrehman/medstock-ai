import React from 'react';
import { RecommendationFactor } from '../../types';
import { Sparkles, Info } from 'lucide-react';

interface ConfidenceBarProps {
  confidence: number; // e.g. 91
  factors?: RecommendationFactor[];
  showBreakdown?: boolean;
  className?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  factors = [],
  showBreakdown = true,
  className = '',
}) => {
  const getConfidenceColor = (val: number) => {
    if (val >= 90) return 'bg-teal-600 text-teal-700';
    if (val >= 80) return 'bg-cyan-600 text-cyan-700';
    if (val >= 70) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-500 text-rose-700';
  };

  const colorClass = getConfidenceColor(confidence);

  return (
    <div className={`p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            AI Confidence Score
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
          <span>{confidence}%</span>
          <span className="text-[11px] font-normal text-slate-500">(High Confidence)</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass.split(' ')[0]}`}
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
        />
      </div>

      {/* Factors breakdown */}
      {showBreakdown && factors.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/70">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Why this prediction?</span>
            <span className="text-[10px] font-normal text-slate-400">Telemetry Weight</span>
          </div>

          <div className="space-y-2">
            {factors.map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{factor.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{factor.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600/85 h-full rounded-full transition-all duration-500"
                    style={{ width: `${factor.percentage}%` }}
                  />
                </div>
                {factor.description && (
                  <p className="text-[11px] text-slate-400 font-normal leading-tight">
                    {factor.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-3 pt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-snug">
          Predictions are decision-support insights derived from time-series models; procurement
          actions require clinical / store manager sign-off.
        </p>
      </div>
    </div>
  );
};
