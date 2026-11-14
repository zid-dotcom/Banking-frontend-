import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { FdMisSchemeDetailModal } from '../../components/dashboard/FdMisSchemeModals';
import { getBranchAdminFdMisSchemes } from '../../services/fdMisSchemeService';
import {
  Coins,
  PiggyBank,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Building2,
  ChevronRight
} from 'lucide-react';
import mintFdMisIllustration from '../../assets/Fixed Deposit Growth & Security.png';

function parseBranchInfo(obj = {}) {
  const b = obj.branch;
  const isObj = b && typeof b === 'object';

  const name =
    (isObj ? (b.name || b.branch_name) : null) ||
    (typeof obj.branch_name === 'string' ? obj.branch_name : null) ||
    (typeof b === 'string' ? b : null) ||
    'Society Branch';

  const code =
    (isObj ? b.branch_code : null) ||
    (typeof obj.branch_code === 'string' ? obj.branch_code : null) ||
    (obj.branch_id ? `BRA-${obj.branch_id}` : 'BRA-01');

  const loc =
    (isObj ? (b.city ? `${b.city}, ${b.state || 'Kerala'}` : b.state) : null) ||
    (typeof obj.location === 'string' ? obj.location : 'Kerala');

  return { name, code, loc };
}

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

export default function BranchManagerFdMisSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Details Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [managerUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Branch Manager';
        const { name: bName, code: bCode, loc: bLoc } = parseBranchInfo(parsed);
        return {
          name,
          full_name: name,
          id: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          user_code: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          avatarText: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
          role: 'Branch Manager',
          branch: bName,
          branch_name: bName,
          branch_code: bCode,
          location: bLoc,
          is_active: parsed.is_active !== false,
          branch_id: parsed.branch_id || (typeof parsed.branch === 'object' ? parsed.branch?.id : null)
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      user_code: 'MGR-001',
      avatarText: 'BM',
      role: 'Branch Manager',
      branch: 'Main Branch',
      branch_name: 'Main Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
      is_active: true
    };
  });

  // Fetch Available FD/MIS Schemes from GET /branch-admin/fd-mis-schemes
  const fetchFdMisSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getBranchAdminFdMisSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('API getBranchAdminFdMisSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load available FD / MIS schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFdMisSchemes();
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

  // Computed Metrics (Identical to Super Admin FD/MIS schemes)
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active !== false).length;
  const maxInterest = schemes.length > 0 ? Math.max(...schemes.map((s) => Number(s.annual_interest_rate) || 0)) : 0;
  const minDeposit = schemes.reduce((min, s) => {
    const d = Number(s.minimum_fd_mis_amount);
    if (isNaN(d) || d <= 0) return min;
    return min === null ? d : Math.min(min, d);
  }, null);

  // Pagination slice
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = filteredSchemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="fd_mis_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full text-center md:text-left">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Coins className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: <strong className="font-bold text-teal-950">Branch Manager</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {managerUser.branch_name || 'Society Branch'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Schemes
              </span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Available FD &amp; MIS Schemes
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
              Catalogue of term fixed deposit and monthly income schemes approved by Apex Administration. Review lock-in durations, yield formulas, and payout structures.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={mintFdMisIllustration}
              alt="Available FD & MIS Schemes Illustration"
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
            title="Total FD / MIS Schemes"
            value={totalCount.toString()}
            subtitle="Registered Term Products"
            icon={Coins}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Active Deposit Schemes"
            value={activeCount.toString()}
            subtitle="Ready for Members"
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% active` : '100%'}
            trendType="up"
          />
          <StatCard
            title="Max Annual Yield"
            value={`${maxInterest}%`}
            subtitle="Highest Term Yield p.a."
            icon={TrendingUp}
            trend="Per Annum"
            trendType="neutral"
          />
          <StatCard
            title="Min Investment Scheme"
            value={minDeposit !== null ? formatCurrency(minDeposit) : '₹0'}
            subtitle="Minimum Opening Deposit"
            icon={PiggyBank}
            trend="Base Entry"
            trendType="neutral"
          />
        </div>

        {/* Main Schemes Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            
            {/* Search Input & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search FD / MIS scheme by name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
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
              <div className="relative min-w-[140px] sm:min-w-[160px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => fetchFdMisSchemes(true)}
                disabled={refreshing}
                title="Refresh FD / MIS schemes"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-4 sm:m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load FD/MIS schemes</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchFdMisSchemes()}
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
                <p className="text-sm text-slate-500 font-medium">Loading FD / MIS schemes from registry...</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              /* Empty State */
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching schemes found' : 'No FD / MIS schemes available'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'No term deposit products currently provisioned by apex administration.'}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Scheme Name</th>
                    <th className="py-3.5 px-6">Scheme Code</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Annual Yield</th>
                    <th className="py-3.5 px-6">Min Deposit</th>
                    <th className="py-3.5 px-6">Payout Frequency</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Minimum Deposit Period</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedSchemes.map((scheme) => {
                    const isActive = scheme.is_active !== false;

                    return (
                      <tr
                        key={scheme.id || scheme.scheme_id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Scheme Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                              <Coins className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {scheme.scheme_name || scheme.name}
                            </div>
                          </div>
                        </td>

                        {/* Scheme Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            {scheme.scheme_code || scheme.code}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-6 whitespace-nowrap font-bold font-sans text-slate-800">
                          {scheme.tenure_value} <span className="text-xs text-slate-500 font-medium capitalize">{scheme.tenure_unit || 'months'}</span>
                        </td>

                        {/* Annual Yield */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold font-sans text-teal-900 text-sm">
                            {scheme.annual_interest_rate}% <span className="text-xs text-slate-400 font-medium">p.a.</span>
                          </div>
                        </td>

                        {/* Min Deposit */}
                        <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                          {formatCurrency(scheme.minimum_fd_mis_amount)}
                        </td>

                        {/* Payout Frequency */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {(scheme.interest_payout_type || 'cumulative_yearly').replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Minimum Deposit Period */}
                        <td className="py-4 px-6 whitespace-nowrap text-xs font-bold text-slate-700">
                          {scheme.fd_mis_lock_in_period_months ? `${scheme.fd_mis_lock_in_period_months} Months` : 'None'}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(scheme.created_at)}
                          </span>
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

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            title="View Scheme Details"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls (Fully responsive on mobile) */}
          {!loading && filteredSchemes.length > itemsPerPage && (
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredSchemes.length)} of {filteredSchemes.length} schemes
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Details Modal */}
      <FdMisSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
