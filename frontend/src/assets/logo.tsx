import React from 'react';
import markUrl from './medstock-mark.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'icon-only' | 'with-tagline';
  theme?: 'light' | 'dark';
}

export const MedStockLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'compact',
  theme = 'light',
}) => {
  // Dimension mapping
  const iconDimensions = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const dim = iconDimensions[size];

  // Brand emblem: MedStock AI medical cross + pill + rising-chart mark.
  const LogoIcon = (
    <img
      src={markUrl}
      width={dim}
      height={dim}
      alt="MedStock AI logo"
      className="shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
      style={{ width: dim, height: dim }}
      draggable={false}
    />
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{LogoIcon}</div>;
  }

  const textColorClass = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div dir="ltr" className={`inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-2.5">
        {LogoIcon}
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight font-extrabold leading-none">
            <span className={`text-xl ${textColorClass} tracking-tight`}>MedStock</span>
            <span className="text-xl text-teal-600 ml-1.5 font-black">AI</span>
          </div>
          {variant !== 'compact' && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
              Predict • Prevent • Protect
            </span>
          )}
        </div>
      </div>

      {variant === 'with-tagline' && (
        <div className="w-full mt-3 pt-2.5 border-t border-slate-200 flex flex-col items-center">
          <div className="flex items-center justify-between w-full px-1 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
            <span>Predict</span>
            <span className="w-1 h-1 rounded-full bg-teal-500" />
            <span>Prevent</span>
            <span className="w-1 h-1 rounded-full bg-teal-500" />
            <span>Protect</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-slate-400">
            {/* 4 small iconography indicators matching the brand logo */}
            <span className="text-[11px] flex items-center gap-1 font-medium text-slate-500">
              📊 Demand
            </span>
            <span className="text-[11px] flex items-center gap-1 font-medium text-slate-500">
              💊 Inventory
            </span>
            <span className="text-[11px] flex items-center gap-1 font-medium text-slate-500">
              🛡️ Safety
            </span>
            <span className="text-[11px] flex items-center gap-1 font-medium text-slate-500">
              🗓️ Expiry
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
