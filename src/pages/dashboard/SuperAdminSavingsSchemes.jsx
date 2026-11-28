import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  SavingsSchemeFormModal,
  SavingsSchemeDetailModal,
  SavingsSchemeDeleteModal
} from '../../components/dashboard/SavingsSchemeModals';
import * as savingsSchemeService from '../../services/savingsSchemeService';
import { getBranches } from '../../services/branchService';
import {
  PiggyBank,
  Wallet,
  Coins,
  Percent,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Check,
  Calendar,
  Layers,
  X,
  ShieldCheck,
  Power,
  Landmark,
  Building2,
  Clock,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import savingsGrowthIllustration from '../../assets/Cooperative Bank Savings Growth.webp';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

function renderAccountStatusBadge(status) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  const label = String(status).replace(/_/g, ' ');

  if (s === 'active' || s === 'approved' || s === 'awaiting_initial_deposit' || s === 'opened' || s === 'account_opened') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>{i18n.t("branchManagerSavingsSchemes.accountOpened", "Account Opened")}</span>
      </span>
    );
  }

  if (s.includes('pending')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }

  if (s.includes('closed') || s.includes('rejected') || s.includes('inactive')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      <span>{label}</span>
    </span>
  );
}

export default function SuperAdminSavingsSchemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modals state
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

  // Centered Feedback Popups
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const fetchSchemes = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await savingsSchemeService.getSavingsSchemes();
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.error('Fetch savings schemes error:', err);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load savings schemes from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

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
        const res = await savingsSchemeService.createSavingsScheme(formData);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminSavingsSchemes.savingsSchemeCreated", "Savings Scheme Created"),
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" (${res?.scheme_code || formData.scheme_code}) was successfully created and registered.`
        });
      } else {
        const schemeId = formModal.data?.id;
        const res = await savingsSchemeService.updateSavingsScheme(schemeId, formData);
        setFormModal({ isOpen: false, mode: 'edit', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminSavingsSchemes.savingsSchemeUpdated", "Savings Scheme Updated"),
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" has been updated.`
        });
      }
      await fetchSchemes(true);
    } catch (err) {
      console.error('Savings scheme form submit error:', err);
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Failed to Create Scheme' : 'Failed to Update Scheme',
        message: err.message || 'The server rejected this request. Please review the inputs and try again.'
      });
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDeleteConfirm = async (scheme) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await savingsSchemeService.deleteSavingsScheme(scheme.id);
      setDeleteModal({ isOpen: false, scheme: null, isDeleting: false });
      setSuccessPopup({
        title: i18n.t("superAdminFdMisSchemes.schemeDeleted", "Scheme Deleted"),
        message: `Savings scheme "${scheme.scheme_name}" (${scheme.scheme_code}) was permanently deleted.`
      });
      await fetchSchemes(true);
    } catch (err) {
      console.error('Delete savings scheme error:', err);
      setDeleteModal({ isOpen: false, scheme: null, isDeleting: false });
      setErrorPopup({
        title: i18n.t("superAdminAnnouncements.deletionFailed", "Deletion Failed"),
        message: err.message || `Could not delete scheme "${scheme.scheme_name}". Accounts may be linked.`
      });
    }
  };

  const handleToggleStatus = async (scheme) => {
    setActionLoadingId(scheme.id);
    const newStatus = !scheme.is_active;
    try {
      await savingsSchemeService.changeSavingsSchemeStatus(scheme.id, newStatus);
      setSchemes((prev) =>
        prev.map((s) => (s.id === scheme.id ? { ...s, is_active: newStatus } : s))
      );
      setSuccessPopup({
        title: i18n.t("branchManagerMembers.statusUpdated", "Status Updated"),
        message: `Scheme "${scheme.scheme_name}" is now ${newStatus ? 'ACTIVE (Open for member deposits)' : 'INACTIVE (Hidden from new accounts)'}.`
      });
    } catch (err) {
      console.error('Toggle scheme status error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || 'Could not update scheme status.'
      });
      await fetchSchemes(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('superadmin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = {
    name: storedUser?.name || storedUser?.full_name || 'Super Admin',
    id: storedUser?.id ? `SUPER-ADMIN-${storedUser.id}` : 'SUPER-ADMIN',
    avatarText: 'SA',
    role: 'Super Admin',
    roleTitle: 'Super Admin',
    office: storedUser?.office || 'Head Office - Apex Central Administration',
  };

  // Metrics calculation
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active).length;
  const maxInterest = schemes.length > 0 ? Math.max(...schemes.map((s) => Number(s.annual_interest_rate) || 0)) : 0;
  const lowestOpeningBal = schemes.length > 0 ? Math.min(...schemes.map((s) => Number(s.min_opening_balance) || 0)) : 0;

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = !q || s.scheme_name?.toLowerCase().includes(q);
    const codeMatch = !q || s.scheme_code?.toLowerCase().includes(q);

    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = Boolean(s.is_active);
    else if (statusFilter === 'inactive') statusMatch = !s.is_active;

    return (nameMatch || codeMatch) && statusMatch;
  });

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="savings_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("login.superAdmin.portalTitleLine1", "Super Admin")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("superAdminSavingsSchemes.depositPortfolioSchemesPolicy", "Deposit Portfolio & Schemes Policy")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t("common.active", "Active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("memberSavingsSchemes.cooperativeSavingsSchemes", "Cooperative Savings Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminSavingsSchemes.manageMemberSavingsDepositSchemes", "Manage member savings deposit schemes, annual interest yields, senior citizen add-on benefits, and minimum average balance requirements.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={savingsGrowthIllustration}
              alt={t("memberSavingsSchemes.cooperativeSavingsSchemesIllustration", "Cooperative Savings Schemes Illustration")}
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300 mx-auto md:mx-0"
            />
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("branchManagerSavingsSchemes.totalSavingsSchemes", "Total Savings Schemes")}
            value={totalCount.toString()}
            subtitle={t("branchManagerLoanSchemes.registeredProducts", "Registered Products")}
            icon={PiggyBank}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerFdMisSchemes.activeDepositSchemes", "Active Deposit Schemes")}
            value={activeCount.toString()}
            subtitle={t("branchManagerFdMisSchemes.readyForMembers", "Ready for Members")}
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% active` : '100%'}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerFdMisSchemes.maxAnnualYield", "Max Annual Yield")}
            value={`${maxInterest}%`}
            subtitle={t("branchManagerSavingsSchemes.topAnnualRate", "Top Annual Rate")}
            icon={Percent}
          />
          <StatCard
            title={t("branchManagerSavingsSchemes.minOpeningDeposit", "Min Opening Deposit")}
            value={formatCurrency(lowestOpeningBal)}
            subtitle={t("branchManagerSavingsSchemes.startingRequirement", "Starting Requirement")}
            icon={Coins}
          />
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("branchManagerSavingsSchemes.searchSavingsSchemeByName", "Search savings scheme by name or code...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                  <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                  <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => fetchSchemes(true)}
                disabled={refreshing}
                title={t("branchManagerSavingsSchemes.refreshSavingsSchemes", "Refresh savings schemes")}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <button
                onClick={handleCreateOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("superAdminSavingsSchemes.createSavingsScheme", "Create Savings Scheme")}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">{t("branchManagerSavingsSchemes.failedToLoadSavingsSchemes", "Failed to load savings schemes")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchSchemes()}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">{t("superAdminSavingsSchemes.loadingSavingsSchemes", "Loading savings schemes...")}</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <PiggyBank className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("branchManagerFdMisSchemes.noMatchingSchemesFound", "No matching schemes found") : t("superAdminSavingsSchemes.noSavingsSchemesConfiguredYet", "No savings schemes configured yet")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("branchManagerFdMisSchemes.tryAdjustingYourSearchQuery", "Try adjusting your search query or clear the filter.")
                      : t("superAdminSavingsSchemes.defineDepositProductsWithAnnual", "Define deposit products with annual interest formulas, minimum balances, and periodic charges.")}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={handleCreateOpen}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t("superAdminSavingsSchemes.createFirstSavingsScheme", "Create First Savings Scheme")}
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("dashboardModule.productAccounts.schemeName", "Scheme Name")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.productAccounts.schemeCode", "Scheme Code")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerFdMisSchemes.annualYield", "Annual Yield")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSavingsSchemes.minOpening", "Min Opening")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSavingsSchemes.monthlyMab", "Monthly MAB")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSavingsSchemes.payout", "Payout")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSavingsSchemes.serviceCharges", "Service Charges")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSavingsSchemes.smsCharges", "SMS Charges")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                    <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-6 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSchemes.map((scheme) => (
                    <tr
                      key={scheme.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* Scheme Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            <PiggyBank className="w-5 h-5 text-[#00b4a7]" />
                          </div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                            {scheme.scheme_name}
                          </div>
                        </div>
                      </td>

                      {/* Scheme Code */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                          {scheme.scheme_code}
                        </span>
                      </td>

                      {/* Annual Yield */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold font-sans text-teal-900 text-sm">
                          {scheme.annual_interest_rate}% <span className="text-xs text-slate-400 font-medium">p.a.</span>
                        </div>
                      </td>

                      {/* Min Opening */}
                      <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                        {formatCurrency(scheme.min_opening_balance)}
                      </td>

                      {/* Monthly MAB */}
                      <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                        {formatCurrency(scheme.min_monthly_avg_balance)}
                      </td>

                      {/* Payout */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {scheme.interest_payout_type}
                        </span>
                      </td>

                      {/* Service Charges */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-bold font-sans text-slate-800 text-sm">
                          {formatCurrency(scheme.service_charges)}
                        </div>
                        {scheme.service_charge_frequency && (
                          <span className="text-[10px] text-slate-400 capitalize">
                            ({scheme.service_charge_frequency})
                          </span>
                        )}
                      </td>

                      {/* SMS Charges */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-bold font-sans text-slate-800 text-sm">
                          {formatCurrency(scheme.sms_charges)}
                        </div>
                        {scheme.sms_charge_frequency && (
                          <span className="text-[10px] text-slate-400 capitalize">
                            ({scheme.sms_charge_frequency})
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(scheme.created_at)}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(scheme)}
                          disabled={actionLoadingId === scheme.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            scheme.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          } ${actionLoadingId === scheme.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={`Click to ${scheme.is_active ? t("branchManagerMembers.deactivate", "deactivate") : t("branchManagerMembers.activate", "activate")} this scheme`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              scheme.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <div className="text-[10px] font-bold mt-1">
                          {scheme.is_active ? (
                            <span className="text-emerald-700">{t("common.active", "Active")}</span>
                          ) : (
                            <span className="text-slate-400">{t("common.inactive", "Inactive")}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            title={t("branchManagerFdMisSchemes.viewSchemeDetails", "View Scheme Details")}
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditOpen(scheme)}
                            title={t("superAdminSavingsSchemes.editSavingsScheme", "Edit Savings Scheme")}
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, scheme, isDeleting: false })}
                            title={t("superAdminSavingsSchemes.deleteSavingsScheme", "Delete Savings Scheme")}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Count */}
          {!loading && filteredSchemes.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
              <span>
                {t("common.showing", "Showing")} <strong className="text-slate-700">{filteredSchemes.length}</strong> {t("common.of", "of")}{' '}
                <strong className="text-slate-700">{schemes.length}</strong> {t("superAdminSavingsSchemes.savingsSchemes", "savings schemes")}
              </span>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Form Modal (Create & Edit) */}
      <SavingsSchemeFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        mode={formModal.mode}
        initialData={formModal.data}
        onSubmit={handleFormSubmit}
        isSubmitting={formModal.isSubmitting}
      />

      {/* Detail Modal */}
      <SavingsSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
        onEditClick={(s) => handleEditOpen(s)}
        onDeleteClick={(s) => setDeleteModal({ isOpen: true, scheme: s, isDeleting: false })}
      />

      {/* Delete Confirmation Modal */}
      <SavingsSchemeDeleteModal
        isOpen={deleteModal.isOpen}
        scheme={deleteModal.scheme}
        onClose={() => setDeleteModal({ isOpen: false, scheme: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Centered Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {successPopup.title || 'Success'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {successPopup.message}
            </p>
            <button
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-600 transition-all cursor-pointer"
            >
              {t("superAdminSavingsSchemes.okayGreat", "Okay, Great")}
            </button>
          </div>
        </div>
      )}

      {/* Centered Error Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {errorPopup.title || 'Error'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {errorPopup.message}
            </p>
            <button
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              {t("branchManagerMemberPasswordUpdate.dismiss", "Dismiss")}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

