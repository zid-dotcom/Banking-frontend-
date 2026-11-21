import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { SavingsSchemeDetailModal } from '../../components/dashboard/SavingsSchemeModals';
import {
  ApplySavingsAccountModal,
  SavingsAccountDetailModal
} from '../../components/dashboard/SavingsAccountModals';
import {
  getMemberSavingsSchemes,
  createMemberSavingsAccountRequest,
  getMemberSavingsAccountRequests,
  getMemberSavingsAccounts
} from '../../services/savingsSchemeService';
import { getMemberMe } from '../../services/memberService';
import {
  PiggyBank,
  Percent,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  Eye,
  Wallet,
  ShieldCheck,
  Building2,
  Coins,
  Landmark,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  PlusCircle,
  Clock,
  XCircle,
  FileText,
  Sparkles,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter
} from 'lucide-react';
import savingsGrowthIllustration from '../../assets/Cooperative Bank Savings Growth.webp';

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

function renderAccountStatusBadge(status) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  const label = String(status).replace(/_/g, ' ');

  if (s === 'active' || s === 'approved' || s === 'awaiting_initial_deposit' || s === 'opened' || s === 'account_opened') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Account Opened</span>
      </span>
    );
  }

  if (s.includes('pending')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }

  if (s.includes('closed') || s.includes('rejected') || s.includes('inactive')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      <span>{label}</span>
    </span>
  );
}

export default function MemberSavingsSchemes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlTab = searchParams.get('tab');
  const initialTab = ['schemes', 'requests', 'accounts'].includes(urlTab)
    ? urlTab
    : 'schemes';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // 1. Schemes state (GET /member/savings-schemes)
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 2. Member Requests state (GET /member/savings-account-requests)
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState(null);

  // 3. Member Savings Accounts state (GET /member/savings-accounts)
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [errorAccounts, setErrorAccounts] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [applyModal, setApplyModal] = useState({
    isOpen: false,
    scheme: null,
    isSubmitting: false,
  });

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // 1. Fetch Available Savings Schemes from GET /member/savings-schemes
  const fetchSavingsSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberSavingsSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('getMemberSavingsSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load available savings schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Fetch Member Savings Account Requests from GET /member/savings-account-requests
  const fetchMemberRequests = async (isManual = false) => {
    setLoadingRequests(true);
    setErrorRequests(null);
    try {
      const data = await getMemberSavingsAccountRequests({ limit: 100 });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('getMemberSavingsAccountRequests error:', err);
      setErrorRequests(err.message || 'Failed to load savings account requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // 3. Fetch Member Active Savings Accounts from GET /member/savings-accounts
  const fetchMemberAccounts = async (isManual = false) => {
    setLoadingAccounts(true);
    setErrorAccounts(null);
    try {
      const data = await getMemberSavingsAccounts({ limit: 100 });
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('getMemberSavingsAccounts error:', err);
      setErrorAccounts(err.message || 'Failed to load active savings accounts.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchSavingsSchemes();
    fetchMemberRequests();
    fetchMemberAccounts();
  }, []);

  // Handle Apply / Open Account submission via POST /member/savings-account-requests
  const handleApplyAccount = async (scheme) => {
    setApplyModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const schemeId = scheme.id || scheme.scheme_id;
      const res = await createMemberSavingsAccountRequest({ savings_scheme_id: schemeId });
      showToast(
        `Savings account opening request #${res?.id || ''} for "${scheme.scheme_name || scheme.name}" submitted successfully!`
      );
      setApplyModal({ isOpen: false, scheme: null, isSubmitting: false });
      await fetchMemberRequests();
      setActiveTab('requests');
    } catch (err) {
      console.error('Account request submit error:', err);
      alert(err.message || 'Failed to submit savings account request.');
      setApplyModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  useEffect(() => {
    fetchSavingsSchemes();
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

  // Computed Metrics (Matches Super Admin Savings Schemes exactly)
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active !== false).length;
  const maxInterest = schemes.length > 0
    ? Math.max(...schemes.map((s) => Number(s.annual_interest_rate ?? s.interest_rate) || 0))
    : 0;
  const lowestOpeningBal = schemes.length > 0
    ? Math.min(...schemes.map((s) => Number(s.min_opening_balance ?? s.min_balance) || 0))
    : 0;

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
      activeTab="savings_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner matching Super Admin exactly */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: <strong className="font-bold text-teal-950">Member</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {memberUser.branch_name || 'Society Savings Catalogue'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Schemes
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Cooperative Savings Schemes
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Explore member savings deposit schemes, annual interest yields, senior citizen add-on benefits, and minimum average balance requirements.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={savingsGrowthIllustration}
              alt="Cooperative Savings Schemes Illustration"
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

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Available Schemes"
            value={totalCount.toString()}
            subtitle="Deposit Products"
            icon={PiggyBank}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Account Requests"
            value={requests.length.toString()}
            subtitle="Submitted Applications"
            icon={FileText}
            trend={
              requests.filter((r) => r.status === 'pending').length > 0
                ? `${requests.filter((r) => r.status === 'pending').length} pending`
                : 'All processed'
            }
            trendType={requests.filter((r) => r.status === 'pending').length > 0 ? 'alert' : 'up'}
          />
          <StatCard
            title="My Savings Accounts"
            value={accounts.length.toString()}
            subtitle="Active Society Folios"
            icon={Wallet}
            trend={`${accounts.length} online`}
            trendType="up"
          />
          <StatCard
            title="Top Annual Yield"
            value={`${maxInterest}%`}
            subtitle="Maximum Return"
            icon={Percent}
          />
        </div>

        {/* Navigation Tabs: Available Schemes | My Requests | My Accounts | Account Transactions */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabChange('schemes')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'schemes'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PiggyBank className="w-4 h-4 text-[#00b4a7]" />
            <span>Available Schemes</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {schemes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('requests')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>My Account Requests</span>
            {requests.filter((r) => r.status === 'pending').length > 0 ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold animate-pulse">
                {requests.filter((r) => r.status === 'pending').length} Pending
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {requests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('accounts')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>My Savings Accounts</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {accounts.length} Active
            </span>
          </button>
        </div>

        {/* TAB 1: SCHEMES CATALOGUE VIEW */}
        {activeTab === 'schemes' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Action & Filter Toolbar */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-[#00b4a7]" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    Society Savings Schemes Catalogue
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Official deposit products available for cooperative society members
                </p>
              </div>

              {/* Search Input, Status Filter & Refresh */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search savings scheme by name or code..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[140px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <button
                  onClick={() => fetchSavingsSchemes(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Refresh schemes"
                >
                  <RefreshCw className={`w-4 h-4 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Failed to load savings schemes</p>
                    <p className="text-xs text-red-700 mt-0.5">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchSavingsSchemes()}
                  className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Schemes Table Container */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">Loading savings schemes from registry...</p>
                </div>
              ) : filteredSchemes.length === 0 ? (
                <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <PiggyBank className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">
                      {searchQuery ? 'No matching schemes found' : 'No savings schemes available'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {searchQuery
                        ? 'Try adjusting your search query or clear the filter.'
                        : 'No savings products currently provisioned by apex administration.'}
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Scheme Name</th>
                      <th className="py-3.5 px-6">Scheme Code</th>
                      <th className="py-3.5 px-6">Annual Yield</th>
                      <th className="py-3.5 px-6">Min Opening</th>
                      <th className="py-3.5 px-6">Monthly MAB</th>
                      <th className="py-3.5 px-6">Payout</th>
                      <th className="py-3.5 px-6">Service Charges</th>
                      <th className="py-3.5 px-6">SMS Charges</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedSchemes.map((scheme) => {
                      const isActive = scheme.is_active !== false;
                      const annualYield = scheme.annual_interest_rate ?? scheme.interest_rate ?? 0;
                      const minOpening = scheme.min_opening_balance ?? scheme.min_balance ?? 0;
                      const minMab = scheme.min_monthly_avg_balance ?? scheme.min_balance ?? 0;
                      const payout = scheme.interest_payout_type || scheme.interest_calculation_frequency || 'Monthly';

                      return (
                        <tr
                          key={scheme.id || scheme.scheme_id}
                          className="hover:bg-teal-50/20 transition-colors group"
                        >
                          {/* Scheme Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                                <PiggyBank className="w-5 h-5 text-[#00b4a7]" />
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

                          {/* Annual Yield */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="font-bold font-sans text-teal-900 text-sm">
                              {annualYield}% <span className="text-xs text-slate-400 font-medium">p.a.</span>
                            </div>
                            {scheme.senior_citizen_rate_add_on > 0 && (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                +{scheme.senior_citizen_rate_add_on}% Senior
                              </span>
                            )}
                          </td>

                          {/* Min Opening */}
                          <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                            {formatCurrency(minOpening)}
                          </td>

                          {/* Monthly MAB */}
                          <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                            {formatCurrency(minMab)}
                          </td>

                          {/* Payout */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {payout}
                            </span>
                          </td>

                          {/* Service Charges */}
                          <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                            <div className="font-bold font-sans text-slate-800 text-sm">
                              {formatCurrency(scheme.service_charges || 0)}
                            </div>
                            {scheme.service_charge_frequency && (
                              <span className="text-[10px] text-slate-400 capitalize">
                                ({scheme.service_charge_frequency})
                              </span>
                            )}
                          </td>

                          {/* SMS Charges */}
                          <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                            <div className="font-bold font-sans text-slate-800 text-sm">
                              {formatCurrency(scheme.sms_charges || 0)}
                            </div>
                            {scheme.sms_charge_frequency && (
                              <span className="text-[10px] text-slate-400 capitalize">
                                ({scheme.sms_charge_frequency})
                              </span>
                            )}
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
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Actions: View & Apply this scheme */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setDetailModal({ isOpen: true, scheme })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                                title="View scheme details"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() =>
                                  setApplyModal({
                                    isOpen: true,
                                    scheme,
                                    isSubmitting: false,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                                title="Apply this scheme"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Apply this scheme</span>
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
                  Showing{' '}
                  <span className="font-bold text-slate-800">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(currentPage * itemsPerPage, filteredSchemes.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800">{filteredSchemes.length}</span> schemes
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
        )}

        {/* TAB 2: MY ACCOUNT OPENING REQUESTS VIEW (GET /member/savings-account-requests) */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-fadeIn">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    My Savings Account Opening Requests
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Track real-time status of your deposit opening applications submitted to your branch
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMemberRequests(true)}
                  disabled={loadingRequests}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingRequests ? 'animate-spin' : ''}`} />
                  <span>Refresh Requests</span>
                </button>
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Request</span>
                </button>
              </div>
            </div>

            {loadingRequests ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#00b4a7] animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Fetching your account requests...</p>
              </div>
            ) : errorRequests ? (
              <div className="p-8 text-center text-rose-600 text-xs font-semibold">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span>{errorRequests}</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No Account Opening Requests Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not submitted any savings account opening requests yet. Browse the schemes catalogue to request your deposit folio.
                </p>
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Browse Savings Schemes
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Request ID</th>
                      <th className="py-3.5 px-6">Scheme Requested</th>
                      <th className="py-3.5 px-6">Submission Date</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6">Decision / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {requests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-[#0f766e] font-mono">
                            #{req.id}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900 block">
                              {req.scheme_name || req.scheme?.scheme_name || `Scheme #${req.savings_scheme_id || req.scheme_id}`}
                            </span>
                            {req.scheme_code && (
                              <span className="font-mono text-[11px] text-slate-400 mt-0.5 block">
                                Code: {req.scheme_code}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                            {formatDateTime(req.created_at || req.requested_at)}
                          </td>
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {!isPending && !isApproved && !isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                {req.status}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600">
                            {req.rejection_reason ? (
                              <span className="text-rose-700 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 inline-block">
                                Reason: {req.rejection_reason}
                              </span>
                            ) : isApproved ? (
                              <span className="text-emerald-700 font-semibold">
                                Folio verified and active. View in "My Savings Accounts"
                              </span>
                            ) : isPending ? (
                              <span className="text-slate-400 italic">Awaiting branch manager verification</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY SAVINGS ACCOUNTS VIEW (GET /member/savings-accounts) */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-fadeIn">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    My Active Savings Accounts Ledger
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Central record of your opened cooperative society savings folios and balances
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMemberAccounts(true)}
                  disabled={loadingAccounts}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingAccounts ? 'animate-spin' : ''}`} />
                  <span>Refresh Accounts</span>
                </button>
              </div>
            </div>

            {loadingAccounts ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Fetching your active savings accounts...</p>
              </div>
            ) : errorAccounts ? (
              <div className="p-8 text-center text-rose-600 text-xs font-semibold">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span>{errorAccounts}</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Wallet className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No Active Savings Accounts Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have any active savings accounts in your branch. Explore the available schemes to apply for a deposit folio.
                </p>
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Open a Savings Account
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Account Number</th>
                      <th className="py-3.5 px-6">Scheme</th>
                      <th className="py-3.5 px-6">Branch</th>
                      <th className="py-3.5 px-6">IFSC Code</th>
                      <th className="py-3.5 px-6">Balance</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6">Opened On</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-sm whitespace-nowrap">
                          {acc.account_number || `#SB-${acc.id}`}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 capitalize">
                            {acc.scheme_name || 'Savings Scheme'}
                          </div>
                          {acc.scheme_code && (
                            <span className="font-mono text-[11px] text-slate-400 block font-normal mt-0.5">
                              Code: {acc.scheme_code}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-xs">
                            {acc.branch_name || 'Society Branch'}
                          </div>
                          {acc.branch_code && (
                            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                              Code: {acc.branch_code}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {acc.ifsc_code ? (
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-xs">
                              {acc.ifsc_code}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-black font-sans text-base text-slate-900 whitespace-nowrap">
                          {formatCurrency(acc.balance ?? 0)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {renderAccountStatusBadge(acc.status)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(acc.opened_at)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/member/account-transactions?account_id=${acc.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                              title="View full transactions ledger for this account"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#00b4a7]" />
                              <span>Passbook</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAccount(acc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              title="View Account Details Modal"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Member Apply / Open Account Modal */}
      <ApplySavingsAccountModal
        isOpen={applyModal.isOpen}
        scheme={applyModal.scheme}
        memberUser={memberUser}
        onClose={() => setApplyModal({ isOpen: false, scheme: null, isSubmitting: false })}
        onSubmit={handleApplyAccount}
        isSubmitting={applyModal.isSubmitting}
      />

      {/* 2. View Scheme Details Modal */}
      <SavingsSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />

      {/* 3. View Savings Account Detail Dossier Modal */}
      <SavingsAccountDetailModal
        isOpen={Boolean(selectedAccount)}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />

      {/* Floating Centered Toast */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn backdrop-blur-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </DashboardLayout>
  );
}
