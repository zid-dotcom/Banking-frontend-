import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getBranchAdminEmergencyCase,
  sendBranchAdminEmergencyMessage,
  getSuperadminEmergencyCase,
  sendSuperadminEmergencyMessage,
} from '../../services/emergencyService';
import {
  X,
  Send,
  Loader2,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  User,
  ShieldAlert,
  Flame,
  Check,
  CheckCheck,
  RefreshCw,
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

export default function EmergencyCaseThreadModal({
  isOpen,
  caseId,
  role = 'branch_admin', // 'branch_admin' | 'super_admin'
  onClose,
  onCaseUpdated,
}) {
  const { t } = useTranslation();
  const [caseDetail, setCaseDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Send message
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDetail = async (isManual = false) => {
    if (!caseId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let data = null;
      if (role === 'super_admin') {
        data = await getSuperadminEmergencyCase(caseId);
      } else {
        data = await getBranchAdminEmergencyCase(caseId);
      }
      setCaseDetail(data);
      if (onCaseUpdated) {
        onCaseUpdated(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load emergency conversation.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && caseId) {
      fetchDetail();
    } else {
      setCaseDetail(null);
      setError(null);
      setReplyText('');
      setSendError(null);
    }
  }, [isOpen, caseId]);

  useEffect(() => {
    if (caseDetail?.messages?.length) {
      scrollToBottom();
    }
  }, [caseDetail?.messages?.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(null);

    try {
      let updatedData = null;
      if (role === 'super_admin') {
        updatedData = await sendSuperadminEmergencyMessage(caseId, { message: text });
      } else {
        updatedData = await sendBranchAdminEmergencyMessage(caseId, { message: text });
      }

      setReplyText('');
      if (updatedData) {
        setCaseDetail(updatedData);
      } else {
        fetchDetail(true);
      }

      if (onCaseUpdated) {
        onCaseUpdated(updatedData);
      }
    } catch (err) {
      setSendError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const branch = caseDetail?.branch;
  const createdBy = caseDetail?.created_by;
  const messages = Array.isArray(caseDetail?.messages) ? caseDetail.messages : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[90vh] max-h-[820px]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold flex-shrink-0">
              <AlertOctagon className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#0f766e]">
                  {t("emergencyCaseThreadModal.case", "Case #")}{caseId}
                </span>
                {branch && (
                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    {branch.name} {branch.branch_code ? `(#${branch.branch_code})` : ''}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug truncate mt-0.5">
                {caseDetail?.subject || 'Emergency Case Escalation'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchDetail(true)}
              disabled={refreshing}
              title={t("emergencyCaseThreadModal.refreshConversation", "Refresh conversation")}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00b4a7]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header info bar */}
        {caseDetail && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("emergencyCaseThreadModal.openedBy", "Opened by:")}</span>
                <strong className="text-slate-800">{createdBy?.full_name || 'Branch Admin'}</strong>
                <span className="text-slate-400">({createdBy?.email || 'branch admin'})</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{t("emergencyCaseThreadModal.created", "Created")} {formatDateTime(caseDetail.created_at)}</span>
            </div>
          </div>
        )}

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">{t("emergencyCaseThreadModal.loadingEmergencyConversationThread", "Loading emergency conversation thread...")}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchDetail(true)}
                className="underline font-bold hover:text-red-900 cursor-pointer"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-slate-400">
              <AlertOctagon className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">{t("emergencyCaseThreadModal.noMessagesInThisCase", "No messages in this case yet.")}</p>
              <p className="text-xs text-slate-400">{t("emergencyCaseThreadModal.sendAMessageBelowTo", "Send a message below to start the conversation.")}</p>
            </div>
          ) : (
            messages.map((msg) => {
  const { t } = useTranslation();
              const sender = msg.sender || {};
              const senderRole = (sender.role || '').toLowerCase();
              const isSuperAdminSender =
                senderRole.includes('super') ||
                senderRole.includes('superadmin') ||
                senderRole.includes('admin') && !senderRole.includes('branch');

              // In branch_admin view: my messages are right-aligned (Branch Admin)
              // In super_admin view: my messages are right-aligned (Super Admin)
              const isMine =
                role === 'super_admin' ? isSuperAdminSender : !isSuperAdminSender;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-black tracking-tight text-slate-600">
                      {isSuperAdminSender ? t("login.superAdmin.portalTitleLine1", "Super Admin") : sender.full_name || 'Branch Manager'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isSuperAdminSender
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {isSuperAdminSender ? t("emergencyCaseThreadModal.hqSuperadmin", "HQ / Superadmin") : t("dashboard.branch", "Branch")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-xs text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                      isMine
                        ? 'bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] px-1">
                    {msg.is_read ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCheck className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                        <span>{t("dashboardModule.branchOverview.read", "Read")}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                        <Check className="w-3 h-3 stroke-[2] text-slate-400" />
                        <span>{t("memberNotifications.unread", "Unread")}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 border-t border-slate-200 bg-white flex-shrink-0 space-y-2"
        >
          {sendError && (
            <p className="text-xs text-red-600 font-semibold px-1">{sendError}</p>
          )}

          <div className="flex items-center gap-2">
            <textarea
              rows={2}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                role === 'super_admin'
                  ? t("emergencyCaseThreadModal.typeASuperadminResponseTo", "Type a Superadmin response to this branch...")
                  : t("emergencyCaseThreadModal.typeAnUrgentReplyOr", "Type an urgent reply or update for Superadmin...")
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] text-xs sm:text-sm text-slate-800 font-medium resize-none"
            />

            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("emergencyCaseThreadModal.send", "Send")}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 px-1">
            {t("emergencyCaseThreadModal.press", "Press")} <kbd className="font-sans px-1 bg-slate-100 rounded text-slate-500">{t("emergencyCaseThreadModal.enter", "Enter")}</kbd> {t("emergencyCaseThreadModal.toSend", "to send,")} <kbd className="font-sans px-1 bg-slate-100 rounded text-slate-500">{t("emergencyCaseThreadModal.shiftEnter", "Shift + Enter")}</kbd> {t("emergencyCaseThreadModal.forANewLineMessages", "for a new line. Messages are transmitted with high emergency priority.")}
          </p>
        </form>
      </div>
    </div>
  );
}
