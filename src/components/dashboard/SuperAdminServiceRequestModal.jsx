import React, { useState, useEffect } from 'react';
import {
  X,
  Headset,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Send,
  Edit2,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  Mail,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import {
  replyToSuperAdminServiceRequest,
  editSuperAdminServiceRequestReply,
  updateSuperAdminServiceRequestStatus
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
  const staffRoleName =
    sender?.staff_role?.name ||
    (typeof sender?.staff_role === 'string' ? sender.staff_role : null) ||
    rep?.staff_role?.name ||
    (typeof rep?.staff_role === 'string' ? rep.staff_role : null);
  if (staffRoleName) {
    return staffRoleName;
  }

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
    return 'Super Admin';
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

  if (sender?.full_name?.toLowerCase() === 'super admin') {
    return 'Super Admin';
  }

  if (role) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return rep?.is_member ? 'Member' : 'Super Admin';
}

export function SuperAdminServiceRequestModal({
  isOpen,
  onClose,
  request,
  onUpdated,
  showToast
}) {
  const [currentRequest, setCurrentRequest] = useState(request);
  const [status, setStatus] = useState(() => normalizeStatus(request?.status));
  const [statusUpdating, setStatusUpdating] = useState(false);

  // New Reply
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  // Edit Reply State
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setCurrentRequest(request);
    setStatus(normalizeStatus(request?.status));
    setReplyText('');
    setReplyError(null);
    setEditingReplyId(null);
    setEditedText('');
  }, [request]);

  if (!isOpen || !currentRequest) return null;

  const reqId = currentRequest.id || currentRequest.request_id || currentRequest.ticket_id;
  const memberName =
    currentRequest.member?.full_name ||
    currentRequest.member?.name ||
    currentRequest.member_name ||
    currentRequest.user_name ||
    'Cooperative Member';
  const memberCode =
    currentRequest.member?.user_code ||
    currentRequest.user_code ||
    currentRequest.member?.member_code ||
    currentRequest.member_code ||
    (currentRequest.member_id ? `MEM-${currentRequest.member_id}` : '');
  const memberEmail = currentRequest.member?.email || currentRequest.member_email || '';
  const memberPhone = currentRequest.member?.mobile || currentRequest.member?.phone || currentRequest.member_phone || '';

  const branchName =
    currentRequest.branch?.name ||
    currentRequest.branch?.branch_name ||
    currentRequest.branch_name ||
    'Apex Main Registry';
  const branchCode =
    currentRequest.branch?.branch_code ||
    currentRequest.branch_code ||
    '';

  // Parse replies
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
          author: 'Super Admin'
        }
      ]
    : [];

  // Update Request Status
  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await updateSuperAdminServiceRequestStatus(reqId, newStatus);
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
      const res = await replyToSuperAdminServiceRequest(reqId, { message: replyText.trim() });
      
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
          sender: { full_name: 'Super Admin', role: 'super_admin' }
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
      if (showToast) showToast('Official reply dispatched to member successfully');
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReplyError(err.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Begin Edit Reply
  const startEditReply = (rep) => {
    setEditingReplyId(rep.id);
    setEditedText(rep.message || rep.reply || '');
  };

  // Cancel Edit Reply
  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditedText('');
  };

  // Save Edited Reply
  const handleSaveEditedReply = async (repId) => {
    if (!editedText.trim()) return;
    setSavingEdit(true);

    try {
      const res = await editSuperAdminServiceRequestReply(reqId, repId, { message: editedText.trim() });

      if (res && Array.isArray(res.replies)) {
        setCurrentRequest(res);
        if (res.status) setStatus(normalizeStatus(res.status));
        if (onUpdated) onUpdated(res);
      } else {
        const updatedReplies = replies.map((r) => {
          if (String(r.id) === String(repId)) {
            return {
              ...r,
              message: editedText.trim(),
              edited_at: new Date().toISOString()
            };
          }
          return r;
        });

        const updated = {
          ...currentRequest,
          replies: updatedReplies
        };
        setCurrentRequest(updated);
        if (onUpdated) onUpdated(updated);
      }

      setEditingReplyId(null);
      setEditedText('');
      if (showToast) showToast('Reply updated successfully');
    } catch (err) {
      console.error('Failed to edit reply:', err);
      if (showToast) showToast(err.message || 'Failed to update reply');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-teal-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Headset className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Super Admin Service Request Desk
                </h3>
                {reqId && (
                  <span className="font-mono text-xs font-bold text-teal-900 bg-white/90 px-2 py-0.5 rounded-md shadow-2xs">
                    #{reqId}
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-100 font-medium">
                Apex Cooperative Governance &amp; Central Grievance Resolution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Member & Request Metadata Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{memberName}</span>
                    {memberCode && (
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                        {memberCode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                    {memberEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{memberEmail}</span>
                      </span>
                    )}
                    {memberPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{memberPhone}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-teal-700 font-semibold bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-100">
                      <Building2 className="w-3 h-3 text-teal-600" />
                      <span>{branchName} {branchCode ? `(#${branchCode})` : ''}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status:
                </span>
                <div className="relative inline-block">
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className={`text-xs font-bold py-1.5 pl-3 pr-8 rounded-full border cursor-pointer appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60 shadow-2xs ${
                      status === 'solved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    <option value="pending" className="text-rose-700 font-bold bg-white">
                      Pending
                    </option>
                    <option value="in_progress" className="text-amber-700 font-bold bg-white">
                      In Progress
                    </option>
                    <option value="solved" className="text-emerald-700 font-bold bg-white">
                      Solved
                    </option>
                  </select>
                  <ChevronDown
                    className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                      status === 'solved'
                        ? 'text-emerald-700'
                        : status === 'in_progress'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Subject and Ticket Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="uppercase tracking-wider font-bold text-slate-500">Subject</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Submitted on {formatDateTime(currentRequest.created_at)}</span>
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                {currentRequest.subject || 'No Subject Provided'}
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Member Message:
                </span>
                {currentRequest.message || currentRequest.description || 'No initial message text recorded.'}
              </div>
            </div>
          </div>

          {/* Conversation & Responses History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <h5 className="font-bold text-slate-800 text-sm">
                  Responses &amp; Desk Replies ({replies.length})
                </h5>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Official Central Correspondence
              </span>
            </div>

            {replies.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 space-y-1">
                <p className="text-xs font-semibold text-slate-500">No replies posted yet.</p>
                <p className="text-[11px] text-slate-400">Use the reply composer below to contact this member.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((rep, idx) => {
                  const repId = rep.id || `rep-${idx}`;
                  const isEditingThis = editingReplyId === rep.id;
                  const roleDisplayName = getSenderRoleLabel(rep.sender, rep);
                  const isMember =
                    roleDisplayName.toLowerCase() === 'member' ||
                    rep.is_member ||
                    rep.sender?.role === 'member';
                  const isStaff = !isMember;
                  const isSuperAdminSender = roleDisplayName === 'Super Admin' || roleDisplayName === 'Main Administration';

                  const senderName =
                    rep.sender?.full_name ||
                    rep.author ||
                    rep.sender_name ||
                    roleDisplayName;

                  return (
                    <div
                      key={repId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isStaff
                          ? 'bg-teal-50/50 border-teal-100'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {senderName.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs text-slate-900">{senderName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold uppercase tracking-wider border border-teal-200">
                            {roleDisplayName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatDateTime(rep.created_at || rep.date)}
                          </span>

                          {rep.edited_at && (
                            <span className="text-[10px] text-slate-400 italic">(edited)</span>
                          )}

                          {/* Edit button */}
                          {!isEditingThis && (
                            <button
                              type="button"
                              onClick={() => startEditReply(rep)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded transition-colors cursor-pointer"
                              title="Edit this reply"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 text-xs bg-white border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                            placeholder="Edit your official response..."
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEditReply}
                              disabled={savingEdit}
                              className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedReply(rep.id)}
                              disabled={savingEdit || !editedText.trim()}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {savingEdit ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {rep.message || rep.reply}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Reply Composer Form */}
          <form
            onSubmit={handleSendReply}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Post Super Admin Reply to Member</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {replyText.length} characters
              </span>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={submittingReply}
              rows={3}
              placeholder="Type your official apex resolution or administrative response to this service request..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 font-medium text-slate-800 transition-all resize-none"
            />

            {replyError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{replyError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-medium">
                Sending a reply notifies the cooperative member in their portal.
              </span>

              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-400">
            Apex Super Admin Helpdesk &amp; Service Request Console
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default SuperAdminServiceRequestModal;
