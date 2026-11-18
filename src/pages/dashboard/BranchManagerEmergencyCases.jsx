import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import EmergencyCaseThreadModal from '../../components/dashboard/EmergencyCaseThreadModal';
import {
  getBranchAdminEmergencyCases,
  createBranchAdminEmergencyCase,
  getBranchAdminEmergencyUnreadCount,
  notifyEmergencyUnreadUpdated,
  EMERGENCY_UNREAD_UPDATED_EVENT,
} from '../../services/emergencyService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import {
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Search,
  MessageSquare,
  Clock,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  Send,
  Eye,
  Flame,
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

export default function BranchManagerEmergencyCases() {
  const [cases, setCases] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: '', message: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Active Thread Modal
  const [activeCaseId, setActiveCaseId] = useState(null);

  // Current branch user from storage
  const [branchUser, setBranchUser] = useState(() => {
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

  const fetchCasesAndUnread = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [casesData, unreadData] = await Promise.all([
        getBranchAdminEmergencyCases({ limit: 100, search: searchQuery }),
        getBranchAdminEmergencyUnreadCount(),
      ]);

      setCases(Array.isArray(casesData) ? casesData : []);
      const count = Number(unreadData?.unread_count) || 0;
      setUnreadCount(count);
      notifyEmergencyUnreadUpdated({ role: 'branch_manager', count });
    } catch (err) {
      console.warn('Emergency cases fetch error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('branch_manager');
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
  }, [searchQuery]);

  useEffect(() => {
    const handleEmergencyUpdated = (e) => {
      const detail = e?.detail;
      const targetRole = detail?.role;
      if (!targetRole || targetRole === 'branch_manager' || targetRole === 'branch_admin') {
        if (typeof detail?.count === 'number') {
          setUnreadCount(detail.count);
        }
      }
    };

    window.addEventListener(EMERGENCY_UNREAD_UPDATED_EVENT || 'emergency-unread-updated', handleEmergencyUpdated);
    return () => {
      window.removeEventListener(EMERGENCY_UNREAD_UPDATED_EVENT || 'emergency-unread-updated', handleEmergencyUpdated);
    };
  }, []);

  const handleOpenCase = (caseItem) => {
    if (!caseItem) return;
    setActiveCaseId(caseItem.id);

    // If this case has unread messages, clear badge immediately in table & sidebar
    const unreadOnCase = Number(caseItem.unread_count) || 0;
    if (unreadOnCase > 0) {
      setCases((prev) =>
        prev.map((c) => (c.id === caseItem.id ? { ...c, unread_count: 0 } : c))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - unreadOnCase);
        notifyEmergencyUnreadUpdated({ role: 'branch_manager', count: next });
        return next;
      });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.message.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const created = await createBranchAdminEmergencyCase(createForm);
      setCreateModalOpen(false);
      setCreateForm({ subject: '', message: '' });
      setSuccessToast(`Emergency case #${created.id} created and dispatched to Superadmin HQ!`);
      setTimeout(() => setSuccessToast(null), 5000);
      fetchCasesAndUnread(true);
      setActiveCaseId(created.id);
    } catch (err) {
      setCreateError(err.message || 'Failed to open emergency case.');
    } finally {
      setCreating(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.id && String(c.id).includes(q)) ||
      (c.created_by?.full_name && c.created_by.full_name.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout role="branch_manager" user={branchUser} activeTab="emergency_cases">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="p-1 rounded-lg hover:bg-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <AlertOctagon className="w-4 h-4 text-[#00b4a7]" />
                <span>Superadmin Emergency Hotline</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">{branchUser.branch_name}</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Branch Emergency Cases
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">
              Open and monitor direct high-priority escalation cases with Superadmin HQ. Use this emergency channel for branch lockouts, urgent liquidity matters, or compliance alerts.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise Emergency Case</span>
              </button>

              <button
                type="button"
                onClick={() => fetchCasesAndUnread(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
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

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Total Emergency Cases"
            value={cases.length}
            valueClassName="text-xl sm:text-2xl font-semibold text-slate-900 tracking-normal font-sans"
            subtext="Escalations Raised by Branch"
            icon={ShieldAlert}
          />

          <StatCard
            title="Unread Superadmin Replies"
            value={unreadCount}
            valueClassName={
              unreadCount > 0
                ? 'text-xl sm:text-2xl font-bold text-amber-600 tracking-normal font-sans'
                : 'text-xl sm:text-2xl font-semibold text-emerald-600 tracking-normal font-sans'
            }
            subtext={unreadCount > 0 ? 'Urgent attention required' : 'All replies read'}
            icon={MessageSquare}
            trend={unreadCount > 0 ? `${unreadCount} Unread` : 'Clear'}
            trendType={unreadCount > 0 ? 'down' : 'up'}
          />

          <StatCard
            title="Channel Status"
            value="Connected"
            valueClassName="text-xl sm:text-2xl font-semibold text-emerald-600 tracking-normal font-sans"
            subtext="HQ Direct Priority Line"
            icon={CheckCircle2}
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
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/60">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Active Emergency Threads
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live communication cases established with Superadmin
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search case subject or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] text-xs sm:text-sm font-medium text-slate-800 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Raise Emergency Case</span>
              </button>
            </div>
          </div>

          {/* Cases List */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading branch emergency cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-20 text-center space-y-3 p-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0f766e] flex items-center justify-center mx-auto">
                <AlertOctagon className="w-7 h-7 text-[#00b4a7]" />
              </div>
              <p className="text-base font-bold text-slate-800">
                {searchQuery ? 'No matching emergency cases found' : 'No emergency cases raised'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you encounter a critical issue requiring Superadmin intervention, click &quot;Raise Emergency Case&quot; to open an immediate hotline.
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Raise Emergency Case</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Case ID</th>
                    <th className="py-3.5 px-6">Subject</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-center">Unread Messages</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCases.map((c) => {
                    const hasUnread = Number(c.unread_count) > 0;
                    return (
                      <tr key={c.id} className="hover:bg-teal-50/25 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#0f766e]">
                          #{c.id}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-slate-900 group-hover:text-[#0f766e] transition-colors">
                            {c.subject}
                          </p>
                          <span className="text-xs text-slate-400">
                            By {c.created_by?.full_name || 'Branch Admin'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(c.created_at)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {hasUnread ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-200 animate-pulse">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{c.unread_count} new reply</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">0 unread</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCase(c)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs rounded-xl border border-teal-200 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Conversation</span>
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

      {/* Create Emergency Case Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-[#0f766e] flex items-center justify-center font-bold">
                  <AlertOctagon className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Open Emergency Case
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Immediate notification sent to Superadmin HQ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4">
              {createError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Case Subject / Brief Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  minLength={2}
                  placeholder="e.g. Critical Cash Deficit at Agra Hub Vault"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] font-medium text-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Initial Message &amp; Emergency Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={5000}
                  minLength={1}
                  placeholder="Explain the urgent situation, root cause, and immediate assistance requested from Superadmin..."
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] font-medium text-slate-800 text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{creating ? 'Dispatching...' : 'Dispatch Emergency Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Conversation Modal */}
      <EmergencyCaseThreadModal
        isOpen={Boolean(activeCaseId)}
        caseId={activeCaseId}
        role="branch_admin"
        onClose={() => {
          setActiveCaseId(null);
          fetchCasesAndUnread(true);
        }}
        onCaseUpdated={() => fetchCasesAndUnread(true)}
      />
    </DashboardLayout>
  );
}
