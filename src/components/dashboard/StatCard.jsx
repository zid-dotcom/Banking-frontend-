import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const METRIC_MESSAGES = {
  'dashboard.totalMembers': { id: 'dashboard.totalMembers', message: 'Total Members' },
  'dashboard.activeAccounts': { id: 'dashboard.activeAccounts', message: 'Active Accounts' },
  'dashboard.totalDeposits': { id: 'dashboard.totalDeposits', message: 'Total Deposits' },
  'dashboard.activeLoans': { id: 'dashboard.activeLoans', message: 'Active Loans' },
  'dashboard.availableBalance': { id: 'dashboard.availableBalance', message: 'Available Balance' },
  'sidebar.branchMembers': { id: 'sidebar.branchMembers', message: 'Branch Members' },
  'sidebar.branchStaff': { id: 'sidebar.branchStaff', message: 'Branch Staff' },
  'sidebar.monthlyTargets': { id: 'sidebar.monthlyTargets', message: 'Monthly Targets' },
  'sidebar.staffMembers': { id: 'sidebar.staffMembers', message: 'Staff Members' },
  'sidebar.branches': { id: 'sidebar.branches', message: 'Branches' },
  'sidebar.savingsSchemes': { id: 'sidebar.savingsSchemes', message: 'Savings Schemes' },
  'sidebar.fdMisSchemes': { id: 'sidebar.fdMisSchemes', message: 'FD / MIS Schemes' },
  'sidebar.investmentSchemes': { id: 'sidebar.investmentSchemes', message: 'Investment Schemes' },
  'sidebar.loanSchemes': { id: 'sidebar.loanSchemes', message: 'Loan Schemes' },
  'sidebar.serviceRequests': { id: 'sidebar.serviceRequests', message: 'Service Requests' },
  'sidebar.emergencyCases': { id: 'sidebar.emergencyCases', message: 'Emergency Cases' },
};

export default function StatCard({
  title,
  label,
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
  const { t, i18n } = useTranslation();
  const rawTitle = title || label || '';
  
  // Dynamic mapping helper for common dashboard metric titles
  const getMappedTitle = (raw) => {
    if (!raw) return '';
    const metricMap = {
      'Total Members': 'dashboard.totalMembers',
      'Active Accounts': 'dashboard.activeAccounts',
      'Total Deposits': 'dashboard.totalDeposits',
      'Active Loans': 'dashboard.activeLoans',
      'Available Balance': 'dashboard.availableBalance',
      'Branch Members': 'sidebar.branchMembers',
      'Branch Staff': 'sidebar.branchStaff',
      'Monthly Targets': 'sidebar.monthlyTargets',
      'Staff Members': 'sidebar.staffMembers',
      'Branches': 'sidebar.branches',
      'Savings Schemes': 'sidebar.savingsSchemes',
      'FD / MIS Schemes': 'sidebar.fdMisSchemes',
      'Investment Schemes': 'sidebar.investmentSchemes',
      'Loan Schemes': 'sidebar.loanSchemes',
      'Service Requests': 'sidebar.serviceRequests',
      'Emergency Cases': 'sidebar.emergencyCases'
    };
    const key = metricMap[raw];
    return key ? t(METRIC_MESSAGES[key].id, METRIC_MESSAGES[key].message) : raw;
  };

  const displayTitle = getMappedTitle(rawTitle);
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
            {displayTitle}
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
