import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

/**
 * Modal for Creating (POST) or Updating (PUT) a Branch Admin
 * Aligned with Swagger schema:
 * {
 *   "full_name": "string",
 *   "email": "user@example.com",
 *   "password": "string",
 *   "contact_number": "string",
 *   "branch_id": 0
 * }
 */
export function BranchAdminFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  branches = [],
  onSubmit,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    contact_number: '',
    branch_id: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        full_name: initialData.full_name || initialData.name || '',
        email: initialData.email || '',
        password: '',
        contact_number: initialData.contact_number || initialData.phone || '',
        branch_id: initialData.branch_id ? String(initialData.branch_id) : (branches[0]?.rawId ? String(branches[0].rawId) : ''),
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        contact_number: '',
        branch_id: branches.length > 0 ? String(branches[0].rawId || branches[0].id) : '',
      });
    }
    setError(null);
    setShowPassword(false);
  }, [initialData, mode, isOpen, branches]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name.trim()) {
      setErrorPopup({
        title: 'Validation Error',
        message: 'Full name is required.'
      });
      return;
    }
    if (!formData.email.trim()) {
      setErrorPopup({
        title: 'Validation Error',
        message: 'Email address is required.'
      });
      return;
    }
    if (mode === 'create' && !formData.password.trim()) {
      setErrorPopup({
        title: 'Validation Error',
        message: 'Password is required for new branch manager.'
      });
      return;
    }
    if (!formData.contact_number.trim()) {
      setErrorPopup({
        title: 'Validation Error',
        message: 'Contact number is required.'
      });
      return;
    }
    if (!formData.branch_id) {
      setErrorPopup({
        title: 'Validation Error',
        message: 'Please select an operational branch.'
      });
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim(),
        branch_id: Number(formData.branch_id),
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Operation failed. Please verify API response.');
      setErrorPopup({
        title: mode === 'create' ? 'Branch Manager Creation Failed' : 'Branch Manager Update Failed',
        message: err.message || 'Operation failed. Please verify API response.'
      });
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="fixed inset-0" onClick={!isSubmitting ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Update Branch Manager' : 'Add Branch Manager'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? `Editing credentials for ${initialData?.full_name || initialData?.name || 'Manager'}`
                  : 'Assign operational manager to operational branch unit'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Backend Error Alert Box */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 shadow-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold leading-relaxed whitespace-pre-wrap">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Administrator Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Anand Sharma"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* 2. Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. anand.sharma@aurumfx.coop"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* 3. Assigned Branch Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Operational Branch <span className="text-rose-500">*</span>
            </label>
            <select
              name="branch_id"
              required
              value={formData.branch_id}
              onChange={handleChange}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all cursor-pointer"
            >
              <option value="" disabled>Select branch unit</option>
              {branches.map((b) => {
                const bId = b.rawId || b.id;
                const ifsc = b.ifsc_code || b.ifsc;
                return (
                  <option key={b.id || bId} value={bId}>
                    {b.name} {b.city ? `(${b.city}, ${b.state})` : ''} - #{b.branch_code || bId} {ifsc ? `[IFSC: ${ifsc}]` : ''}
                  </option>
                );
              })}
            </select>
            {branches.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No branches registered yet. Please create a branch first in the Branches section.
              </p>
            )}
          </div>

          {/* 4. Contact Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="contact_number"
              required
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="e.g. +919495234500"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              10 to 14 digits, optional + at start (without spaces)
            </p>
          </div>

          {/* 5. Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEdit ? 'New Password (Optional)' : 'Admin Login Password'} {!isEdit && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required={!isEdit}
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? 'Leave blank to retain existing password' : 'Enter secure admin password'}
                className="w-full h-10 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {isEdit && (
              <p className="text-[11px] text-slate-400 mt-1">
                Only fill this in if you want to reset this branch manager's password.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Update Manager' : 'Create Branch Manager'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Centered Red Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {typeof errorPopup === 'object' ? (errorPopup.title || 'Validation Error') : 'Submission Error'}
              </h3>
              <p className="text-xs sm:text-sm text-rose-900 mt-2.5 leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 font-medium break-words text-left">
                {typeof errorPopup === 'object' ? (errorPopup.message || JSON.stringify(errorPopup)) : String(errorPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Okay, Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

