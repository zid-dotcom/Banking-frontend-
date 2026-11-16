import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  FileText,
  User,
  Calendar,
  Send,
  LifeBuoy,
  Building2,
  ShieldCheck,
  UserCheck,
  Headset
} from 'lucide-react';

function getRoleBadgeInfo(role) {
  const r = String(role || '').toLowerCase().trim();
  if (r === 'branch_admin' || r === 'branch_manager' || r === 'branch admin') {
    return {
      label: 'Branch Manager',
      className: 'bg-teal-100 text-teal-800 border-teal-200'
    };
  }
  if (r === 'super_admin' || r === 'superadmin' || r === 'super admin' || r === 'admin') {
    return {
      label: 'Main Administration',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    };
  }
  if (r === 'member') {
    return {
      label: 'Member',
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }
  const formatted = r ? r.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Branch Officer';
  return {
    label: formatted,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
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

/**
 * Modal for creating a new Service Request (POST /member/service-requests)
 * Body: { subject, message }
 */
export function CreateServiceRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.trim().length < 4) {
      newErrors.subject = 'Subject must be at least 4 characters';
    }

    if (!message.trim()) {
      newErrors.message = 'Message description is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Please provide more details (minimum 10 characters)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      subject: subject.trim(),
      message: message.trim()
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubject('');
    setMessage('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">New Service Request</h3>
              <p className="text-xs text-teal-100 font-medium">Submit an inquiry or assistance ticket to society desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Subject / Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Passbook statement update or EMI query"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
              }}
              maxLength={150}
              className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl font-medium focus:outline-none focus:bg-white transition-all ${
                errors.subject
                  ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-200 focus:border-teal-500 ring-2 ring-transparent focus:ring-teal-100'
              }`}
            />
            {errors.subject && (
              <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.subject}</span>
              </p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description / Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe your issue, query, or service request in detail..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
              }}
              className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl font-medium focus:outline-none focus:bg-white transition-all resize-none ${
                errors.message
                  ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-200 focus:border-teal-500 ring-2 ring-transparent focus:ring-teal-100'
              }`}
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>{errors.message ? <span className="text-rose-500 font-semibold">{errors.message}</span> : 'Provide specific account or transaction details if applicable'}</span>
              <span>{message.length} chars</span>
            </div>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your service request will be routed directly to your home branch support team and prioritized for resolution.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Service Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Viewing details of a Service Request
 */
export function ServiceRequestDetailModal({
  isOpen,
  onClose,
  request,
  loading = false
}) {
  if (!isOpen) return null;

  const reqId = request?.id || request?.request_id || request?.ticket_id;
  const status = (request?.status || 'open').toLowerCase();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'solved':
      case 'resolved':
      case 'closed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending':
      case 'open':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const branchName =
    request?.branch?.name ||
    request?.branch?.branch_name ||
    request?.branch_name ||
    '';
  const branchCode =
    request?.branch?.branch_code ||
    request?.branch_code ||
    '';

  // Parse replies from API response
  const replies = Array.isArray(request?.replies)
    ? request.replies
    : Array.isArray(request?.responses)
    ? request.responses
    : request?.reply
    ? [
        {
          id: 'single-reply',
          message: request.reply,
          created_at: request.updated_at || request.created_at,
          sender: { full_name: 'Branch Manager', role: 'branch_admin' }
        }
      ]
    : request?.resolution
    ? [
        {
          id: 'single-resolution',
          message: request.resolution,
          created_at: request.updated_at || request.created_at,
          sender: { full_name: 'Branch Manager', role: 'branch_admin' }
        }
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <MessageSquare className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Service Request Details
                </h3>
                {reqId && (
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    #{reqId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                <span>Society Helpdesk Support Ticket</span>
                {branchName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                      <Building2 className="w-3 h-3 text-teal-600" />
                      <span>{branchName} {branchCode ? `(#${branchCode})` : ''}</span>
                    </span>
                  </>
                )}
              </div>
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading ticket details...</p>
            </div>
          ) : !request ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No request details found.
            </div>
          ) : (
            <>
              {/* Status and Created At chips */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(status)}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{status.replace(/_/g, ' ')}</span>
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted on {formatDateTime(request.created_at || request.date)}</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subject
                </p>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                  {request.subject}
                </h4>
              </div>

              {/* Member Sent Message */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Your Sent Message</span>
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {request.message || request.description || 'No initial message text recorded.'}
                </div>
              </div>

              {/* Official Responses & Desk Replies Thread */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    <h5 className="font-bold text-slate-900 text-sm">
                      Official Desk Responses ({replies.length})
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Branch &amp; Society Correspondence
                  </span>
                </div>

                {replies.length === 0 ? (
                  <div className="p-5 text-center rounded-2xl bg-teal-50/40 border border-dashed border-teal-200/80 text-teal-800 space-y-1">
                    <p className="text-xs font-bold text-teal-900">Awaiting Response</p>
                    <p className="text-[11px] text-teal-700 leading-relaxed">
                      Your service request has been logged. A Branch Manager or society officer will post responses here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replies.map((rep, idx) => {
                      const repId = rep.id || `rep-${idx}`;
                      const rawName =
                        rep.sender?.full_name ||
                        rep.sender?.name ||
                        rep.author ||
                        rep.sender_name ||
                        '';
                      const senderRole = String(rep.sender?.role || rep.role || 'branch_admin').toLowerCase();
                      const roleBadge = getRoleBadgeInfo(senderRole);

                      const isSuperAdmin =
                        senderRole === 'super_admin' ||
                        senderRole === 'superadmin' ||
                        senderRole === 'admin' ||
                        rawName.toLowerCase() === 'super admin' ||
                        rawName.toLowerCase() === 'super_admin';

                      let senderName = rawName;
                      if (isSuperAdmin && (!rawName || rawName.toLowerCase() === 'super admin' || rawName.toLowerCase() === 'super_admin')) {
                        senderName = 'Main Administration';
                      } else if (!senderName) {
                        senderName = roleBadge.label;
                      }

                      const avatarLetter = senderName === 'Main Administration' ? 'M' : senderName.slice(0, 1).toUpperCase();

                      return (
                        <div
                          key={repId}
                          className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
                            isSuperAdmin
                              ? 'bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white border-purple-200/80'
                              : 'bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-white border-teal-200/70'
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-2xs ${
                                  isSuperAdmin ? 'bg-purple-600' : 'bg-teal-600'
                                }`}
                              >
                                {avatarLetter}
                              </div>
                              <span className="font-bold text-xs text-slate-900">
                                {senderName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${roleBadge.className}`}>
                                {roleBadge.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDateTime(rep.created_at || rep.date)}</span>
                              {rep.edited_at && (
                                <span className="text-[10px] text-slate-400 italic">(edited)</span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pl-9">
                            {rep.message || rep.reply}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
