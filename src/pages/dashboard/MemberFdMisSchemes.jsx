import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { FdMisSchemeDetailModal } from '../../components/dashboard/FdMisSchemeModals';
import { getMemberFdMisSchemes } from '../../services/fdMisSchemeService';
import { getMemberMe } from '../../services/memberService';
import {
  Coins,
  PiggyBank,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Landmark,
  PlusCircle
} from 'lucide-react';
import mintFdMisIllustration from '../../assets/Mint FD & MIS Investment Growth.webp';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
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

export default function MemberFdMisSchemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Details Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Member';
        const branchObj = typeof parsed.branch === 'object' && parsed.branch !== null ? parsed.branch : null;
        const branchName = branchObj?.name || (typeof parsed.branch === 'string' ? parsed.branch : '');
        const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
        return {
          name,
          full_name: name,
          id: parsed.member_code || (parsed.id ? `MEM-${parsed.id}` : 'AFX-MEM-8842'),
          member_code: parsed.member_code || (parsed.id ? String(parsed.id) : ''),
          email: parsed.email || '',
          mobile: parsed.mobile || '',
          branch: branchName || 'Society Branch',
          branch_name: branchName,
          branch_location: branchLocation,
          status: parsed.status || 'approved',
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
        };
      }
    } catch {}
    return {
      name: 'Member',
      full_name: 'Member',
      id: 'AFX-MEM-8842',
      member_code: '',
      email: '',
      mobile: '',
      branch: 'Society Branch',
      branch_name: '',
      branch_location: '',
      status: 'approved',
      avatarText: 'M'
    };
  });

  // Sync member profile
  useEffect(() => {
    getMemberMe()
      .then((data) => {
        if (data) {
          const name = data.full_name || data.name || 'Member';
          const branchObj = typeof data.branch === 'object' && data.branch !== null ? data.branch : null;
          const branchName = branchObj?.name || (typeof data.branch === 'string' ? data.branch : '');
          const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
          setMemberUser({
            name,
            full_name: name,
            id: data.member_code || (data.id ? `MEM-${data.id}` : 'AFX-MEM-8842'),
            member_code: data.member_code || (data.id ? String(data.id) : ''),
            email: data.email || '',
            mobile: data.mobile || '',
            branch: branchName || 'Society Branch',
            branch_name: branchName,
            branch_location: branchLocation,
            status: data.status || 'approved',
            avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Available FD/MIS Schemes from GET /member/fd-mis-schemes
  const fetchFdMisSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberFdMisSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('getMemberFdMisSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load available FD/MIS schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFdMisSchemes();
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

  // Computed Metrics (Matches Super Admin FD/MIS schemes exactly)
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active !== false).length;
  const maxInterest = schemes.length > 0
    ? Math.max(...schemes.map((s) => Number(s.annual_interest_rate ?? s.interest_rate) || 0))
    : 0;

  const validDeposits = schemes
    .map((s) => Number(s.minimum_fd_mis_amount ?? s.min_deposit_amount ?? s.min_amount ?? s.min_balance) || 0)
    .filter((v) => v > 0);
  const minDeposit = validDeposits.length > 0 ? Math.min(...validDeposits) : 0;

  // Pagination
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = filteredSchemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="fd_mis_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner matching Super Admin exactly */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("dashboardModule.accountTransactions.roleMember", "Member")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {memberUser.branch_name || 'Term Deposit & MIS Policy'}
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
                {t("memberFdMisSchemes.cooperativeFdMisTermSchemes", "Cooperative FD & MIS Term Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("memberFdMisSchemes.exploreFixedDepositAccountsMonthly", "Explore fixed deposit accounts, monthly income schemes (MIS), annual yield matrices, and lock-in intervals offered to society members.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={mintFdMisIllustration}
              alt={t("memberFdMisSchemes.mintFdMisInvestmentGrowth", "Mint FD & MIS Investment Growth")}
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

        {/* 4 Summary Metric Cards (Identical to Super Admin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("branchManagerFdMisSchemes.totalFdMisSchemes", "Total FD / MIS Schemes")}
            value={totalCount.toString()}
            subtitle={t("branchManagerFdMisSchemes.registeredTermProducts", "Registered Term Products")}
            icon={Coins}
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
            subtitle={t("branchManagerFdMisSchemes.highestTermYieldPA", "Highest Term Yield p.a.")}
            icon={TrendingUp}
            trend="Per Annum"
            trendType="neutral"
          />
          <StatCard
            title={t("branchManagerFdMisSchemes.minInvestmentScheme", "Min Investment Scheme")}
            value={formatCurrency(minDeposit)}
            subtitle={t("branchManagerFdMisSchemes.minimumOpeningDeposit", "Minimum Opening Deposit")}
            icon={PiggyBank}
            trend="Base Entry"
            trendType="neutral"
          />
        </div>

        {/* Main Schemes Table Panel (Same layout & table as Super Admin) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Table Header Filter & Action Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {t("memberFdMisSchemes.termDepositMisSchemesDirectory", "Term Deposit & MIS Schemes Directory")}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("memberFdMisSchemes.comprehensiveCatalogueOfTermFixed", "Comprehensive catalogue of term fixed deposits and regular payout instruments")}
              </p>
            </div>

            {/* Search Input, Status Filter & Refresh */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("dashboardModule.productAccounts.searchSchemePlaceholder", "Search scheme name or code...")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchFdMisSchemes(true)}
                disabled={refreshing}
                title={t("memberFdMisSchemes.refreshFdMisSchemes", "Refresh FD/MIS schemes")}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
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
                  <p className="text-sm font-bold text-red-900">{t("branchManagerFdMisSchemes.failedToLoadFdMis", "Failed to load FD/MIS schemes")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchFdMisSchemes()}
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
                <p className="text-sm text-slate-500 font-medium">{t("memberFdMisSchemes.loadingFdMisSchemesFrom", "Loading FD/MIS schemes from registry...")}</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("branchManagerFdMisSchemes.noMatchingSchemesFound", "No matching schemes found") : t("branchManagerFdMisSchemes.noFdMisSchemesAvailable", "No FD / MIS schemes available")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("branchManagerFdMisSchemes.tryAdjustingYourSearchQuery", "Try adjusting your search query or clear the filter.")
                      : t("memberFdMisSchemes.noFixedDepositOrMonthly", "No fixed deposit or monthly income products are currently provisioned.")}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("dashboardModule.productAccounts.schemeName", "Scheme Name")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.productAccounts.schemeCode", "Scheme Code")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerFdMisSchemes.duration", "Duration")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerFdMisSchemes.annualYield", "Annual Yield")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerFdMisSchemes.minDeposit", "Min Deposit")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerFdMisSchemes.payoutFrequency", "Payout Frequency")}</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">{t("branchManagerFdMisSchemes.minimumDepositPeriod", "Minimum Deposit Period")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                    <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-6 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedSchemes.map((scheme) => {
  const { t } = useTranslation();
                    const isActive = scheme.is_active !== false;
                    const annualYield = scheme.annual_interest_rate ?? scheme.interest_rate ?? 0;
                    const minDep = scheme.minimum_fd_mis_amount ?? scheme.min_deposit_amount ?? scheme.min_amount ?? scheme.min_balance ?? 0;
                    const tenureVal = scheme.tenure_value || (scheme.max_tenure_months ? `${scheme.min_tenure_months || 12}-${scheme.max_tenure_months}` : '12');
                    const tenureUnit = scheme.tenure_unit || 'months';
                    const payout = (scheme.interest_payout_type || scheme.compounding_frequency || 'monthly').replace(/_/g, ' ');
                    const lockIn = scheme.fd_mis_lock_in_period_months ? `${scheme.fd_mis_lock_in_period_months} Months` : t("branchManagerFdMisSchemes.none", "None");
                    const createdAt = scheme.created_at;

                    return (
                      <tr
                        key={scheme.id || scheme.scheme_id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Scheme Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                              <Coins className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                                {scheme.scheme_name || scheme.name}
                              </div>
                              {scheme.description && (
                                <p className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                                  {scheme.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Scheme Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            {scheme.scheme_code || scheme.code}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-6 whitespace-nowrap font-bold font-sans text-slate-800">
                          {tenureVal} <span className="text-xs text-slate-500 font-medium capitalize">{tenureUnit}</span>
                        </td>

                        {/* Annual Yield */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold font-sans text-teal-900 text-sm">
                            {annualYield}% <span className="text-xs text-slate-400 font-medium">p.a.</span>
                          </div>
                          {(scheme.senior_citizen_addon_interest_rate > 0 || scheme.senior_citizen_rate_add_on > 0) && (
                            <span className="text-[10px] text-amber-700 font-semibold block">
                              +{scheme.senior_citizen_addon_interest_rate || scheme.senior_citizen_rate_add_on}{t("memberFdMisSchemes.senior", "% Senior")}
                            </span>
                          )}
                        </td>

                        {/* Min Deposit */}
                        <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                          {formatCurrency(minDep)}
                        </td>

                        {/* Payout Frequency */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {payout}
                          </span>
                        </td>

                        {/* Minimum Deposit Period */}
                        <td className="py-4 px-6 whitespace-nowrap text-xs font-bold text-slate-700">
                          {lockIn}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(createdAt)}
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailModal({ isOpen: true, scheme })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                              title={t("memberFdMisSchemes.viewSchemeDetails", "View scheme details")}
                            >
                              <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />
                              <span>{t("common.view", "View")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredSchemes.length > itemsPerPage && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                {t("common.showing", "Showing")}{' '}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                {t("common.to", "to")}{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredSchemes.length)}
                </span>{' '}
                {t("common.of", "of")} <span className="font-bold text-slate-800">{filteredSchemes.length}</span> {t("branchManagerFdMisSchemes.schemes", "schemes")}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Scheme Details Modal */}
      <FdMisSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
