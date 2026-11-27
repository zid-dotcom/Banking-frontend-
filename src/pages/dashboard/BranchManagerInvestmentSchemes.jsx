import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  InvestmentSchemeDetailModal,
  formatInterestRate
} from '../../components/dashboard/InvestmentSchemeModals';
import { getBranchAdminInvestmentSchemes } from '../../services/investmentSchemeService';
import {
  TrendingUp,
  Coins,
  PiggyBank,
  Percent,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Landmark
} from 'lucide-react';

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
    maximumFractionDigits: 0,
  }).format(val);
}

export default function BranchManagerInvestmentSchemes({ embedded = false }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
          role: 'Branch Manager',
          branch: bName,
          branch_name: bName,
          branch_code: bCode,
          location: bLoc,
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      branch: 'Society Branch',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
    };
  });

  const fetchSchemes = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getBranchAdminInvestmentSchemes({
        frequency: frequencyFilter !== 'all' ? frequencyFilter : undefined,
      });
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch branch investment schemes:', err);
      setError(err.message || 'Unable to retrieve investment schemes for this branch.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [frequencyFilter]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
        (s.scheme_code && s.scheme_code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      const matchesFrequency =
        frequencyFilter === 'all' ||
        String(s.contribution_frequency || '').toLowerCase() === frequencyFilter.toLowerCase();

      return matchesSearch && matchesFrequency;
    });
  }, [schemes, searchQuery, frequencyFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = schemes.length;
    const daily = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'daily'
    ).length;
    const weekly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'weekly'
    ).length;
    const monthly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'monthly'
    ).length;

    return { total, daily, weekly, monthly };
  }, [schemes]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchemes.slice(start, start + itemsPerPage);
  }, [filteredSchemes, currentPage]);

  const content = (
    <div className="space-y-6">
      {/* Banner Section (Same color as FD/MIS section, without image) */}
      <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 flex-1 max-w-2xl w-full">
          {/* Pill Badge */}
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
            <span className="inline-flex items-center gap-1.5 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>Role: <strong className="font-bold text-teal-950">Branch Manager</strong></span>
            </span>
            <span className="text-teal-300 hidden sm:inline">•</span>
            <span className="text-slate-600 sm:text-[#0f766e]">{managerUser.branch_name}</span>
            <span className="text-teal-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Branch Investment Schemes
            </h1>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
            Review authorized recurring investment deposit plans available for enrollment across <strong className="text-slate-800">{managerUser.branch_name}</strong>. Members can enroll in daily, weekly, or monthly contribution schemes with guaranteed cooperative interest.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => fetchSchemes(true)}
            disabled={loading || refreshing}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-teal-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Catalogue</span>
          </button>
        </div>

        {/* Decorative ambient gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Schemes"
          value={stats.total}
          icon={TrendingUp}
          variant="emerald"
          subtitle="Branch approved schemes"
        />
        <StatCard
          title="Daily Schemes"
          value={stats.daily}
          icon={Coins}
          variant="teal"
          subtitle="Micro deposit plans"
        />
        <StatCard
          title="Weekly Schemes"
          value={stats.weekly}
          icon={Calendar}
          variant="blue"
          subtitle="7-day recurring plans"
        />
        <StatCard
          title="Monthly Schemes"
          value={stats.monthly}
          icon={PiggyBank}
          variant="purple"
          subtitle="Monthly periodic plans"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search investment schemes by title, code or terms..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Frequency Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Frequency:
          </span>
          {[
            { id: 'all', label: 'All Frequencies' },
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
          ].map((f) => {
            const isActive = frequencyFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFrequencyFilter(f.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchSchemes()}
            className="font-bold underline text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Schemes Catalogue Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-black text-slate-900 text-base">
              Authorized Investment Schemes
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing {filteredSchemes.length} of {schemes.length} schemes
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading branch investment schemes...</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No Investment Schemes Available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || frequencyFilter !== 'all'
                ? 'No schemes matched your active filter. Try resetting search or frequency filters.'
                : 'No active investment schemes are currently authorized for this branch.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Scheme Name</th>
                    <th className="py-3 px-4">Scheme Code</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Installment</th>
                    <th className="py-3 px-4">Investment Duration</th>
                    <th className="py-3 px-4">Annual Interest Rate</th>
                    <th className="py-3 px-4">Est. Total Principal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSchemes.map((scheme) => {
                    const schemeId = scheme.id || scheme.scheme_id;
                    const freq = String(scheme.contribution_frequency || 'daily').toLowerCase();
                    const estTotal =
                      (Number(scheme.installment_amount) || 0) *
                      (parseInt(scheme.tenure_installments, 10) || 0);

                    const freqBadges = {
                      daily: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                      weekly: 'bg-blue-50 text-blue-700 border-blue-200/60',
                      monthly: 'bg-purple-50 text-purple-700 border-purple-200/60',
                    };

                    return (
                      <tr key={schemeId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          {scheme.scheme_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 inline-block">
                            {scheme.scheme_code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                              freqBadges[freq] || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {freq}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatCurrency(scheme.installment_amount)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {scheme.tenure_installments}{' '}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {freq === 'daily' ? 'Days' : freq === 'weekly' ? 'Weeks' : freq === 'monthly' ? 'Months' : 'Days'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600">
                          {formatInterestRate(scheme.annual_interest_rate)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {formatCurrency(estTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              scheme.is_active !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                scheme.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{scheme.is_active !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Detail Modal */}
      <InvestmentSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout role="branch_manager" activeTab="investment_schemes">
      {content}
    </DashboardLayout>
  );
}
