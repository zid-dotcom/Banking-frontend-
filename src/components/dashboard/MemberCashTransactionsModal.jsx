import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Receipt,
  Search,
  RefreshCw,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
  Landmark,
  Coins
} from 'lucide-react';
import {
  getBranchAdminMemberCashTransactions,
  getSuperAdminMemberCashTransactions,
  getAccountantMemberCashTransactions
} from '../../services/cashTransactionService';
import { getBranchAdminMember } from '../../services/branchAdminService';
import { getSuperadminBranchMember, getAccountantMember } from '../../services/memberService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
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

export default function MemberCashTransactionsModal({
  isOpen,
  onClose,
  member,
  portal = 'branch_admin', // 'branch_admin' | 'super_admin'
  branchId = null
}) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [memberDetails, setMemberDetails] = useState(member || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Other filters & search
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'deposit' | 'withdrawal'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const memberId = member?.id;
  const memberCode =
    member?.user_code ||
    member?.member_code ||
    (memberId ? `MEM-${memberId}` : '—');
  const memberName = member?.full_name || member?.name || 'Member';
  const resolvedBranchId = branchId || member?.branch_id || member?.branch?.id;
  const branchName =
    member?.branch_name ||
    member?.branch?.name ||
    (resolvedBranchId ? `Branch #${resolvedBranchId}` : 'Branch');

  const fetchMemberDetails = async () => {
    if (!memberId) return;
    try {
      let data = null;
      if (portal === 'accountant') {
        data = await getAccountantMember(memberId);
      } else if (portal === 'super_admin') {
        if (resolvedBranchId) {
          data = await getSuperadminBranchMember(resolvedBranchId, memberId);
        }
      } else {
        data = await getBranchAdminMember(memberId);
      }
      if (data) {
        setMemberDetails(data);
      }
    } catch (err) {
      console.warn('Could not load detailed member accounts for transaction modal:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);

    try {
      const options = {
        skip: 0,
        limit: 100,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      };

      let res = null;
      if (portal === 'accountant') {
        res = await getAccountantMemberCashTransactions(memberId, options);
      } else if (portal === 'super_admin') {
        if (!resolvedBranchId) {
          throw new Error('Branch ID is required for Super Admin to query member transactions.');
        }
        res = await getSuperAdminMemberCashTransactions(resolvedBranchId, memberId, options);
      } else {
        res = await getBranchAdminMemberCashTransactions(memberId, options);
      }

      const txList =
        (res && Array.isArray(res.transactions) ? res.transactions : null) ||
        (Array.isArray(res) ? res : []) ||
        (res && Array.isArray(res.items) ? res.items : []) ||
        [];

      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load member cash transactions:', err);
      setError(err.message || 'Failed to load member cash transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && memberId) {
      setMemberDetails(member || null);
      fetchTransactions();
      fetchMemberDetails();
    } else {
      setTransactions([]);
      setMemberDetails(null);
      setFromDate('');
      setToDate('');
      setSearchQuery('');
      setTypeFilter('all');
      setCurrentPage(1);
      setError(null);
    }
  }, [isOpen, memberId, fromDate, toDate]);

  // Client search and type filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      const txType = String(tx.transaction_type || '').toLowerCase();
      if (typeFilter !== 'all' && txType !== typeFilter) {
        return false;
      }

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const receipt = String(tx.receipt_number || '').toLowerCase();
      const accNum = String(tx.account_number || '').toLowerCase();
      const cashierName = String(tx.cashier_name || '').toLowerCase();
      const cashierCode = String(tx.cashier_code || '').toLowerCase();
      const notes = String(tx.notes || '').toLowerCase();
      const amt = String(tx.amount || '').toLowerCase();

      return (
        receipt.includes(q) ||
        accNum.includes(q) ||
        cashierName.includes(q) ||
        cashierCode.includes(q) ||
        notes.includes(q) ||
        amt.includes(q)
      );
    });
  }, [transactions, typeFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let depositTotal = 0;
    let withdrawalTotal = 0;
    let depositCount = 0;
    let withdrawalCount = 0;

    transactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount) || 0);
      const isDeposit = String(tx.transaction_type || '').toLowerCase().includes('deposit');
      if (isDeposit) {
        depositTotal += amt;
        depositCount += 1;
      } else {
        withdrawalTotal += amt;
        withdrawalCount += 1;
      }
    });

    const net = depositTotal - withdrawalTotal;

    return {
      depositTotal,
      withdrawalTotal,
      depositCount,
      withdrawalCount,
      net,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Resolve primary savings account and balance details
  const accountsList = memberDetails?.accounts || member?.accounts || [];
  const primaryAccount = accountsList.length > 0 ? accountsList[0] : null;

  const currentBalance =
    primaryAccount?.balance !== undefined && primaryAccount?.balance !== null
      ? Number(primaryAccount.balance)
      : (transactions.length > 0 && transactions[0].balance_after !== undefined && transactions[0].balance_after !== null
          ? Number(transactions[0].balance_after)
          : null);

  const schemeName = primaryAccount?.scheme_name || (accountsList.length > 0 ? accountsList[0].scheme_name : '');
  const schemeCode = primaryAccount?.scheme_code || (accountsList.length > 0 ? accountsList[0].scheme_code : '');

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-4 animate-scaleUp">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner flex-shrink-0">
              <Receipt className="w-6 h-6 text-white stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {t("memberCashTransactionsModal.memberCashTransactions", "Member Cash Transactions")}
                </h3>
                <span className="font-mono text-xs font-bold text-teal-900 bg-white/90 px-2.5 py-0.5 rounded-md shadow-2xs">
                  {memberCode}
                </span>
                <span className="text-[11px] font-semibold bg-teal-400/30 text-white px-2 py-0.5 rounded-full border border-teal-300/40">
                  {portal === 'super_admin' ? t("memberCashTransactionsModal.superAdminAudit", "Super Admin Audit") : portal === 'accountant' ? t("branchManagerCashReconciliation.accountantAudit", "Accountant Audit") : t("memberCashTransactionsModal.branchManagerAudit", "Branch Manager Audit")}
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium mt-0.5">
                {t("memberCashTransactionsModal.officialCounterCashDepositsTeller", "Official counter cash deposits & teller withdrawals ledger for")} <span className="font-bold text-white capitalize">{memberName}</span> ({branchName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            title={t("modal.member.closeModal", "Close modal")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          
          {/* Member Meta Ribbon & 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Inflow / Deposits */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t("dashboard.totalDeposits", "Total Deposits")}</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-emerald-950 font-sans truncate">
                {formatCurrency(metrics.depositTotal)}
              </h4>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                {metrics.depositCount} {t("memberCashTransactionsModal.depositTransactions", "deposit transactions")}
              </p>
            </div>

            {/* Total Outflow / Withdrawals */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t("memberCashTransactionsModal.totalWithdrawals", "Total Withdrawals")}</span>
                <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-rose-950 font-sans truncate">
                {formatCurrency(metrics.withdrawalTotal)}
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5 font-medium">
                {metrics.withdrawalCount} {t("memberCashTransactionsModal.withdrawalTransactions", "withdrawal transactions")}
              </p>
            </div>

            {/* Current Balance */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80">
              <div className="flex items-center justify-between text-teal-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t("dashboardModule.productAccounts.currentBalance", "Current Balance")}</span>
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <h4 className="text-lg sm:text-xl font-bold font-sans text-teal-950 truncate">
                {currentBalance !== null ? formatCurrency(currentBalance) : '—'}
              </h4>
              <div
                className="text-[11px] text-teal-700 mt-0.5 font-medium truncate flex items-center gap-1.5"
                title={schemeName ? `${schemeName} (${schemeCode})` : t("memberCashTransactionsModal.savingsDeposit", "Savings Deposit")}
              >
                {schemeName ? (
                  <>
                    <span className="capitalize truncate max-w-[150px]">{schemeName}</span>
                    {schemeCode && (
                      <span className="font-mono text-[10px] font-bold bg-teal-100/90 text-teal-800 px-1.5 py-0.2 rounded border border-teal-300/40">
                        {schemeCode}
                      </span>
                    )}
                  </>
                ) : (
                  <span>{t("memberCashTransactionsModal.savingsDepositAccount", "Savings Deposit Account")}</span>
                )}
              </div>
            </div>

            {/* Total Records */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t("memberCashTransactionsModal.ledgerEntries", "Ledger Entries")}</span>
                <div className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-sans truncate">
                {metrics.totalCount}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                {fromDate || toDate ? t("memberCashTransactionsModal.filteredDateRange", "Filtered date range") : t("memberCashTransactionsModal.allLifetimeEntries", "All lifetime entries")}
              </p>
            </div>
          </div>

          {/* Controls Bar: Date Filtering + Type Tabs + Search */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            
            {/* Left: Type Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: t("memberCashTransactionsModal.allTransactions", "All Transactions"), count: transactions.length },
                { id: 'deposit', label: t("dashboardModule.accountTransactions.filterDeposits", "Deposits"), count: metrics.depositCount },
                { id: 'withdrawal', label: t("dashboardModule.accountTransactions.filterWithdrawals", "Withdrawals"), count: metrics.withdrawalCount }
              ].map((tab) => {
                const isActive = typeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setTypeFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Date Picker & Search Box */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Filters */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">
                  {t("memberCashTransactionsModal.from", "From:")}
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("memberCashTransactionsModal.to", "To:")}
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title={t("memberCashTransactionsModal.clearDateRange", "Clear date range")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("memberCashTransactionsModal.receiptCashierAmt", "Receipt, cashier, amt...")}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
                />
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchTransactions}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-teal-50 text-slate-700 hover:text-teal-900 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title={t("memberCashTransactionsModal.refreshTransactions", "Refresh transactions")}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchTransactions}
                className="font-bold underline text-amber-900 hover:text-amber-700 cursor-pointer"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Transactions Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{t("memberCashTransactionsModal.receiptNo", "Receipt No.")}</th>
                    <th className="py-3 px-4">{t("memberCashTransactionsModal.accountNo", "Account No.")}</th>
                    <th className="py-3 px-4">{t("dashboardModule.productAccounts.type", "Type")}</th>
                    <th className="py-3 px-4">{t("dashboardModule.accountTransactions.colAmount", "Amount")}</th>
                    <th className="py-3 px-4">{t("memberCashTransactionsModal.beforeBalance", "Before Balance")}</th>
                    <th className="py-3 px-4">{t("memberCashTransactionsModal.afterBalance", "After Balance")}</th>
                    <th className="py-3 px-4">{t("branchManagerCashReconciliation.cashier", "Cashier")}</th>
                    <th className="py-3 px-4">{t("dashboardModule.accountTransactions.colDateTime", "Date & Time")}</th>
                    <th className="py-3 px-4">{t("dashboardModule.accountTransactions.colNotes", "Notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center text-slate-400">
                        <Loader2 className="w-7 h-7 mx-auto animate-spin text-teal-600 mb-2" />
                        <p className="font-semibold text-xs">{t("memberCashTransactionsModal.loadingMemberCashTransactions", "Loading member cash transactions...")}</p>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                          <Receipt className="w-6 h-6 stroke-[1.8]" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{t("memberCashTransactionsModal.noCashTransactionsFound", "No Cash Transactions Found")}</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                          {fromDate || toDate || searchQuery || typeFilter !== 'all'
                            ? t("memberCashTransactionsModal.noTransactionsMatchedTheActive", "No transactions matched the active date or search filters. Try clearing filters.")
                            : t("memberCashTransactionsModal.thisMemberHasNotMade", "This member has not made any counter cash deposits or withdrawals yet.")}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((tx) => {
  const { t } = useTranslation();
                      const isDeposit = String(tx.transaction_type || '').toLowerCase().includes('deposit');
                      const amt = Math.abs(Number(tx.amount) || 0);

                      return (
                        <tr
                          key={tx.id || tx.receipt_number}
                          className="hover:bg-teal-50/30 transition-colors"
                        >
                          {/* Receipt Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                            <span className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/70 inline-block shadow-2xs">
                              {tx.receipt_number || `#TX-${tx.id}`}
                            </span>
                          </td>

                          {/* Account Number */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {tx.account_number || `ACC-${tx.account_id || '—'}`}
                          </td>

                          {/* Transaction Type */}
                          <td className="py-3.5 px-4">
                            {isDeposit ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                                <ArrowDownLeft className="w-3 h-3 stroke-[2.2]" />
                                <span>{t("dashboardModule.accountTransactions.deposit", "Deposit")}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs">
                                <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                                <span>{t("dashboardModule.accountTransactions.withdrawal", "Withdrawal")}</span>
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-sans font-bold text-xs">
                            <span className={isDeposit ? 'text-emerald-700' : 'text-rose-700'}>
                              {isDeposit ? '+' : '-'} {formatCurrency(amt)}
                            </span>
                          </td>

                          {/* Before Balance */}
                          <td className="py-3.5 px-4 font-sans text-slate-600 font-medium">
                            {formatCurrency(tx.balance_before)}
                          </td>

                          {/* After Balance */}
                          <td className="py-3.5 px-4 font-sans font-bold text-slate-800">
                            {formatCurrency(tx.balance_after)}
                          </td>

                          {/* Cashier */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900 text-xs capitalize">
                                {tx.cashier_name || 'Counter Cashier'}
                              </p>
                              {tx.cashier_code && (
                                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                                  #{tx.cashier_code}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{formatDateTime(tx.created_at)}</span>
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600 font-normal" title={tx.notes}>
                            {tx.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > itemsPerPage && (
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>
                  {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
                  {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} {t("common.of", "of")}{' '}
                  {filteredTransactions.length} {t("branchManagerCashTransactions.transactions", "transactions")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                  >
                    {t("superAdminStaff.prev", "Prev")}
                  </button>
                  <span className="font-bold font-mono px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                  >
                    {t("branchManagerFdMisSchemes.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {t("memberCashTransactionsModal.officialMemberCounterCashHistory", "Official Member Counter Cash History")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
