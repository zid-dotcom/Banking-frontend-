import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import SecurityEventDetailModal from '../../components/dashboard/SecurityEventDetailModal';
import {
  getBranchAdminSecurityEvents,
  formatSecurityEventType,
  getSecurityEventTypeBadge,
  formatAccountRole,
} from '../../services/securityService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Building2,
  Calendar,
  Lock,
  Clock,
  Laptop,
  Globe,
  Loader2,
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

export default function BranchManagerSecurityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedSucceeded, setSelectedSucceeded] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [branchUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        return {
          name: parsed.full_name || parsed.name || 'Branch Manager',
          full_name: parsed.full_name || parsed.name || 'Branch Manager',
          id: parsed.id || 'MGR-001',
          user_code: parsed.user_code || 'MGR-001',
          avatarText: (parsed.full_name || parsed.name || 'BM')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          role: parsed.role || 'Branch Manager',
          branch: parsed.branch?.name || parsed.branch_name || 'Society Branch',
          branch_name: parsed.branch?.name || parsed.branch_name || 'Society Branch',
          branch_code: parsed.branch?.branch_code || parsed.branch_code || 'BRA-01',
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      avatarText: 'BM',
      role: 'Branch Manager',
      branch: 'Society Branch',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01',
    };
  });

  const fetchBranchEvents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getBranchAdminSecurityEvents({
        limit: 200,
        from_date: fromDate ? new Date(fromDate).toISOString() : null,
        to_date: toDate ? new Date(toDate).toISOString() : null,
      });

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Branch security events fetch error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('branch_manager');
        return;
      }
      setError(err.message || 'Failed to load branch security events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranchEvents();
  }, [fromDate, toDate]);

  // Derived metrics from full events dataset
  const totalCount = events.length;
  const suspiciousCount = events.filter((e) => e.is_suspicious).length;
  const succeededCount = events.filter((e) => e.succeeded).length;
  const failedCount = events.filter((e) => !e.succeeded).length;

  // Real-time client-side filter
  const filteredEvents = events.filter((ev) => {
    // 1. Role Filter (properly handles branch_manager / branch_admin aliases)
    if (selectedRole !== 'all') {
      const rawRole = (ev.account_role || '').toLowerCase().replace(/[\s_-]+/g, '');
      if (selectedRole === 'member') {
        if (!rawRole.includes('member')) return false;
      } else if (selectedRole === 'branch_manager' || selectedRole === 'branch_admin') {
        if (!rawRole.includes('branch') && !rawRole.includes('manager')) return false;
      } else if (selectedRole === 'staff') {
        if (!rawRole.includes('staff')) return false;
      }
    }

    // 2. Outcome Filter
    if (selectedSucceeded !== 'all') {
      const isSuccess = selectedSucceeded === 'true';
      if (Boolean(ev.succeeded) !== isSuccess) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const roleFormatted = formatAccountRole(ev.account_role).toLowerCase();
      const match =
        (ev.user_name && ev.user_name.toLowerCase().includes(q)) ||
        (ev.user_code && ev.user_code.toLowerCase().includes(q)) ||
        (ev.account_role && ev.account_role.toLowerCase().includes(q)) ||
        roleFormatted.includes(q) ||
        (ev.event_type && ev.event_type.toLowerCase().includes(q)) ||
        (ev.ip_address && ev.ip_address.toLowerCase().includes(q)) ||
        (ev.details && String(ev.details).toLowerCase().includes(q)) ||
        String(ev.id).includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <DashboardLayout role="branch_manager" user={branchUser} activeTab="security_events">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                <span>Branch Security &amp; Access Center</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">{branchUser.branch_name}</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Branch Security Audit Events
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">
              Review authentication logs, sensitive member access, credential updates, and staff security activities occurring within {branchUser.branch_name}.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => fetchBranchEvents(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-xl shadow-teal-500/25 flex-shrink-0">
            <ShieldCheck className="w-14 h-14 stroke-[1.8]" />
          </div>

          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Total Security Events"
            value={totalCount}
            valueClassName="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal font-sans"
            subtext="Audit log entries"
            icon={ShieldCheck}
          />

          <StatCard
            title="Suspicious Flags"
            value={suspiciousCount}
            valueClassName={
              suspiciousCount > 0
                ? 'text-xl sm:text-2xl font-bold text-amber-600 tracking-normal font-sans'
                : 'text-xl sm:text-2xl font-bold text-emerald-600 tracking-normal font-sans'
            }
            subtext="Anomalies detected"
            icon={AlertTriangle}
          />

          <StatCard
            title="Successful Actions"
            value={succeededCount}
            valueClassName="text-xl sm:text-2xl font-bold text-emerald-600 tracking-normal font-sans"
            subtext="Authorized & verified"
            icon={CheckCircle2}
          />

          <StatCard
            title="Failed Attempts"
            value={failedCount}
            valueClassName={
              failedCount > 0
                ? 'text-xl sm:text-2xl font-bold text-rose-600 tracking-normal font-sans'
                : 'text-xl sm:text-2xl font-bold text-slate-600 tracking-normal font-sans'
            }
            subtext="Denied / rejected"
            icon={XCircle}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchBranchEvents(true)} className="underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Security Events Table Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header Filter Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4 bg-slate-50/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Branch Security Log
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Showing {filteredEvents.length} security events recorded for {branchUser.branch_name}
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, IP, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6]"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              {/* Account Role Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#14b8a6]"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Member</option>
                  <option value="staff">Branch Staff</option>
                  <option value="branch_manager">Branch Manager</option>
                </select>
              </div>

              {/* Outcome / Result */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Outcome
                </label>
                <select
                  value={selectedSucceeded}
                  onChange={(e) => setSelectedSucceeded(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#14b8a6]"
                >
                  <option value="all">All Results</option>
                  <option value="true">Succeeded</option>
                  <option value="false">Failed / Denied</option>
                </select>
              </div>

              {/* Clear Filters Reset */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('all');
                    setSelectedSucceeded('all');
                    setSearchQuery('');
                    setFromDate('');
                    setToDate('');
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 text-center transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0f766e] mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Fetching branch security events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No branch security events found</p>
              <p className="text-xs text-slate-400">
                {events.length > 0
                  ? 'No records match your selected role or filter criteria.'
                  : 'Security activities for your branch members and staff will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Event ID</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">User &amp; Role</th>
                    <th className="py-3.5 px-6">Event Type</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Risk Level</th>
                    <th className="py-3.5 px-6">Client IP</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEvents.map((ev) => {
                    const badge = getSecurityEventTypeBadge(ev.event_type);
                    return (
                      <tr key={ev.id} className="hover:bg-teal-50/25 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#0f766e] whitespace-nowrap">
                          #{ev.id}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(ev.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-slate-900 group-hover:text-[#0f766e] transition-colors leading-tight">
                            {ev.user_name || 'Anonymous User'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            {ev.user_code && <span>{ev.user_code} • </span>}
                            <span className="capitalize font-semibold text-slate-500">
                              {formatAccountRole(ev.account_role)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{formatSecurityEventType(ev.event_type)}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {ev.succeeded ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Success</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {ev.is_suspicious ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Suspicious</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Normal</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {ev.ip_address || '—'}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs rounded-xl border border-teal-200 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
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

      {/* Security Event Dossier Modal */}
      <SecurityEventDetailModal
        isOpen={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </DashboardLayout>
  );
}
