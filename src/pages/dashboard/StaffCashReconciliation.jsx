import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  Coins,
  Wallet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Landmark,
  User,
  Briefcase,
  MapPin,
  FileText,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
  Scale,
  Receipt,
  Headset
} from 'lucide-react';
import staffTeamworkIllustration from '../../assets/AurumFX Office Finance Teamwork Cutout.webp';
import { getStaffMe } from '../../services/branchStaffService';
import {
  getStaffCashDays,
  openStaffCashDay,
  closeStaffCashDay
} from '../../services/cashReconciliationService';
import AccountantCashReconciliationView from '../../components/dashboard/AccountantCashReconciliationView';
import ReconciliationReceiptsModal from '../../components/dashboard/ReconciliationReceiptsModal';

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
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function StaffCashReconciliation() {
  const navigate = useNavigate();

  const [staffData, setStaffData] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [refreshing, setRefreshing] = useState(false);

  const roleName = String(staffData?.staff_role?.name || staffData?.account_role || staffData?.role || '').toLowerCase();
  const isAccountant = roleName.includes('accountant') || roleName.includes('auditor');
  const isCustomerService =
    roleName.includes('customer') ||
    roleName.includes('cso') ||
    roleName.includes('support') ||
    (roleName.includes('service') && !roleName.includes('cashier'));

  // Cash Days Data
  const [cashDays, setCashDays] = useState([]);
  const [loadingCashDays, setLoadingCashDays] = useState(true);
  const [errorCashDays, setErrorCashDays] = useState(null);

  // Form states
  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [openBusinessDate, setOpenBusinessDate] = useState(getTodayISO());
  const [openCashAmount, setOpenCashAmount] = useState('');
  const [openSubmitting, setOpenSubmitting] = useState(false);
  const [openError, setOpenError] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(null);

  const [closeCashAmount, setCloseCashAmount] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState(null);
  const [closeSuccess, setCloseSuccess] = useState(null);
  const [confirmCloseModal, setConfirmCloseModal] = useState(false);

  // History table filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');

  // Selected Reconciliation Report for Receipts Modal
  const [selectedReconciliationReport, setSelectedReconciliationReport] = useState(null);

  // Load Staff Profile
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
      setRefreshing(false);
    }
  };

  // Load Cash Days
  const loadCashDays = async () => {
    if (isAccountant || isCustomerService) {
      setLoadingCashDays(false);
      return;
    }
    setLoadingCashDays(true);
    setErrorCashDays(null);
    try {
      const data = await getStaffCashDays({ limit: 50 });
      setCashDays(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load staff cash days:', err);
      setErrorCashDays(err.message || 'Unable to load cash reconciliation history.');
    } finally {
      setLoadingCashDays(false);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
    loadCashDays();
  }, []);

  // Determine active open day (if any) and today's day record
  const todayISO = getTodayISO();
  const activeOpenDay = cashDays.find((d) => String(d.status).toLowerCase() === 'open');
  const todayDay = cashDays.find((d) => d.business_date === todayISO) || (activeOpenDay?.business_date === todayISO ? activeOpenDay : null);
  const isTodayClosed = Boolean(
    !activeOpenDay &&
    todayDay &&
    String(todayDay.status).toLowerCase() !== 'open'
  );
  const latestDay = cashDays[0] || null;

  // Handle Opening Cash Day
  const handleOpenDaySubmit = async (e) => {
    e.preventDefault();
    setOpenError(null);
    setOpenSuccess(null);

    if (isTodayClosed && openBusinessDate <= todayISO) {
      setOpenError("Today's cash shift has already been closed and locked. In accordance with banking security protocols, a new cash day can only be opened after 12:00 AM (tomorrow).");
      return;
    }

    const amount = Number(openCashAmount);
    if (!openBusinessDate) {
      setOpenError('Please specify the business date.');
      return;
    }
    if (isNaN(amount) || amount < 0 || openCashAmount === '') {
      setOpenError('Please enter a valid starting cash amount (₹0 or greater).');
      return;
    }

    setOpenSubmitting(true);
    try {
      const res = await openStaffCashDay({
        business_date: openBusinessDate,
        opening_cash: Number(openCashAmount).toFixed(2)
      });
      setOpenSuccess(`Cash day for ${res.business_date || openBusinessDate} opened successfully with starting float ${formatCurrency(openCashAmount)}!`);
      setOpenCashAmount('');
      await loadCashDays();
    } catch (err) {
      console.error('Failed to open cash day:', err);
      setOpenError(err.message || 'Failed to open cash day.');
    } finally {
      setOpenSubmitting(false);
    }
  };

  // Handle Closing Cash Day
  const handleCloseDaySubmit = async () => {
    setCloseError(null);
    setCloseSuccess(null);

    const amount = Number(closeCashAmount);
    if (isNaN(amount) || amount < 0 || closeCashAmount === '') {
      setCloseError('Please enter the counted physical closing cash in your drawer.');
      return;
    }

    setCloseSubmitting(true);
    try {
      const res = await closeStaffCashDay({
        closing_cash: Number(closeCashAmount).toFixed(2)
      });
      setCloseSuccess(`Cash day closed successfully! Physical count of ${formatCurrency(closeCashAmount)} recorded.`);
      setCloseCashAmount('');
      setConfirmCloseModal(false);
      await loadCashDays();
    } catch (err) {
      console.error('Failed to close cash day:', err);
      setCloseError(err.message || 'Failed to close cash day.');
    } finally {
      setCloseSubmitting(false);
    }
  };

  // Calculated helper for expected closing cash
  const calcExpectedCash = (day) => {
    if (!day) return 0;
    if (day.expected_closing_cash !== null && day.expected_closing_cash !== undefined && Number(day.expected_closing_cash) > 0) {
      return Number(day.expected_closing_cash);
    }
    const op = Number(day.opening_cash || 0);
    const dep = Number(day.deposit_total || 0);
    const w = Number(day.withdrawal_total || 0);
    return Math.max(0, op + dep - w);
  };

  const activeExpectedCash = calcExpectedCash(activeOpenDay);

  const enteredClosingNumber = closeCashAmount !== '' ? Number(closeCashAmount) : null;
  const calculatedDiff = enteredClosingNumber !== null ? (enteredClosingNumber - activeExpectedCash) : null;

  // Filtered History
  const isDateFiltered = Boolean(historyFromDate || historyToDate);
  const effectiveFrom = isDateFiltered ? (historyFromDate || historyToDate) : todayISO;
  const effectiveTo = isDateFiltered ? (historyToDate || historyFromDate) : todayISO;

  const filteredHistory = cashDays.filter((d) => {
    if (historyStatusFilter !== 'all') {
      if (String(d.status).toLowerCase() !== historyStatusFilter.toLowerCase()) return false;
    }
    const bDate = d.business_date || String(d.opened_at || '').slice(0, 10);
    if (effectiveFrom && bDate < effectiveFrom) return false;
    if (effectiveTo && bDate > effectiveTo) return false;

    if (historySearch) {
      const s = historySearch.toLowerCase();
      const dateStr = String(d.business_date || '').toLowerCase();
      const idStr = String(d.id || '').toLowerCase();
      const accountant = String(d.accountant_name || '').toLowerCase();
      if (!dateStr.includes(s) && !idStr.includes(s) && !accountant.includes(s)) {
        return false;
      }
    }
    return true;
  });

  const formatStaffRole = (role) => {
    if (!role) return '';
    const str = String(role);
    if (/cashier\/teller/i.test(str)) return 'Cashier';
    return str;
  };

  return (
    <DashboardLayout role="staff" user={staffData} activeTab="cash_reconciliation">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner matching AurumFX Staff styling */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-3xl">
            {/* Top Separate Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <Briefcase className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: {formatStaffRole(staffData?.staff_role?.name) || (isAccountant ? 'Branch Accountant' : 'Cashier')}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Branch Code: <span className="font-mono text-teal-800 font-bold">{staffData?.branch?.branch_code ? `#${staffData.branch.branch_code}` : '#Central'}</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{staffData?.is_active !== false ? 'Active & Authorized' : 'Inactive'}</span>
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{isAccountant ? 'Branch Cash Reconciliation & Auditing' : 'Cash Drawer & Day Reconciliation'}</span>
                <span className="inline-block text-2xl sm:text-3xl">⚖️</span>
              </h1>
            </div>

            {/* User & Branch details */}
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
                <span className="text-slate-500 font-medium">Branch:</span>
                <span className="text-slate-900 font-bold">{staffData?.branch?.name || 'Society Branch'}</span>
              </div>
            </div>

            {/* Location & IFSC Chips */}
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
                  loadCashDays();
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh Cash Day Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-3 sm:-my-6 lg:-my-8 flex-shrink-0 w-full md:w-auto">
            <img
              src={staffTeamworkIllustration}
              alt="Cash Drawer Operations"
              className="h-36 sm:h-48 lg:h-56 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none mx-auto md:mx-0"
            />
          </div>

          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl pointer-events-none" />
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
              You are signed in as a <strong>Customer Service Officer</strong>. Cash reconciliation is handled by Cashiers and Accountants. You have access to review and respond to member service requests.
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
          <AccountantCashReconciliationView staffUser={staffData} isStandalone={true} />
        ) : (
          <>
            {/* 5 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          <StatCard
            title="Cash Day Status"
            value={
              activeOpenDay
                ? 'Open & Active'
                : isTodayClosed
                ? 'Closed & Locked'
                : todayDay
                ? String(todayDay.status).toUpperCase()
                : 'Not Started'
            }
            subtitle={
              isTodayClosed
                ? 'Locked until tomorrow (12:00 AM)'
                : todayDay
                ? `Date: ${todayDay.business_date}`
                : `Date: ${todayISO}`
            }
            icon={activeOpenDay ? Unlock : Lock}
            trend={
              activeOpenDay
                ? 'Ready for operations'
                : isTodayClosed
                ? 'Unlocks next day 12:00 AM'
                : 'Shift closed'
            }
            trendType={activeOpenDay ? 'up' : 'down'}
          />
          <StatCard
            title="Opening Drawer Cash"
            value={formatCurrency(todayDay?.opening_cash ?? 0)}
            subtitle={todayDay ? "Starting physical cash" : "No drawer opened today"}
            icon={Coins}
          />
          <StatCard
            title="Total Deposits Today"
            value={formatCurrency(todayDay?.deposit_total ?? 0)}
            subtitle="Member cash inflows"
            icon={ArrowDownLeft}
            trendType="up"
          />
          <StatCard
            title="Withdrawal Total Today"
            value={formatCurrency(todayDay?.withdrawal_total ?? 0)}
            subtitle="Member cash outflows"
            icon={ArrowUpRight}
            trendType="down"
          />
          <StatCard
            title="Expected Closing Cash"
            value={formatCurrency(calcExpectedCash(todayDay))}
            subtitle="System cash ledger"
            icon={Scale}
            trendType="up"
          />
        </div>

        {/* =========================================================================
            ACTIVE DRAWER CONTROL CONSOLE
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activeOpenDay ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {activeOpenDay ? <Unlock className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                  <span>Shift Drawer Management</span>
                  {activeOpenDay ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Day Open
                    </span>
                  ) : isTodayClosed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      <Lock className="w-3 h-3 text-rose-600" />
                      Closed &amp; Locked Until 12:00 AM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Day Closed
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Open your business day to enable member counter operations, or reconcile drawer cash to close your shift.
                </p>
              </div>
            </div>

            {activeOpenDay && (
              <button
                type="button"
                onClick={() => navigate('/staff/cash-operations')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Go to Cash Operations</span>
              </button>
            )}
          </div>

          <div className="p-5 sm:p-7">
            {/* SUCCESS / ERROR TOASTS */}
            {openSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{openSuccess}</span>
                </div>
                <button onClick={() => setOpenSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {openError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{openError}</span>
                </div>
                <button onClick={() => setOpenError(null)} className="text-rose-700 hover:text-rose-900 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {closeSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{closeSuccess}</span>
                </div>
                <button onClick={() => setCloseSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {closeError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{closeError}</span>
                </div>
                <button onClick={() => setCloseError(null)} className="text-rose-700 hover:text-rose-900 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* SCENARIO A: DAY IS CURRENTLY OPEN */}
            {activeOpenDay ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Live Drawer Breakdown (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200/60 pb-3.5 gap-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Current Active Shift
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                          Business Date: <span className="font-mono text-teal-900 font-extrabold">{formatDate(activeOpenDay.business_date)}</span>
                        </h4>

                        {/* Opened Time & Cashier Code Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 border border-emerald-200/80 text-xs shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-slate-500 font-medium">Opened Time:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatDateTime(activeOpenDay.opened_at)}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 border border-emerald-200/80 text-xs shadow-2xs">
                            <User className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-slate-500 font-medium">Cashier Code:</span>
                            <span className="font-mono font-bold text-teal-800">
                              {activeOpenDay.cashier_code || staffData?.staff_code || `STF-${activeOpenDay.cashier_user_id || staffData?.staff_id}`}
                            </span>
                          </div>

                          {activeOpenDay.cashier_name && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 border border-emerald-200/80 text-xs shadow-2xs">
                              <span className="text-slate-500 font-medium">Cashier:</span>
                              <span className="font-bold text-slate-900 capitalize">
                                {activeOpenDay.cashier_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs self-start sm:self-center tracking-wider">
                        OPEN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 block">Starting Float</span>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                          {formatCurrency(activeOpenDay.opening_cash)}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-emerald-600 block">+ Inflow Deposits</span>
                        <p className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">
                          {formatCurrency(activeOpenDay.deposit_total || 0)}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-rose-600 block">- Outflow Withdrawals</span>
                        <p className="text-sm sm:text-base font-extrabold text-rose-700 mt-0.5">
                          {formatCurrency(activeOpenDay.withdrawal_total || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-white border border-teal-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          System Expected In-Drawer Cash
                        </span>
                        <p className="text-xl sm:text-2xl font-black text-teal-900 mt-0.5">
                          {formatCurrency(activeExpectedCash)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Opening Float + Deposits - Withdrawals
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Scale className="w-6 h-6 text-[#00b4a7]" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-3 border-t border-emerald-200/50">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>Shift Opened At: <strong className="text-slate-800 font-mono">{formatDateTime(activeOpenDay.opened_at)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>Cashier Code: <strong className="text-teal-900 font-mono font-bold">{activeOpenDay.cashier_code || staffData?.staff_code || `STF-${activeOpenDay.cashier_user_id || '—'}`}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Close Day Reconciliation Action (5 cols) */}
                <div className="lg:col-span-5">
                  <div className="h-full p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-rose-600" />
                        </div>
                        <h4 className="font-serif font-bold text-slate-900 text-base">
                          Close Cash Day
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        At the end of your shift, physically count the notes and coins in your cash drawer and enter the total amount below.
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Counted Physical Cash in Drawer (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g. 11900.00"
                              value={closeCashAmount}
                              onChange={(e) => setCloseCashAmount(e.target.value)}
                              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                            />
                          </div>
                        </div>

                        {/* Live Difference Calculation Preview */}
                        {calculatedDiff !== null && (
                          <div className={`p-3 rounded-xl border text-xs font-semibold ${
                            calculatedDiff === 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : calculatedDiff > 0
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span>Physical Count:</span>
                              <span className="font-mono font-bold">{formatCurrency(enteredClosingNumber)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span>Expected Ledger:</span>
                              <span className="font-mono font-bold">{formatCurrency(activeExpectedCash)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 font-bold">
                              <span>Variance (Diff):</span>
                              <span className="font-mono font-black">
                                {calculatedDiff > 0 ? `+${formatCurrency(calculatedDiff)} (Surplus)` : calculatedDiff < 0 ? `${formatCurrency(calculatedDiff)} (Shortage)` : '₹0.00 (Balanced ✓)'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => setConfirmCloseModal(true)}
                        disabled={closeSubmitting || !closeCashAmount}
                        className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {closeSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Closing Day...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Reconcile &amp; Close Shift</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-slate-500 text-center mt-2">
                        Closing the day blocks further cash transactions until a new business day is opened.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : isTodayClosed ? (
              /* SCENARIO B: TODAY'S DAY IS CLOSED -> LOCKED UNTIL TOMORROW (12:00 AM) */
              <div className="max-w-2xl mx-auto animate-fadeIn">
                <div className="p-6 sm:p-8 rounded-3xl border border-rose-200/90 bg-gradient-to-b from-rose-50/40 via-white to-slate-50/60 shadow-xs">
                  <div className="text-center max-w-lg mx-auto space-y-2.5 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-2xs">
                      <Lock className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Locked Until Tomorrow (After 12:00 AM)</span>
                    </div>
                    <h3 className="font-serif font-black text-slate-900 text-xl sm:text-2xl pt-1">
                      Today's Cash Shift Closed &amp; Locked
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Your cash drawer for today (<strong>{formatDate(todayDay?.business_date || todayISO)}</strong>) has already been closed and submitted for reconciliation.
                      Per banking security controls, you cannot reopen or record starting cash again for today.
                      A new cash day can only be opened <strong>after 12:00 AM</strong> on the next business date.
                    </p>
                  </div>

                  {/* Shift Summary Breakdown */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 font-bold">
                      <span className="text-slate-600">Shift Business Date:</span>
                      <span className="font-mono text-slate-900">{formatDate(todayDay?.business_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Starting Float Amount:</span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(todayDay?.opening_cash)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Inflows (Deposits):</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatCurrency(todayDay?.deposit_total || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Outflows (Withdrawals):</span>
                      <span className="font-mono font-bold text-rose-700">-{formatCurrency(todayDay?.withdrawal_total || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Expected Closing Balance:</span>
                      <span className="font-mono font-bold text-teal-900">{formatCurrency(calcExpectedCash(todayDay))}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                      <span className="text-slate-700">Counted Physical Closing:</span>
                      <span className="font-mono text-slate-900">{formatCurrency(todayDay?.closing_cash)}</span>
                    </div>
                    {todayDay?.closed_at && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>Shift Closed At:</span>
                        <span>{formatDateTime(todayDay.closed_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Lock Notice Info Banner */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Next shift opens automatically tomorrow after 12:00 AM midnight. Please contact the branch manager or accountant if you need an emergency override.
                    </span>
                  </div>

                  {/* Receipts Action Button */}
                  <div className="pt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReconciliationReport(todayDay)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>View Today's Audit Receipts</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SCENARIO C: NO ACTIVE OPEN DAY & NOT CLOSED TODAY -> OPEN CASH DAY FORM */
              <div className="max-w-2xl mx-auto">
                <div className="p-6 sm:p-8 rounded-3xl border border-teal-200/80 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/50">
                  <div className="text-center max-w-md mx-auto space-y-2 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto border border-teal-100 shadow-2xs">
                      <Unlock className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif font-black text-slate-900 text-xl">
                      Open Cash Day
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Record the starting cash float in your drawer to initiate your counter shift. You must open the day before handling member deposits and withdrawals.
                    </p>
                  </div>

                  <form onSubmit={handleOpenDaySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Business Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={openBusinessDate}
                          onChange={(e) => setOpenBusinessDate(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Opening Cash Float Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 5000.00"
                          value={openCashAmount}
                          onChange={(e) => setOpenCashAmount(e.target.value)}
                          required
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                        />
                      </div>

                      {/* Quick Float Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Float:</span>
                        {[2000, 5000, 10000, 15000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setOpenCashAmount(String(amt))}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={openSubmitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] hover:from-[#00a296] hover:to-[#0c625c] text-white font-bold text-sm shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {openSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Opening Cash Day...</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            <span>Open Cash Day &amp; Enable Counter</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            PAST CASH RECONCILIATIONS AUDIT TRAIL TABLE
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
                  Cash Reconciliation History
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Historical record of your daily drawer opening floats, counter totals, closing balances, and supervisor reviews.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                {['all', 'open', 'closed', 'reviewed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setHistoryStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                      historyStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[9px] font-black uppercase text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 select-none">
                    From
                  </span>
                  <input
                    type="date"
                    value={historyFromDate}
                    onChange={(e) => setHistoryFromDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[9px] font-black uppercase text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 select-none">
                    To
                  </span>
                  <input
                    type="date"
                    value={historyToDate}
                    onChange={(e) => setHistoryToDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
                {(historyFromDate || historyToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryFromDate('');
                      setHistoryToDate('');
                    }}
                    className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs border border-slate-200"
                    title="Clear Date Filter"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px]">Clear</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={loadCashDays}
                disabled={loadingCashDays}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh History"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCashDays ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Business Date</th>
                  <th className="py-3.5 px-4">Cashier Code</th>
                  <th className="py-3.5 px-4">Opened Time</th>
                  <th className="py-3.5 px-4">Starting Float</th>
                  <th className="py-3.5 px-4">Deposits</th>
                  <th className="py-3.5 px-4">Withdrawals</th>
                  <th className="py-3.5 px-4">Expected Cash</th>
                  <th className="py-3.5 px-4">Actual Closing</th>
                  <th className="py-3.5 px-4">Variance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Review / Notes</th>
                  <th className="py-3.5 px-4 text-center">Receipts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCashDays ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7] mx-auto mb-2" />
                      <span>Loading reconciliation history...</span>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <Scale className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No reconciliation records found</p>
                      <p className="text-[11px] mt-0.5">Your daily drawer shifts will be catalogued here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((day) => {
                    const st = String(day.status || '').toLowerCase();
                    const diff = day.difference !== null && day.difference !== undefined ? Number(day.difference) : null;
                    const expectedVal = calcExpectedCash(day);
                    return (
                      <tr key={day.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 whitespace-nowrap">
                          {formatDate(day.business_date)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {day.cashier_code || (staffData?.staff_code ? staffData.staff_code : `STF-${day.cashier_user_id || '—'}`)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] font-medium whitespace-nowrap">
                          {formatDateTime(day.opened_at)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {formatCurrency(day.opening_cash)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          +{formatCurrency(day.deposit_total || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                          -{formatCurrency(day.withdrawal_total || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-teal-900">
                          {formatCurrency(expectedVal)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {day.closing_cash !== null ? formatCurrency(day.closing_cash) : <span className="text-slate-400 italic">In progress</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          {diff !== null ? (
                            <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                              diff === 0 ? 'text-emerald-700' : diff > 0 ? 'text-blue-700' : 'text-rose-700'
                            }`}>
                              {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                            st === 'open'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : st === 'reviewed'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {st === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            <span>{st}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600 text-[11px] max-w-[200px] truncate">
                          {day.accountant_explanation ? (
                            <span title={day.accountant_explanation}>
                              💬 {day.accountant_explanation} ({day.accountant_name || 'Accountant'})
                            </span>
                          ) : day.closed_at ? (
                            `Closed at ${formatDateTime(day.closed_at)}`
                          ) : (
                            'Active Shift'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedReconciliationReport(day)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                            title="Inspect Counter Receipts & Balance Logs"
                          >
                            <Receipt className="w-3.5 h-3.5 text-teal-600" />
                            <span>Receipts</span>
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

      {/* CONFIRM CLOSE MODAL */}
      {!isAccountant && confirmCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-black text-slate-900 text-lg">
                Confirm Cash Day Closing
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Are you sure you want to close the drawer for <strong>{formatDate(activeOpenDay?.business_date)}</strong> with physical cash count of <strong>{formatCurrency(closeCashAmount)}</strong>?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Counted Cash:</span>
                <span className="font-bold text-slate-900">{formatCurrency(closeCashAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Expected Cash:</span>
                <span className="font-bold text-teal-900">{formatCurrency(activeExpectedCash)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Variance:</span>
                <span className={calculatedDiff === 0 ? 'text-emerald-700' : calculatedDiff > 0 ? 'text-blue-700' : 'text-rose-700'}>
                  {calculatedDiff > 0 ? `+${formatCurrency(calculatedDiff)}` : formatCurrency(calculatedDiff)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCloseModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseDaySubmit}
                disabled={closeSubmitting}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {closeSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm &amp; Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
