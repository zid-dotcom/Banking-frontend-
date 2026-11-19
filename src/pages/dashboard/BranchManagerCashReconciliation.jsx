import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import {
  Scale,
  Coins,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  HelpCircle,
  ChevronRight,
  Send,
  Loader2,
  MessageSquare,
  Landmark,
  Wallet,
  Calculator
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import bankTechScene from '../../assets/AurumFX Cooperative Bank Technology Scene.png';
import {
  getBranchDailyCashReport,
  getBranchRangeCashReport,
  getBranchAdminCashReconciliation,
  decideBranchAdminCashReconciliation
} from '../../services/cashReconciliationService';
import { getBranchAdminMe } from '../../services/branchAdminService';
import { getMemberBranches } from '../../services/memberService';

function formatCurrency(val) {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
      hour12: true
    });
  } catch {
    return isoString;
  }
}

export default function BranchManagerCashReconciliation() {
  const navigate = useNavigate();

  const [managerUser, setManagerUser] = useState(() => {
    try {
      const cached = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      role: 'Branch Manager',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01'
    };
  });

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const [reports, setReports] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'resolved' | 'escalated' | 'mismatch'
  const [search, setSearch] = useState('');

  // Details Modal (GET /branch-admin/cash-reconciliations/{report_id})
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Decision Modal (PATCH /branch-admin/cash-reconciliations/{report_id}/decision)
  const [decisionModalReport, setDecisionModalReport] = useState(null);
  const [decisionType, setDecisionType] = useState('resolved'); // 'resolved' | 'escalated'
  const [decisionExplanation, setDecisionExplanation] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState(null);
  const [decisionSuccess, setDecisionSuccess] = useState(null);

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
            branch_name: profile.branch?.branch_name || profile.branch?.name || profile.branch_name || 'Society Branch',
            branch_code: profile.branch?.branch_code || profile.branch_code || 'BRA-01'
          };
          setManagerUser(updated);
          localStorage.setItem('branch_user', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch reports based on date filter (defaults to today when both fromDate and toDate are clear)
  const fetchReconciliations = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setError('"From" date cannot be after "To" date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (fromDate && toDate) {
        // Range report API
        const rangeData = await getBranchRangeCashReport({
          from_date: fromDate,
          to_date: toDate,
          limit: 100
        });

        // Flatten cashier_reports across days
        const allReports = [];
        let aggOpening = 0;
        let aggDeposits = 0;
        let aggWithdrawals = 0;
        let aggExpected = 0;
        let aggCounted = 0;
        let aggDiff = 0;
        let aggPendingAdmin = 0;

        rangeData.forEach((day) => {
          aggOpening += Number(day.total_opening_cash || 0);
          aggDeposits += Number(day.total_deposits || 0);
          aggWithdrawals += Number(day.total_withdrawals || 0);
          aggExpected += Number(day.total_expected_closing_cash || 0);
          aggCounted += Number(day.total_counted_closing_cash || 0);
          aggDiff += Number(day.total_difference || 0);
          aggPendingAdmin += Number(day.pending_branch_admin_review_count || 0);

          if (Array.isArray(day.cashier_reports)) {
            day.cashier_reports.forEach((cr) => {
              allReports.push({ ...cr, branch_name: day.branch_name, business_date: day.business_date || cr.business_date });
            });
          }
        });

        setReports(allReports);
        setDailySummary({
          total_opening_cash: aggOpening,
          total_deposits: aggDeposits,
          total_withdrawals: aggWithdrawals,
          total_expected_closing_cash: aggExpected,
          total_counted_closing_cash: aggCounted,
          total_difference: aggDiff,
          pending_branch_admin_review_count: aggPendingAdmin,
          isRange: true
        });
      } else if (fromDate || toDate) {
        // Single specific date report (e.g. yesterday selected as From Date)
        const targetDate = fromDate || toDate;
        const dailyData = await getBranchDailyCashReport(targetDate);

        if (dailyData) {
          setDailySummary(dailyData);
          setReports(Array.isArray(dailyData.cashier_reports) ? dailyData.cashier_reports : []);
        } else {
          setDailySummary(null);
          setReports([]);
        }
      } else {
        // Default today's report
        const todayStr = getTodayISO();
        const dailyData = await getBranchDailyCashReport(todayStr);

        if (dailyData) {
          setDailySummary(dailyData);
          setReports(Array.isArray(dailyData.cashier_reports) ? dailyData.cashier_reports : []);
        } else {
          setDailySummary(null);
          setReports([]);
        }
      }
    } catch (err) {
      console.warn('Could not load branch cash reconciliations:', err);
      setError(err.message || 'Unable to load branch cash reconciliations.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [fromDate, toDate]);

  // Open Details Modal
  const handleOpenDetails = async (reportId) => {
    setSelectedReportId(reportId);
    setLoadingDetails(true);
    setDetailsError(null);
    setReportDetails(null);
    try {
      const data = await getBranchAdminCashReconciliation(reportId);
      setReportDetails(data);
    } catch (err) {
      console.error('Failed to load report details:', err);
      setDetailsError(err.message || 'Unable to load report details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Decision Modal
  const handleOpenDecision = (report) => {
    setDecisionModalReport(report);
    setDecisionType(report.branch_admin_decision === 'escalated' ? 'escalated' : 'resolved');
    setDecisionExplanation(report.branch_admin_explanation || '');
    setDecisionError(null);
    setDecisionSuccess(null);
  };

  // Submit Decision
  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionModalReport) return;

    const cleanExplanation = decisionExplanation.trim();
    if (!cleanExplanation) {
      setDecisionError('Please provide a decision explanation justifying your resolution or escalation.');
      return;
    }

    setSubmittingDecision(true);
    setDecisionError(null);
    try {
      const updated = await decideBranchAdminCashReconciliation(decisionModalReport.id, {
        decision: decisionType,
        explanation: cleanExplanation
      });

      setDecisionSuccess(
        decisionType === 'resolved'
          ? 'Reconciliation marked as Resolved successfully!'
          : 'Reconciliation Escalated to Apex Superadmin Authority!'
      );

      // Update in local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === decisionModalReport.id
            ? { ...r, ...updated, branch_admin_decision: decisionType, branch_admin_explanation: cleanExplanation }
            : r
        )
      );

      if (reportDetails && reportDetails.id === decisionModalReport.id) {
        setReportDetails((prev) => ({
          ...prev,
          ...updated,
          branch_admin_decision: decisionType,
          branch_admin_explanation: cleanExplanation
        }));
      }

      setTimeout(() => {
        setDecisionModalReport(null);
        setDecisionSuccess(null);
        fetchReconciliations();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit decision:', err);
      setDecisionError(err.message || 'Failed to submit decision. Please try again.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Helpers
  const isReportPendingAdmin = (r) => {
    return !r.branch_admin_decision || r.branch_admin_decision === 'pending';
  };

  const isReportMismatch = (r) => {
    const diff = r.difference;
    if (diff !== null && diff !== undefined && Number(diff) !== 0) return true;
    if (
      r.closing_cash !== null &&
      r.expected_closing_cash !== null &&
      Number(r.closing_cash) !== Number(r.expected_closing_cash)
    ) {
      return true;
    }
    return false;
  };

  // Filtered reports
  const isDateFiltered = Boolean(fromDate || toDate);
  const effectiveFrom = isDateFiltered ? (fromDate || toDate) : getTodayISO();
  const effectiveTo = isDateFiltered ? (toDate || fromDate) : getTodayISO();

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'pending' && !isReportPendingAdmin(r)) return false;
    if (statusFilter === 'resolved' && r.branch_admin_decision !== 'resolved') return false;
    if (statusFilter === 'escalated' && r.branch_admin_decision !== 'escalated') return false;
    if (statusFilter === 'mismatch' && !isReportMismatch(r)) return false;

    // Date range filtering
    const rDate = r.business_date || String(r.opened_at || '').slice(0, 10);
    if (rDate) {
      if (effectiveFrom && rDate < effectiveFrom) return false;
      if (effectiveTo && rDate > effectiveTo) return false;
    }

    if (search) {
      const s = search.toLowerCase();
      const idStr = String(r.id || '').toLowerCase();
      const cashier = String(r.cashier_name || r.cashier_code || '').toLowerCase();
      const dateStr = String(r.business_date || '').toLowerCase();
      const expl = String(r.branch_admin_explanation || r.accountant_explanation || '').toLowerCase();
      if (!idStr.includes(s) && !cashier.includes(s) && !dateStr.includes(s) && !expl.includes(s)) {
        return false;
      }
    }
    return true;
  });

  // Aggregated Stat Metrics
  const pendingCount = reports.filter(isReportPendingAdmin).length;
  const mismatchCount = reports.filter(isReportMismatch).length;
  const totalOpening = filteredReports.reduce((acc, r) => acc + Number(r.opening_cash || 0), 0);
  const totalDeposits = filteredReports.reduce((acc, r) => acc + Number(r.deposit_total || 0), 0);
  const totalWithdrawals = filteredReports.reduce((acc, r) => acc + Number(r.withdrawal_total || 0), 0);
  const totalExpected = filteredReports.reduce((acc, r) => acc + Number(r.expected_closing_cash || 0), 0);
  const totalCounted = filteredReports.reduce(
    (acc, r) => acc + (r.closing_cash !== null && r.closing_cash !== undefined ? Number(r.closing_cash) : 0),
    0
  );
  const totalDifference = filteredReports.reduce((acc, r) => acc + Number(r.difference || 0), 0);

  return (
    <DashboardLayout role="branch_manager" user={managerUser} activeTab="cash_reconciliation">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <Scale className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: Branch Manager</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Branch: <span className="font-bold text-slate-900">{managerUser.branch_name || 'Society Branch'}</span></span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Audit Authority</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Branch Cash Reconciliation</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Inspect counter drawer balancing reports, review cash variances, and record official branch decisions (Resolve or Escalate to Super Admin).
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={bankTechScene}
              alt="Cash Reconciliation Audit"
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none mx-auto md:mx-0"
            />
          </div>

          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl pointer-events-none" />
        </div>

        {/* Tab Navigation: Toggle between Cash Transactions and Cash Reconciliation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Link
            to="/branch-manager/cash-transactions"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Coins className="w-4 h-4 text-slate-400" />
            <span>Cash Transactions Ledger</span>
          </Link>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00b4a7] text-white shadow-sm flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            <span>Cash Reconciliation Audit Desk</span>
          </button>
        </div>

        {/* 7 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          <StatCard
            title="Pending Decisions"
            value={pendingCount.toString()}
            subtitle="Awaiting manager review"
            icon={AlertCircle}
            trend={pendingCount > 0 ? 'Requires Action' : 'All Clear'}
            trendType={pendingCount > 0 ? 'down' : 'up'}
          />
          <StatCard
            title="Total Opening Cash"
            value={formatCurrency(totalOpening)}
            subtitle={isDateFiltered ? 'Filtered opening float' : "Today's opening float"}
            icon={Wallet}
            trend="Opening Float"
            trendType="neutral"
          />
          <StatCard
            title="Counter Cash Deposits"
            value={formatCurrency(totalDeposits)}
            subtitle={isDateFiltered ? 'Filtered deposits' : "Today's deposits"}
            icon={ArrowDownLeft}
            trend="Cash Inflows"
            trendType="up"
          />
          <StatCard
            title="Counter Cash Withdrawals"
            value={formatCurrency(totalWithdrawals)}
            subtitle={isDateFiltered ? 'Filtered withdrawals' : "Today's withdrawals"}
            icon={ArrowUpRight}
            trend="Cash Outflows"
            trendType="down"
          />
          <StatCard
            title="Expected Closing Cash"
            value={formatCurrency(totalExpected)}
            subtitle="System expected float"
            icon={Calculator}
            trend="Expected"
            trendType="neutral"
          />
          <StatCard
            title="Counted Closing Cash"
            value={formatCurrency(totalCounted)}
            subtitle="Physical verified cash"
            icon={Coins}
            trend="Counted Cash"
            trendType="neutral"
          />
          <StatCard
            title="Net Variance"
            value={formatCurrency(totalDifference)}
            subtitle={totalDifference === 0 ? 'Zero Variance' : 'Cash Mismatch'}
            icon={Scale}
            trend={totalDifference === 0 ? 'Balanced' : 'Review Needed'}
            trendType={totalDifference === 0 ? 'up' : 'down'}
          />
        </div>

        {/* Main Reconciliation Ledger Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Controls */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                  Branch Cash Reconciliations Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verified cashier daily balancing, accountant audit notes, and manager decision governance.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={fetchReconciliations}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
                title="Refresh Branch Reconciliations"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200 shadow-2xs flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({reports.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-amber-50 text-amber-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pending Decision ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('mismatch')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'mismatch' ? 'bg-rose-50 text-rose-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cash Mismatch ({mismatchCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resolved ({reports.filter((r) => r.branch_admin_decision === 'resolved').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('escalated')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'escalated' ? 'bg-indigo-50 text-indigo-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Escalated ({reports.filter((r) => r.branch_admin_decision === 'escalated').length})
              </button>
            </div>

            {/* Date Range & Search */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    From
                  </span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title="Filter from business date"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    To
                  </span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title="Filter to business date"
                  />
                </div>

                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs border border-slate-200"
                    title="Clear Date Filter"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">Clear</span>
                  </button>
                )}
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cashier, notes..."
                  className="w-full sm:w-44 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="m-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={fetchReconciliations} className="font-bold underline text-amber-900 cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3.5 px-4">Report</th>
                  <th className="py-3.5 px-4">Business Date</th>
                  <th className="py-3.5 px-4">Cashier</th>
                  <th className="py-3.5 px-4 text-right">Opening Float</th>
                  <th className="py-3.5 px-4 text-right">Deposits</th>
                  <th className="py-3.5 px-4 text-right">Withdrawals</th>
                  <th className="py-3.5 px-4 text-right">Expected Cash</th>
                  <th className="py-3.5 px-4 text-right">Counted Cash</th>
                  <th className="py-3.5 px-4 text-right">Difference</th>
                  <th className="py-3.5 px-4 text-center">Accountant Audit</th>
                  <th className="py-3.5 px-4 text-center">Branch Decision</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7]" />
                        <span>Loading branch cash reconciliations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Scale className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">No cash reconciliations found</p>
                        <p className="text-[11px] text-slate-400">
                          {fromDate || toDate
                            ? `No reports found between ${fromDate || 'start'} and ${toDate || 'today'}.`
                            : 'No cashier day reports submitted for today yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const diffNum = Number(report.difference || 0);
                    const hasMismatch = isReportMismatch(report);
                    const decision = report.branch_admin_decision;

                    return (
                      <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                          #REC-{report.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {formatDate(report.business_date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 capitalize">{report.cashier_name || 'Cashier'}</div>
                          {report.cashier_code && (
                            <span className="text-[10px] text-slate-400 font-mono">#{report.cashier_code}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                          {formatCurrency(report.opening_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          +{formatCurrency(report.deposit_total)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                          -{formatCurrency(report.withdrawal_total)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {formatCurrency(report.expected_closing_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          {report.closing_cash !== null ? formatCurrency(report.closing_cash) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black">
                          {report.difference === null || report.difference === undefined ? (
                            <span className="text-slate-400">—</span>
                          ) : diffNum === 0 ? (
                            <span className="text-emerald-700">₹0.00</span>
                          ) : diffNum > 0 ? (
                            <span className="text-emerald-600">+{formatCurrency(diffNum)} (Surplus)</span>
                          ) : (
                            <span className="text-rose-600">{formatCurrency(diffNum)} (Shortage)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {report.accountant_explanation ? (
                            <div className="max-w-[140px] mx-auto text-left">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Audited</span>
                              </span>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5" title={report.accountant_explanation}>
                                {report.accountant_explanation}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              Pending Audit
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {decision === 'resolved' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Resolved</span>
                            </span>
                          ) : decision === 'escalated' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Escalated</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Decision Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(report.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-teal-200"
                              title="Inspect receipts and decision history"
                            >
                              <Receipt className="w-3 h-3 text-teal-600" />
                              <span>Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDecision(report)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Record manager resolution or escalation"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Decide</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REPORT DETAILS MODAL (Transactions & Complete Decision History)
         ========================================================================= */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center border border-teal-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
                    Reconciliation Audit: #REC-{selectedReportId}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Verified counter cash vouchers, receipts, and member balance before/after logs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetails ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7]" />
                  <span>Loading full reconciliation audit trail...</span>
                </div>
              ) : detailsError ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{detailsError}</span>
                </div>
              ) : reportDetails ? (
                <>
                  {/* Top Stats Overview in Modal - 7 Cards with Separated Deposits and Withdrawals */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Business Date</span>
                      <span className="text-xs font-black text-slate-900 mt-1 block">
                        {formatDate(reportDetails.business_date)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cashier</span>
                      <span className="text-xs font-black text-slate-900 mt-1 block capitalize truncate">
                        {reportDetails.cashier_name || 'Cashier'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Opening Float</span>
                      <span className="text-xs font-black text-slate-900 mt-1 block font-mono">
                        {formatCurrency(reportDetails.opening_cash)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Deposits</span>
                      <span className="text-xs font-black text-emerald-700 mt-1 block font-mono">
                        +{formatCurrency(reportDetails.deposit_total)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">Withdrawals</span>
                      <span className="text-xs font-black text-rose-700 mt-1 block font-mono">
                        -{formatCurrency(reportDetails.withdrawal_total)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 text-center">
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">Expected Closing</span>
                      <span className="text-xs font-black text-teal-900 mt-1 block font-mono">
                        {formatCurrency(reportDetails.expected_closing_cash)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Physical Count</span>
                      <span className="text-xs font-black text-slate-900 mt-1 block font-mono">
                        {reportDetails.closing_cash !== null ? formatCurrency(reportDetails.closing_cash) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#00b4a7]" />
                        <span>Counter Transactions &amp; Receipts ({reportDetails.transactions?.length || 0})</span>
                      </span>
                    </h4>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto min-w-full">
                      <table className="w-full text-left border-collapse min-w-[760px] text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3">Receipt Number</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-right">Balance Before</th>
                            <th className="py-2.5 px-3 text-right">Balance After</th>
                            <th className="py-2.5 px-3">Date &amp; Time</th>
                            <th className="py-2.5 px-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {!reportDetails.transactions || reportDetails.transactions.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="py-8 text-center text-slate-400">
                                No transactions processed during this cash drawer shift.
                              </td>
                            </tr>
                          ) : (
                            reportDetails.transactions.map((tx, idx) => {
                              const isDep = String(tx.type || tx.transaction_type || '').toLowerCase().includes('deposit');
                              return (
                                <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                    {tx.receipt_number || `#TX-${tx.id}`}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isDep ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {isDep ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                      <span>{isDep ? 'Deposit' : 'Withdrawal'}</span>
                                    </span>
                                  </td>
                                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${isDep ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {isDep ? '+' : '-'}{formatCurrency(tx.amount)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                    {formatCurrency(tx.balance_before)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatCurrency(tx.balance_after)}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                    {formatDateTime(tx.timestamp || tx.created_at)}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate" title={tx.notes}>
                                    {tx.notes || '—'}
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
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                Close Audit Details
              </button>

              {reportDetails && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenDecision(reportDetails);
                    setSelectedReportId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Submit Manager Decision</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH MANAGER DECISION MODAL (Resolved or Escalated)
         ========================================================================= */}
      {decisionModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center border border-teal-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-lg">
                    Manager Decision: #REC-{decisionModalReport.id}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cashier: <strong className="text-slate-800 capitalize">{decisionModalReport.cashier_name}</strong> | Date:{' '}
                    <strong>{formatDate(decisionModalReport.business_date)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="p-5 sm:p-6 space-y-4">
              {decisionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{decisionSuccess}</span>
                </div>
              )}

              {decisionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{decisionError}</span>
                </div>
              )}

              {/* Drawer Variance Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Expected Closing</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(decisionModalReport.expected_closing_cash)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Counted Physical Cash</span>
                  <span className="font-mono font-bold text-slate-900">
                    {decisionModalReport.closing_cash !== null ? formatCurrency(decisionModalReport.closing_cash) : '—'}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Drawer Difference / Variance:</span>
                  <span
                    className={`font-mono font-black ${
                      Number(decisionModalReport.difference || 0) === 0
                        ? 'text-emerald-700'
                        : Number(decisionModalReport.difference || 0) > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(decisionModalReport.difference)}
                  </span>
                </div>
              </div>

              {/* Decision Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Administrative Decision: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionType('resolved')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      decisionType === 'resolved'
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                      {decisionType === 'resolved' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Confirm shift balancing or approve justified counter difference at branch level.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType('escalated')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      decisionType === 'escalated'
                        ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Escalate</span>
                      </span>
                      {decisionType === 'escalated' && <Check className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Escalate unexplained shortage or material cash variance to Apex Super Admin.
                    </p>
                  </button>
                </div>
              </div>

              {/* Decision Explanation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Decision Explanation &amp; Remarks: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="4"
                  value={decisionExplanation}
                  onChange={(e) => setDecisionExplanation(e.target.value)}
                  placeholder="Record formal explanation for resolving or escalating this cashier day..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 transition-all font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">
                  {decisionExplanation.length}/1000 characters
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecisionModalReport(null)}
                  disabled={submittingDecision}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision || !decisionExplanation.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                    decisionType === 'resolved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submittingDecision ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Decision...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{decisionType === 'resolved' ? 'Record Resolution' : 'Escalate to Super Admin'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
