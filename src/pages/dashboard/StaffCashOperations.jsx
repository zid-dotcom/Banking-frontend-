import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import {
  Wallet,
  Coins,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  User,
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Check,
  X,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  FileText,
  Scale,
  Lock,
  Unlock,
  AlertTriangle,
  Calculator,
  Headset
} from 'lucide-react';
import staffTeamworkIllustration from '../../assets/AurumFX Office Finance Teamwork Cutout.webp';
import { getStaffMe } from '../../services/branchStaffService';
import {
  lookupSavingsAccount,
  createCashDeposit,
  createCashWithdrawal,
  getStaffCashTransactions
} from '../../services/cashTransactionService';
import { getCurrentCashDayStatus, getStaffCashDays } from '../../services/cashReconciliationService';
import ReconciliationReceiptsModal from '../../components/dashboard/ReconciliationReceiptsModal';

export default function StaffCashOperations() {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loadingProfile, setLoadingProfile] = useState(!staffData);
  const [refreshing, setRefreshing] = useState(false);

  // Cashier Counter State
  const [accountLookupNumber, setAccountLookupNumber] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txLoading, setTxLoading] = useState(null); // 'deposit' | 'withdrawal' | null
  const [txSuccess, setTxSuccess] = useState(null);
  const [txError, setTxError] = useState(null);

  // Cash Transactions Ledger State (GET /staff/cash-transactions)
  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [cashTransactions, setCashTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // 'all' | 'deposit' | 'withdrawal'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Cash Day Drawer Status
  const [drawerStatus, setDrawerStatus] = useState({ isOpen: true, checked: false, currentDay: null });
  const [cashDaysList, setCashDaysList] = useState([]);
  const [selectedReconciliationReport, setSelectedReconciliationReport] = useState(null);

  const todayISO = getTodayISO();
  const isTodayClosed = Boolean(
    drawerStatus.checked &&
    !drawerStatus.isOpen &&
    drawerStatus.currentDay &&
    (drawerStatus.currentDay.business_date === todayISO || drawerStatus.currentDay.closed_at?.slice(0, 10) === todayISO)
  );

  const roleName = String(staffData?.staff_role?.name || staffData?.account_role || staffData?.role || '').toLowerCase();
  const isAccountant = roleName.includes('accountant') || roleName.includes('auditor');
  const isCustomerService =
    roleName.includes('customer') ||
    roleName.includes('cso') ||
    roleName.includes('support') ||
    (roleName.includes('service') && !roleName.includes('cashier'));

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  const formatDateTime = (isoString) => {
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
  };

  const fetchStaffProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getStaffMe();
      if (data) {
        setStaffData(data);
        localStorage.setItem('staff_user', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not refresh staff profile:', err);
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  };

  const loadTransactions = async () => {
    if (isAccountant || isCustomerService) return;

    if (fromDate && toDate && fromDate > toDate) {
      return;
    }

    setLoadingTransactions(true);
    try {
      const params = {};
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      } else if (fromDate || toDate) {
        const targetDate = fromDate || toDate;
        params.from_date = targetDate;
        params.to_date = targetDate;
      }
      const data = await getStaffCashTransactions(params);
      setCashTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load staff cash transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const checkDrawerStatus = async () => {
    if (isAccountant || isCustomerService) return;
    try {
      const [res, days] = await Promise.all([
        getCurrentCashDayStatus(),
        getStaffCashDays({ limit: 50 }).catch(() => [])
      ]);
      setDrawerStatus({ ...res, checked: true });
      if (Array.isArray(days)) {
        setCashDaysList(days);
      }
    } catch {
      setDrawerStatus({ isOpen: true, checked: true, currentDay: null });
    }
  };

  const handleViewReceipt = (tx) => {
    // 1. Look for matching cash day report in loaded list
    const txDate = tx?.created_at?.slice(0, 10) || tx?.date?.slice(0, 10);
    const matchedDay = cashDaysList.find((d) => d.business_date === txDate) || drawerStatus?.currentDay;

    if (matchedDay) {
      setSelectedReconciliationReport(matchedDay);
    } else {
      // 2. Synthesize complete reconciliation report object with 7 cards and transactions table
      setSelectedReconciliationReport({
        id: tx?.cash_reconciliation_id || 1,
        business_date: txDate || new Date().toISOString().slice(0, 10),
        cashier_name: tx?.cashier_name || staffData?.name || staffData?.full_name || 'Cashier',
        opening_cash: tx?.opening_cash || 50000,
        deposit_total: tx?.transaction_type === 'deposit' ? tx.amount : 0,
        withdrawal_total: tx?.transaction_type === 'withdrawal' ? tx.amount : 0,
        expected_closing_cash: tx?.expected_closing_cash || 50000,
        closing_cash: null,
        transactions: [tx]
      });
    }
  };

  useEffect(() => {
    fetchStaffProfile();
    checkDrawerStatus();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [fromDate, toDate]);

  // Handle Account Verification
  const handleLookupAccount = async (e) => {
    if (e) e.preventDefault();
    const cleanAccount = accountLookupNumber.trim();
    if (!cleanAccount) {
      setLookupError('Please enter a 16-digit account number.');
      return;
    }
    if (!/^\d{16}$/.test(cleanAccount)) {
      setLookupError('Wrong account number. Account number must be exactly 16 digits.');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setTxSuccess(null);
    setTxError(null);
    try {
      const result = await lookupSavingsAccount(cleanAccount);
      setAccountDetails(result);
    } catch (err) {
      setAccountDetails(null);
      let errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('pattern') ||
        errMsg.toLowerCase().includes('string should match') ||
        errMsg.toLowerCase().includes('not found') ||
        errMsg.toLowerCase().includes('no savings account') ||
        errMsg.toLowerCase().includes('404') ||
        errMsg.toLowerCase().includes('422')
      ) {
        errMsg = 'Wrong account number. Account not found or invalid.';
      }
      setLookupError(errMsg || 'Wrong account number. Please check and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Cash Deposit
  const handleCashDeposit = async () => {
    const targetAccount = accountDetails?.account_number || accountLookupNumber.trim();
    if (!targetAccount) {
      setTxError('Please lookup and verify an account number first.');
      return;
    }
    const numAmount = Number(txAmount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setTxError('Please enter a valid deposit amount greater than ₹0.');
      return;
    }

    setTxLoading('deposit');
    setTxError(null);
    setTxSuccess(null);
    try {
      const res = await createCashDeposit({
        account_number: targetAccount,
        amount: numAmount,
        notes: txNotes.trim(),
      });
      setTxSuccess({
        type: 'Deposit',
        message: `Successfully deposited ₹${numAmount.toLocaleString('en-IN')} to Account #${targetAccount}!`,
        data: res,
      });
      setTxAmount('');
      setTxNotes('');
      // Re-fetch account details to reflect new balance
      try {
        const updated = await lookupSavingsAccount(targetAccount);
        setAccountDetails(updated);
      } catch {}
      // Refresh transactions
      loadTransactions();
    } catch (err) {
      setTxError(err.message || 'Deposit failed. Please try again.');
    } finally {
      setTxLoading(null);
    }
  };

  // Handle Cash Withdrawal
  const handleCashWithdrawal = async () => {
    const targetAccount = accountDetails?.account_number || accountLookupNumber.trim();
    if (!targetAccount) {
      setTxError('Please lookup and verify an account number first.');
      return;
    }
    const numAmount = Number(txAmount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setTxError('Please enter a valid withdrawal amount greater than ₹0.');
      return;
    }

    setTxLoading('withdrawal');
    setTxError(null);
    setTxSuccess(null);
    try {
      const res = await createCashWithdrawal({
        account_number: targetAccount,
        amount: numAmount,
        notes: txNotes.trim(),
      });
      setTxSuccess({
        type: 'Withdrawal',
        message: `Successfully withdrew ₹${numAmount.toLocaleString('en-IN')} from Account #${targetAccount}!`,
        data: res,
      });
      setTxAmount('');
      setTxNotes('');
      // Re-fetch account details to reflect new balance
      try {
        const updated = await lookupSavingsAccount(targetAccount);
        setAccountDetails(updated);
      } catch {}
      // Refresh transactions
      loadTransactions();
    } catch (err) {
      setTxError(err.message || 'Withdrawal failed. Please check withdrawable balance.');
    } finally {
      setTxLoading(null);
    }
  };

  // Filtered transactions based on active filters
  const filteredTransactions = cashTransactions.filter((tx) => {
    const type = String(tx.transaction_type || tx.type || '').toLowerCase();
    if (txTypeFilter === 'deposit' && !type.includes('deposit') && !type.includes('credit')) return false;
    if (txTypeFilter === 'withdrawal' && !type.includes('withdrawal') && !type.includes('debit')) return false;

    // Date range filtering (defaults to today when no dates selected, without pre-filling input boxes)
    const isDateFiltered = Boolean(fromDate || toDate);
    const effectiveFrom = isDateFiltered ? (fromDate || toDate) : getTodayISO();
    const effectiveTo = isDateFiltered ? (toDate || fromDate) : getTodayISO();

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

    if (txSearch) {
      const s = txSearch.toLowerCase();
      const acct = String(tx.account_number || '').toLowerCase();
      const ref = String(tx.receipt_number || tx.reference_number || tx.id || '').toLowerCase();
      const mem = String(tx.member_name || tx.member_code || '').toLowerCase();
      const branch = String(tx.branch_name || tx.branch_code || '').toLowerCase();
      const cashier = String(tx.cashier_name || tx.cashier_code || '').toLowerCase();
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

  // Summary Metrics:
  // When date filter is applied (fromDate && toDate), calculate from filtered transactions for that range.
  // When date filter is clear (empty), default to TODAY's transactions!
  const getTxLocalDate = (tx) => {
    const rawDate = tx?.created_at || tx?.timestamp || tx?.date;
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(rawDate).slice(0, 10);
  };

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

  const formatStaffRole = (role) => {
    if (!role) return '';
    const str = String(role);
    if (/cashier\/teller/i.test(str)) return 'Cashier';
    return str;
  };

  // User payload for layout and sidebar
  const layoutUser = {
    name: staffData?.full_name || 'Staff Member',
    full_name: staffData?.full_name || 'Staff Member',
    email: staffData?.email || '',
    id: staffData?.staff_code || (staffData?.staff_id ? `STF-${staffData.staff_id}` : 'STF-01'),
    avatarText: staffData?.full_name
      ? staffData.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'ST',
    role: formatStaffRole(staffData?.staff_role?.name || staffData?.account_role) || 'Cashier',
    staff_role: staffData?.staff_role,
    branch: staffData?.branch?.name || 'Society Branch',
    branch_name: staffData?.branch?.name || 'Society Branch',
    branch_code: staffData?.branch?.branch_code || '—',
    branch_location: [staffData?.branch?.city, staffData?.branch?.state].filter(Boolean).join(', '),
    is_active: staffData?.is_active !== false,
  };

  return (
    <DashboardLayout role="staff" user={layoutUser} activeTab="cash_operations">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Hero Banner matching exact reference design */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-3xl">
            {/* Top Separate Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <Briefcase className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: {formatStaffRole(staffData?.staff_role?.name) || 'Cashier'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Branch Code: <span className="font-mono text-teal-800 font-bold">{staffData?.branch?.branch_code ? `#${staffData.branch.branch_code}` : '#Central'}</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{staffData?.is_active !== false ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Cashier Counter &amp; Cash Operations</span>
                <span className="inline-block text-2xl sm:text-3xl">💵</span>
              </h1>
            </div>

            {/* Structured User & Branch Details */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-500 font-medium">Logged in as:</span>
                <span className="text-slate-900 font-bold capitalize">{staffData?.full_name || 'Staff Member'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <span className="text-slate-500 font-medium">Staff ID:</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  {staffData?.staff_code || (staffData?.staff_id ? `STF-${staffData.staff_id}` : 'STF-01')}
                </span>
              </div>

              {staffData?.email && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-slate-900 font-bold">{staffData.email}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-500 font-medium">Branch Name:</span>
                <span className="text-slate-900 font-bold">{staffData?.branch?.name || 'Society Branch'}</span>
              </div>
            </div>

            {/* Row 4: Location & IFSC Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {(staffData?.branch?.city || staffData?.branch?.state) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="text-slate-800 font-semibold capitalize">
                    {[staffData.branch.city, staffData.branch.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {staffData?.branch?.ifsc_code && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <Landmark className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-slate-500 font-medium">IFSC:</span>
                  <span className="font-mono font-bold text-teal-800">{staffData.branch.ifsc_code}</span>
                </div>
              )}

              <button
                onClick={() => {
                  fetchStaffProfile(true);
                  loadTransactions();
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh Counter Profile & Transactions"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto flex justify-center md:justify-end">
            <img
              src={staffTeamworkIllustration}
              alt="Staff Teamwork"
              className="max-h-[170px] sm:max-h-[200px] lg:max-h-[220px] object-contain drop-shadow-md pointer-events-none"
            />
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Counter Desk Status
              </span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              Operational
            </h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready for Counter Cash</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cash Transactions
              </span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {cardTxCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {hasDateFilter ? 'Filtered counter operations' : "Today's counter operations"}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Cash Deposits
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-emerald-700 truncate">
              {formatCurrency(totalDeposits)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {hasDateFilter ? 'Filtered deposits accepted' : "Today's deposits accepted"}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Cash Withdrawals
              </span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-rose-700 truncate">
              {formatCurrency(totalWithdrawals)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {hasDateFilter ? 'Filtered withdrawals disbursed' : "Today's withdrawals disbursed"}
            </p>
          </div>
        </div>

        {isCustomerService ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto border border-teal-100">
              <Headset className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900">
              Customer Service Officer Portal
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You are signed in as a <strong>Customer Service Officer</strong>. Counter cash deposits and withdrawals are restricted to Cashiers. You have access to review and respond to member service requests.
            </p>
            <div className="pt-2">
              <Link
                to="/staff/service-requests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Go to Service Requests Desk
              </Link>
            </div>
          </div>
        ) : isAccountant ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto border border-teal-100">
              <Calculator className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900">
              Accountant Cash Audit Portal
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You are signed in as an <strong>Accountant</strong>. Counter cash deposits and teller withdrawals are restricted to Cashiers. You have access to review branch daily reconciliations and inspect transaction receipts.
            </p>
            <div className="pt-2">
              <Link
                to="/staff/cash-reconciliation"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Go to Cash Reconciliations Review</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* =========================================================================
                CASHIER COUNTER & CASH OPERATIONS DESK (POST deposits/withdrawals & GET lookup)
               ========================================================================= */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 flex-shrink-0">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
                  Cash Operations Counter
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verify member savings account to record counter cash deposits &amp; withdrawals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0f766e] font-semibold text-xs border border-teal-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cash Counter Online</span>
              </span>
            </div>
          </div>

          {/* Content: Form Left + Account Live Dossier Right */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Lookup Form & Action Inputs (col-span-7) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Drawer Status Notice */}
              {drawerStatus.checked && !drawerStatus.isOpen && (
                <div className={`p-4 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn ${
                  isTodayClosed
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isTodayClosed ? (
                      <Lock className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-extrabold ${isTodayClosed ? 'text-rose-950' : 'text-amber-950'}`}>
                        {isTodayClosed ? "Today's Cash Shift Closed & Locked" : "Cash Day Not Open"}
                      </p>
                      <p className={`text-[11px] font-medium mt-0.5 ${isTodayClosed ? 'text-rose-800' : 'text-amber-800'}`}>
                        {isTodayClosed
                          ? "Your drawer for today has been closed and submitted for reconciliation. Opening a new shift is locked until after 12:00 AM (tomorrow)."
                          : "Your cash drawer is currently closed or not opened for today. Open your cash day first to record deposits and withdrawals."}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/staff/cash-reconciliation"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer shadow-xs ${
                      isTodayClosed ? 'bg-slate-700 hover:bg-slate-800' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isTodayClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isTodayClosed ? "View Shift Status" : "Open Cash Day"}</span>
                  </Link>
                </div>
              )}

              {drawerStatus.checked && drawerStatus.isOpen && drawerStatus.currentDay && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      Day Open ({drawerStatus.currentDay.business_date}) • Starting Float: <strong>{formatCurrency(drawerStatus.currentDay.opening_cash)}</strong>
                    </span>
                  </div>
                  <Link
                    to="/staff/cash-reconciliation"
                    className="text-xs font-bold text-[#0f766e] hover:underline flex items-center gap-1"
                  >
                    <span>Reconciliation</span>
                    <span>→</span>
                  </Link>
                </div>
              )}

              {/* Verify Member Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verify Member Account
                </label>
                <form onSubmit={handleLookupAccount} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={accountLookupNumber}
                      onChange={(e) => {
                        setAccountLookupNumber(e.target.value);
                        setLookupError(null);
                      }}
                      placeholder="Enter 16-digit Account Number (e.g. 9021178522884104)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading || !accountLookupNumber.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex-shrink-0"
                  >
                    {lookupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Account</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Lookup Error Message */}
              {lookupError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Transaction Feedback Toast/Alerts */}
              {txSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start justify-between gap-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-emerald-900 text-sm leading-tight">
                        {txSuccess.type} Processed Successfully!
                      </p>
                      <p className="mt-1 text-emerald-700">{txSuccess.message}</p>
                      {txSuccess.data?.receipt_number && (
                        <p className="mt-1 font-mono text-[11px] text-emerald-900">
                          Receipt: <strong>{txSuccess.data.receipt_number}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setTxSuccess(null)}
                    className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {txError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{txError}</span>
                  </div>
                  <button
                    onClick={() => setTxError(null)}
                    className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Cash Transaction Inputs (Amount & Notes) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Step 2: Transaction Details
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Cash Desk Execution</span>
                </div>

                <div>
                  <span className="text-slate-600 text-xs font-semibold block mb-1.5">
                    Transaction Amount (₹) <span className="text-rose-500">*</span>
                  </span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={txAmount}
                      onChange={(e) => {
                        setTxAmount(e.target.value);
                        setTxError(null);
                      }}
                      placeholder="Enter amount (e.g. 500.00)"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 transition-all shadow-xs"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Quick:</span>
                    {[100, 500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTxAmount(String(amt))}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-semibold text-slate-700 hover:text-teal-800 transition-all cursor-pointer shadow-2xs"
                      >
                        +₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-600 text-xs font-semibold block mb-1.5">
                    Cashier Notes / Reference (Optional)
                  </span>
                  <input
                    type="text"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="e.g. Counter Cash Deposit / Member Passbook entry"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] transition-all shadow-xs"
                  />
                </div>

                {/* Dual Action Buttons */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCashDeposit}
                    disabled={txLoading !== null || !accountDetails || !drawerStatus.isOpen}
                    className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {txLoading === 'deposit' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Deposit...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Record Cash Deposit</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCashWithdrawal}
                    disabled={txLoading !== null || !accountDetails || !drawerStatus.isOpen}
                    className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {txLoading === 'withdrawal' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Withdrawal...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Record Cash Withdrawal</span>
                      </>
                    )}
                  </button>
                </div>
                {!accountDetails ? (
                  <p className="text-[11px] text-amber-700 text-center font-medium">
                    ⚠️ Please verify an account first to enable cash deposit / withdrawal buttons.
                  </p>
                ) : !drawerStatus.isOpen ? (
                  <p className="text-[11px] text-rose-700 text-center font-bold">
                    🔒 Cash counter is closed for today. Shift locked until tomorrow after 12:00 AM.
                  </p>
                ) : null}
              </div>

            </div>

            {/* Right Column: Live Account Dossier Preview (col-span-5) */}
            <div className="lg:col-span-5">
              <div className="h-full rounded-2xl border border-slate-200/80 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/50 p-5 flex flex-col justify-between">
                {accountDetails ? (
                  <div className="space-y-4">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider">
                        Verified Member Account
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Confirmed</span>
                      </span>
                    </div>

                    {/* Big Balance Box */}
                    <div className="p-4 rounded-2xl bg-white border border-teal-200/70 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Available Balance
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 font-sans">
                        {formatCurrency(accountDetails.balance ?? accountDetails.current_balance ?? 0)}
                      </p>
                      <p className="text-xs font-mono font-bold text-teal-800 mt-1">
                        Account Number: {accountDetails.account_number || accountLookupNumber}
                      </p>
                    </div>

                    {/* Account Meta Grid */}
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Account Holder:</span>
                        <span className="font-extrabold text-slate-900">
                          {accountDetails.account_holder_name || accountDetails.member_name || accountDetails.full_name || 'Member'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Savings Scheme:</span>
                        <span className="font-bold text-teal-900">
                          {accountDetails.scheme_name || accountDetails.scheme?.name || 'Regular Savings Deposit'}
                        </span>
                      </div>

                      {accountDetails.member_code && (
                        <div className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Member Code:</span>
                          <span className="font-mono font-bold text-slate-800">{accountDetails.member_code}</span>
                        </div>
                      )}

                      {accountDetails.branch_name && (
                        <div className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Operating Branch:</span>
                          <span className="font-semibold text-slate-800">{accountDetails.branch_name}</span>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-white border border-slate-100 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-medium block">Deposits</span>
                          <span className="text-xs font-bold text-emerald-700">
                            {accountDetails.deposits_allowed !== false ? '✓ Allowed' : '✗ Restricted'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-100">
                          <span className="text-[10px] text-slate-500 font-medium block">Withdrawals</span>
                          <span className="text-xs font-bold text-teal-700">
                            {accountDetails.withdrawals_allowed !== false ? '✓ Allowed' : '✗ Restricted'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountDetails(null);
                          setAccountLookupNumber('');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                      >
                        Clear &amp; Verify Different Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto py-10 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto border border-teal-100">
                      <Landmark className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Awaiting Account Verification
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Enter the member's 16-digit account number on the left and click <strong>Verify Account</strong> to inspect balance, scheme, and status before processing cash.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            MY CASH TRANSACTIONS LEDGER (GET /staff/cash-transactions)
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Panel Header: Title, Count badge, and Clean Refresh Action */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                <span>My Cash Transactions</span>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {filteredTransactions.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time record of all cash deposits and withdrawals handled at your counter.
              </p>
            </div>

            {/* Refresh Action: Always neatly aligned on top right */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              {drawerStatus?.currentDay && (
                <button
                  type="button"
                  onClick={() => setSelectedReconciliationReport(drawerStatus.currentDay)}
                  className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 shadow-2xs text-xs font-bold text-teal-800 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Inspect Today's Cash Reconciliation Receipts Audit"
                >
                  <Receipt className="w-3.5 h-3.5 text-teal-600" />
                  <span>Day Receipts Audit</span>
                </button>
              )}
              <button
                type="button"
                onClick={loadTransactions}
                disabled={loadingTransactions}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
                title="Refresh Cashier Transactions Ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingTransactions ? 'animate-spin' : ''}`} />
                <span>{loadingTransactions ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Full width, wrapping cleanly without crowding the title */}
          <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Left Group: Type Filter */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setTxTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  txTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTxTypeFilter('deposit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  txTypeFilter === 'deposit'
                    ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Deposits
              </button>
              <button
                type="button"
                onClick={() => setTxTypeFilter('withdrawal')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  txTypeFilter === 'withdrawal'
                    ? 'bg-rose-50 text-rose-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Withdrawals
              </button>
            </div>

            {/* Right Group: Date Range & Search */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
              {/* Prominent Date Range Pickers matching Member Portal */}
              <div className="flex flex-wrap items-center gap-2">
                {/* FROM Box */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    From
                  </span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title="Filter transactions starting from this date"
                  />
                </div>

                {/* TO Box */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 select-none">
                    To
                  </span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                    title="Filter transactions up to this date"
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
                    title="Clear Date Filter"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">Clear</span>
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search account, ref..."
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00b4a7] focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Receipt Number</th>
                  <th className="py-3.5 px-4">Account Number</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Transaction Type</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Balance Before</th>
                  <th className="py-3.5 px-4">Balance After</th>
                  <th className="py-3.5 px-4">Branch Name</th>
                  <th className="py-3.5 px-4">Branch Code</th>
                  <th className="py-3.5 px-4">IFSC Code</th>
                  <th className="py-3.5 px-4">Cashier Code</th>
                  <th className="py-3.5 px-4">Cashier Name</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4 sm:px-6">Notes</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7] mx-auto mb-2" />
                      <span>Loading cashier transactions...</span>
                    </td>
                  </tr>
                ) : cashTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No cash transactions recorded yet</p>
                      <p className="text-[11px] mt-0.5">Use the Counter Desk above to execute your first cash deposit or withdrawal.</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No cash transactions match the selected filters</p>
                      <p className="text-[11px] mt-0.5">Try clearing date ranges or resetting search terms.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => {
                      const isDeposit = String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
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
                              <div className="text-[10px] font-mono text-slate-400 font-normal">Code: {tx.member_code}</div>
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
                              <span>{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            {formatCurrency(tx.amount || 0)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                            {tx.balance_before !== undefined && tx.balance_before !== null ? formatCurrency(tx.balance_before) : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                            {tx.balance_after !== undefined && tx.balance_after !== null ? formatCurrency(tx.balance_after) : (tx.balance ? formatCurrency(tx.balance) : '—')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {tx.branch_name || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {tx.branch_code || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {tx.ifsc_code || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">
                            {tx.cashier_code || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {tx.cashier_name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-slate-600 truncate max-w-[180px]">
                            {tx.notes || tx.description || 'Processed by Cashier'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                              title="Inspect Counter Receipts & Reconciliation Audit"
                            >
                              <Receipt className="w-3.5 h-3.5 text-teal-600" />
                              <span>Receipt</span>
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

      </div>

      {/* RECONCILIATION RECEIPTS MODAL */}
      {selectedReconciliationReport && (
        <ReconciliationReceiptsModal
          report={selectedReconciliationReport}
          onClose={() => setSelectedReconciliationReport(null)}
        />
      )}
    </DashboardLayout>
  );
}
