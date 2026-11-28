import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Globe,
  Laptop,
  FileText,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  formatSecurityEventType,
  getSecurityEventTypeBadge,
  formatAccountRole,
} from '../../services/securityService';

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
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function SecurityEventDetailModal({ isOpen, event, onClose }) {
  const { t } = useTranslation();
  if (!isOpen || !event) return null;

  const typeBadge = getSecurityEventTypeBadge(event.event_type);
  const isSuspicious = Boolean(event.is_suspicious);
  const succeeded = Boolean(event.succeeded);

  // Format details if JSON string
  let parsedDetails = null;
  if (event.details) {
    try {
      parsedDetails = typeof event.details === 'object' ? event.details : JSON.parse(event.details);
    } catch {
      parsedDetails = event.details;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold ${
                isSuspicious
                  ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-rose-500/20'
                  : succeeded
                  ? 'bg-gradient-to-br from-[#14b8a6] to-[#0f766e] shadow-teal-500/20'
                  : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20'
              }`}
            >
              {isSuspicious ? (
                <ShieldAlert className="w-5 h-5 stroke-[2]" />
              ) : (
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#0f766e]">
                  {t("securityEventDetailModal.event", "Event #")}{event.id}
                </span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeBadge.bg}`}>
                  {formatSecurityEventType(event.event_type)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {t("securityEventDetailModal.securityAuditDossier", "Security Audit Dossier")}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Suspicious Alert Flag Banner */}
          {isSuspicious && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm text-amber-900">
                  {t("securityEventDetailModal.suspiciousActivityFlagged", "Suspicious Activity Flagged")}
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed font-medium">
                  {t("securityEventDetailModal.thisTransactionOrAccessAttempt", "This transaction or access attempt triggered automated anomaly detection rules (e.g. unexpected IP, velocity limit, or repeated credential failure).")}
                </p>
              </div>
            </div>
          )}

          {/* Status & Outcome Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("securityEventDetailModal.resultStatus", "Result Status")}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {succeeded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">{t("branchManagerSecurityEvents.succeeded", "Succeeded")}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="font-extrabold text-rose-700 text-xs sm:text-sm">{t("branchManagerSecurityEvents.failedDenied", "Failed / Denied")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("securityEventDetailModal.riskAssessment", "Risk Assessment")}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isSuspicious ? (
                  <span className="font-extrabold text-amber-600 text-xs sm:text-sm">{t("securityEventDetailModal.highSuspicious", "High / Suspicious")}</span>
                ) : (
                  <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">{t("securityEventDetailModal.normalVerified", "Normal / Verified")}</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("branchManagerSecurityEvents.timestamp", "Timestamp")}</p>
              <p className="font-bold text-slate-800 text-xs mt-1 truncate" title={formatDateTime(event.created_at)}>
                {formatDateTime(event.created_at)}
              </p>
            </div>
          </div>

          {/* User & Actor Details */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-[#00b4a7]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("securityEventDetailModal.userActorContext", "User & Actor Context")}</h4>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">{t("securityEventDetailModal.targetUser", "Target User:")}</span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {event.user_name || '—'} {event.user_code ? `(${event.user_code})` : ''}
                </p>
                {event.user_id && <span className="text-[11px] text-slate-400">{t("securityEventDetailModal.userId", "User ID: #")}{event.user_id}</span>}
              </div>

              <div>
                <span className="text-slate-400 font-medium">{t("securityEventDetailModal.accountRole", "Account Role:")}</span>
                <p className="font-extrabold text-[#0f766e] capitalize mt-0.5">
                  {formatAccountRole(event.account_role)}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">{t("securityEventDetailModal.actorInitiator", "Actor / Initiator:")}</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {event.actor_name || event.user_name || 'System / Direct'}
                </p>
                {event.actor_user_id && (
                  <span className="text-[11px] text-slate-400">{t("securityEventDetailModal.actorId", "Actor ID: #")}{event.actor_user_id}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-medium">{t("securityEventDetailModal.branchAffiliation", "Branch Affiliation:")}</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {event.branch_name || 'Central HQ / Global'}
                </p>
                {event.branch_id && (
                  <span className="text-[11px] text-slate-400">{t("securityEventDetailModal.branchId", "Branch ID: #")}{event.branch_id}</span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Network Information */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00b4a7]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("securityEventDetailModal.networkDeviceDetails", "Network & Device Details")}</h4>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-500 font-medium">{t("securityEventDetailModal.clientIpAddress", "Client IP Address:")}</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {event.ip_address || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">{t("securityEventDetailModal.userAgentString", "User Agent String:")}</span>
                <p className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 break-all">
                  {event.user_agent || 'Unknown Client Device'}
                </p>
              </div>
            </div>
          </div>

          {/* Details / Payload Record */}
          {event.details && (
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00b4a7]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("securityEventDetailModal.eventDetailsPayload", "Event Details Payload")}</h4>
              </div>
              <div className="p-4">
                <pre className="font-mono text-[11px] text-slate-800 bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto leading-relaxed">
                  {typeof parsedDetails === 'object'
                    ? JSON.stringify(parsedDetails, null, 2)
                    : String(parsedDetails)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("securityEventDetailModal.closeDossier", "Close Dossier")}
          </button>
        </div>
      </div>
    </div>
  );
}
