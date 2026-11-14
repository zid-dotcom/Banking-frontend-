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
  LifeBuoy
} from 'lucide-react';

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
      case 'resolved':
      case 'closed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Service Request Details</h3>
                {reqId && (
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    #{reqId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Society Helpdesk Support Ticket</p>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
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
                  <span>{formatDateTime(request.created_at || request.date)}</span>
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

              {/* Message */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Message Description
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {request.message}
                </div>
              </div>

              {/* Resolution / Admin Reply if available */}
              {(request.resolution || request.reply || request.admin_notes) && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Society Desk Resolution</span>
                  </p>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs sm:text-sm text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                    {request.resolution || request.reply || request.admin_notes}
                  </div>
                </div>
              )}
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
