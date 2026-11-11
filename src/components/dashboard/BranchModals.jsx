import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Power
} from 'lucide-react';

/**
 * Modal for Creating (POST) or Updating (PUT) a Branch
 * Aligned with backend API schema:
 * {
 *   "name": "string",
 *   "city": "string",
 *   "state": "string",
 *   "address": "string",
 *   "contact_number": "string"
 * }
 */
export function BranchFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSubmit,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    contact_number: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        city: initialData.city || '',
        state: initialData.state || '',
        address: initialData.address || '',
        contact_number: initialData.contact_number || initialData.phone || '',
      });
    } else {
      setFormData({
        name: '',
        city: '',
        state: '',
        address: '',
        contact_number: '',
      });
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim()) {
      setError('Branch name is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Operation failed. Please verify API connection.');
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="fixed inset-0" onClick={!isSubmitting ? onClose : undefined} />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Update Society Branch' : 'Charter New Society Branch'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? `Editing ${initialData?.name || 'Branch'}`
                  : 'Provision operational hub under Multi-State Cooperative Act'}
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

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Branch Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Branch Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Kozhikode North Agro Hub"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* 2. City & State Jurisdiction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Kozhikode"
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Kerala"
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 3. Physical Street Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physical Street Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Main Commercial Junction, Town Center"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
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
              placeholder="e.g. +91 495 234 5000"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Charter Branch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Viewing Single Branch Details (GET /superadmin/branches/{branch_id})
 */
export function BranchDetailModal({
  isOpen,
  onClose,
  branch,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus
}) {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                  {branch.state} Jurisdiction
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  branch.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                }`}>
                  <CheckCircle2 className="w-3 h-3" /> {branch.isActive ? 'Online & Active' : 'Offline'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{branch.name}</h3>
              <p className="text-xs text-slate-400 font-mono">Code: {branch.code || branch.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7]" />
            <p className="text-xs font-medium">Fetching live branch audit metrics...</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Address & Contact Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {branch.address}
                  {branch.city && !branch.address?.includes(branch.city) ? `, ${branch.city}` : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-bold">{branch.manager}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-mono">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{branch.phone}</span>
                </div>
              </div>
              {branch.email && (
                <div className="flex items-center gap-2 text-slate-700 font-mono pt-1">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{branch.email}</span>
                </div>
              )}
            </div>

            {/* Financial Ledger Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Deposits</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{branch.deposits}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Credit Disbursed</span>
                <p className="text-sm font-extrabold text-[#0d9488] mt-1">{branch.loans}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Recovery Rate</span>
                <p className="text-sm font-extrabold text-emerald-700 mt-1">{branch.recoveryRate}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Members</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{branch.members}</p>
              </div>
            </div>

            {/* Regulatory Status */}
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs text-[#0f766e]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                Multi-State Cooperative Regulatory Compliance
              </span>
              <span className="font-bold">Verified</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onToggleStatus(branch);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              branch.isActive
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{branch.isActive ? 'Deactivate Branch' : 'Activate Branch'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(branch);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(branch);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

