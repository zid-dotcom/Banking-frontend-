import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  PlusCircle,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Percent,
  Search,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  Coins,
  ShieldCheck,
  Filter
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import monthlyTargetService from '../../services/monthlyTargetService';
import { getBranches } from '../../services/branchService';
import {
  CreateMonthlyTargetModal,
  MonthlyTargetDetailModal,
  formatCurrency,
  formatMonthDisplay,
  formatPercentValue,
  getCurrentMonthTargetString,
} from '../../components/dashboard/MonthlyTargetModals';

export default function SuperAdminMonthlyTargets() {
  const { t } = useTranslation();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Month and Filter State
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthTargetString());
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'branch_manager' | 'staff_role'
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  // Notifications
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch branches for filter
  useEffect(() => {
    async function loadBranches() {
      try {
        const list = await getBranches();
        setBranches(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('SuperAdminMonthlyTargets: Could not load branches:', err);
      }
    }
    loadBranches();
  }, []);

  const fetchTargets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await monthlyTargetService.getSuperAdminMonthlyTargets({
        target_month: selectedMonth || undefined,
      });
      setTargets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch monthly targets:', err);
      setError(err.message || 'Unable to retrieve monthly targets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedMonth]);

  const handleCreateSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await monthlyTargetService.createSuperAdminMonthlyTarget(payload);
      setSuccessMessage('Monthly target and incentive ladder assigned successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setCreateModalOpen(false);
      fetchTargets(true);
    } catch (err) {
      console.error('Failed to create monthly target:', err);
      setErrorMessage(err.message || 'Failed to create monthly target.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered targets
  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      const roleName = String(
        t.role_name || (t.target_role_type === 'branch_manager' ? 'Branch Manager' : 'Staff')
      ).toLowerCase();
      const adminName = String(t.target_user_name || t.target_admin_name || '').toLowerCase();
      const branchName = String(t.branch_name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        roleName.includes(q) ||
        adminName.includes(q) ||
        branchName.includes(q) ||
        String(t.target_amount || '').includes(q) ||
        String(t.target_month || '').includes(q);

      const matchesRole =
        roleFilter === 'all' ||
        String(t.target_role_type || '').toLowerCase() === roleFilter.toLowerCase();

      const matchesBranch =
        branchFilter === 'all' ||
        String(t.branch_id || '') === String(branchFilter) ||
        String(t.branch_name || '').toLowerCase() === String(branchFilter).toLowerCase();

      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [targets, searchQuery, roleFilter, branchFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, branchFilter, selectedMonth]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = targets.length;
    const totalAmount = targets.reduce((acc, curr) => acc + (Number(curr.target_amount) || 0), 0);
    const bmTargets = targets.filter((t) => t.target_role_type === 'branch_manager').length;

    return { totalCount, totalAmount, bmTargets };
  }, [targets]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage) || 1;
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTargets.slice(start, start + itemsPerPage);
  }, [filteredTargets, currentPage]);

  return (
    <DashboardLayout role="super_admin" activeTab="monthly_targets">
      <div className="space-y-6">
        {/* Banner Section (Clean soft teal style, without image) */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("login.superAdmin.portalTitleLine1", "Super Admin")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("superAdminMonthlyTargets.performanceManagement", "Performance Management")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("superAdminMonthlyTargets.activeTargets", "Active Targets")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("dashboardModule.monthlyTargets.pageTitle", "Monthly Targets & Incentives")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminMonthlyTargets.configureAndAssignMonthlyCollection", "Configure and assign monthly collection and business targets with tiered incentive structures for branch managers and staff roles.")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("superAdminMonthlyTargets.setMonthlyTarget", "Set Monthly Target")}</span>
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <StatCard
            title={t("superAdminMonthlyTargets.totalTargetsSet", "Total Targets Set")}
            label={t("superAdminMonthlyTargets.totalTargetsSet", "Total Targets Set")}
            value={stats.totalCount}
            subtext="Configured branch directives"
            icon={Target}
            color="teal"
          />
          <StatCard
            title={t("superAdminMonthlyTargets.totalTargetValue", "Total Target Value")}
            label={t("superAdminMonthlyTargets.totalTargetValue", "Total Target Value")}
            value={formatCurrency(stats.totalAmount)}
            subtext="Aggregated portfolio value"
            icon={Coins}
            color="emerald"
          />
          <StatCard
            title={t("nav.branchManager", "Branch Manager")}
            label={t("nav.branchManager", "Branch Manager")}
            value={stats.bmTargets}
            subtext="Branch management quotas"
            icon={Building2}
            color="amber"
          />
        </div>

        {/* Month Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("superAdminMonthlyTargets.searchTargetRoleOrAmount", "Search target role or amount...")}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            {/* Target Month Picker and Role Filter */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-600">{t("superAdminMonthlyTargets.targetMonth", "Target Month:")}</span>
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

              {/* Branch Filter Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-600 flex-shrink-0">{t("branchManagerCashReconciliation.branch", "Branch:")}</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[210px] truncate"
                >
                  <option value="all">{t("superAdminMonthlyTargets.allBranches", "All Branches (")}{branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || `Branch #${b.branch_code || b.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">{t("branchManagerSecurityEvents.allRoles", "All Roles")}</option>
                <option value="branch_manager">{t("nav.branchManager", "Branch Manager")}</option>
                <option value="staff_role">{t("superAdminMonthlyTargets.staffRole", "Staff Role")}</option>
              </select>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t("superAdminMonthlyTargets.setTarget", "Set Target")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Targets Table / Catalogue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                {t("dashboardModule.monthlyTargets.monthlyTargetDirectives", "Monthly Target Directives")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("common.showing", "Showing")} {filteredTargets.length} {t("superAdminMonthlyTargets.assignedTargetConfigurations", "assigned target configurations")}
                {selectedMonth ? ` for ${formatMonthDisplay(selectedMonth)}` : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{t("superAdminMonthlyTargets.loadingTargets", "Loading targets...")}</p>
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
          ) : filteredTargets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 px-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                <Target className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">{t("superAdminMonthlyTargets.noMonthlyTargetsFound", "No monthly targets found")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {t("superAdminMonthlyTargets.noMonthlyTargetDirectivesHave", "No monthly target directives have been configured for the selected month or filters.")}
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t("superAdminMonthlyTargets.setFirstMonthlyTarget", "Set First Monthly Target")}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 whitespace-nowrap">
                    <th className="py-3.5 px-4 sm:px-5">{t("superAdminMonthlyTargets.targetAdminRole", "Target Admin / Role")}</th>
                    <th className="py-3.5 px-4">{t("dashboard.branch", "Branch")}</th>
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
                  {paginatedTargets.map((item, idx) => {
  const { t } = useTranslation();
                    const isBm = item.target_role_type === 'branch_manager';
                    const roleTitle = item.target_user_name || item.role_name || (isBm ? t("nav.branchManager", "Branch Manager") : t("superAdminMonthlyTargets.staffRole", "Staff Role"));

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
                                {roleTitle}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                {item.role_name || (isBm ? t("superAdminMonthlyTargets.branchExecutive", "Branch Executive") : `Staff ID: ${item.staff_role_id || 'N/A'}`)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-xs">
                            {item.branch_name || 'Assigned Branch'}
                          </div>
                          {item.branch_id && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {t("superAdminMonthlyTargets.branch", "Branch #")}{item.branch_id}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {formatMonthDisplay(item.target_month)}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                            {item.target_period || 'Monthly'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(item.target_amount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                            {item.partial_threshold_percent}%
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {t("branchManagerInvestmentSchemes.page", "Page")} {currentPage} {t("common.of", "of")} {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Target Modal */}
      <CreateMonthlyTargetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
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
