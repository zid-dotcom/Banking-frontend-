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
  ChevronRight,
  TrendingUp,
  Building2,
  Coins,
  ShieldCheck,
  Zap,
  PlusCircle,
  Users
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import monthlyTargetService from '../../services/monthlyTargetService';
import {
  CreateBranchStaffTargetModal,
  MonthlyTargetDetailModal,
  formatCurrency,
  formatMonthDisplay,
  formatPercentValue,
  getCurrentMonthTargetString,
} from '../../components/dashboard/MonthlyTargetModals';


export default function BranchManagerMonthlyTargets() {
  const { t } = useTranslation();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Month Selector
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthTargetString());
  const [detailTarget, setDetailTarget] = useState(null);

  // Staff Target Assignment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchTargets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await monthlyTargetService.getBranchAdminMonthlyTargets({
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
      console.error('Failed to fetch branch monthly targets:', err);
      setError(err.message || t("dashboardModule.monthlyTargets.errorRetrieve", "Unable to retrieve branch monthly targets."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedMonth]);

  const handleCreateStaffTargetSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await monthlyTargetService.createBranchAdminStaffTarget(payload);
      setSuccessMessage(t("dashboardModule.monthlyTargets.assignSuccess", "Staff target quota and incentive ladder assigned successfully!"));
      setTimeout(() => setSuccessMessage(null), 4000);
      setCreateModalOpen(false);
      fetchTargets(true);
    } catch (err) {
      console.error('Failed to assign staff target:', err);
      setErrorMessage(err.message || t("dashboardModule.monthlyTargets.assignError", "Failed to assign staff target."));
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <DashboardLayout role="branch_manager" activeTab="monthly_targets">
      <div className="space-y-6">
        {/* Banner Section (Clean soft teal style, without image) */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("nav.branchManager", "Branch Manager")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("dashboardModule.monthlyTargets.branchPerformanceQuotas", "Branch Performance & Quotas")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("dashboardModule.monthlyTargets.activeDirectives", "Active Directives")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("dashboardModule.monthlyTargets.pageTitle", "Monthly Targets & Incentives")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("dashboardModule.monthlyTargets.branchBannerDesc", "View your branch's quota directives and assign individual monthly targets and tiered incentive commissions to branch staff & collection agents.")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
            {/* Assign Staff Target Button */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("dashboardModule.monthlyTargets.assignStaffTarget", "Assign Staff Target")}</span>
            </button>

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

        {/* Global Notifications */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title={t("dashboardModule.monthlyTargets.totalTargets", "Total Targets")}
            label={t("dashboardModule.monthlyTargets.totalTargets", "Total Targets")}
            value={stats.count}
            subtext={t("dashboardModule.monthlyTargets.assignedMonthlyQuotas", "Assigned monthly quotas")}
            icon={Target}
            color="teal"
          />
          <StatCard
            title={t("dashboardModule.monthlyTargets.totalQuotaValue", "Total Quota Value")}
            label={t("dashboardModule.monthlyTargets.totalQuotaValue", "Total Quota Value")}
            value={formatCurrency(stats.totalAmount)}
            subtext={t("dashboardModule.monthlyTargets.monthlyTargetVolume", "Monthly target volume")}
            icon={Coins}
            color="emerald"
          />
          <StatCard
            title={t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
            label={t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
            value={formatPercentValue(stats.avgThreshold)}
            subtext={t("dashboardModule.monthlyTargets.minimumTierEligibility", "Minimum tier eligibility")}
            icon={Percent}
            color="amber"
          />
          <StatCard
            title={t("dashboardModule.monthlyTargets.topIncentiveRate", "Top Incentive Rate")}
            label={t("dashboardModule.monthlyTargets.topIncentiveRate", "Top Incentive Rate")}
            value={formatPercentValue(stats.maxIncentive)}
            subtext={t("dashboardModule.monthlyTargets.performanceOverflowTier", "Performance overflow tier")}
            icon={Zap}
            color="purple"
          />
        </div>

        {/* Targets Table / Directives View */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                {t("dashboardModule.monthlyTargets.monthlyTargetDirectives", "Monthly Target Directives")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("dashboardModule.monthlyTargets.targetPeriodSummary", "Target period: {period} • Showing {count} targets", { period: formatMonthDisplay(selectedMonth), count: targets.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t("dashboardModule.monthlyTargets.assignStaffTarget", "Assign Staff Target")}</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{t("dashboardModule.monthlyTargets.loadingBranchTargets", "Loading branch targets...")}</p>
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
              <p className="text-sm font-bold text-slate-700 mb-1">{t("dashboardModule.monthlyTargets.noTargetAssigned", "No monthly target assigned")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {t("dashboardModule.monthlyTargets.noTargetAssignedDesc", "No monthly quota has been assigned for {month}. You can assign targets to staff or wait for Super Admin directives.", { month: formatMonthDisplay(selectedMonth) })}
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t("dashboardModule.monthlyTargets.assignStaffTarget", "Assign Staff Target")}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 whitespace-nowrap">
                    <th className="py-3.5 px-4 sm:px-5">{t("dashboardModule.monthlyTargets.colTargetAssignedTo", "Target Assigned To")}</th>
                    <th className="py-3.5 px-4">{t("dashboardModule.monthlyTargets.colRoleScope", "Role / Scope")}</th>
                    <th className="py-3.5 px-4">{t("dashboardModule.monthlyTargets.colPeriodMonth", "Period / Month")}</th>
                    <th className="py-3.5 px-4">{t("dashboardModule.monthlyTargets.colTargetAmount", "Target Amount")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.colThreshold", "Threshold")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.colBelowTarget", "Below Target")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.colPartiallyAchieved", "Partially Achieved")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.colTargetAchieved", "Target Achieved")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.colExceededTarget", "Exceeded Target")}</th>
                    <th className="py-3.5 px-4 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 whitespace-nowrap">
                  {targets.map((item, idx) => {
                    const isBm = item.target_role_type === 'branch_manager' || item.target_scope === 'branch';
                    const targetName =
                      item.target_user_name ||
                      item.role_name ||
                      (isBm ? t("nav.branchManager", "Branch Manager") : t("dashboardModule.monthlyTargets.staffTarget", "Staff Target"));

                    return (
                      <tr key={item.id || idx} className="hover:bg-teal-50/20 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isBm
                                  ? 'bg-amber-100/70 text-amber-800'
                                  : 'bg-teal-100/70 text-teal-800'
                              }`}
                            >
                              {isBm ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {targetName}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                {item.role_name || (isBm ? t("nav.branchManager", "Branch Manager") : t("dashboardModule.monthlyTargets.staffMember", "Staff Member"))}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isBm
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                            }`}
                          >
                            {item.target_scope || (isBm ? t("dashboard.branch", "Branch") : t("dashboardModule.monthlyTargets.scopeIndividual", "Individual"))}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {formatMonthDisplay(item.target_month)}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                            {item.target_period || t("dashboardModule.monthlyTargets.periodMonthly", "Monthly")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(item.target_amount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                            {item.partial_threshold_percent || 80}%
                          </span>
                        </td>

                        {/* Separate Column 1: Below Target */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                            {formatPercentValue(item.below_target_incentive_percent)}
                          </span>
                        </td>

                        {/* Separate Column 2: Partially Achieved */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            {formatPercentValue(item.partially_achieved_incentive_percent)}
                          </span>
                        </td>

                        {/* Separate Column 3: Target Achieved */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {formatPercentValue(item.target_achieved_incentive_percent)}
                          </span>
                        </td>

                        {/* Separate Column 4: Exceeded Target */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                            {formatPercentValue(item.exceeded_target_incentive_percent)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailTarget(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("dashboardModule.monthlyTargets.details", "Details")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Staff Target Modal */}
      <CreateBranchStaffTargetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateStaffTargetSubmit}
        isSubmitting={isSubmitting}
        initialMonth={selectedMonth}
      />

      {/* Target Details Modal */}
      <MonthlyTargetDetailModal
        isOpen={Boolean(detailTarget)}
        target={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </DashboardLayout>
  );
}
