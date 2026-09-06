import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'healthy' | 'empty' | 'filtered';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Everything looks healthy and within normal operating parameters.',
  actionText,
  onAction,
  type = 'healthy',
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          type === 'healthy' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {type === 'healthy' ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <AlertCircle className="w-6 h-6" />
        )}
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
