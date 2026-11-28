import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import SecurityEventDetailModal from '../../components/dashboard/SecurityEventDetailModal';
import {
  getMemberSecurityEvents,
  formatSecurityEventType,
  getSecurityEventTypeBadge,
} from '../../services/securityService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Clock,
  Laptop,
  Globe,
  Loader2,
  KeyRound,
  FileCheck2,
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

export default function MemberSecurityEvents() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSucceeded, setSelectedSucceeded] = useState('all');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [memberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        return {
          name: parsed.full_name || parsed.name || 'Member',
          full_name: parsed.full_name || parsed.name || 'Member',
          id: parsed.member_code || (parsed.id ? `MEM-${parsed.id}` : 'AFX-MEM-8842'),
          member_code: parsed.member_code || '',
          email: parsed.email || '',
          role: 'Member',
          avatarText: (parsed.full_name || parsed.name || 'MB')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          branch: parsed.branch?.name || (typeof parsed.branch === 'string' ? parsed.branch : 'Society Branch'),
          branch_name: parsed.branch?.name || (typeof parsed.branch === 'string' ? parsed.branch : 'Society Branch'),
        };
      }
    } catch {}
    return {
      name: 'Member',
      full_name: 'Member',
      id: 'AFX-MEM-8842',
      email: '',
      role: 'Member',
      avatarText: 'MB',
      branch: 'Society Branch',
      branch_name: 'Society Branch',
    };
  });

  const fetchMemberEvents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const succeededParam =
        selectedSucceeded === 'true' ? true : selectedSucceeded === 'false' ? false : null;

      const data = await getMemberSecurityEvents({
        limit: 100,
        succeeded: succeededParam,
      });

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Member security events fetch error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('member');
        return;
      }
      setError(err.message || 'Failed to load security activity logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemberEvents();
  }, [selectedSucceeded]);

  const totalCount = events.length;
  const suspiciousCount = events.filter((e) => e.is_suspicious).length;
  const succeededCount = events.filter((e) => e.succeeded).length;
  const lastEvent = events[0];

  return (
    <DashboardLayout role="member" user={memberUser} activeTab="security_events">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                <span>{t("memberSecurityEvents.accountProtectionAccessLog", "Account Protection & Access Log")}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">{t("memberSecurityEvents.memberSecurityLedger", "Member Security Ledger")}</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t("memberSecurityEvents.accountSecurityActivityHistory", "Account Security & Activity History")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">
              {t("memberSecurityEvents.reviewYourSignInHistory", "Review your sign-in history, recognized devices, IP addresses, and account authentication records. Promptly notify your branch if you observe unfamiliar activity.")}
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => fetchMemberEvents(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{t("memberSecurityEvents.refreshActivity", "Refresh Activity")}</span>
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
            title={t("branchManagerSecurityEvents.totalSecurityEvents", "Total Security Events")}
            value={totalCount}
            valueClassName="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal font-sans"
            subtext="Audit history entries"
            icon={ShieldCheck}
          />

          <StatCard
            title={t("memberSecurityEvents.verifiedAccess", "Verified Access")}
            value={succeededCount}
            valueClassName="text-xl sm:text-2xl font-bold text-emerald-600 tracking-normal font-sans"
            subtext="Successful sign-ins & updates"
            icon={CheckCircle2}
          />

          <StatCard
            title={t("branchManagerSecurityEvents.suspiciousFlags", "Suspicious Flags")}
            value={suspiciousCount}
            valueClassName={
              suspiciousCount > 0
                ? 'text-xl sm:text-2xl font-bold text-amber-600 tracking-normal font-sans'
                : 'text-xl sm:text-2xl font-bold text-emerald-600 tracking-normal font-sans'
            }
            subtext={suspiciousCount > 0 ? 'Requires attention' : 'Account secure'}
            icon={AlertTriangle}
          />

          <StatCard
            title={t("memberSecurityEvents.lastSignInIp", "Last Sign-in IP")}
            value={lastEvent?.ip_address || '—'}
            valueClassName="text-sm sm:text-base font-mono font-bold text-slate-900 tracking-normal font-sans truncate"
            subtext={lastEvent ? formatDateTime(lastEvent.created_at) : 'No recent login'}
            icon={Globe}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchMemberEvents(true)} className="underline cursor-pointer">
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Security Events Table Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header Filter Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4 bg-slate-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {t("memberSecurityEvents.authenticationAccessLog", "Authentication & Access Log")}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t("common.showing", "Showing")} {events.length} {t("memberSecurityEvents.securityEventsRecordedForYour", "security events recorded for your member folio")}
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                <select
                  value={selectedSucceeded}
                  onChange={(e) => setSelectedSucceeded(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#14b8a6]"
                >
                  <option value="all">{t("memberSecurityEvents.allOutcomes", "All Outcomes")}</option>
                  <option value="true">{t("memberSecurityEvents.succeededOnly", "Succeeded Only")}</option>
                  <option value="false">{t("memberSecurityEvents.failedOnly", "Failed Only")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0f766e] mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">{t("memberSecurityEvents.loadingYourSecurityActivityLog", "Loading your security activity log...")}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">{t("memberSecurityEvents.noSecurityEventsFound", "No security events found")}</p>
              <p className="text-xs text-slate-400">
                {t("memberSecurityEvents.yourSignInActivitiesAnd", "Your sign-in activities and authentication records will be shown here.")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("branchManagerSecurityEvents.eventId", "Event ID")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSecurityEvents.timestamp", "Timestamp")}</th>
                    <th className="py-3.5 px-6">{t("memberSecurityEvents.activityType", "Activity Type")}</th>
                    <th className="py-3.5 px-6 text-center">{t("branchManagerSecurityEvents.outcome", "Outcome")}</th>
                    <th className="py-3.5 px-6 text-center">{t("memberSecurityEvents.securityStatus", "Security Status")}</th>
                    <th className="py-3.5 px-6">{t("memberSecurityEvents.ipAddress", "IP Address")}</th>
                    <th className="py-3.5 px-6 text-right">{t("dashboardModule.monthlyTargets.details", "Details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {events.map((ev) => {
  const { t } = useTranslation();
                    const badge = getSecurityEventTypeBadge(ev.event_type);
                    return (
                      <tr key={ev.id} className="hover:bg-teal-50/25 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#0f766e] whitespace-nowrap">
                          #{ev.id}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(ev.created_at)}
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
                              <span>{t("branchManagerSecurityEvents.success", "Success")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{t("branchManagerSecurityEvents.failed", "Failed")}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {ev.is_suspicious ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>{t("branchManagerSecurityEvents.suspicious", "Suspicious")}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {t("branchManagerSecurityEvents.normal", "Normal")}
                            </span>
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
                            <span>{t("branchManagerSecurityEvents.viewDossier", "View Dossier")}</span>
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
