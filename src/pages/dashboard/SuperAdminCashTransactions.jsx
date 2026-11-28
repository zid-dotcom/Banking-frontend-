import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { getSuperAdminCashTransactions } from '../../services/cashTransactionService';
import { getBranches } from '../../services/branchService';
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Landmark,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Filter,
  X,
  Scale
} from 'lucide-react';
import modernTealBankIllustration from '../../assets/Modern Teal Bank with Coins and Rupee Bag.webp';

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

export default function SuperAdminCashTransactions({
  embedded = false,
  branchId = null,
  fromDate: propFromDate = '',
  toDate: propToDate = ''
}) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || 'all');

  useEffect(() => {
    if (branchId !== null && branchId !== undefined) {
      setSelectedBranchId(branchId);
    }
  }, [branchId]);

  const [cashTransactions, setCashTransactions] = useState([]);
  const [loadingCashTransactions, setLoadingCashTransactions] = useState(true);
  const [errorCashTransactions, setErrorCashTransactions] = useState(null);
  const [cashTxFilter, setCashTxFilter] = useState('all'); // 'all' | 'deposit' | 'withdrawal'
  const [cashTxSearch, setCashTxSearch] = useState('');
  const [fromDate, setFromDate] = useState(propFromDate || '');
  const [toDate, setToDate] = useState(propToDate || '');

  useEffect(() => {
    if (propFromDate !== undefined) {
      setFromDate(propFromDate || '');
    }
  }, [propFromDate]);

  useEffect(() => {
    if (propToDate !== undefined) {
      setToDate(propToDate || '');
    }
  }, [propToDate]);

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
    office: storedUser?.office || 'Head Office - Apex Central Administration'
  };

  // Fetch branches for filter
  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches();
        if (Array.isArray(data)) setBranches(data);
      } catch (err) {
        console.warn('Could not load branches for cash transaction filter:', err);
      }
    }
    loadBranches();
  }, []);

  // Fetch cash transactions
  const fetchCashTransactions = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setErrorCashTransactions('"From" date cannot be after "To" date.');
      return;
    }

    setLoadingCashTransactions(true);
    setErrorCashTransactions(null);
    try {
      const params = {
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : null,
        limit: 100
      };
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      } else if (fromDate || toDate) {
        const targetDate = fromDate || toDate;
        params.from_date = targetDate;
        params.to_date = targetDate;
      }
      const data = await getSuperAdminCashTransactions(params);
      setCashTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch central cash transactions:', err);
      setErrorCashTransactions(err.message || 'Unable to load central cash transactions ledger.');
    } finally {
      setLoadingCashTransactions(false);
    }
  };

  useEffect(() => {
    fetchCashTransactions();
  }, [selectedBranchId, fromDate, toDate]);

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

  // Filtered transactions
  const filteredTransactions = cashTransactions.filter((tx) => {
    const type = String(tx.transaction_type || tx.type || '').toLowerCase();
    if (cashTxFilter === 'deposit' && !type.includes('deposit') && !type.includes('credit')) return false;
    if (cashTxFilter === 'withdrawal' && !type.includes('withdrawal') && !type.includes('debit')) return false;

    // Date range filtering (defaults to today's date if no date range is manually set)
    const rawDate = tx.created_at || tx.timestamp || tx.date;
    if (rawDate) {
      const d = new Date(rawDate);
      let localDateStr = '';
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        localDateStr = `${year}-${month}-${day}`;
      } else {
        localDateStr = String(rawDate).slice(0, 10);
      }
      if (effectiveFrom && localDateStr < effectiveFrom) return false;
      if (effectiveTo && localDateStr > effectiveTo) return false;
    }

    if (cashTxSearch) {
      const s = cashTxSearch.toLowerCase();
      const acct = String(tx.account_number || '').toLowerCase();
      const ref = String(tx.receipt_number || tx.reference_number || tx.id || '').toLowerCase();
      const mem = String(tx.member_name || tx.member_code || '').toLowerCase();
      const branch = String(tx.branch_name || tx.branch_code || tx.branch?.name || '').toLowerCase();
      const cashier = String(tx.cashier_name || tx.cashier_code || tx.staff_name || tx.created_by_name || '').toLowerCase();
      const ifsc = String(tx.ifsc_code || '').toLowerCase();
      const notes = String(tx.notes || tx.description || '').toLowerCase();
      if (
        !acct.includes(s) &&
        !ref.includes(s) &&
        !mem.includes(s) &&
        !branch.includes(s) &&
        !cashier.includes(s) &&
        !ifsc.includes(s) &&
        !notes.includes(s)
      ) {
        return false;
      }
    }
    return true;
  });

  const hasDateFilter = Boolean(fromDate && toDate);
  const cardTransactions = filteredTransactions;

  const cardTxCount = cardTransactions.length;

  const totalDeposits = cardTransactions
    .filter((tx) => {
      const type = String(tx.transaction_type || tx.type || '').toLowerCase();
      return type.includes('deposit') || type.includes('credit');
    })
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalWithdrawals = cardTransactions
    .filter((tx) => {
      const type = String(tx.transaction_type || tx.type || '').toLowerCase();
      return type.includes('withdrawal') || type.includes('debit');
    })
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const content = (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("superAdminCashReconciliation.roleSuperAdmin", "Role: Super Admin")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("superAdminCashReconciliation.apexCentralAdministration", "Apex Central Administration")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("superAdminCashTransactions.activeOversight", "Active Oversight")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{t("superAdminCashReconciliation.centralCashTransactions", "Central Cash Transactions")}</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminCashTransactions.societyWideCashierCashTransactions", "Society-wide cashier cash transactions audit, liquidity oversight, and real-time branch counter monitoring.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={modernTealBankIllustration}
              alt={t("superAdminCashTransactions.centralCashOversight", "Central Cash Oversight")}
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none mx-auto md:mx-0"
            />
          </div>

          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl pointer-events-none" />
        </div>

        {/* Tab Navigation: Toggle between Central Cash Transactions and Cash Reconciliation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00b4a7] text-white shadow-sm flex items-center gap-2"
          >
            <Coins className="w-4 h-4" />
            <span>{t("superAdminCashReconciliation.centralCashTransactions", "Central Cash Transactions")}</span>
          </button>
          <Link
            to="/super-admin/cash-reconciliation"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-slate-400" />
            <span>{t("branchManagerCashReconciliation.cashReconciliationAuditDesk", "Cash Reconciliation Audit Desk")}</span>
          </Link>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("superAdminCashTransactions.centralCashDeposits", "Central Cash Deposits")}
            value={formatCurrency(totalDeposits)}
            subtitle={hasDateFilter ? t("superAdminCashTransactions.filteredBranchInflows", "Filtered branch inflows") : t("superAdminCashTransactions.todaySBranchInflows", "Today's branch inflows")}
            icon={ArrowDownLeft}
            trendType="up"
          />
          <StatCard
            title={t("superAdminCashTransactions.centralCashWithdrawals", "Central Cash Withdrawals")}
            value={formatCurrency(totalWithdrawals)}
            subtitle={hasDateFilter ? t("superAdminCashTransactions.filteredDisbursements", "Filtered disbursements") : t("superAdminCashTransactions.todaySDisbursements", "Today's disbursements")}
            icon={ArrowUpRight}
            trendType="down"
          />
          <StatCard
            title={t("superAdminCashTransactions.monitoredBranches", "Monitored Branches")}
            value={branches.length.toString()}
            subtitle={t("superAdminCashTransactions.societyBranchesOperating", "Society branches operating")}
            icon={Building2}
            trend="Apex Network"
            trendType="up"
          />
          <StatCard
            title={t("superAdminCashTransactions.totalCashOperations", "Total Cash Operations")}
            value={cardTxCount.toString()}
            subtitle={hasDateFilter ? t("superAdminCashTransactions.filteredSocietyCounters", "Filtered society counters") : t("superAdminCashTransactions.todaySSocietyCounters", "Today's society counters")}
            icon={Coins}
            trend="Real-time Audit"
            trendType="up"
          />
        </div>

        {/* Central Transactions Ledger Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Panel Header: Title, Subtitle, and Clean Refresh Action */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                  {t("superAdminCashTransactions.centralCashTransactionsLedger", "Central Cash Transactions Ledger")}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {t("superAdminCashTransactions.societyWideCashierCashTransactions2", "Society-wide cashier cash transactions audit with branch filter.")}
              </p>
            </div>

            {/* Refresh Action: Always neatly aligned on top right */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={fetchCashTransactions}
                disabled={loadingCashTransactions}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
                title={t("superAdminCashTransactions.refreshCentralTransactionsLedger", "Refresh Central Transactions Ledger")}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingCashTransactions ? 'animate-spin' : ''}`} />
                <span>{loadingCashTransactions ? t("dashboardModule.branchOverview.refreshing", "Refreshing...") : t("common.refresh", "Refresh")}</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Full width, wrapping cleanly without crowding the title */}
          <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Left Group: Branch Selector & Type Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Branch Filter Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-all">
                <Building2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  aria-label={t("superAdminCashTransactions.filterCashTransactionsByBranch", "Filter cash transactions by branch")}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[190px] sm:max-w-[220px]"
                >
                  <option value="all">{t("superAdminCashTransactions.allBranchesApexOversight", "All Branches (Apex Oversight)")}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name || b.name} ({b.branch_code || `BRA-${b.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCashTxFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cashTxFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterAll", "All")}
                </button>
                <button
                  type="button"
                  onClick={() => setCashTxFilter('deposit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cashTxFilter === 'deposit'
                      ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterDeposits", "Deposits")}
                </button>
                <button
                  type="button"
                  onClick={() => setCashTxFilter('withdrawal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cashTxFilter === 'withdrawal'
                      ? 'bg-rose-50 text-rose-800 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterWithdrawals", "Withdrawals")}
                </button>
              </div>
            </div>

            {/* Right Group: Date Range & Search */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
              {/* Prominent Date Range Pickers matching Member Portal */}
              <div className="flex flex-wrap items-center gap-2">
                {/* FROM Box */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    {t("dashboardModule.accountTransactions.from", "From")}
                  </span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title={t("dashboardModule.accountTransactions.fromDateTitle", "Filter transactions starting from this date")}
                  />
                </div>

                {/* TO Box */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    {t("dashboardModule.accountTransactions.to", "To")}
                  </span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title={t("dashboardModule.accountTransactions.toDateTitle", "Filter transactions up to this date")}
                  />
                </div>

                {/* Clear Date Filter Button */}
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
                  value={cashTxSearch}
                  onChange={(e) => setCashTxSearch(e.target.value)}
                  placeholder={t("superAdminCashTransactions.searchAccountRefBranch", "Search account, ref, branch...")}
                  className="w-full sm:w-52 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorCashTransactions && (
            <div className="m-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{errorCashTransactions}</span>
              </div>
              <button
                onClick={fetchCashTransactions}
                className="font-bold underline text-amber-900 hover:text-amber-700 cursor-pointer"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">{t("dashboardModule.accountTransactions.colReceiptNumber", "Receipt Number")}</th>
                  <th className="py-3.5 px-4">{t("dashboard.accountNumber", "Account Number")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.productAccounts.memberName", "Member Name")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colTransactionType", "Transaction Type")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colAmount", "Amount")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colBalanceBefore", "Balance Before")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colBalanceAfter", "Balance After")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colBranchName", "Branch Name")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colBranchCode", "Branch Code")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colIfscCode", "IFSC Code")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colCashierCode", "Cashier Code")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colCashierName", "Cashier Name")}</th>
                  <th className="py-3.5 px-4">{t("dashboardModule.accountTransactions.colDateTime", "Date & Time")}</th>
                  <th className="py-3.5 px-4 sm:px-6">{t("dashboardModule.accountTransactions.colNotes", "Notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCashTransactions ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7] mx-auto mb-2" />
                      <span>{t("superAdminCashTransactions.loadingCentralCashTransactionsLedger", "Loading central cash transactions ledger...")}</span>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      <Coins className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">{t("superAdminCashTransactions.noCashTransactionsFound", "No cash transactions found")}</p>
                      <p className="text-[11px] mt-0.5">
                        {cashTxSearch || selectedBranchId !== 'all' || cashTxFilter !== 'all'
                          ? t("superAdminCashTransactions.noTransactionsMatchTheCurrent", "No transactions match the current filter or search criteria.")
                          : t("superAdminCashTransactions.transactionsAcrossBranchCashiersWill", "Transactions across branch cashiers will show here.")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => {
  const { t } = useTranslation();
                    const isDeposit =
                      String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
                      String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-800">
                          {tx.receipt_number || tx.reference_number || `#TX-${tx.id || idx + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-teal-800 font-semibold">
                          {tx.account_number || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>{tx.member_name || '—'}</div>
                          {tx.member_code && (
                            <div className="text-[10px] font-mono text-slate-400 font-normal">{t("dashboardModule.productAccounts.codeLabel", "Code:")} {tx.member_code}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                              isDeposit
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{isDeposit ? t("dashboardModule.accountTransactions.deposit", "Deposit") : t("dashboardModule.accountTransactions.withdrawal", "Withdrawal")}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          {formatCurrency(tx.amount || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                          {tx.balance_before !== undefined && tx.balance_before !== null
                            ? formatCurrency(tx.balance_before)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                          {tx.balance_after !== undefined && tx.balance_after !== null
                            ? formatCurrency(tx.balance_after)
                            : tx.balance
                            ? formatCurrency(tx.balance)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {tx.branch_name || tx.branch?.name || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {tx.branch_code || tx.branch?.branch_code || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {tx.ifsc_code || tx.branch?.ifsc_code || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">
                          {tx.cashier_code || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {tx.cashier_name || tx.staff_name || tx.created_by_name || (tx.cashier_user_id ? `Cashier #${tx.cashier_user_id}` : '—')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600 truncate max-w-[200px]" title={tx.notes || tx.description}>
                          {tx.notes || tx.description || 'Processed by Cashier'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Count */}
          {!loadingCashTransactions && filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
              <span>
                {t("common.showing", "Showing")} <strong className="text-slate-700">{filteredTransactions.length}</strong> {t("common.of", "of")}{' '}
                <strong className="text-slate-700">{cashTransactions.length}</strong> {t("branchManagerCashTransactions.transactions", "transactions")}
              </span>
            </div>
          )}
        </div>

      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout role="super_admin" user={currentUser} activeTab="cash_transactions">
      {content}
    </DashboardLayout>
  );
}
