import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Percent,
  Award,
  TrendingUp,
  Zap,
  Coins,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import monthlyTargetService from '../../services/monthlyTargetService';
import {
  MonthlyTargetDetailModal,
  formatCurrency,
  formatMonthDisplay,
  formatPercentValue,
  getCurrentMonthTargetString,
} from '../../components/dashboard/MonthlyTargetModals';

export default function StaffMonthlyTargets() {
  const { t } = useTranslation();
  const [staffUser] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const roleName = String(
    staffUser?.staff_role?.name ||
    staffUser?.account_role ||
    staffUser?.role ||
    staffUser?.staff_role_name ||
    'Staff Member'
  );
  const isCollectionAgent =
    roleName.toLowerCase().includes('collection') ||
    (roleName.toLowerCase().includes('agent') && !roleName.toLowerCase().includes('customer'));

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Month Selector
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthTargetString());
  const [detailTarget, setDetailTarget] = useState(null);

  const fetchTargets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await monthlyTargetService.getStaffMonthlyTargetsMe({
        target_month: selectedMonth || undefined,
      });

      // Handle both array responses and single-object response
      if (Array.isArray(data)) {
        setTargets(data);
      } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setTargets([data]);
      } else {
        setTargets([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff personal monthly targets:', err);
      setError(err.message || 'Unable to retrieve your monthly target.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedMonth]);

  // Target summary stats
  const stats = useMemo(() => {
    const totalAmount = targets.reduce((acc, curr) => acc + (Number(curr.target_amount) || 0), 0);
    const avgThreshold =
      targets.length > 0
        ? Math.round(
            targets.reduce((acc, curr) => acc + (Number(curr.partial_threshold_percent) || 0), 0) /
              targets.length
          )
        : 80;
    const maxIncentive =
      targets.length > 0
        ? Math.max(...targets.map((t) => Number(t.exceeded_target_incentive_percent) || 0))
        : 0;
    const baseAchievedIncentive =
      targets.length > 0
        ? Math.max(...targets.map((t) => Number(t.target_achieved_incentive_percent) || 0))
        : 0;

    return { totalAmount, avgThreshold, maxIncentive, baseAchievedIncentive, count: targets.length };
  }, [targets]);

  return (
    <DashboardLayout role="staff" user={staffUser} activeTab="monthly_targets">
      <div className="space-y-6">
        {/* Banner Section (Clean soft teal style, without image) */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{roleName}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {t("staffMonthlyTargets.personalPerformanceTarget", "Personal Performance Target")}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("staffMonthlyTargets.activePolicy", "Active Policy")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("staffMonthlyTargets.myMonthlyTargetsIncentives", "My Monthly Targets & Incentives")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("staffMonthlyTargets.trackYourAssignedMonthlyTarget", "Track your assigned monthly target and discover tiered incentive commission bonuses.")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
            {/* Month Picker */}
            <div className="flex items-center gap-2 bg-white/95 px-3.5 py-2 rounded-xl border border-teal-200/80 shadow-2xs">
              <Calendar className="w-4 h-4 text-[#00b4a7]" />
              <span className="text-xs font-bold text-slate-600">{t("dashboardModule.monthlyTargets.monthLabel", "Month:")}</span>
              <input
                type="month"
                value={selectedMonth ? selectedMonth.substring(0, 7) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(`${e.target.value}-01`);
                  } else {
                    setSelectedMonth('');
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchTargets(true)}
              disabled={loading || refreshing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-teal-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00b4a7]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{t("common.refresh", "Refresh")}</span>
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title={t("staffMonthlyTargets.myTargetGoal", "My Target Goal")}
            label={t("staffMonthlyTargets.myTargetGoal", "My Target Goal")}
            value={formatCurrency(stats.totalAmount)}
            subtext="Monthly target quota"
            icon={Target}
            color="teal"
          />
          <StatCard
            title={t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
            label={t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
            value={formatPercentValue(stats.avgThreshold)}
            subtext="Minimum achievement for bonus"
            icon={Percent}
            color="amber"
          />
          <StatCard
            title={t("staffMonthlyTargets.achievedCommission", "Achieved Commission")}
            label={t("staffMonthlyTargets.achievedCommission", "Achieved Commission")}
            value={formatPercentValue(stats.baseAchievedIncentive)}
            subtext="Standard target incentive"
            icon={Award}
            color="emerald"
          />
          <StatCard
            title={t("staffMonthlyTargets.topTierRate", "Top Tier Rate")}
            label={t("staffMonthlyTargets.topTierRate", "Top Tier Rate")}
            value={formatPercentValue(stats.maxIncentive)}
            subtext="When exceeding 100% quota"
            icon={Zap}
            color="purple"
          />
        </div>

        {/* Targets Details and Ladder View */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                {t("staffMonthlyTargets.assignedTargetBreakdown", "Assigned Target Breakdown")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("staffMonthlyTargets.targetPeriod", "Target period:")} {formatMonthDisplay(selectedMonth)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{t("staffMonthlyTargets.loadingYourTargets", "Loading your targets...")}</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-500 px-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={() => fetchTargets()}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : targets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 px-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                <Target className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">{t("staffMonthlyTargets.noTargetAssignedYet", "No target assigned yet")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("staffMonthlyTargets.noMonthlyTargetHasBeen", "No monthly target has been assigned to your role for")} {formatMonthDisplay(selectedMonth)}{t("staffMonthlyTargets.contactYourBranchManagerOr", ". Contact your Branch Manager or Super Admin for information.")}
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-6">
              {targets.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-serif font-black text-slate-900">
                            {item.target_user_name ? `${item.target_user_name} (${item.role_name || 'Collection Agent'})` : (item.role_name || 'Staff Quota Directive')}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                            {item.target_scope || item.target_period || 'Monthly'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {item.branch_name ? `Branch: ${item.branch_name} • ` : ''}{t("staffMonthlyTargets.applicableFor", "Applicable for:")} {formatMonthDisplay(item.target_month)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t("staffMonthlyTargets.targetQuota", "Target Quota")}
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {formatCurrency(item.target_amount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailTarget(item)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("branchManagerFdMisSchemes.viewDetails", "View Details")}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Tier Visual Ladder Cards */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      {t("staffMonthlyTargets.yourIncentiveCommissionLadder", "Your Incentive Commission Ladder")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Tier 1 */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {t("staffMonthlyTargets.belowTarget", "Below Target (<")}{item.partial_threshold_percent}%)
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-700">
                            {formatPercentValue(item.below_target_incentive_percent)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">{t("staffMonthlyTargets.commission", "Commission")}</span>
                        </div>
                      </div>

                      {/* Tier 2 */}
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                          {t("staffMonthlyTargets.partiallyAchieved", "Partially Achieved (")}{item.partial_threshold_percent}% - 99%)
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-amber-900">
                            {formatPercentValue(item.partially_achieved_incentive_percent)}
                          </span>
                          <span className="text-[11px] font-bold text-amber-700">{t("staffMonthlyTargets.commission", "Commission")}</span>
                        </div>
                      </div>

                      {/* Tier 3 */}
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                          {t("staffMonthlyTargets.targetAchieved100", "Target Achieved (100%)")}
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-emerald-900">
                            {formatPercentValue(item.target_achieved_incentive_percent)}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">{t("staffMonthlyTargets.commission", "Commission")}</span>
                        </div>
                      </div>

                      {/* Tier 4 */}
                      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">
                          {t("staffMonthlyTargets.exceededTarget100", "Exceeded Target (>100%)")}
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-purple-900">
                            {formatPercentValue(item.exceeded_target_incentive_percent)}
                          </span>
                          <span className="text-[11px] font-bold text-purple-700">{t("staffMonthlyTargets.commission", "Commission")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Details Modal */}
      <MonthlyTargetDetailModal
        isOpen={Boolean(detailTarget)}
        target={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </DashboardLayout>
  );
}
