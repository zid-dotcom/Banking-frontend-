import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Headset,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import {
  getStaffCustomerServiceRequest,
  replyToStaffCustomerServiceRequest,
  updateStaffCustomerServiceRequestStatus
} from '../../services/serviceRequestService';

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

function normalizeStatus(st) {
  const s = String(st || '').toLowerCase().trim();
  if (s === 'open' || s === 'pending') return 'pending';
  if (s === 'resolved' || s === 'closed' || s === 'completed' || s === 'solved') return 'solved';
  if (s === 'in_progress') return 'in_progress';
  return 'pending';
}

function getSenderRoleLabel(sender, rep) {
  // 1. If staff_role object or string is provided
  const staffRoleName =
    sender?.staff_role?.name ||
    (typeof sender?.staff_role === 'string' ? sender.staff_role : null) ||
    rep?.staff_role?.name ||
    (typeof rep?.staff_role === 'string' ? rep.staff_role : null);
  if (staffRoleName) {
    return staffRoleName;
  }

  // 2. Sender role string
  const role = String(
    sender?.role ||
    rep?.replied_by_role ||
    rep?.author_type ||
    rep?.role ||
    rep?.author ||
    ''
  ).toLowerCase().trim();

  if (role === 'branch_admin' || role === 'branch_manager') {
    return 'Branch Manager';
  }
  if (role === 'super_admin' || role === 'superadmin' || role === 'admin') {
    return 'Main Administration';
  }
  if (role === 'customer_service' || role === 'cso' || role.includes('customer')) {
    return 'Customer Service Officer';
  }
  if (role === 'accountant') {
    return 'Accountant';
  }
  if (role === 'cashier') {
    return 'Cashier';
  }
  if (role === 'member') {
    return 'Member';
  }

  // 3. Sender full_name checks
  if (sender?.full_name?.toLowerCase() === 'super admin') {
    return 'Main Administration';
  }

  // Fallback to formatted role if available
  if (role) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return rep?.is_member ? 'Member' : 'Branch Staff';
}

export function StaffServiceRequestModal({
  isOpen,
  onClose,
  request,
  onUpdated,
  showToast
}) {
  const { t } = useTranslation();
  const [currentRequest, setCurrentRequest] = useState(request);
  const [status, setStatus] = useState(() => normalizeStatus(request?.status));
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Reply
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const reqId = currentRequest?.id || currentRequest?.request_id || currentRequest?.ticket_id;

  const loadFullDetails = async (id) => {
    if (!id) return;
    setLoadingDetails(true);
    try {
      const data = await getStaffCustomerServiceRequest(id);
      if (data) {
        setCurrentRequest(data);
        setStatus(normalizeStatus(data.status));
      }
    } catch (err) {
      console.warn('Could not load staff service request full details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (request && isOpen) {
      setCurrentRequest(request);
      setStatus(normalizeStatus(request?.status));
      setReplyText('');
      setReplyError(null);
      loadFullDetails(request.id || request.request_id || request.ticket_id);
    }
  }, [request, isOpen]);

  if (!isOpen || !currentRequest) return null;

  const memberName =
    currentRequest.member?.full_name ||
    currentRequest.member?.name ||
    currentRequest.member_name ||
    currentRequest.user_name ||
    'Cooperative Member';
  const memberCode =
    currentRequest.member?.user_code ||
    currentRequest.member?.member_code ||
    currentRequest.member_code ||
    (currentRequest.member_id ? `MEM-${currentRequest.member_id}` : '');
  const memberEmail = currentRequest.member?.email || currentRequest.member_email || '';
  const memberPhone =
    currentRequest.member?.mobile ||
    currentRequest.member?.phone ||
    currentRequest.member_phone ||
    '';

  // Parse replies from various possible backend structures
  const replies = Array.isArray(currentRequest.replies)
    ? currentRequest.replies
    : Array.isArray(currentRequest.responses)
    ? currentRequest.responses
    : currentRequest.reply
    ? [
        {
          id: 'initial-reply',
          message: currentRequest.reply,
          created_at: currentRequest.updated_at || currentRequest.created_at,
          author: 'Customer Service Officer'
        }
      ]
    : [];

  // Update Request Status
  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await updateStaffCustomerServiceRequestStatus(reqId, newStatus);
      setStatus(newStatus);
      const updated = {
        ...currentRequest,
        status: newStatus,
        ...(res && typeof res === 'object' ? res : {})
      };
      setCurrentRequest(updated);
      if (showToast) showToast(`Ticket status updated to "${newStatus.replace(/_/g, ' ')}"`);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
      if (showToast) showToast(err.message || 'Failed to update ticket status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Submit New Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setReplyError('Reply message cannot be empty');
      return;
    }
    setSubmittingReply(true);
    setReplyError(null);

    try {
      const res = await replyToStaffCustomerServiceRequest(reqId, { message: replyText.trim() });

      // Backend returns full updated ServiceRequestDetailOut
      if (res && Array.isArray(res.replies)) {
        setCurrentRequest(res);
        if (res.status) setStatus(normalizeStatus(res.status));
        if (onUpdated) onUpdated(res);
      } else {
        const newReply = {
          id: res?.id || Date.now(),
          message: replyText.trim(),
          created_at: new Date().toISOString(),
          sender: { full_name: 'Customer Service Officer', role: 'customer_service' }
        };

        const updatedReplies = [...replies, newReply];
        const updated = {
          ...currentRequest,
          replies: updatedReplies,
          status: status === 'pending' ? 'in_progress' : status
        };

        setCurrentRequest(updated);
        setStatus(updated.status);
        if (onUpdated) onUpdated(updated);
      }

      setReplyText('');
      if (showToast) showToast('Reply sent successfully to member');
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReplyError(err.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusColor = (st) => {
    const s = normalizeStatus(st);
    switch (s) {
      case 'solved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header (matching Branch Manager) */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Headset className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">{t("branchServiceRequestModal.serviceRequestDesk", "Service Request Desk")}</h3>
                {reqId && (
                  <span className="font-mono text-xs font-bold text-teal-900 bg-white/80 px-2 py-0.5 rounded-md">
                    #{reqId}
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-100 font-medium">{t("branchServiceRequestModal.branchMemberInquiryAssistanceFolio", "Branch Member Inquiry & Assistance Folio")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Member Card & Status Control */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-800 font-bold flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{memberName}</h4>
                  {memberCode && (
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {memberCode}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                  {memberEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {memberEmail}
                    </span>
                  )}
                  {memberPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {memberPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                {t("applyProductAccountModal.status", "Status:")}
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={normalizeStatus(status)}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdating}
                  title={t("branchServiceRequestModal.clickToDirectlyChangeStatus", "Click to directly change status")}
                  className={`text-xs font-bold pl-3 pr-7 py-1 rounded-full border transition-all cursor-pointer focus:outline-none appearance-none capitalize ${getStatusColor(
                    status
                  )}`}
                >
                  <option value="pending" className="bg-white text-rose-800 font-semibold">{t("common.pending", "Pending")}</option>
                  <option value="in_progress" className="bg-white text-amber-800 font-semibold">{t("dashboardModule.branchOverview.statusInProgress", "In Progress")}</option>
                  <option value="solved" className="bg-white text-emerald-800 font-semibold">{t("dashboardModule.branchOverview.statusSolved", "Solved")}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                  {statusUpdating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Details & Original Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {t("branchManagerMembershipSettings.submittedOn", "Submitted on")} {formatDateTime(currentRequest.created_at || currentRequest.date)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1">
                {t("dashboardModule.emergency.table.subject", "Subject")}
              </p>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                {currentRequest.subject}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t("branchServiceRequestModal.memberMessage", "Member Message")}
              </p>
              <p className="text-xs sm:text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                {currentRequest.message}
              </p>
            </div>
          </div>

          {/* Replies & Communication Thread */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>{t("branchServiceRequestModal.responsesDeskReplies", "Responses & Desk Replies (")}{replies.length})</span>
              </div>
            </div>

            {replies.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                {t("branchServiceRequestModal.noRepliesPostedYetUse", "No replies posted yet. Use the reply composer below to contact this member.")}
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((rep, idx) => {
                  const repId = rep.id || idx;
                  const roleDisplayName = getSenderRoleLabel(rep.sender, rep);
                  const isMember =
                    roleDisplayName.toLowerCase() === 'member' ||
                    rep.is_member ||
                    rep.sender?.role === 'member';
                  const isStaff = !isMember;

                  return (
                    <div
                      key={repId}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm transition-all ${
                        isStaff
                          ? 'bg-emerald-50/50 border-emerald-200/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isStaff
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rep.sender?.full_name ? `${rep.sender.full_name} (${roleDisplayName})` : `${roleDisplayName} Response`}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatDateTime(rep.created_at || rep.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {rep.message || rep.reply || rep.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Reply Box */}
          <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("branchServiceRequestModal.postReplyToMember", "Post Reply to Member")}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {replyText.length} {t("branchServiceRequestModal.characters", "characters")}
              </span>
            </div>

            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                if (replyError) setReplyError(null);
              }}
              placeholder={t("branchServiceRequestModal.typeYourOfficialResolutionOr", "Type your official resolution or response to this service request...")}
              className={`w-full p-3.5 text-xs sm:text-sm bg-slate-50 border rounded-2xl font-medium focus:outline-none focus:bg-white transition-all resize-none ${
                replyError
                  ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-200 focus:border-teal-500 ring-2 ring-transparent focus:ring-teal-100'
              }`}
            />

            {replyError && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{replyError}</span>
              </p>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="text-[11px] text-slate-500 font-medium">
                {t("branchServiceRequestModal.sendingAReplyNotifiesThe", "Sending a reply notifies the cooperative member in their portal.")}
              </div>
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("branchServiceRequestModal.sendingReply", "Sending Reply...")}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t("branchServiceRequestModal.sendReply", "Send Reply")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {t("staffServiceRequestModal.customerServiceOfficerHelpdeskTicket", "Customer Service Officer Helpdesk & Ticket Console")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffServiceRequestModal;
