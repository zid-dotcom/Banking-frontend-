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
    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-snug whitespace-normal break-words">
            {title}
          </p>
          <div
            className={
              valueClassName
                ? `mt-2 transition-colors ${valueClassName}`
                : 'text-2xl sm:text-3xl font-bold font-sans text-slate-900 mt-2 tracking-tight group-hover:text-[#0d9488] transition-colors'
            }
          >
            {value}
          </div>
        </div>

        <div className="w-12 h-12 rounded-xl bg-teal-50/80 group-hover:bg-gradient-to-br group-hover:from-[#14b8a6] group-hover:to-[#2dd4bf] text-[#0d9488] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs flex-shrink-0">
          {Icon && <Icon className="w-6 h-6 stroke-[1.8]" />}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-500 min-w-0 flex-1">
          {(subtitle || subtext) && <span className="text-[11px] leading-tight break-words">{subtitle || subtext}</span>}
        </div>

        {trendText && (
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
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
