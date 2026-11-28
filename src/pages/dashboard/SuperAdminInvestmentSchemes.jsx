import React, { useState, useEffect, useMemo } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Coins,
  Search,
  PlusCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Percent,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Landmark,
  PiggyBank,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import investmentSchemeService from '../../services/investmentSchemeService';
import {
  InvestmentSchemeFormModal,
  InvestmentSchemeDetailModal,
  InvestmentSchemeDeleteModal,
  CONTRIBUTION_FREQUENCY_OPTIONS,
  formatInterestRate
} from '../../components/dashboard/InvestmentSchemeModals';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function SuperAdminInvestmentSchemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modals State
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scheme: null,
    isDeleting: false,
  });

  // Action status loading tracker (for toggle switch)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Popups
  const [successPopup, setSuccessPopup] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchSchemes = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await investmentSchemeService.getSuperAdminInvestmentSchemes({
        limit: 100,
        frequency: frequencyFilter !== 'all' ? frequencyFilter : undefined,
      });
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch investment schemes:', err);
      setError(err.message || 'Unable to retrieve investment schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [frequencyFilter]);

  const handleCreateOpen = () => {
    setFormModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false,
    });
  };

  const handleEditOpen = (scheme) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      data: scheme,
      isSubmitting: false,
    });
  };

  const handleFormSubmit = async (formData) => {
    setFormModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const res = await investmentSchemeService.createSuperAdminInvestmentScheme(formData);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminInvestmentSchemes.investmentSchemeCreated", "Investment Scheme Created"),
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" (${res?.scheme_code || formData.scheme_code}) was successfully registered.`,
        });
      } else {
        const schemeId = formModal.data?.id || formModal.data?.scheme_id;
        const res = await investmentSchemeService.updateSuperAdminInvestmentScheme(schemeId, formData);
        setFormModal({ isOpen: false, mode: 'edit', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminInvestmentSchemes.investmentSchemeUpdated", "Investment Scheme Updated"),
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" was successfully updated.`,
        });
      }
      fetchSchemes(true);
    } catch (err) {
      console.error('Form submission failed:', err);
      setErrorPopup({
        title: i18n.t("superAdminInvestmentSchemes.operationFailed", "Operation Failed"),
        message: err.message || 'Unable to save investment scheme.',
      });
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleStatusToggle = async (scheme) => {
    const schemeId = scheme.id || scheme.scheme_id;
    const nextStatus = !scheme.is_active;
    setActionLoadingId(schemeId);

    try {
      await investmentSchemeService.changeSuperAdminInvestmentSchemeStatus(schemeId, nextStatus);
      setSchemes((prev) =>
        prev.map((s) => ((s.id || s.scheme_id) === schemeId ? { ...s, is_active: nextStatus } : s))
      );
      setSuccessPopup({
        title: i18n.t("branchManagerMembers.statusUpdated", "Status Updated"),
        message: `Scheme "${scheme.scheme_name}" is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`,
      });
    } catch (err) {
      console.error('Status toggle failed:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || 'Failed to update scheme status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.scheme) return;
    const schemeId = deleteModal.scheme.id || deleteModal.scheme.scheme_id;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await investmentSchemeService.deleteSuperAdminInvestmentScheme(schemeId);
      setDeleteModal({ isOpen: false, scheme: null, isDeleting: false });
      setSuccessPopup({
        title: i18n.t("superAdminFdMisSchemes.schemeDeleted", "Scheme Deleted"),
        message: `Scheme "${deleteModal.scheme.scheme_name}" was successfully removed.`,
      });
      fetchSchemes(true);
    } catch (err) {
      console.error('Delete failed:', err);
      setErrorPopup({
        title: i18n.t("branchManagerStaff.deleteFailed", "Delete Failed"),
        message: err.message || 'Unable to delete investment scheme.',
      });
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
        (s.scheme_code && s.scheme_code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active);

      const matchesFrequency =
        frequencyFilter === 'all' ||
        String(s.contribution_frequency || '').toLowerCase() === frequencyFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesFrequency;
    });
  }, [schemes, searchQuery, statusFilter, frequencyFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchemes.slice(start, start + itemsPerPage);
  }, [filteredSchemes, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = schemes.length;
    const active = schemes.filter((s) => s.is_active).length;
    const daily = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'daily'
    ).length;
    const weekly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'weekly'
    ).length;
    const monthly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'monthly'
    ).length;

    return { total, active, daily, weekly, monthly };
  }, [schemes]);

  return (
    <DashboardLayout role="super_admin" activeTab="investment_schemes">
      <div className="space-y-6">
        {/* Banner Section (Same color as FD/MIS section, without image) */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("login.superAdmin.portalTitleLine1", "Super Admin")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("superAdminInvestmentSchemes.recurringInvestmentPolicy", "Recurring Investment Policy")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("common.active", "Active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("memberInvestmentSchemes.cooperativeInvestmentSchemes", "Cooperative Investment Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminInvestmentSchemes.createConfigureAndManageDaily", "Create, configure, and manage daily, weekly, and monthly recurring investment schemes. Enabling members and branch networks to build flexible, high-yield cooperative savings.")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCreateOpen}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("superAdminInvestmentSchemes.createInvestmentScheme", "Create Investment Scheme")}</span>
            </button>
            <button
              type="button"
              onClick={() => fetchSchemes(true)}
              disabled={loading || refreshing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-teal-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t("common.refresh", "Refresh")}</span>
            </button>
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* Statistics Cards (Separate cards for Daily, Weekly, and Monthly) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title={t("superAdminInvestmentSchemes.totalSchemes", "Total Schemes")}
            value={stats.total}
            icon={TrendingUp}
            variant="emerald"
            subtitle={t("superAdminInvestmentSchemes.registeredDepositPlans", "Registered deposit plans")}
          />
          <StatCard
            title={t("branchManagerFdMisSchemes.activeSchemes", "Active Schemes")}
            value={stats.active}
            icon={ShieldCheck}
            variant="teal"
            subtitle={t("superAdminInvestmentSchemes.liveAccessibleToMembers", "Live & accessible to members")}
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.dailySchemes", "Daily Schemes")}
            value={stats.daily}
            icon={Coins}
            variant="blue"
            subtitle={t("superAdminInvestmentSchemes.microDepositDailyPlans", "Micro-deposit daily plans")}
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.weeklySchemes", "Weekly Schemes")}
            value={stats.weekly}
            icon={Calendar}
            variant="indigo"
            subtitle={t("branchManagerInvestmentSchemes.7DayRecurringPlans", "7-day recurring plans")}
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.monthlySchemes", "Monthly Schemes")}
            value={stats.monthly}
            icon={PiggyBank}
            variant="purple"
            subtitle={t("branchManagerInvestmentSchemes.monthlyPeriodicPlans", "Monthly periodic plans")}
          />
        </div>

        {/* Filter & Control Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("superAdminInvestmentSchemes.searchSchemeByNameCode", "Search scheme by name, code or terms...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>

            {/* Status Filter & In-Page Create Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#00b4a7] transition-all cursor-pointer"
              >
                <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
              </select>

              <button
                type="button"
                onClick={() => fetchSchemes(true)}
                disabled={loading || refreshing}
                title={t("superAdminFdMisSchemes.refreshSchemesCatalogue", "Refresh schemes catalogue")}
                className="p-2 sm:px-3 sm:py-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Prominent in-page Create button */}
              <button
                type="button"
                onClick={handleCreateOpen}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("superAdminInvestmentSchemes.createInvestmentScheme", "Create Investment Scheme")}</span>
              </button>
            </div>
          </div>

          {/* Frequency Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              {t("branchManagerInvestmentSchemes.frequency", "Frequency:")}
            </span>
            {[
              { id: 'all', label: t("branchManagerInvestmentSchemes.allFrequencies", "All Frequencies") },
              { id: 'daily', label: t("branchManagerInvestmentSchemes.daily", "Daily") },
              { id: 'weekly', label: t("branchManagerInvestmentSchemes.weekly", "Weekly") },
              { id: 'monthly', label: t("dashboardModule.monthlyTargets.periodMonthly", "Monthly") },
            ].map((f) => {
              const isActive = frequencyFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFrequencyFilter(f.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchSchemes()}
              className="font-bold underline text-rose-900 cursor-pointer"
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Schemes Table / Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-black text-slate-900 text-base">
                {t("superAdminInvestmentSchemes.investmentSchemesCatalogue", "Investment Schemes Catalogue")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("common.showing", "Showing")} {filteredSchemes.length} {t("common.of", "of")} {schemes.length} {t("branchManagerFdMisSchemes.schemes", "schemes")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600">{t("memberInvestmentSchemes.loadingInvestmentSchemes", "Loading investment schemes...")}</p>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">{t("superAdminInvestmentSchemes.noInvestmentSchemesFound", "No Investment Schemes Found")}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery || statusFilter !== 'all' || frequencyFilter !== 'all'
                  ? t("superAdminInvestmentSchemes.noSchemesMatchedYourActive", "No schemes matched your active filter criteria. Try adjusting filters or search.")
                  : t("superAdminInvestmentSchemes.getStartedByCreatingYour", "Get started by creating your first cooperative investment scheme.")}
              </p>
              <button
                type="button"
                onClick={handleCreateOpen}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
              >
                {t("superAdminInvestmentSchemes.createNewScheme", "Create New Scheme")}
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">{t("dashboardModule.productAccounts.schemeName", "Scheme Name")}</th>
                      <th className="py-3 px-4">{t("dashboardModule.productAccounts.schemeCode", "Scheme Code")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.frequency2", "Frequency")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.installment", "Installment")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.investmentDuration", "Investment Duration")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.annualInterestRate", "Annual Interest Rate")}</th>
                      <th className="py-3 px-4">{t("superAdminInvestmentSchemes.estTotal", "Est. Total")}</th>
                      <th className="py-3 px-4 text-center">{t("common.status", "Status")}</th>
                      <th className="py-3 px-4 text-right">{t("common.actions", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSchemes.map((scheme) => {
  const { t } = useTranslation();
                      const schemeId = scheme.id || scheme.scheme_id;
                      const freq = String(scheme.contribution_frequency || 'daily').toLowerCase();
                      const estTotal =
                        (Number(scheme.installment_amount) || 0) *
                        (parseInt(scheme.tenure_installments, 10) || 0);

                      const freqBadges = {
                        daily: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                        weekly: 'bg-blue-50 text-blue-700 border-blue-200/60',
                        monthly: 'bg-purple-50 text-purple-700 border-purple-200/60',
                      };

                      return (
                        <tr key={schemeId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            {scheme.scheme_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 inline-block">
                              {scheme.scheme_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                                freqBadges[freq] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {freq}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatCurrency(scheme.installment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {scheme.tenure_installments}{' '}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {freq === 'daily' ? t("branchManagerInvestmentSchemes.days", "Days") : freq === 'weekly' ? t("branchManagerInvestmentSchemes.weeks", "Weeks") : freq === 'monthly' ? t("branchManagerInvestmentSchemes.months", "Months") : t("branchManagerInvestmentSchemes.days", "Days")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600">
                            {formatInterestRate(scheme.annual_interest_rate)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {formatCurrency(estTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={scheme.is_active}
                                onClick={() => handleStatusToggle(scheme)}
                                disabled={actionLoadingId === schemeId}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  scheme.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                                } ${actionLoadingId === schemeId ? 'opacity-50 cursor-wait' : ''}`}
                                title={scheme.is_active ? t("superAdminInvestmentSchemes.clickToDeactivate", "Click to deactivate") : t("superAdminInvestmentSchemes.clickToActivate", "Click to activate")}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    scheme.is_active ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-[11px] font-bold ${
                                  scheme.is_active ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                              >
                                {scheme.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title={t("branchManagerFdMisSchemes.viewDetails", "View Details")}
                                onClick={() => setDetailModal({ isOpen: true, scheme })}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={t("superAdminFdMisSchemes.editScheme", "Edit Scheme")}
                                onClick={() => handleEditOpen(scheme)}
                                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={t("superAdminFdMisSchemes.deleteScheme", "Delete Scheme")}
                                onClick={() => setDeleteModal({ isOpen: true, scheme, isDeleting: false })}
                                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {t("branchManagerInvestmentSchemes.page", "Page")} {currentPage} {t("common.of", "of")} {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                    >
                      {t("branchManagerFdMisSchemes.previous", "Previous")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                    >
                      {t("branchManagerFdMisSchemes.next", "Next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <InvestmentSchemeFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.data}
        isSubmitting={formModal.isSubmitting}
        onClose={() => setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        onSubmit={handleFormSubmit}
      />

      <InvestmentSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />

      <InvestmentSchemeDeleteModal
        isOpen={deleteModal.isOpen}
        scheme={deleteModal.scheme}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, scheme: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success Popup */}
      {successPopup && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-900 text-white rounded-2xl shadow-xl flex items-start gap-3 max-w-sm animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-xs">{successPopup.title}</h5>
            <p className="text-[11px] text-emerald-200 mt-0.5 leading-relaxed">{successPopup.message}</p>
          </div>
          <button
            onClick={() => setSuccessPopup(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-rose-900 text-white rounded-2xl shadow-xl flex items-start gap-3 max-w-sm animate-slideUp">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-xs">{errorPopup.title}</h5>
            <p className="text-[11px] text-rose-200 mt-0.5 leading-relaxed">{errorPopup.message}</p>
          </div>
          <button
            onClick={() => setErrorPopup(null)}
            className="text-rose-300 hover:text-white cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
