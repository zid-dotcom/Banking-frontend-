import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { LoanSchemeDetailModal } from '../../components/dashboard/LoanSchemeModals';
import { getMemberLoanSchemes } from '../../services/loanSchemeService';
import { getMemberMe } from '../../services/memberService';
import {
  Landmark,
  Coins,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  ShieldCheck,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Receipt
} from 'lucide-react';
import loanIllustration from '../../assets/Modern Cooperative Bank Loan Illustration.webp';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatCharge(amount, type) {
  if (amount === undefined || amount === null || amount === '') return '0';
  const num = Number(amount);
  const isPercent = type === 'percent' || type === 'percentage';
  if (!isNaN(num)) {
    return isPercent ? `${num}%` : `₹${num.toLocaleString('en-IN')}`;
  }
  return isPercent ? `${amount}%` : `₹${amount}`;
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

export default function MemberLoanSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Details Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

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

  // Fetch Available Loan Schemes from GET /member/loan-schemes
  const fetchLoanSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberLoanSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('getMemberLoanSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load available loan schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoanSchemes();
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

  // Computed Metrics (Matches Super Admin Loan schemes exactly)
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active !== false).length;
  const maxCap = schemes.reduce(
    (max, s) => Math.max(max, Number(s.max_loan_amount ?? s.max_amount) || 0),
    0
  );
  const avgRate = activeCount > 0
    ? (
        schemes
          .filter((s) => s.is_active !== false)
          .reduce(
            (sum, s) => sum + (Number(s.annual_interest_rate ?? s.interest_rate) || 0),
            0
          ) / activeCount
      ).toFixed(1)
    : '0';

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
      activeTab="loan_schemes"
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
                {memberUser.branch_name || 'Credit Portfolio & Schemes Policy'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Schemes
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                Cooperative Loan Schemes
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Explore multi-tier loan products, annual interest formulas, upfront processing charges, and flexible repayment terms available to society members.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={loanIllustration}
              alt="Cooperative Loan Schemes Illustration"
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

        {/* 4 Summary Metric Cards (Identical to Super Admin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Loan Schemes"
            value={totalCount}
            subtitle="Registered Products"
            icon={Landmark}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Active Schemes"
            value={activeCount}
            subtitle="Ready for Member Loans"
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% ratio` : '100%'}
            trendType="up"
          />
          <StatCard
            title="Maximum Loan Amount"
            value={formatCurrency(maxCap)}
            subtitle="Highest Permissible Limit"
            icon={Coins}
          />
          <StatCard
            title="Avg Annual Rate"
            value={`${avgRate}%`}
            subtitle="Across Active Schemes"
            icon={Percent}
            trend="Reducing EMI"
            trendType="up"
          />
        </div>

        {/* Main Schemes Table Panel (Same layout & table as Super Admin) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Society Loan Schemes Catalogue
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Official loan and credit products available for cooperative members
              </p>
            </div>

            {/* Search Input, Status Filter & Refresh */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search loan scheme by name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchLoanSchemes(true)}
                disabled={refreshing}
                title="Refresh loan schemes"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load loan schemes</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchLoanSchemes()}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">Loading loan schemes from registry...</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Landmark className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching schemes found' : 'No loan schemes available'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'No loan or credit schemes currently provisioned.'}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Scheme Code</th>
                    <th className="py-3.5 px-5 whitespace-nowrap">Scheme Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Maximum Loan Amount</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Tenure</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Annual Rate</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Overdue Rate</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Grace Period</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Processing Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Stamp Duty</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Insurance Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Documentation Fees</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Foreclosure</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Penalty</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">SMS Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Stationery Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Field / Travel Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Maintenance Fee</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Doorstep Collection</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Created At</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                  {paginatedSchemes.map((scheme) => {
                    const schemeId = scheme.id || scheme.scheme_id;
                    const isActive = scheme.is_active !== false;

                    return (
                      <tr
                        key={schemeId}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Scheme Code */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200/80">
                            {scheme.scheme_code || scheme.code || 'SCH-00'}
                          </span>
                        </td>

                        {/* Scheme Name */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                            {scheme.scheme_name || scheme.name}
                          </div>
                          {scheme.interest_type && (
                            <div className="text-[11px] text-slate-400 capitalize">
                              {String(scheme.interest_type).replace('_', ' ')}
                            </div>
                          )}
                        </td>

                        {/* Maximum Loan Amount */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                          {formatCurrency(scheme.max_loan_amount ?? scheme.max_amount)}
                        </td>

                        {/* Tenure */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-semibold">
                          {scheme.max_tenure_months || scheme.tenure_months || 0} mos
                        </td>

                        {/* Annual Interest Rate */}
                        <td className="py-4 px-3 text-center whitespace-nowrap font-bold text-teal-800">
                          {scheme.annual_interest_rate ?? scheme.interest_rate ?? 0}% p.a.
                        </td>

                        {/* Overdue Rate */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-amber-700 font-semibold">
                          {scheme.overdue_interest_rate ? `${scheme.overdue_interest_rate}%` : '0%'}
                        </td>

                        {/* Grace Period */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          {scheme.credit_period_days ? `${scheme.credit_period_days}d` : '0d'}
                        </td>

                        {/* Processing Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(
                            scheme.processing_fee ?? scheme.processing_fee_value,
                            scheme.processing_fee_type || 'percent'
                          )}
                        </td>

                        {/* Stamp Duty */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(
                            scheme.stamp_duty_charge,
                            scheme.stamp_duty_charge_type || 'percent'
                          )}
                        </td>

                        {/* Insurance Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(
                            scheme.insurance_fee,
                            scheme.insurance_fee_type || 'percent'
                          )}
                        </td>

                        {/* Documentation Fees */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(
                            scheme.documentation_fee ?? scheme.documentation_fees ?? scheme.documentation_charges ?? scheme.documentation_charge_value ?? scheme.doc_fee,
                            scheme.documentation_fee_type || scheme.documentation_charge_type || 'percent'
                          )}
                        </td>

                        {/* Foreclosure Charges */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(
                            scheme.foreclosure_charges,
                            scheme.foreclosure_charges_type || 'percent'
                          )}
                        </td>

                        {/* Penalty Charges */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-rose-600 font-semibold">
                          {formatCharge(
                            scheme.penalty_charges,
                            scheme.penalty_charges_type || 'percent'
                          )}
                        </td>

                        {/* SMS Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.sms_charges, scheme.sms_charges_type || 'fixed')}
                        </td>

                        {/* Stationery Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.stationary_charges, scheme.stationary_charges_type || 'fixed')}
                        </td>

                        {/* Field / Travel Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.fuel_charges, scheme.fuel_charges_type || 'fixed')}
                        </td>

                        {/* Maintenance Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.maintenance_charges, scheme.maintenance_charges_type || 'fixed')}
                        </td>

                        {/* Doorstep Collection Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(
                            scheme.collection_charges ?? scheme.collection_charge,
                            scheme.collection_charges_type || scheme.collection_charge_type || 'fixed'
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{formatDateTime(scheme.created_at)}</span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
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

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#f6fcfb] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            title="View Full Scheme Details"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-xs font-semibold">View</span>
                          </button>
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
      </div>

      {/* View Scheme Details Modal */}
      <LoanSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
