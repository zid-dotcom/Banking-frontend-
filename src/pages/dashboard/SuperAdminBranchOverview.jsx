import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import {
  Building2,
  Users,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Eye,
  X,
  FileBarChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Layers,
  ArrowRight,
  Filter,
  Coins,
  Scale,
  ShieldAlert
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import bankTechScene from '../../assets/AurumFX Cooperative Bank Technology Scene.png';
import { getSuperAdminBranchOverview } from '../../services/branchOverviewService';
import { getBranches } from '../../services/branchService';
import SuperAdminMembers from './SuperAdminMembers';
import SuperAdminCashTransactions from './SuperAdminCashTransactions';
import SuperAdminCashReconciliation from './SuperAdminCashReconciliation';
import SuperAdminStaff from './SuperAdminStaff';
import SuperAdminSecurityEvents from './SuperAdminSecurityEvents';


function formatCurrency(val) {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function SuperAdminBranchOverview() {
  const { t } = useTranslation();
  const [currentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('superadmin_user') || localStorage.getItem('user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      name: t("nav.superAdmin", "Super Admin"),
      full_name: t("nav.superAdmin", "Super Admin"),
      role: t("nav.superAdmin", "Super Admin"),
    };
  });

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateISO = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('1');
  const [overviewList, setOverviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filtering (defaults to today on backend when empty)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination for enquiries
  const [enquiriesSkip, setEnquiriesSkip] = useState(0);
  const enquiriesLimit = 15;

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Load branches list & set Kozhikode as default
  useEffect(() => {
    getBranches()
      .then((bList) => {
        if (Array.isArray(bList) && bList.length > 0) {
          setBranches(bList);
          const kozhikode = bList.find((b) =>
            (b.name || b.branch_name || '').toLowerCase().includes('kozhikode') ||
            (b.city || '').toLowerCase().includes('kozhikode') ||
            String(b.branch_code || '').includes('203391')
          );
          if (kozhikode) {
            setSelectedBranchId(String(kozhikode.id));
          } else {
            setSelectedBranchId(String(bList[0].id));
          }
        }
      })
      .catch((err) => console.warn('Could not load branch dropdown list:', err));
  }, []);

  // Fetch overview
  const fetchOverview = async (skipOverride = null) => {
    setLoading(true);
    setError(null);
    try {
      const skipToUse = skipOverride !== null ? skipOverride : enquiriesSkip;

      let from = fromDate || null;
      let to = toDate || null;
      if (from && !to) to = from;
      if (!from && to) from = to;

      const branchIdParam = selectedBranchId && selectedBranchId !== 'all' ? Number(selectedBranchId) : null;

      const data = await getSuperAdminBranchOverview({
        branch_id: branchIdParam,
        from_date: from,
        to_date: to,
        enquiries_skip: skipToUse,
        enquiries_limit: enquiriesLimit,
      });

      setOverviewList(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      console.error('Failed to load superadmin branch overview:', err);
      setError(err.message || t("dashboardModule.branchOverview.fetchError", "Unable to retrieve branch overview."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEnquiriesSkip(0);
    fetchOverview(0);
  }, [selectedBranchId, fromDate, toDate]);

  // Aggregated calculations across returned branch overview items
  const isSingleBranch = selectedBranchId !== 'all';
  const singleBranch = isSingleBranch ? (overviewList[0] || null) : null;

  const totalMembers = overviewList.reduce((acc, b) => acc + Number(b.total_members || 0), 0);
  const membersWithAccs = overviewList.reduce((acc, b) => acc + Number(b.members_with_accounts || 0), 0);
  const totalAccounts = overviewList.reduce((acc, b) => acc + Number(b.total_accounts || 0), 0);
  const membersRegisteredInPeriod = overviewList.reduce(
    (acc, b) => acc + Number(b.members_registered_in_period || 0),
    0
  );
  const accountsOpenedInPeriod = overviewList.reduce(
    (acc, b) => acc + Number(b.accounts_opened_in_period || 0),
    0
  );
  const totalDepositAmt = overviewList.reduce((acc, b) => acc + Number(b.cash_deposit_amount || 0), 0);
  const totalDepositCount = overviewList.reduce((acc, b) => acc + Number(b.cash_deposit_count || 0), 0);
  const totalWithdrawalAmt = overviewList.reduce((acc, b) => acc + Number(b.cash_withdrawal_amount || 0), 0);
  const totalWithdrawalCount = overviewList.reduce((acc, b) => acc + Number(b.cash_withdrawal_count || 0), 0);
  const netMovement = totalDepositAmt - totalWithdrawalAmt;
  const totalEnquiriesCount = overviewList.reduce((acc, b) => acc + Number(b.enquiries_submitted_count || 0), 0);

  const adoptionRate = totalMembers > 0 ? Math.round((membersWithAccs / totalMembers) * 100) : 0;

  // Flattened inquiries across loaded branch items
  const allEnquiries = overviewList.flatMap((b) =>
    (b.enquiries || []).map((e) => ({
      ...e,
      branch_name: b.branch_name,
      branch_code: b.branch_code,
    }))
  );

  const filteredEnquiries = allEnquiries.filter((enq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(enq.id || '').toLowerCase().includes(q) ||
      String(enq.member_name || '').toLowerCase().includes(q) ||
      String(enq.member_code || '').toLowerCase().includes(q) ||
      String(enq.branch_name || '').toLowerCase().includes(q) ||
      String(enq.subject || '').toLowerCase().includes(q) ||
      String(enq.message || '').toLowerCase().includes(q) ||
      String(enq.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout role="super_admin" user={currentUser} activeTab="branch_overview">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Filter Toolbar: Branch Selector + Date Filter */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Left: Branch Selector */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">{t("dashboardModule.branchOverview.allBranchesApex", "All Branches (Apex Network)")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || `${t("dashboard.branch", "Branch")} #${b.branch_code || b.id}`} ({b.city || t("dashboardModule.branchOverview.defaultCity", "Kerala")})
                  </option>
                ))}
              </select>
            </div>

            {isSingleBranch && (
              <button
                type="button"
                onClick={() => setSelectedBranchId('all')}
                className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition-colors cursor-pointer"
                title={t("dashboardModule.branchOverview.viewAllBranches", "View All Branches")}
              >
                {t("dashboardModule.branchOverview.clearBranchFilter", "Clear Branch Filter")}
              </button>
            )}
          </div>

          {/* Right: Date Filtering Only & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.branchOverview.from", "From")}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.branchOverview.to", "To")}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                title={t("dashboardModule.branchOverview.clearDates", "Clear Dates")}
              >
                {t("dashboardModule.branchOverview.clear", "Clear")}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchOverview()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              title={t("dashboardModule.branchOverview.refreshOverview", "Refresh Overview")}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? t("dashboardModule.branchOverview.refreshing", "Refreshing...") : t("common.refresh", "Refresh")}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Tab Navigation (6 Tabs) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-slate-200/80 shadow-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: 'overview', label: t("dashboard.overview", "Overview"), icon: FileBarChart },
              { id: 'members', label: t("dashboardModule.branchOverview.tabMembers", "Members"), icon: Users },
              { id: 'cash_transactions', label: t("dashboardModule.branchOverview.tabCashTransactions", "Cash Transactions"), icon: Coins },
              { id: 'cash_reconciliation', label: t("dashboardModule.branchOverview.tabCashReconciliation", "Cash Reconciliation"), icon: Scale },
              { id: 'staff', label: t("dashboardModule.branchOverview.tabStaff", "Staff"), icon: UserCheck },
              { id: 'security_events', label: t("sidebar.securityEvents", "Security Events"), icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => fetchOverview()}
                  className="font-bold underline text-amber-900 cursor-pointer"
                >
                  {t("dashboardModule.branchOverview.retry", "Retry")}
                </button>
              </div>
            )}

        {/* SECTION 1: Foundations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#00b4a7]" />
            <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">
              {isSingleBranch
                ? t("dashboardModule.branchOverview.branchFoundation", "{{branch}} Foundation", { branch: singleBranch?.branch_name || t("dashboard.branch", "Branch") })
                : t("dashboardModule.branchOverview.apexSocietyFoundations", "Apex Society Foundations")}
            </h3>
            <span className="text-xs font-medium text-slate-400">&bull; {t("dashboardModule.branchOverview.lifetimeActiveRecords", "Lifetime active records")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              title={t("dashboardModule.branchOverview.totalEnrolledMembers", "Total Enrolled Members")}
              value={loading ? '...' : totalMembers.toLocaleString()}
              subtitle={isSingleBranch ? t("dashboardModule.branchOverview.branchMemberFolio", "Branch member folio") : t("dashboardModule.branchOverview.societyWideMemberBase", "Society-wide member base")}
              icon={Users}
              trend={t("dashboardModule.branchOverview.societyMembers", "Society Members")}
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.membersWithAccounts", "Members With Accounts")}
              value={loading ? '...' : membersWithAccs.toLocaleString()}
              subtitle={t("dashboardModule.branchOverview.membershipAccountPenetration", "{rate}% membership account penetration", { rate: adoptionRate })}
              icon={UserCheck}
              trend={t("dashboardModule.branchOverview.percentActive", "{rate}% Active", { rate: adoptionRate })}
              trendType={adoptionRate >= 50 ? 'up' : 'neutral'}
            />
            <StatCard
              title={t("dashboardModule.branchOverview.totalActiveBankAccounts", "Total Active Bank Accounts")}
              value={loading ? '...' : totalAccounts.toLocaleString()}
              subtitle={t("dashboardModule.branchOverview.savingsAndSchemeAccounts", "Savings & scheme accounts")}
              icon={Wallet}
              trend={t("dashboardModule.branchOverview.bankPortfolios", "Bank Portfolios")}
              trendType="neutral"
            />
          </div>
        </div>

        {/* SECTION 2: Operations in Period */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00b4a7]" />
              <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">
                {t("dashboardModule.branchOverview.periodOperationsCashFlow", "Period Operations & Cash Flow")}
              </h3>
              <span className="text-xs font-medium text-slate-400">
                &bull;{' '}
                {fromDate && toDate
                  ? `${formatDate(fromDate)} – ${formatDate(toDate)}`
                  : t("dashboardModule.branchOverview.today", "Today")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              title={t("dashboardModule.branchOverview.newMembers", "New Members")}
              value={loading ? '...' : membersRegisteredInPeriod.toLocaleString()}
              subtitle={t("dashboardModule.branchOverview.registeredInPeriod", "Registered in period")}
              icon={Users}
              trend={t("dashboardModule.branchOverview.newRegistrations", "New Registrations")}
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.accountsOpened", "Accounts Opened")}
              value={loading ? '...' : accountsOpenedInPeriod.toLocaleString()}
              subtitle={t("dashboardModule.branchOverview.openedInPeriod", "Opened in period")}
              icon={Wallet}
              trend={t("dashboardModule.branchOverview.newPassbooks", "New Passbooks")}
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.counterCashDeposits", "Counter Cash Deposits")}
              value={loading ? '...' : formatCurrency(totalDepositAmt)}
              subtitle={t("dashboardModule.branchOverview.cashInflowsCount", "{count} cash inflows", { count: totalDepositCount })}
              icon={ArrowDownLeft}
              trend={t("dashboardModule.branchOverview.inflow", "Inflow")}
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.counterCashWithdrawals", "Counter Cash Withdrawals")}
              value={loading ? '...' : formatCurrency(totalWithdrawalAmt)}
              subtitle={t("dashboardModule.branchOverview.cashOutflowsCount", "{count} cash outflows", { count: totalWithdrawalCount })}
              icon={ArrowUpRight}
              trend={t("dashboardModule.branchOverview.outflow", "Outflow")}
              trendType="down"
            />
          </div>
        </div>

        {/* SECTION 3: When All Branches Selected - Society Branches Comparison Grid */}
        {!isSingleBranch && overviewList.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#00b4a7]" />
                  <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                    {t("dashboardModule.branchOverview.societyBranchesPortfolio", "Society Branches Portfolio Performance")}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {t("dashboardModule.branchOverview.operatingHubsCount", "{count} Operating Hubs", { count: overviewList.length })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {t("dashboardModule.branchOverview.crossBranchComparisons", "Cross-branch operational comparisons for the selected period.")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                    <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colBranchHub", "Branch Hub")}</th>
                    <th className="py-3.5 px-4 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-4 text-right">{t("dashboard.totalMembers", "Total Members")}</th>
                    <th className="py-3.5 px-4 text-right">{t("dashboard.activeAccounts", "Active Accounts")}</th>
                    <th className="py-3.5 px-4 text-right">{t("dashboardModule.branchOverview.colDeposits", "Deposits")}</th>
                    <th className="py-3.5 px-4 text-right">{t("dashboardModule.branchOverview.colWithdrawals", "Withdrawals")}</th>
                    <th className="py-3.5 px-4 text-right">{t("dashboardModule.branchOverview.colNetFlow", "Net Flow")}</th>
                    <th className="py-3.5 px-5 text-center">{t("dashboardModule.branchOverview.colEnquiries", "Enquiries")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {overviewList.map((branch) => {
                    const bDep = Number(branch.cash_deposit_amount || 0);
                    const bWth = Number(branch.cash_withdrawal_amount || 0);
                    const bNet = bDep - bWth;

                    return (
                      <tr key={branch.branch_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{branch.branch_name}</div>
                          {branch.branch_code && (
                            <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              #{branch.branch_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              branch.branch_is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={branch.branch_is_active !== false ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {Number(branch.total_members || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {Number(branch.total_accounts || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          +{formatCurrency(bDep)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                          -{formatCurrency(bWth)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {formatCurrency(bNet)}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {branch.enquiries_submitted_count || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: Submitted Enquiries Desk Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                  {isSingleBranch
                    ? t("dashboardModule.branchOverview.branchEnquiriesTitle", "{{branch}} Enquiries", { branch: singleBranch?.branch_name || t("dashboard.branch", "Branch") })
                    : t("dashboardModule.branchOverview.societyEnquiriesFeed", "Society Enquiries Feed")}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {t("dashboardModule.branchOverview.totalEnquiriesBadge", "{count} Total", { count: totalEnquiriesCount })}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {t("dashboardModule.branchOverview.enquiriesFeedDesc", "Helpdesk tickets and member inquiries submitted during this operational window.")}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("dashboardModule.branchOverview.searchEnquiriesPlaceholder", "Search ticket, member...")}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colTicketId", "Ticket ID")}</th>
                  {!isSingleBranch && <th className="py-3.5 px-5">{t("dashboard.branch", "Branch")}</th>}
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colMember", "Member")}</th>
                  <th className="py-3.5 px-5">{t("contact.subject", "Subject")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colMessagePreview", "Message Preview")}</th>
                  <th className="py-3.5 px-5 text-center">{t("common.status", "Status")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colSubmittedAt", "Submitted At")}</th>
                  <th className="py-3.5 px-5 text-center">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={isSingleBranch ? 7 : 8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7]" />
                        <span>{t("dashboardModule.branchOverview.loadingEnquiries", "Loading submitted enquiries...")}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={isSingleBranch ? 7 : 8} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">{t("dashboardModule.branchOverview.noEnquiriesFound", "No enquiries found")}</p>
                        <p className="text-[11px] text-slate-400">
                          {searchQuery
                            ? t("dashboardModule.branchOverview.noEnquiriesMatch", "No enquiries match your search query.")
                            : t("dashboardModule.branchOverview.noEnquiriesPeriod", "No customer service enquiries submitted for this period.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => {
  const { t } = useTranslation();
                    const statusStr = String(enq.status || 'pending').toLowerCase();
                    const isSolved = statusStr === 'solved' || statusStr === 'resolved' || statusStr === 'closed';
                    const isInProgress = statusStr === 'in_progress';

                    return (
                      <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {t("branchManagerOverview.enq", "#ENQ-")}{enq.id}
                        </td>
                        {!isSingleBranch && (
                          <td className="py-3.5 px-5 whitespace-nowrap font-semibold text-slate-800">
                            {enq.branch_name || t("dashboard.branch", "Branch")}
                          </td>
                        )}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{enq.member_name || t("dashboardModule.branchOverview.colMember", "Member")}</div>
                          {enq.member_code && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{enq.member_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800 max-w-xs truncate" title={enq.subject}>
                          {enq.subject || t("dashboardModule.branchOverview.assistanceRequest", "Assistance Request")}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 max-w-sm truncate" title={enq.message}>
                          {enq.message || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          {isSolved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{t("dashboardModule.branchOverview.statusSolved", "Solved")}</span>
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>{t("dashboardModule.branchOverview.statusInProgress", "In Progress")}</span>
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              {t("common.pending", "Pending")}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                          {formatDateTime(enq.submitted_at)}
                        </td>
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedEnquiry(enq)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-teal-200 mx-auto"
                            title={t("dashboardModule.branchOverview.readEnquiryTitle", "Read enquiry message")}
                          >
                            <Eye className="w-3 h-3 text-teal-600" />
                            <span>{t("dashboardModule.branchOverview.read", "Read")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'members' && (
          <SuperAdminMembers embedded={true} branchId={selectedBranchId} />
        )}

        {/* TAB 3: CASH TRANSACTIONS */}
        {activeTab === 'cash_transactions' && (
          <SuperAdminCashTransactions embedded={true} branchId={selectedBranchId} fromDate={fromDate} toDate={toDate} />
        )}

        {/* TAB 4: CASH RECONCILIATION */}
        {activeTab === 'cash_reconciliation' && (
          <SuperAdminCashReconciliation embedded={true} branchId={selectedBranchId} fromDate={fromDate} toDate={toDate} />
        )}

        {/* TAB 5: STAFF */}
        {activeTab === 'staff' && (
          <SuperAdminStaff embedded={true} branchId={selectedBranchId} />
        )}

        {/* TAB 6: SECURITY EVENTS */}
        {activeTab === 'security_events' && (
          <SuperAdminSecurityEvents embedded={true} branchId={selectedBranchId} />
        )}
      </div>

      {/* Enquiry Message Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00b4a7] flex items-center justify-center border border-teal-100">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-base">
                    {t("dashboardModule.branchOverview.enquiryLabel", "Enquiry")} {t("branchManagerOverview.enq", "#ENQ-")}{selectedEnquiry.id}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedEnquiry.branch_name ? <>{selectedEnquiry.branch_name} &bull; </> : ''}{t("dashboardModule.branchOverview.fromSender", "From")} {selectedEnquiry.member_name} ({selectedEnquiry.member_code ? `#${selectedEnquiry.member_code}` : `${t("dashboardModule.branchOverview.colMember", "Member")} #${selectedEnquiry.member_id}`})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t("contact.subject", "Subject")}
                </span>
                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedEnquiry.subject}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t("dashboardModule.branchOverview.inquiryMessage", "Inquiry Message")}
                </span>
                <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                  {selectedEnquiry.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t("common.status", "Status")}</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">{selectedEnquiry.status}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t("dashboardModule.branchOverview.submittedOn", "Submitted On")}</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{formatDateTime(selectedEnquiry.submitted_at)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
