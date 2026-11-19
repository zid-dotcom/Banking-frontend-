import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  subtext,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  badge,
  valueClassName,
  className = ''
}) {
  const trendText = typeof trend === 'object' && trend !== null ? trend.text : trend;
  const effectiveTrendType =
    typeof trend === 'object' && trend !== null && trend.isPositive !== undefined
      ? (trend.isPositive ? 'up' : 'down')
      : trendType;

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-snug flex-1 min-w-0 break-normal">
            {title}
          </p>
          {Icon && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50/80 group-hover:bg-gradient-to-br group-hover:from-[#14b8a6] group-hover:to-[#2dd4bf] text-[#0d9488] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            </div>
          )}
        </div>

        <div
          className={
            valueClassName
              ? `transition-colors ${valueClassName}`
              : 'text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight group-hover:text-[#0d9488] transition-colors truncate'
          }
          title={typeof value === 'string' ? value : undefined}
        >
          {value}
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-500 min-w-0 flex-1">
          {(subtitle || subtext) && (
            <span className="text-[11px] leading-tight break-words truncate" title={subtitle || subtext}>
              {subtitle || subtext}
            </span>
          )}
        </div>

        {trendText && (
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-[10px] sm:text-[11px] ${
              effectiveTrendType === 'up'
                ? 'bg-emerald-50 text-emerald-700'
                : effectiveTrendType === 'down'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {effectiveTrendType === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {effectiveTrendType === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trendText}
          </span>
        )}

        {badge && (
          <span className="font-bold text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full text-[11px] border border-teal-200/50 flex-shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
