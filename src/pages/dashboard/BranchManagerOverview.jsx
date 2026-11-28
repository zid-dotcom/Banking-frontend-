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
  FileText,
  Coins,
  Scale,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import bankTechScene from '../../assets/AurumFX Cooperative Bank Technology Scene.png';
import { getBranchAdminOverview } from '../../services/branchOverviewService';
import { getBranchAdminMe } from '../../services/branchAdminService';

// Embedded Tab Components
import BranchManagerMembers from './BranchManagerMembers';
import BranchManagerCashTransactions from './BranchManagerCashTransactions';
import BranchManagerCashReconciliation from './BranchManagerCashReconciliation';
import BranchManagerStaff from './BranchManagerStaff';
import BranchManagerSecurityEvents from './BranchManagerSecurityEvents';
import BranchManagerMemberPasswordUpdate from './BranchManagerMemberPasswordUpdate';

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

export default function BranchManagerOverview() {
  const { t } = useTranslation();
  const [managerUser, setManagerUser] = useState(() => {
    try {
      const cached = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      role: 'Branch Manager',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01',
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
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filtering (defaults to today on backend when empty)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination for enquiries
  const [enquiriesSkip, setEnquiriesSkip] = useState(0);
  const enquiriesLimit = 10;

  // Search filter inside loaded enquiries
  const [enquirySearch, setEnquirySearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Sync profile
  useEffect(() => {
    getBranchAdminMe()
      .then((profile) => {
        if (profile) {
          const updated = {
            ...profile,
            name: profile.full_name || profile.name || 'Branch Manager',
            full_name: profile.full_name || profile.name || 'Branch Manager',
            role: 'Branch Manager',
            branch_name:
              profile.branch?.branch_name ||
              profile.branch?.name ||
              profile.branch_name ||
              'Society Branch',
            branch_code: profile.branch?.branch_code || profile.branch_code || 'BRA-01',
          };
          setManagerUser(updated);
          localStorage.setItem('branch_user', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch overview data
  const fetchOverview = async (skipOverride = null) => {
    setLoading(true);
    setError(null);
    try {
      const skipToUse = skipOverride !== null ? skipOverride : enquiriesSkip;

      let from = fromDate || null;
      let to = toDate || null;
      if (from && !to) to = from;
      if (!from && to) from = to;

      const data = await getBranchAdminOverview({
        from_date: from,
        to_date: to,
        enquiries_skip: skipToUse,
        enquiries_limit: enquiriesLimit,
      });

      setOverview(data);
    } catch (err) {
      console.error('Failed to load branch overview:', err);
      setError(err.message || 'Unable to retrieve branch overview data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEnquiriesSkip(0);
    fetchOverview(0);
  }, [fromDate, toDate]);

  // Handle Enquiry Pagination
  const handlePageChange = (newSkip) => {
    if (newSkip < 0) return;
    setEnquiriesSkip(newSkip);
    fetchOverview(newSkip);
  };

  // Calculations
  const depositAmt = Number(overview?.cash_deposit_amount || 0);
  const withdrawalAmt = Number(overview?.cash_withdrawal_amount || 0);
  const netMovement = depositAmt - withdrawalAmt;

  const totalMembers = Number(overview?.total_members || 0);
  const membersWithAccs = Number(overview?.members_with_accounts || 0);
  const adoptionRate = totalMembers > 0 ? Math.round((membersWithAccs / totalMembers) * 100) : 0;

  // Filter inquiries in current page
  const displayedEnquiries = (overview?.enquiries || []).filter((item) => {
    if (!enquirySearch.trim()) return true;
    const q = enquirySearch.toLowerCase();
    return (
      String(item.id || '').toLowerCase().includes(q) ||
      String(item.member_name || '').toLowerCase().includes(q) ||
      String(item.member_code || '').toLowerCase().includes(q) ||
      String(item.subject || '').toLowerCase().includes(q) ||
      String(item.message || '').toLowerCase().includes(q) ||
      String(item.status || '').toLowerCase().includes(q)
    );
  });

  const totalEnquiries = overview?.enquiries_submitted_count || 0;
  const currentEnquiriesPage = Math.floor(enquiriesSkip / enquiriesLimit) + 1;
  const totalEnquiriesPages = Math.max(1, Math.ceil(totalEnquiries / enquiriesLimit));

  return (
    <DashboardLayout role="branch_manager" user={managerUser} activeTab="branch_overview">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Date Filter Toolbar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Branch Title & Code */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00b4a7] flex items-center justify-center border border-teal-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {overview?.branch_name || managerUser.branch_name || 'Kozhikode North Agro Hub'}
              </h3>
              <span className="text-[11px] text-teal-700 font-mono font-bold">
                #{overview?.branch_code || managerUser.branch_code || '203391'} {t("branchManagerOverview.branchOverview", "• Branch Overview")}
              </span>
            </div>
          </div>

          {/* Right: Date Filtering Only & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.accountTransactions.from", "From")}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.accountTransactions.to", "To")}</span>
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
                {t("dashboardModule.emergency.clear", "Clear")}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchOverview()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              title={t("branchManagerOverview.refreshBranchOverview", "Refresh Branch Overview")}
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
              { id: 'member_password_update', label: t("sidebar.memberPasswordUpdate", "Member Password Update"), icon: KeyRound },
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
            {/* Error notification */}
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
                  {t("common.retry", "Retry")}
                </button>
              </div>
            )}

        {/* SECTION 1: Current Branch Totals */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#00b4a7]" />
            <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">
              {t("branchManagerOverview.branchFoundationEnrolledFolio", "Branch Foundation & Enrolled Folio")}
            </h3>
            <span className="text-xs font-medium text-slate-400">{t("branchManagerOverview.lifetimeActiveRecords", "• Lifetime active records")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              title={t("branchManagerMemberPasswordUpdate.totalBranchMembers", "Total Branch Members")}
              value={overview ? totalMembers.toLocaleString() : '—'}
              subtitle={t("branchManagerOverview.societyRegisteredMembers", "Society registered members")}
              icon={Users}
              trend="Registered"
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.membersWithAccounts", "Members With Accounts")}
              value={overview ? membersWithAccs.toLocaleString() : '—'}
              subtitle={`${adoptionRate}% of branch membership`}
              icon={UserCheck}
              trend={`${adoptionRate}% Active`}
              trendType={adoptionRate >= 50 ? 'up' : 'neutral'}
            />
            <StatCard
              title={t("branchManagerOverview.totalDepositSavingsAccounts", "Total Deposit & Savings Accounts")}
              value={overview ? Number(overview.total_accounts || 0).toLocaleString() : '—'}
              subtitle={t("branchManagerOverview.activePassbooksPortfolios", "Active passbooks & portfolios")}
              icon={Wallet}
              trend="Bank Accounts"
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
                {t("branchManagerOverview.periodActivityCounterMovement", "Period Activity & Counter Movement")}
              </h3>
              <span className="text-xs font-medium text-slate-400">
                &bull;{' '}
                {overview?.from_date && overview?.to_date
                  ? `${formatDate(overview.from_date)} – ${formatDate(overview.to_date)}`
                  : t("dashboardModule.branchOverview.today", "Today")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              title={t("dashboardModule.branchOverview.newMembers", "New Members")}
              value={overview ? (overview.members_registered_in_period || 0).toLocaleString() : '—'}
              subtitle={t("dashboardModule.branchOverview.registeredInPeriod", "Registered in period")}
              icon={Users}
              trend="New Members"
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.accountsOpened", "Accounts Opened")}
              value={overview ? (overview.accounts_opened_in_period || 0).toLocaleString() : '—'}
              subtitle={t("branchManagerOverview.newPassbooksOpened", "New passbooks opened")}
              icon={Wallet}
              trend="New Accounts"
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.counterCashDeposits", "Counter Cash Deposits")}
              value={overview ? formatCurrency(depositAmt) : '—'}
              subtitle={`${overview?.cash_deposit_count || 0} deposit entries`}
              icon={ArrowDownLeft}
              trend="Cash Inflow"
              trendType="up"
            />
            <StatCard
              title={t("dashboardModule.branchOverview.counterCashWithdrawals", "Counter Cash Withdrawals")}
              value={overview ? formatCurrency(withdrawalAmt) : '—'}
              subtitle={`${overview?.cash_withdrawal_count || 0} withdrawal entries`}
              icon={ArrowUpRight}
              trend="Cash Outflow"
              trendType="down"
            />
          </div>
        </div>

        {/* SECTION 3: Enquiries Desk Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                  {t("branchManagerOverview.submittedMemberEnquiries", "Submitted Member Enquiries")}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {totalEnquiries} {t("branchManagerOverview.total", "Total")}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {t("branchManagerOverview.helpdeskTicketsAndMemberAssistance", "Helpdesk tickets and member assistance requests submitted during this operational window.")}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                placeholder={t("branchManagerOverview.searchMemberTicket", "Search member, ticket...")}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colTicketId", "Ticket ID")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.accountTransactions.roleMember", "Member")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.emergency.table.subject", "Subject")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colMessagePreview", "Message Preview")}</th>
                  <th className="py-3.5 px-5 text-center">{t("common.status", "Status")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colSubmittedAt", "Submitted At")}</th>
                  <th className="py-3.5 px-5 text-center">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7]" />
                        <span>{t("dashboardModule.branchOverview.loadingEnquiries", "Loading submitted enquiries...")}</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">{t("dashboardModule.branchOverview.noEnquiriesFound", "No enquiries found")}</p>
                        <p className="text-[11px] text-slate-400">
                          {enquirySearch
                            ? t("branchManagerOverview.noEnquiriesMatchYourCurrent", "No enquiries match your current search.")
                            : t("branchManagerOverview.noCustomerAssistanceEnquiriesSubmitted", "No customer assistance enquiries submitted in this period.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedEnquiries.map((enq) => {
  const { t } = useTranslation();
                    const statusStr = String(enq.status || 'pending').toLowerCase();
                    const isSolved = statusStr === 'solved' || statusStr === 'resolved' || statusStr === 'closed';
                    const isInProgress = statusStr === 'in_progress';

                    return (
                      <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {t("branchManagerOverview.enq", "#ENQ-")}{enq.id}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{enq.member_name || 'Member'}</div>
                          {enq.member_code && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{enq.member_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800 max-w-xs truncate" title={enq.subject}>
                          {enq.subject || 'Assistance Request'}
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

          {/* Pagination Toolbar */}
          {totalEnquiries > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                {t("common.showing", "Showing")}{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(enquiriesSkip + 1, totalEnquiries)}
                </span>{' '}
                {t("common.to", "to")}{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(enquiriesSkip + enquiriesLimit, totalEnquiries)}
                </span>{' '}
                {t("common.of", "of")} <span className="font-bold text-slate-900">{totalEnquiries}</span> {t("branchManagerOverview.enquiries", "enquiries")}
              </span>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handlePageChange(enquiriesSkip - enquiriesLimit)}
                  disabled={enquiriesSkip === 0 || loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t("branchManagerFdMisSchemes.previous", "Previous")}</span>
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {currentEnquiriesPage} / {totalEnquiriesPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(enquiriesSkip + enquiriesLimit)}
                  disabled={enquiriesSkip + enquiriesLimit >= totalEnquiries || loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <span>{t("branchManagerFdMisSchemes.next", "Next")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'members' && (
          <BranchManagerMembers embedded={true} />
        )}

        {/* TAB 3: CASH TRANSACTIONS */}
        {activeTab === 'cash_transactions' && (
          <BranchManagerCashTransactions embedded={true} fromDate={fromDate} toDate={toDate} />
        )}

        {/* TAB 4: CASH RECONCILIATION */}
        {activeTab === 'cash_reconciliation' && (
          <BranchManagerCashReconciliation embedded={true} fromDate={fromDate} toDate={toDate} />
        )}

        {/* TAB 5: STAFF */}
        {activeTab === 'staff' && (
          <BranchManagerStaff embedded={true} />
        )}

        {/* TAB 6: SECURITY EVENTS */}
        {activeTab === 'security_events' && (
          <BranchManagerSecurityEvents embedded={true} />
        )}

        {/* TAB 7: MEMBER PASSWORD UPDATE */}
        {activeTab === 'member_password_update' && (
          <BranchManagerMemberPasswordUpdate embedded={true} />
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
                    {t("branchManagerOverview.enquiryEnq", "Enquiry #ENQ-")}{selectedEnquiry.id}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {t("dashboardModule.accountTransactions.from", "From")} {selectedEnquiry.member_name} ({selectedEnquiry.member_code ? `#${selectedEnquiry.member_code}` : `Member #${selectedEnquiry.member_id}`})
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
                  {t("dashboardModule.emergency.table.subject", "Subject")}
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
