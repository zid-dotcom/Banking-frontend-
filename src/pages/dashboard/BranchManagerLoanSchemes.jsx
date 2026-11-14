import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { LoanSchemeDetailModal } from '../../components/dashboard/LoanSchemeModals';
import { getBranchAdminLoanSchemes } from '../../services/loanSchemeService';
import {
  Landmark,
  Coins,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  CreditCard,
  Receipt,
  Clock,
  ShieldCheck,
  TrendingUp,
  Layers,
  Home,
  MapPin
} from 'lucide-react';
import loanIllustration from '../../assets/Teal Cooperative Loan Scheme Illustration.webp';

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

export default function BranchManagerLoanSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [interestTypeFilter, setInterestTypeFilter] = useState('all');
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

  // Fetch Available Loan Schemes from GET /branch-admin/loan-schemes
  const fetchLoanSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getBranchAdminLoanSchemes({ limit: 100 });
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('API getBranchAdminLoanSchemes error:', err.message);
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

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  const formatCharge = (amount, type) => {
    if (amount === undefined || amount === null) return '0';
    return type === 'percent' ? `${amount}%` : `₹${amount}`;
  };

  // Filter logic
  const filteredSchemes = schemes.filter((s) => {
    const sName = (s.scheme_name || s.name || '').toLowerCase();
    const sCode = (s.scheme_code || s.code || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    if (q && !sName.includes(q) && !sCode.includes(q)) return false;

    if (statusFilter === 'active' && s.is_active === false) return false;
    if (statusFilter === 'inactive' && s.is_active !== false) return false;

    if (interestTypeFilter !== 'all' && s.interest_type !== interestTypeFilter) {
      return false;
    }

    return true;
  });

  // Computed Key Stats (Matching Super Admin Loan Schemes Metrics)
  const totalCount = schemes.length;
  const activeCount = schemes.filter(s => s.is_active !== false).length;
  const maxCap = schemes.reduce((max, s) => Math.max(max, Number(s.max_loan_amount) || 0), 0);
  const avgRate = activeCount > 0
    ? (schemes.filter(s => s.is_active !== false).reduce((sum, s) => sum + (Number(s.annual_interest_rate) || 0), 0) / activeCount).toFixed(1)
    : '0';

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
      activeTab="loan_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Home className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: <strong className="font-bold text-teal-950">Branch Manager</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 text-slate-600 sm:text-[#0f766e]">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>{managerUser.branch_name || managerUser.branch || 'Kozhikode North Agro Hub'}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Liabilities Loan Schemes
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Manage and track various liabilities loan schemes offered by the cooperative society.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={loanIllustration}
              alt="Liabilities Loan Schemes Illustration"
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

        {/* 4 Summary Stat Cards */}
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

        {/* Main Schemes Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Society Credit Schemes Catalogue
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official loan products available for members at this branch
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scheme name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Interest Method Filter */}
              <select
                value={interestTypeFilter}
                onChange={(e) => {
                  setInterestTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="reducing_emi">Reducing EMI</option>
                <option value="flat">Flat Interest</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchLoanSchemes(true)}
                disabled={refreshing}
                title="Refresh scheme catalogue"
                className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
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

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Scheme Code</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Scheme Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Max Loan Amount</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Annual Rate</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Overdue Rate</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Grace Period</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Processing Fee</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Stamp Duty</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Insurance Fee</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">SMS Fee</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Created At</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="py-14 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        <span>Loading available loan schemes from registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-14 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Loan Schemes Found</p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusFilter !== 'all' || interestTypeFilter !== 'all'
                            ? 'Try clearing your search or filter options.'
                            : 'No credit products currently provisioned by apex administration.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSchemes.map((scheme) => {
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
                          <div className="text-[11px] text-slate-400 capitalize">
                            {(scheme.interest_type || 'reducing_emi').replace('_', ' ')}
                          </div>
                        </td>

                        {/* Maximum Loan Amount */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                          {formatCurrency(scheme.max_loan_amount)}
                        </td>

                        {/* Tenure */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-semibold">
                          {scheme.max_tenure_months || 0} mos
                        </td>

                        {/* Annual Interest Rate */}
                        <td className="py-4 px-3 text-center whitespace-nowrap font-bold text-teal-800">
                          {scheme.annual_interest_rate ?? 0}% p.a.
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
                          {formatCharge(scheme.processing_fee, scheme.processing_fee_type || 'percent')}
                        </td>

                        {/* Stamp Duty */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.stamp_duty_charge, scheme.stamp_duty_charge_type || 'percent')}
                        </td>

                        {/* Insurance Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.insurance_fee, scheme.insurance_fee_type || 'percent')}
                        </td>

                        {/* SMS Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.sms_charges, scheme.sms_charges_type || 'fixed')}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(scheme.created_at)}
                          </span>
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
                            title="View Complete Scheme Policy"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination & Counter */}
          {!loading && filteredSchemes.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium bg-slate-50/50">
              <span>
                Showing <strong className="text-slate-700">{paginatedSchemes.length}</strong> of{' '}
                <strong className="text-slate-700">{filteredSchemes.length}</strong> available loan schemes
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loan Scheme Detail Modal */}
      <LoanSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
