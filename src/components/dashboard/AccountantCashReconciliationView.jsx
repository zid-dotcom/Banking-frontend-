import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Calendar,
  Building2,
  User,
  X,
  Check,
  Eye,
  MessageSquare,
  ShieldCheck,
  Receipt,
  Scale,
  Clock
} from 'lucide-react';
import StatCard from './StatCard';
import {
  listAccountantCashReconciliations,
  getAccountantCashReconciliation,
  reviewAccountantCashReconciliation
} from '../../services/cashReconciliationService';

function formatCurrency(val) {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(val));
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

export default function AccountantCashReconciliationView({ staffUser = {}, isStandalone = false }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'mismatch' | 'reviewed'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  // Details Modal (GET /staff/accountant/cash-reconciliations/{report_id})
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Review Modal (PATCH /staff/accountant/cash-reconciliations/{report_id}/review)
  const [reviewModalReport, setReviewModalReport] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  // Fetch all reports
  const fetchReports = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setError(i18n.t("dashboardModule.accountTransactions.invalidDateRange", "\"From\" date cannot be after \"To\" date."));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      } else if (fromDate || toDate) {
        const targetDate = fromDate || toDate;
        params.from_date = targetDate;
        params.to_date = targetDate;
      }
      const data = await listAccountantCashReconciliations(params);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load accountant cash reconciliations:', err);
      setError(err.message || 'Unable to load branch cash reconciliations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate]);

  // Load single report details
  const handleOpenDetails = async (reportId) => {
    setSelectedReportId(reportId);
    setLoadingDetails(true);
    setDetailsError(null);
    setReportDetails(null);
    try {
      const data = await getAccountantCashReconciliation(reportId);
      setReportDetails(data);
    } catch (err) {
      console.error('Failed to load report details:', err);
      setDetailsError(err.message || 'Unable to load report details and receipts.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Review Modal
  const handleOpenReview = (report) => {
    setReviewModalReport(report);
    setExplanation(report.accountant_explanation || '');
    setReviewError(null);
    setReviewSuccess(null);
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalReport) return;

    const diff = Number(reviewModalReport.difference || 0);
    const cleanExplanation = explanation.trim();

    // Backend rule: An explanation is required when the cash count differs
    if (diff !== 0 && !cleanExplanation) {
      setReviewError('An explanation is required when the physical cash differs from the expected closing cash.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const updated = await reviewAccountantCashReconciliation(reviewModalReport.id, {
        explanation: cleanExplanation
      });
      setReviewSuccess('Reconciliation review and explanation recorded successfully!');

      // Update in reports list
      setReports((prev) =>
        prev.map((r) => (r.id === reviewModalReport.id ? { ...r, ...updated, accountant_explanation: cleanExplanation } : r))
      );

      // If details modal was open for this report, update it
      if (reportDetails && reportDetails.id === reviewModalReport.id) {
        setReportDetails((prev) => ({ ...prev, ...updated, accountant_explanation: cleanExplanation }));
      }

      setTimeout(() => {
        setReviewModalReport(null);
        setReviewSuccess(null);
        fetchReports();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Helpers for review and mismatch status
  const isReportReviewed = (r) => {
    const st = String(r?.status || '').toLowerCase();
    return Boolean(
      r?.reviewed_at ||
      st === 'reviewed' ||
      st === 'approved' ||
      r?.accountant_user_id ||
      (r?.accountant_explanation && String(r?.accountant_explanation).trim())
    );
  };

  const isReportMismatch = (r) => {
    const diff = r?.difference;
    if (diff !== null && diff !== undefined && Number(diff) !== 0) return true;
    if (
      r?.closing_cash !== null &&
      r?.closing_cash !== undefined &&
      r?.expected_closing_cash !== null &&
      r?.expected_closing_cash !== undefined &&
      Number(r.closing_cash) !== Number(r.expected_closing_cash)
    ) {
      return true;
    }
    return false;
  };

  const isReportPending = (r) => {
    return !isReportReviewed(r);
  };

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateFiltered = Boolean(fromDate || toDate);
  const effectiveFrom = isDateFiltered ? (fromDate || toDate) : getTodayISO();
  const effectiveTo = isDateFiltered ? (toDate || fromDate) : getTodayISO();

  // Client-side filtering
  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'pending') {
      if (!isReportPending(r)) return false;
    }
    if (statusFilter === 'mismatch' || statusFilter === 'discrepancy') {
      if (!isReportMismatch(r)) return false;
    }
    if (statusFilter === 'reviewed') {
      if (!isReportReviewed(r)) return false;
    }

    // Date filtering (defaults to today's date if no date range is manually set)
    const reportDate = r.business_date || String(r.opened_at || '').slice(0, 10);
    if (reportDate) {
      if (effectiveFrom && reportDate < effectiveFrom) return false;
      if (effectiveTo && reportDate > effectiveTo) return false;
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const idStr = String(r.id || '').toLowerCase();
      const cashier = String(r.cashier_name || r.cashier_code || '').toLowerCase();
      const dateStr = String(r.business_date || '').toLowerCase();
      const expl = String(r.accountant_explanation || '').toLowerCase();
      if (!idStr.includes(s) && !cashier.includes(s) && !dateStr.includes(s) && !expl.includes(s)) {
        return false;
      }
    }
    return true;
  });

  const hasDateFilter = Boolean(fromDate || toDate);
  const targetReportsForCards = filteredReports;

  const pendingReviewsCount = targetReportsForCards.filter(isReportPending).length;
  const cashMismatchCount = targetReportsForCards.filter(isReportMismatch).length;
  const reviewedCount = targetReportsForCards.filter(isReportReviewed).length;

  const totalOpeningCash = targetReportsForCards.reduce((acc, r) => acc + Number(r.opening_cash || 0), 0);
  const totalClosingCash = targetReportsForCards.reduce((acc, r) => acc + Number(r.closing_cash || 0), 0);
  const totalDeposit = targetReportsForCards.reduce((acc, r) => acc + Number(r.deposit_total || 0), 0);
  const totalWithdrawal = targetReportsForCards.reduce((acc, r) => acc + Number(r.withdrawal_total || 0), 0);
  const totalExpectedClosingCash = targetReportsForCards.reduce((acc, r) => acc + Number(r.expected_closing_cash || 0), 0);

  return (
    <div className="space-y-6">
      {/* 6 Overview Stat Cards: Pending + 5 Cash Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Pending Reviews */}
        <StatCard
          title={t("accountantCashReconciliationView.pendingReviews", "Pending Reviews")}
          value={pendingReviewsCount.toString()}
          subtitle={t("accountantCashReconciliationView.reportsNeedingAudit", "Reports needing audit")}
          icon={AlertCircle}
          trend={pendingReviewsCount > 0 ? 'Requires Action' : 'All Cleared'}
          trendType={pendingReviewsCount > 0 ? 'down' : 'up'}
        />

        {/* 2. Opening Cash */}
        <StatCard
          title={t("accountantCashReconciliationView.openingCash", "Opening Cash")}
          value={formatCurrency(totalOpeningCash)}
          subtitle={hasDateFilter ? t("branchManagerCashReconciliation.filteredOpeningFloat", "Filtered opening float") : t("branchManagerCashReconciliation.todaySOpeningFloat", "Today's opening float")}
          icon={Wallet}
          trend={hasDateFilter ? 'Selected Float' : 'Opening Float'}
          trendType="neutral"
        />

        {/* 3. Closing Cash */}
        <StatCard
          title={t("accountantCashReconciliationView.closingCash", "Closing Cash")}
          value={formatCurrency(totalClosingCash)}
          subtitle={hasDateFilter ? t("accountantCashReconciliationView.filteredClosingCash", "Filtered closing cash") : t("accountantCashReconciliationView.todaySClosingCash", "Today's closing cash")}
          icon={Coins}
          trend={hasDateFilter ? 'Selected Cash' : 'Physical Cash'}
          trendType="neutral"
        />

        {/* 4. Total Deposits Today */}
        <StatCard
          title={hasDateFilter ? t("dashboard.totalDeposits", "Total Deposits") : t("staffCashReconciliation.totalDepositsToday", "Total Deposits Today")}
          value={formatCurrency(totalDeposit)}
          subtitle={hasDateFilter ? t("branchManagerCashTransactions.filteredCounterInflows", "Filtered counter inflows") : t("branchManagerCashTransactions.todaySCounterInflows", "Today's counter inflows")}
          icon={ArrowDownLeft}
          trend="Cash Inflow"
          trendType="up"
        />

        {/* 5. Withdrawal Total Today */}
        <StatCard
          title={hasDateFilter ? t("accountantCashReconciliationView.withdrawalTotal", "Withdrawal Total") : t("staffCashReconciliation.withdrawalTotalToday", "Withdrawal Total Today")}
          value={formatCurrency(totalWithdrawal)}
          subtitle={hasDateFilter ? t("accountantCashReconciliationView.filteredCounterOutflows", "Filtered counter outflows") : t("accountantCashReconciliationView.todaySCounterOutflows", "Today's counter outflows")}
          icon={ArrowUpRight}
          trend="Cash Outflow"
          trendType="down"
        />

        {/* 6. Expected Closing Cash */}
        <StatCard
          title={t("branchManagerCashReconciliation.expectedClosingCash", "Expected Closing Cash")}
          value={formatCurrency(totalExpectedClosingCash)}
          subtitle={hasDateFilter ? t("accountantCashReconciliationView.filteredExpectedBalance", "Filtered expected balance") : t("accountantCashReconciliationView.todaySExpectedFloat", "Today's expected float")}
          icon={Calculator}
          trend={hasDateFilter ? 'Selected Float' : 'Expected Float'}
          trendType="neutral"
        />
      </div>

      {/* Main Ledger Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Panel Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4 h-4 text-[#00b4a7]" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                <span>{t("branchManagerCashReconciliation.branchCashReconciliationsLedger", "Branch Cash Reconciliations Ledger")}</span>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {filteredReports.length}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {t("accountantCashReconciliationView.auditCashierDailyCashDays", "Audit cashier daily cash days, inspect transaction receipts with before/after balances, and record explanation for cash variances.")}
            </p>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
              title={t("accountantCashReconciliationView.refreshReports", "Refresh Reports")}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? t("dashboardModule.branchOverview.refreshing", "Refreshing...") : t("common.refresh", "Refresh")}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t("branchManagerCashReconciliation.all", "All (")}{reports.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 text-amber-800 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t("accountantCashReconciliationView.pendingReview", "Pending Review (")}{pendingReviewsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mismatch')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'mismatch' || statusFilter === 'discrepancy'
                  ? 'bg-rose-50 text-rose-800 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t("branchManagerCashReconciliation.cashMismatch2", "Cash Mismatch (")}{cashMismatchCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('reviewed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'reviewed'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t("accountantCashReconciliationView.reviewed", "Reviewed (")}{reviewedCount})
            </button>
          </div>

          {/* Right Group: Date Pickers & Search */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
            {/* Prominent Twin-Box Date Range */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                  {t("dashboardModule.accountTransactions.from", "From")}
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                  title={t("branchManagerCashReconciliation.filterFromBusinessDate", "Filter from business date")}
                />
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                  {t("dashboardModule.accountTransactions.to", "To")}
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                  title={t("branchManagerCashReconciliation.filterToBusinessDate", "Filter to business date")}
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
                  title={t("branchManagerCashReconciliation.clearDateFilter", "Clear Date Filter")}
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px]">{t("dashboardModule.emergency.clear", "Clear")}</span>
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("accountantCashReconciliationView.searchCashierReportId", "Search cashier, report ID...")}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="m-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchReports}
              className="font-bold underline text-amber-900 hover:text-amber-700 cursor-pointer"
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Reports Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4 sm:pl-5 pr-2">{t("accountantCashReconciliationView.reportId", "Report ID")}</th>
                <th className="py-3 px-2">{t("branchManagerMembershipSettings.date", "Date")}</th>
                <th className="py-3 px-2">{t("branchManagerCashReconciliation.cashier", "Cashier")}</th>
                <th className="py-3 px-2">{t("branchManagerCashReconciliation.openingFloat", "Opening Float")}</th>
                <th className="py-3 px-2">{t("dashboardModule.accountTransactions.filterDeposits", "Deposits")}</th>
                <th className="py-3 px-2">{t("dashboardModule.accountTransactions.filterWithdrawals", "Withdrawals")}</th>
                <th className="py-3 px-2">{t("accountantCashReconciliationView.expected", "Expected")}</th>
                <th className="py-3 px-2">{t("accountantCashReconciliationView.physicalClosing", "Physical Closing")}</th>
                <th className="py-3 px-2">{t("branchManagerCashReconciliation.difference", "Difference")}</th>
                <th className="py-3 px-2">{t("common.status", "Status")}</th>
                <th className="py-3 px-2">{t("accountantCashReconciliationView.auditNotes", "Audit Notes")}</th>
                <th className="py-3 pl-2 pr-4 sm:pr-5 text-right">{t("common.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-[#00b4a7] mx-auto mb-2" />
                    <span>{t("branchManagerCashReconciliation.loadingBranchCashReconciliations", "Loading branch cash reconciliations...")}</span>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">{t("accountantCashReconciliationView.noCashReconciliationReportsFound", "No cash reconciliation reports found")}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {reports.length === 0
                        ? t("accountantCashReconciliationView.cashiersAtYourBranchHave", "Cashiers at your branch have not submitted any day reconciliations for this period.")
                        : t("accountantCashReconciliationView.noReportsMatchYourActive", "No reports match your active filter criteria.")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
  const { t } = useTranslation();
                  const diff = Number(report.difference || 0);
                  const isMismatch = isReportMismatch(report);
                  const isBalanced = !isMismatch && (report.difference !== null && report.difference !== undefined);
                  const isClosed = String(report.status).toLowerCase() === 'closed';
                  const isReviewed = isReportReviewed(report);
                  const hasExplanation = Boolean(report.accountant_explanation && String(report.accountant_explanation).trim());

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Report ID */}
                      <td className="py-3 pl-4 sm:pl-5 pr-2 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {t("branchManagerCashReconciliation.rec", "#REC-")}{report.id}
                      </td>

                      {/* Business Date */}
                      <td className="py-3 px-2 font-bold text-slate-800 whitespace-nowrap">
                        {formatDate(report.business_date)}
                      </td>

                      {/* Cashier */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{report.cashier_name || 'Cashier'}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {report.cashier_code ? `#${report.cashier_code}` : `User #${report.cashier_user_id}`}
                        </div>
                      </td>

                      {/* Opening Float */}
                      <td className="py-3 px-2 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {formatCurrency(report.opening_cash)}
                      </td>

                      {/* Deposits */}
                      <td className="py-3 px-2 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(report.deposit_total)}
                      </td>

                      {/* Withdrawals */}
                      <td className="py-3 px-2 font-mono font-bold text-rose-700 whitespace-nowrap">
                        -{formatCurrency(report.withdrawal_total)}
                      </td>

                      {/* Expected Cash */}
                      <td className="py-3 px-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(report.expected_closing_cash)}
                      </td>

                      {/* Physical Closing */}
                      <td className="py-3 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {report.closing_cash !== null ? formatCurrency(report.closing_cash) : '—'}
                      </td>

                      {/* Difference */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {report.difference === null || report.difference === undefined ? (
                          <span className="text-slate-400">—</span>
                        ) : isBalanced ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("accountantCashReconciliationView.0Balanced", "₹0 Balanced")}</span>
                          </span>
                        ) : diff > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>+{formatCurrency(diff)} {t("accountantCashReconciliationView.surplus", "Surplus")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>{formatCurrency(diff)} {t("accountantCashReconciliationView.shortage", "Shortage")}</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            isReviewed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isClosed
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReviewed ? 'bg-emerald-500' : isClosed ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{report.status || 'open'}</span>
                        </span>
                      </td>

                      {/* Accountant Explanation */}
                      <td className="py-3 px-2 max-w-[180px]">
                        {hasExplanation ? (
                          <div className="flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div className="truncate text-slate-700 font-medium" title={report.accountant_explanation}>
                              {report.accountant_explanation}
                            </div>
                          </div>
                        ) : isMismatch ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" />
                            <span>{t("accountantCashReconciliationView.explanationRequired", "Explanation Required")}</span>
                          </span>
                        ) : isReviewed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("accountantCashReconciliationView.reviewed2", "Reviewed")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{t("branchManagerMembers.pendingReview", "Pending Review")}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-2 pr-4 sm:pr-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Receipts & Details (GET /staff/accountant/cash-reconciliations/{report_id}) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(report.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                            title={t("accountantCashReconciliationView.inspectTransactionReceiptsBalanceHistory", "Inspect Transaction Receipts & Balance History")}
                          >
                            <Receipt className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t("staffCashReconciliation.receipts", "Receipts")}</span>
                          </button>

                          {/* Review & Explain (PATCH /staff/accountant/cash-reconciliations/{report_id}/review) */}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(report)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-[11px] transition-all cursor-pointer shadow-2xs ${
                              isMismatch && !hasExplanation
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                : !isReviewed
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-teal-50 hover:bg-teal-100 text-[#0f766e] border-teal-200'
                            }`}
                            title={t("accountantCashReconciliationView.recordAuditExplanationReview", "Record Audit Explanation & Review")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                            <span>{hasExplanation || isReviewed ? t("accountantCashReconciliationView.editReview", "Edit Review") : t("accountantCashReconciliationView.review", "Review")}</span>
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

      {/* =========================================================================
          MODAL 1: REPORT DETAILS & TRANSACTION RECEIPTS
          GET /staff/accountant/cash-reconciliations/{report_id}
         ========================================================================= */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-lg">
                    {t("accountantCashReconciliationView.reconciliationReceiptsAuditRec", "Reconciliation Receipts Audit: #REC-")}{selectedReportId}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("branchManagerCashReconciliation.verifiedCounterCashVouchersReceipts", "Verified counter cash vouchers, receipts, and member balance before/after logs.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetails ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto mb-2" />
                  <p className="font-medium text-xs">{t("accountantCashReconciliationView.loadingTransactionReceiptsAndBalance", "Loading transaction receipts and balance logs...")}</p>
                </div>
              ) : detailsError ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                  <span>{detailsError}</span>
                  <button
                    onClick={() => handleOpenDetails(selectedReportId)}
                    className="font-bold underline text-rose-900 hover:text-rose-700 cursor-pointer"
                  >
                    {t("common.retry", "Retry")}
                  </button>
                </div>
              ) : reportDetails ? (
                <>
                  {/* Summary Bar with Separated Deposits and Withdrawals */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t("branchManagerCashReconciliation.businessDate", "Business Date")}</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(reportDetails.business_date)}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t("branchManagerCashReconciliation.cashier", "Cashier")}</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5 truncate">{reportDetails.cashier_name}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t("branchManagerCashReconciliation.openingFloat", "Opening Float")}</div>
                      <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{formatCurrency(reportDetails.opening_cash)}</div>
                    </div>
                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
                      <div className="text-[10px] uppercase font-bold text-emerald-800">{t("dashboardModule.accountTransactions.filterDeposits", "Deposits")}</div>
                      <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">+{formatCurrency(reportDetails.deposit_total)}</div>
                    </div>
                    <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80">
                      <div className="text-[10px] uppercase font-bold text-rose-800">{t("dashboardModule.accountTransactions.filterWithdrawals", "Withdrawals")}</div>
                      <div className="font-mono font-bold text-rose-700 text-sm mt-0.5">-{formatCurrency(reportDetails.withdrawal_total)}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t("branchManagerCashReconciliation.expectedClosing", "Expected Closing")}</div>
                      <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{formatCurrency(reportDetails.expected_closing_cash)}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t("accountantCashReconciliationView.physicalClosing", "Physical Closing")}</div>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                        {reportDetails.closing_cash !== null ? formatCurrency(reportDetails.closing_cash) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Difference Banner */}
                  {Number(reportDetails.difference || 0) !== 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-amber-900 text-xs">
                          {t("accountantCashReconciliationView.cashVarianceNoticeDifferenceOf", "Cash Variance Notice: Difference of")} {formatCurrency(reportDetails.difference)}
                        </h4>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {t("accountantCashReconciliationView.physicalDrawerCashRecordedBy", "Physical drawer cash recorded by the cashier does not match expected counter balance. An accountant explanation must be recorded for audit trails.")}
                        </p>
                        {reportDetails.accountant_explanation ? (
                          <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-slate-800">
                            <strong>{t("accountantCashReconciliationView.recordedExplanation", "Recorded Explanation:")}</strong> {reportDetails.accountant_explanation}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportId(null);
                              handleOpenReview(reportDetails);
                            }}
                            className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            {t("accountantCashReconciliationView.recordRequiredExplanationNow", "Record Required Explanation Now")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transactions Receipts Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00b4a7]" />
                        <span>{t("branchManagerCashReconciliation.counterTransactionsReceipts", "Counter Transactions & Receipts (")}{reportDetails.transactions?.length || 0})</span>
                      </h4>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 pl-4 pr-2">{t("dashboardModule.accountTransactions.colReceiptNumber", "Receipt Number")}</th>
                              <th className="py-2.5 px-2">{t("dashboardModule.productAccounts.type", "Type")}</th>
                              <th className="py-2.5 px-2">{t("dashboardModule.accountTransactions.colAmount", "Amount")}</th>
                              <th className="py-2.5 px-2">{t("dashboardModule.accountTransactions.colBalanceBefore", "Balance Before")}</th>
                              <th className="py-2.5 px-2">{t("dashboardModule.accountTransactions.colBalanceAfter", "Balance After")}</th>
                              <th className="py-2.5 px-2">{t("dashboardModule.accountTransactions.colDateTime", "Date & Time")}</th>
                              <th className="py-2.5 pl-2 pr-4">{t("dashboardModule.accountTransactions.colNotes", "Notes")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {!reportDetails.transactions || reportDetails.transactions.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                                  {t("accountantCashReconciliationView.noIndividualCashTransactionReceipts", "No individual cash transaction receipts recorded during this cash day.")}
                                </td>
                              </tr>
                            ) : (
                              reportDetails.transactions.map((tx) => {
                                const isDep = String(tx.transaction_type || '').toLowerCase().includes('deposit') ||
                                              String(tx.transaction_type || '').toLowerCase().includes('credit');
                                return (
                                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-2.5 pl-4 pr-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                                      {tx.receipt_number || `#TX-${tx.id}`}
                                    </td>
                                    <td className="py-2.5 px-2 whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                          isDep ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}
                                      >
                                        {isDep ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                        <span>{tx.transaction_type}</span>
                                      </span>
                                    </td>
                                    <td className={`py-2.5 px-2 font-mono font-bold whitespace-nowrap ${isDep ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {isDep ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="py-2.5 px-2 font-mono text-slate-600 whitespace-nowrap">
                                      {formatCurrency(tx.balance_before)}
                                    </td>
                                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                                      {formatCurrency(tx.balance_after)}
                                    </td>
                                    <td className="py-2.5 px-2 text-slate-500 font-medium whitespace-nowrap">
                                      {formatDateTime(tx.created_at)}
                                    </td>
                                    <td className="py-2.5 pl-2 pr-4 text-slate-700 min-w-[140px] whitespace-normal break-words">
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
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-2xs"
              >
                {t("common.close", "Close")}
              </button>

              {reportDetails && (
                <button
                  type="button"
                  onClick={() => {
                    const r = reportDetails;
                    setSelectedReportId(null);
                    handleOpenReview(r);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{reportDetails.accountant_explanation ? t("accountantCashReconciliationView.editAuditExplanation", "Edit Audit Explanation") : t("accountantCashReconciliationView.recordAuditReview", "Record Audit Review")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REVIEW & EXPLANATION SUBMISSION
          PATCH /staff/accountant/cash-reconciliations/{report_id}/review
         ========================================================================= */}
      {reviewModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-base sm:text-lg">
                    {t("accountantCashReconciliationView.accountantAuditReviewRec", "Accountant Audit Review: #REC-")}{reviewModalReport.id}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {formatDate(reviewModalReport.business_date)} {t("accountantCashReconciliationView.cashier", "• Cashier:")} {reviewModalReport.cashier_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalReport(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="p-5 sm:p-6 space-y-4">
              {/* Difference highlight */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("accountantCashReconciliationView.cashVariance", "Cash Variance")}</div>
                  <div className="font-mono font-black text-base mt-0.5">
                    {Number(reviewModalReport.difference || 0) === 0 ? (
                      <span className="text-emerald-700">{t("accountantCashReconciliationView.000Balanced", "₹0.00 (Balanced)")}</span>
                    ) : (
                      <span className="text-rose-700">
                        {formatCurrency(reviewModalReport.difference)}{' '}
                        {Number(reviewModalReport.difference) > 0 ? t("branchManagerCashReconciliation.surplus", "(Surplus)") : t("branchManagerCashReconciliation.shortage", "(Shortage)")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("accountantCashReconciliationView.physicalRecorded", "Physical Recorded")}</div>
                  <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                    {formatCurrency(reviewModalReport.closing_cash)}
                  </div>
                </div>
              </div>

              {/* Requirement Alert if diff != 0 */}
              {Number(reviewModalReport.difference || 0) !== 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {t("accountantCashReconciliationView.cashCountDiffersBy", "Cash count differs by")} {formatCurrency(Math.abs(Number(reviewModalReport.difference)))}{t("accountantCashReconciliationView.anExplanationIs", ". An explanation is")} <strong>{t("accountantCashReconciliationView.required", "required")}</strong> {t("accountantCashReconciliationView.beforeThisReconciliationCanBe", "before this reconciliation can be verified.")}
                  </span>
                </div>
              )}

              {/* Textarea for explanation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("accountantCashReconciliationView.accountantExplanationAuditNotes", "Accountant Explanation / Audit Notes")} {Number(reviewModalReport.difference || 0) !== 0 ? <span className="text-rose-600">*</span> : t("accountantCashReconciliationView.optional", "(Optional)")}
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder={t("accountantCashReconciliationView.recordYourAuditFindingsVoucher", "Record your audit findings, voucher verifications, reasons for cash surplus/shortage, or counter notes...")}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 transition-all resize-none"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {explanation.length} {t("accountantCashReconciliationView.1000Characters", "/ 1000 characters")}
                </div>
              </div>

              {/* Error & Success Messages */}
              {reviewError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalReport(null)}
                  disabled={reviewSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("accountantCashReconciliationView.submittingAudit", "Submitting Audit...")}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("accountantCashReconciliationView.saveAuditReview", "Save Audit Review")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
