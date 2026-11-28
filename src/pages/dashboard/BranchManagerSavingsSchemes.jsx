import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { SavingsSchemeDetailModal } from '../../components/dashboard/SavingsSchemeModals';
import {
  getBranchAdminSavingsSchemes
} from '../../services/savingsSchemeService';
import {
  PiggyBank,
  Coins,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  Wallet,
  ShieldCheck,
  Building2,
  Landmark,
  Clock,
  XCircle,
  FileText,
  User,
  Check,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import savingsGrowthIllustration from '../../assets/Cooperative Savings Bank Growth Banner.webp';

function parseBranchInfo(obj = {}) {
  const b = obj.branch;
  const isObj = b && typeof b === 'object';

  const name =
    (isObj ? (b.name || b.branch_name) : null) ||
    (typeof obj.branch_name === 'string' ? obj.branch_name : null) ||
    (typeof b === 'string' ? b : null) ||
    'Society Branch';

  const code =
    (isObj ? b.branch_code : null) ||
    (typeof obj.branch_code === 'string' ? obj.branch_code : null) ||
    (obj.branch_id ? `BRA-${obj.branch_id}` : 'BRA-01');

  const loc =
    (isObj ? (b.city ? `${b.city}, ${b.state || 'Kerala'}` : b.state) : null) ||
    (typeof obj.location === 'string' ? obj.location : 'Kerala');

  return { name, code, loc };
}

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>{i18n.t("branchManagerSavingsSchemes.accountOpened", "Account Opened")}</span>
      </span>
    );
  }

  if (s.includes('pending')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }

  if (s.includes('closed') || s.includes('rejected') || s.includes('inactive')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      <span>{label}</span>
    </span>
  );
}

export default function BranchManagerSavingsSchemes() {
  const { t } = useTranslation();
  // 1. Schemes Catalogue state (GET /branch-admin/savings-schemes)
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters for schemes
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Action states
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [managerUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Branch Manager';
        const { name: bName, code: bCode, loc: bLoc } = parseBranchInfo(parsed);
        return {
          name,
          full_name: name,
          id: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          user_code: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          avatarText: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
          role: 'Branch Manager',
          branch: bName,
          branch_name: bName,
          branch_code: bCode,
          location: bLoc,
          is_active: parsed.is_active !== false,
          branch_id: parsed.branch_id || (typeof parsed.branch === 'object' ? parsed.branch?.id : null)
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      user_code: 'MGR-001',
      avatarText: 'BM',
      role: 'Branch Manager',
      branch: 'Main Branch',
      branch_name: 'Main Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
      is_active: true
    };
  });

  // Fetch Available Savings Schemes from GET /branch-admin/savings-schemes
  const fetchSavingsSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getBranchAdminSavingsSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('API getBranchAdminSavingsSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load available savings schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavingsSchemes();
  }, []);

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = !q || (s.scheme_name || s.name || '').toLowerCase().includes(q);
    const codeMatch = !q || (s.scheme_code || s.code || '').toLowerCase().includes(q);

    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = s.is_active !== false;
    else if (statusFilter === 'inactive') statusMatch = s.is_active === false;

    return (nameMatch || codeMatch) && statusMatch;
  });

  // Computed Metrics (Matches Super Admin Savings Schemes exactly)
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active !== false).length;
  const maxInterest = schemes.length > 0 ? Math.max(...schemes.map((s) => Number(s.annual_interest_rate) || 0)) : 0;
  const lowestOpeningBal = schemes.length > 0 ? Math.min(...schemes.map((s) => Number(s.min_opening_balance) || 0)) : 0;

  // Pagination slice
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = filteredSchemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="savings_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <PiggyBank className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("nav.branchManager", "Branch Manager")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {managerUser.branch_name || 'Society Branch'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("branchManagerFdMisSchemes.activeSchemes", "Active Schemes")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("branchManagerSavingsSchemes.availableSavingsSchemes", "Available Savings Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("branchManagerSavingsSchemes.catalogueOfMemberSavingsDeposit", "Catalogue of member savings deposit schemes approved by Apex Administration. Review annual yields, minimum average balances, service levies, and payout cycles.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={savingsGrowthIllustration}
              alt={t("branchManagerSavingsSchemes.availableSavingsSchemesIllustration", "Available Savings Schemes Illustration")}
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

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Schemes Catalogue */}
        <div className="space-y-6">
        {/* 4 Summary Metric Cards (Identical to Super Admin) */}
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

        {/* Main Schemes Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {t("branchManagerSavingsSchemes.societySavingsSchemesCatalogue", "Society Savings Schemes Catalogue")}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t("branchManagerSavingsSchemes.officialDepositProductsAvailableFor", "Official deposit products available for members at this branch")}
              </p>
            </div>

            {/* Search Input & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("branchManagerSavingsSchemes.searchSavingsSchemeByName", "Search savings scheme by name or code...")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                  <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                  <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchSavingsSchemes(true)}
                disabled={refreshing}
                title={t("branchManagerSavingsSchemes.refreshSavingsSchemes", "Refresh savings schemes")}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
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
                onClick={() => fetchSavingsSchemes()}
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
                <p className="text-sm text-slate-500 font-medium">{t("branchManagerSavingsSchemes.loadingSavingsSchemesFromRegistry", "Loading savings schemes from registry...")}</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <PiggyBank className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("branchManagerFdMisSchemes.noMatchingSchemesFound", "No matching schemes found") : t("branchManagerSavingsSchemes.noSavingsSchemesAvailable", "No savings schemes available")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("branchManagerFdMisSchemes.tryAdjustingYourSearchQuery", "Try adjusting your search query or clear the filter.")
                      : t("branchManagerSavingsSchemes.noSavingsProductsCurrentlyProvisioned", "No savings products currently provisioned by apex administration.")}
                  </p>
                </div>
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
                  {paginatedSchemes.map((scheme) => {
  const { t } = useTranslation();
                    const isActive = scheme.is_active !== false;

                    return (
                      <tr
                        key={scheme.id || scheme.scheme_id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Scheme Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                              <PiggyBank className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {scheme.scheme_name || scheme.name}
                            </div>
                          </div>
                        </td>

                        {/* Scheme Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            {scheme.scheme_code || scheme.code}
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
                            {scheme.interest_payout_type || 'Monthly'}
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

                        {/* Status */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            title={t("branchManagerFdMisSchemes.viewSchemeDetails", "View Scheme Details")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("branchManagerFdMisSchemes.viewDetails", "View Details")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && filteredSchemes.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
                  {Math.min(currentPage * itemsPerPage, filteredSchemes.length)} {t("common.of", "of")} {filteredSchemes.length} {t("branchManagerFdMisSchemes.schemes", "schemes")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.previous", "Previous")}
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* Details Modal */}
      <SavingsSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
