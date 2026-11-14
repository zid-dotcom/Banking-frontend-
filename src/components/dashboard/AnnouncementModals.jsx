import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Clock,
  Radio,
  FileText
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
 * Modal for Creating (POST) or Updating (PUT) an Announcement
 */
export function AnnouncementFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSubmit,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          title: initialData.title || '',
          message: initialData.message || '',
          is_active: initialData.is_active !== undefined ? Boolean(initialData.is_active) : true
        });
      } else {
        setFormData({
          title: '',
          message: '',
          is_active: true
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Announcement title is required.';
    } else if (formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }

    if (!formData.message.trim()) {
      errs.message = 'Announcement message is required.';
    } else if (formData.message.trim().length < 5) {
      errs.message = 'Message must be at least 5 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-lg flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                {mode === 'edit' ? 'Update Announcement' : 'Create New Announcement'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Broadcast administrative notice across portals and members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Announcement Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Society Annual General Meeting 2026 Scheduled"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                  : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notice Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              placeholder="Write the full announcement message, circular text, or official notice details here..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                errors.message
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                  : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
              }`}
            />
            {errors.message && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.message}
              </p>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Active (Publish Immediately)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  When enabled, this notice will be immediately visible to members and branches.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'edit' ? 'Save Changes' : 'Publish Announcement'}</span>
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
 * Modal for Viewing Announcement Details
 */
export function AnnouncementDetailModal({
  isOpen,
  announcement,
  onClose,
  onEditClick,
  onDeleteClick
}) {
  if (!isOpen || !announcement) return null;

  const isActive = announcement.is_active !== false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-xl flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  Notice #{announcement.id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Official Society Announcement Circular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
              Notice Title
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {announcement.title}
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00b4a7]" />
              Announcement Message Body
            </span>
            <p className="text-xs sm:text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
              {announcement.message}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-slate-500 block font-medium">Published Date</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {formatDateTime(announcement.created_at)}
              </span>
            </div>

            {announcement.updated_at && (
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 block font-medium">Last Modified</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {formatDateTime(announcement.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {onDeleteClick ? (
            <button
              onClick={() => {
                onClose();
                onDeleteClick(announcement);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Notice</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {onEditClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(announcement);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Notice</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Confirming Announcement Deletion
 */
export function AnnouncementDeleteModal({
  isOpen,
  announcement,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Announcement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notice #{announcement.id}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Are you sure you want to permanently delete the announcement{' '}
          <strong className="text-slate-900 font-bold">"{announcement.title}"</strong>?
          This notice will be permanently removed from all member and branch noticeboards.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(announcement.id)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Delete Announcement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
