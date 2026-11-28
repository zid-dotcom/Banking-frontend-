import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { getMemberMe } from '../../services/memberService';
import { getMemberSavingsAccounts } from '../../services/savingsAccountService';
import { getMemberSavingsAccountTransactions } from '../../services/cashTransactionService';
import {
  Receipt,
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Landmark,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight
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

export default function MemberAccountTransactions() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || t("dashboardModule.accountTransactions.roleMember", "Member");
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
          branch: branchName || t("dashboardModule.accountTransactions.societyBranch", "Society Branch"),
          branch_name: branchName,
          branch_location: branchLocation,
          status: parsed.status || 'approved',
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
        };
      }
    } catch {}
    return {
      name: t("dashboardModule.accountTransactions.roleMember", "Member"),
      full_name: t("dashboardModule.accountTransactions.roleMember", "Member"),
      id: 'AFX-MEM-8842',
      member_code: '',
      email: '',
      mobile: '',
      branch: t("dashboardModule.accountTransactions.societyBranch", "Society Branch"),
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
          const name = data.full_name || data.name || t("dashboardModule.accountTransactions.roleMember", "Member");
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
            branch: branchName || t("dashboardModule.accountTransactions.societyBranch", "Society Branch"),
            branch_name: branchName,
            branch_location: branchLocation,
            status: data.status || 'approved',
            avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
          });
        }
      })
      .catch(() => {});
  }, []);

  // 1. Savings accounts state
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // 2. Transactions state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [errorTx, setErrorTx] = useState(null);

  // 3. Filters
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'deposits' | 'withdrawals'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Member Active Accounts (GET /member/savings-accounts)
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await getMemberSavingsAccounts({ limit: 100 });
      const list = Array.isArray(data) ? data : [];
      setAccounts(list);

      const qAccountId = searchParams.get('account_id');
      if (qAccountId && list.some((a) => String(a.id) === String(qAccountId))) {
        setSelectedAccountId(Number(qAccountId));
      } else if (list.length > 0) {
        setSelectedAccountId(list[0].id);
      }
    } catch (err) {
      console.warn('getMemberSavingsAccounts error:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch Transactions for selected account (GET /member/savings-accounts/{account_id}/transactions)
  const fetchTransactions = async (accId = selectedAccountId) => {
    if (!accId) return;

    if (fromDate && toDate && fromDate > toDate) {
      setErrorTx(t("dashboardModule.accountTransactions.invalidDateRange", "\"From\" date cannot be after \"To\" date."));
      return;
    }

    setLoadingTx(true);
    setErrorTx(null);
    try {
      const opts = { limit: 100 };
      // Send date range or single date query
      if (fromDate && toDate && fromDate.trim() && toDate.trim()) {
        opts.from_date = fromDate.trim();
        opts.to_date = toDate.trim();
      } else if (fromDate || toDate) {
        const targetDate = (fromDate || toDate).trim();
        opts.from_date = targetDate;
        opts.to_date = targetDate;
      }
      const data = await getMemberSavingsAccountTransactions(accId, opts);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('getMemberSavingsAccountTransactions error:', err);
      setErrorTx(err.message || t("dashboardModule.accountTransactions.loadError", "Failed to load savings account transactions."));
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, fromDate, toDate]);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;

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

  // Filter transactions with live date, type, and keyword matching
  const filteredTransactions = transactions.filter((tx) => {
    const isDeposit =
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');

    if (typeFilter === 'deposits' && !isDeposit) return false;
    if (typeFilter === 'withdrawals' && isDeposit) return false;

    // Date Range Filtering (defaults to today's date if no date range is manually set)
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

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const refMatch = String(tx.receipt_number || tx.reference_number || tx.id || '').toLowerCase().includes(q);
      const accMatch = String(tx.account_number || '').toLowerCase().includes(q);
      const notesMatch = String(tx.notes || '').toLowerCase().includes(q);
      const cashierMatch = String(tx.cashier_name || tx.cashier_code || '').toLowerCase().includes(q);
      const branchMatch = String(tx.branch_name || tx.branch_code || '').toLowerCase().includes(q);
      const ifscMatch = String(tx.ifsc_code || '').toLowerCase().includes(q);
      if (!refMatch && !accMatch && !notesMatch && !cashierMatch && !branchMatch && !ifscMatch) return false;
    }
    return true;
  });

  const hasDateFilter = Boolean(fromDate && toDate);
  const cardTransactions = filteredTransactions;

  const totalDepositsAmount = cardTransactions
    .filter((tx) => {
      const isDeposit =
        String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
        String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
      return isDeposit;
    })
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalDepositsCount = cardTransactions.filter((tx) => {
    const isDeposit =
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
    return isDeposit;
  }).length;

  const totalWithdrawalsAmount = cardTransactions
    .filter((tx) => {
      const isWithdrawal =
        String(tx.transaction_type || tx.type || '').toLowerCase().includes('withdrawal') ||
        String(tx.transaction_type || tx.type || '').toLowerCase().includes('debit');
      return isWithdrawal;
    })
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalWithdrawalsCount = cardTransactions.filter((tx) => {
    const isWithdrawal =
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('withdrawal') ||
      String(tx.transaction_type || tx.type || '').toLowerCase().includes('debit');
    return isWithdrawal;
  }).length;

  const totalTxCount = cardTransactions.length;

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="account_transactions"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner matching AurumFX standard styling */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.accountTransactions.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("dashboardModule.accountTransactions.roleMember", "Member")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {memberUser.branch_name || t("dashboardModule.accountTransactions.societySavingsFolios", "Society Savings Folios")}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("dashboardModule.accountTransactions.livePassbook", "Live Passbook")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("dashboardModule.accountTransactions.title", "Account Transactions")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
              {t("dashboardModule.accountTransactions.subtitle", "Real-time verified ledger of cash deposits and cash withdrawals processed across your cooperative society savings accounts.")}
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                onClick={() => fetchTransactions(selectedAccountId)}
                disabled={loadingTx}
                className="px-4 py-2.5 rounded-xl bg-white border border-teal-200/80 hover:bg-teal-50/60 text-[#0f766e] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingTx ? 'animate-spin' : ''}`} />
                <span>{t("dashboardModule.accountTransactions.refreshLedger", "Refresh Ledger")}</span>
              </button>
              <button
                onClick={() => navigate('/member/savings-schemes')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-md"
              >
                <span>{t("sidebar.savingsSchemes", "Savings Schemes")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={modernTealBankIllustration}
              alt={t("dashboardModule.accountTransactions.title", "Account Transactions")}
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300 mx-auto md:mx-0"
            />
          </div>

          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* Account Selector Card */}
        {accounts.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0 border border-teal-100">
                <Receipt className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {t("dashboardModule.accountTransactions.activeSavingsAccount", "Active Savings Account")}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1 font-mono">
                  {currentAccount?.account_number || `${t("dashboardModule.accountTransactions.folio", "Folio")} #${currentAccount?.id}`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentAccount?.scheme_name || t("dashboardModule.accountTransactions.savingsScheme", "Savings Scheme")} • {currentAccount?.branch_name || t("dashboardModule.accountTransactions.societyBranch", "Society Branch")}
                </p>
              </div>
            </div>

            {/* Account Selector Dropdown */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap">{t("dashboardModule.accountTransactions.switchScheme", "Switch Scheme:")}</label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedAccountId(id);
                  setSearchParams({ account_id: id });
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 cursor-pointer min-w-[240px]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number || `${t("dashboardModule.accountTransactions.folio", "Folio")} #${acc.id}`} ({acc.scheme_name || t("dashboardModule.accountTransactions.savings", "Savings")}) - {formatCurrency(acc.balance || 0)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : !loadingAccounts ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{t("dashboardModule.accountTransactions.noActiveAccountsTitle", "No active savings accounts found")}</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {t("dashboardModule.accountTransactions.noActiveAccountsDesc", "You need an active savings account to record and view cash transactions.")}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/member/savings-schemes')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            >
              {t("dashboardModule.accountTransactions.browseSchemes", "Browse Schemes")}
            </button>
          </div>
        ) : null}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("dashboardModule.accountTransactions.accountBalance", "Account Balance")}
            value={formatCurrency(currentAccount?.balance ?? 0)}
            subtitle={currentAccount?.account_number ? `${t("dashboardModule.accountTransactions.accPrefix", "Acc #")}${currentAccount.account_number}` : t("dashboardModule.accountTransactions.savingsBalance", "Savings Balance")}
            icon={Wallet}
            trend={t("dashboardModule.accountTransactions.availableCounterBalance", "Available Counter Balance")}
            trendType="up"
          />
          <StatCard
            title={t("dashboardModule.accountTransactions.totalCashDeposits", "Total Cash Deposits")}
            value={formatCurrency(totalDepositsAmount)}
            subtitle={`${totalDepositsCount} ${t("dashboardModule.accountTransactions.depositsLabel", "deposits")} ${hasDateFilter ? t("dashboardModule.accountTransactions.filteredTag", "(filtered)") : t("dashboardModule.accountTransactions.todayTag", "(today)")}`}
            icon={ArrowDownLeft}
            trend={t("dashboardModule.accountTransactions.cashDeskInflows", "Cash Desk Inflows")}
            trendType="up"
          />
          <StatCard
            title={t("dashboardModule.accountTransactions.totalCashWithdrawals", "Total Cash Withdrawals")}
            value={formatCurrency(totalWithdrawalsAmount)}
            subtitle={`${totalWithdrawalsCount} ${t("dashboardModule.accountTransactions.withdrawalsLabel", "withdrawals")} ${hasDateFilter ? t("dashboardModule.accountTransactions.filteredTag", "(filtered)") : t("dashboardModule.accountTransactions.todayTag", "(today)")}`}
            icon={ArrowUpRight}
            trend={t("dashboardModule.accountTransactions.counterCashReleases", "Counter Cash Releases")}
            trendType="down"
          />
          <StatCard
            title={t("dashboardModule.accountTransactions.totalTransactions", "Total Transactions")}
            value={totalTxCount.toString()}
            subtitle={hasDateFilter ? t("dashboardModule.accountTransactions.filteredLedgerEntries", "Filtered ledger entries") : t("dashboardModule.accountTransactions.todaysLedgerEntries", "Today's ledger entries")}
            icon={Coins}
            trend={t("dashboardModule.accountTransactions.verifiedLedgerCount", "Verified Ledger Count")}
            trendType="neutral"
          />
        </div>

        {/* Transactions Ledger Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-200/70 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterAll", "All")} ({filteredTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('deposits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'deposits'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterDeposits", "Deposits")} ({totalDepositsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'withdrawals'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t("dashboardModule.accountTransactions.filterWithdrawals", "Withdrawals")} ({totalWithdrawalsCount})
                </button>
              </div>
            </div>

            {/* Date range inputs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Prominent Date Range Pickers */}
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

                {/* Clear / Reset Date Filter */}
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs border border-slate-200"
                    title={t("dashboardModule.accountTransactions.clearDateRangeTitle", "Clear Date Range")}
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">{t("dashboardModule.accountTransactions.clear", "Clear")}</span>
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("dashboardModule.accountTransactions.searchPlaceholder", "Search receipt, cashier, notes...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 w-full sm:w-56"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loadingTx ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">{t("dashboardModule.accountTransactions.fetchingTransactions", "Fetching savings account transactions...")}</p>
              </div>
            ) : errorTx ? (
              <div className="p-8 text-center text-rose-600 text-xs font-semibold">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span>{errorTx}</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto">
                  <Receipt className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{t("dashboardModule.accountTransactions.noTransactionsTitle", "No Transactions Found")}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {fromDate || toDate || searchQuery || typeFilter !== 'all'
                    ? t("dashboardModule.accountTransactions.noTransactionsFiltered", "No transactions matched your filter criteria.")
                    : t("dashboardModule.accountTransactions.noTransactionsEmpty", "No transactions have been recorded for this savings folio yet.")}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colReceiptNumber", "Receipt Number")}</th>
                    <th className="py-3.5 px-6">{t("dashboard.accountNumber", "Account Number")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colTransactionType", "Transaction Type")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colAmount", "Amount")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colBalanceBefore", "Balance Before")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colBalanceAfter", "Balance After")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colBranchName", "Branch Name")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colBranchCode", "Branch Code")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colIfscCode", "IFSC Code")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colCashierCode", "Cashier Code")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colCashierName", "Cashier Name")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colDateTime", "Date & Time")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.accountTransactions.colNotes", "Notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTransactions.map((tx) => {
                    const isDeposit =
                      String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
                      String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
                    return (
                      <tr key={tx.id || tx.receipt_number} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-xs whitespace-nowrap">
                          {tx.receipt_number || tx.reference_number || `#${tx.id}`}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">
                          {tx.account_number || currentAccount?.account_number || '—'}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                              isDeposit
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>{isDeposit ? t("dashboardModule.accountTransactions.deposit", "Deposit") : t("dashboardModule.accountTransactions.withdrawal", "Withdrawal")}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 font-black font-sans text-sm whitespace-nowrap">
                          <span className={isDeposit ? 'text-emerald-700' : 'text-slate-900'}>
                            {isDeposit ? '+' : '-'}{formatCurrency(tx.amount || 0)}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-600 text-xs whitespace-nowrap">
                          {tx.balance_before !== undefined && tx.balance_before !== null
                            ? formatCurrency(tx.balance_before)
                            : '—'}
                        </td>
                        <td className="py-4 px-6 font-mono font-extrabold text-slate-900 text-xs whitespace-nowrap">
                          {tx.balance_after !== undefined && tx.balance_after !== null
                            ? formatCurrency(tx.balance_after)
                            : '—'}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-800 font-medium whitespace-nowrap">
                          {tx.branch_name || currentAccount?.branch_name || t("dashboardModule.accountTransactions.societyBranch", "Society Branch")}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {tx.branch_code || currentAccount?.branch_code || '—'}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {tx.ifsc_code || currentAccount?.ifsc_code ? (
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                              {tx.ifsc_code || currentAccount?.ifsc_code}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {tx.cashier_code ? `#${tx.cashier_code}` : '—'}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-800 font-semibold whitespace-nowrap">
                          {tx.cashier_name || t("dashboardModule.accountTransactions.counterCashier", "Counter Cashier")}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 max-w-[200px] truncate">
                          {tx.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
