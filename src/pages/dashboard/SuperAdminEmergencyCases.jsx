import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import EmergencyCaseThreadModal from '../../components/dashboard/EmergencyCaseThreadModal';
import {
  getSuperadminEmergencyCases,
  getSuperadminEmergencyUnreadCount,
} from '../../services/emergencyService';
import {
  getBranches as getSuperadminBranches,
  handleAuthExpired,
  isTokenExpiredError,
} from '../../services/branchService';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  MessageSquare,
  Clock,
  Building2,
  CheckCircle2,
  Loader2,
  X,
  Eye,
  Filter,
  Check,
  AlertOctagon,
} from 'lucide-react';

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
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function SuperAdminEmergencyCases() {
  const [cases, setCases] = useState([]);
  const [unreadInfo, setUnreadInfo] = useState({ total_unread_count: 0, branches: [] });
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Thread Modal
  const [activeCaseId, setActiveCaseId] = useState(null);

  const [superAdminUser] = useState(() => {
    try {
      const u = localStorage.getItem('superadmin_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        return {
          name: parsed.full_name || parsed.name || 'Super Admin',
          full_name: parsed.full_name || parsed.name || 'Super Admin',
          id: 'HQ-ADMIN',
          avatarText: 'SA',
          role: 'Super Admin',
          branch: 'Central Headquarters',
        };
      }
    } catch {}
    return {
      name: 'Super Admin',
      full_name: 'Super Admin',
      id: 'HQ-ADMIN',
      avatarText: 'SA',
      role: 'Super Admin',
      branch: 'Central Headquarters',
    };
  });

  // Load branches list
  useEffect(() => {
    getSuperadminBranches({ limit: 100 })
      .then((data) => {
        if (Array.isArray(data)) setBranchesList(data);
      })
      .catch(() => {});
  }, []);

  const fetchCasesAndUnread = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const branchIdParam = selectedBranchId !== 'all' ? selectedBranchId : null;
      const [casesData, unreadData] = await Promise.all([
        getSuperadminEmergencyCases({
          limit: 100,
          branch_id: branchIdParam,
          unread_only: unreadOnly,
          search: searchQuery,
        }),
        getSuperadminEmergencyUnreadCount(),
      ]);

      setCases(Array.isArray(casesData) ? casesData : []);
      setUnreadInfo(unreadData || { total_unread_count: 0, branches: [] });
    } catch (err) {
      console.warn('Superadmin emergency fetch error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('super_admin');
        return;
      }
      setError(err.message || 'Failed to load emergency cases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCasesAndUnread();
  }, [selectedBranchId, unreadOnly, searchQuery]);

  return (
    <DashboardLayout role="super_admin" user={superAdminUser} activeTab="emergency_cases">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <AlertOctagon className="w-4 h-4 text-[#00b4a7]" />
                <span>HQ Emergency Operations Center</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">All Registered Branches</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Branch Emergency Hotlines
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">
              Real-time hotline channels connecting all branch managers directly with Superadmin. Review crisis reports, vault security alerts, or urgent operational escalations.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => fetchCasesAndUnread(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Escalations</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-xl shadow-teal-500/25 flex-shrink-0">
            <AlertOctagon className="w-14 h-14 stroke-[1.8]" />
          </div>

          {/* Decorative background glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />
        </div>

        {/* 2 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Total Unread Messages"
            value={unreadInfo.total_unread_count}
            valueClassName={
              unreadInfo.total_unread_count > 0
                ? 'text-xl sm:text-2xl font-bold text-amber-600 tracking-normal font-sans'
                : 'text-xl sm:text-2xl font-semibold text-emerald-600 tracking-normal font-sans'
            }
            subtext={
              unreadInfo.total_unread_count > 0
                ? 'Requires Superadmin reply'
                : 'All incoming messages addressed'
            }
            icon={MessageSquare}
            trend={unreadInfo.total_unread_count > 0 ? `${unreadInfo.total_unread_count} Unread` : 'Clear'}
            trendType={unreadInfo.total_unread_count > 0 ? 'down' : 'up'}
          />

          <StatCard
            title="Total Emergency Cases"
            value={cases.length}
            valueClassName="text-xl sm:text-2xl font-semibold text-slate-900 tracking-normal font-sans"
            subtext="System-wide Branch Escalations"
            icon={ShieldAlert}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchCasesAndUnread(true)} className="underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Main List Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header Filter Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                All Branch Emergency Cases
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live communication threads escalated by individual branches
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Branch Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Branch:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6]"
                >
                  <option value="all">All Branches</option>
                  {branchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (#{b.branch_code || b.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unread Only Toggle */}
              <button
                type="button"
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  unreadOnly
                    ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Unread Only</span>
              </button>

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subject or case..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] text-xs font-medium text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Cases List */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading emergency cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="py-20 text-center space-y-3 p-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0f766e] flex items-center justify-center mx-auto">
                <AlertOctagon className="w-7 h-7 text-[#00b4a7]" />
              </div>
              <p className="text-base font-bold text-slate-800">No emergency cases found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {unreadOnly
                  ? 'There are no unread emergency messages awaiting HQ response.'
                  : 'No branch managers have opened an emergency case matching this filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Case ID</th>
                    <th className="py-3.5 px-6">Branch</th>
                    <th className="py-3.5 px-6">Subject</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-center">Unread Messages</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {cases.map((c) => {
                    const hasUnread = Number(c.unread_count) > 0;
                    return (
                      <tr key={c.id} className="hover:bg-teal-50/25 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#0f766e] whitespace-nowrap">
                          #{c.id}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-slate-900 leading-tight">
                            {c.branch?.name || 'Society Branch'}
                          </p>
                          <span className="text-xs text-slate-400">
                            Code: #{c.branch?.branch_code || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-slate-900 group-hover:text-[#0f766e] transition-colors">
                            {c.subject}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(c.created_at)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {hasUnread ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-200 animate-pulse">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{c.unread_count} new</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">All Read</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setActiveCaseId(c.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Reply / View Hotline</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Live Conversation Modal */}
      <EmergencyCaseThreadModal
        isOpen={Boolean(activeCaseId)}
        caseId={activeCaseId}
        role="super_admin"
        onClose={() => setActiveCaseId(null)}
        onCaseUpdated={() => fetchCasesAndUnread(false)}
      />
    </DashboardLayout>
  );
}
