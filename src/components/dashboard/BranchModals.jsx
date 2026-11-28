import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
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
 *   "ifsc_code": "string",
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    ifsc_code: '',
    city: '',
    state: '',
    address: '',
    contact_number: '',
  });

  const [error, setError] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        ifsc_code: initialData.ifsc_code || initialData.ifsc || '',
        city: initialData.city || '',
        state: initialData.state || '',
        address: initialData.address || '',
        contact_number: initialData.contact_number || initialData.phone || '',
      });
    } else {
      setFormData({
        name: '',
        ifsc_code: '',
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
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Branch name is required.'
      });
      return;
    }
    if (!formData.ifsc_code.trim()) {
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Branch IFSC code is required.'
      });
      return;
    }
    if (!formData.city.trim()) {
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'City is required.'
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Operation failed. Please verify API connection.');
      setErrorPopup({
        title: mode === 'create' ? 'Branch Creation Failed' : 'Branch Update Failed',
        message: err.message || 'Operation failed. Please verify API connection.'
      });
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
                {isEdit ? t("branchModals.updateBranch", "Update Branch") : t("superAdminBranches.createBranch", "Create Branch")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? `Editing ${initialData?.name || 'Branch'}`
                  : t("branchModals.registerOperationalHubInThe", "Register operational hub in the multi-state cooperative network")}
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
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 shadow-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold leading-relaxed whitespace-pre-wrap">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Branch Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t("dashboardModule.accountTransactions.colBranchName", "Branch Name")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder={t("branchModals.eGKozhikodeNorthAgro", "e.g. Kozhikode North Agro Hub")}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* 2. Branch IFSC Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t("branchModals.branchIfscCode", "Branch IFSC Code")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="ifsc_code"
              required
              value={formData.ifsc_code}
              onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
              placeholder={t("branchModals.eGAurm0001234", "e.g. AURM0001234")}
              maxLength={11}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">{t("branchModals.11CharacterIndianFinancialSystem", "11-character Indian Financial System Code (e.g. AURM0001234)")}</p>
          </div>

          {/* 3. City & State Jurisdiction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("branchModals.city", "City")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder={t("branchModals.eGKozhikode", "e.g. Kozhikode")}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("memberProfile.state", "State")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder={t("branchModals.eGKerala", "e.g. Kerala")}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 3. Physical Street Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t("staffDashboard.physicalStreetAddress", "Physical Street Address")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder={t("branchModals.eGMainCommercialJunction", "e.g. Main Commercial Junction, Town Center")}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all"
            />
          </div>

          {/* 4. Contact Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t("modal.branchAdmin.contactNumberLabel", "Contact Number")} <span className="text-rose-500">*</span>
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
            <p className="text-[11px] text-slate-400 mt-1">{t("modal.branchAdmin.contactNumberHint", "10 to 14 digits, optional + at start (without spaces)")}</p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? t("memberNominee.saveChanges", "Save Changes") : t("superAdminBranches.createBranch", "Create Branch")}</span>
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
                {typeof errorPopup === 'object' ? (errorPopup.title || 'Validation Error') : t("modal.branchAdmin.submissionError", "Submission Error")}
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
                {t("modal.branchAdmin.okayGotIt", "Okay, Got It")}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const { t } = useTranslation();
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
                  {branch.state || 'kerala'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  branch.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                }`}>
                  <CheckCircle2 className="w-3 h-3" /> {branch.isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{branch.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-mono">{t("branchModals.branchCode", "Branch Code: #")}{branch.branch_code || branch.id}</p>
                {branch.ifsc_code && (
                  <span className="text-xs font-mono font-bold text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {t("staffCashOperations.ifsc", "IFSC:")} {branch.ifsc_code}
                  </span>
                )}
              </div>
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
            <p className="text-xs font-medium">{t("branchModals.fetchingLiveBranchDetails", "Fetching live branch details...")}</p>
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
                  <span className="text-slate-400 font-medium">{t("modal.member.state", "State:")}</span>
                  <span className="font-bold text-slate-900">{branch.state || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-mono">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{branch.contact_number || branch.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Real API Ledger Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.accountTransactions.colBranchCode", "Branch Code")}</span>
                <p className="text-sm font-mono font-extrabold text-slate-900 mt-1">#{branch.branch_code || branch.id}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t("dashboardModule.accountTransactions.colIfscCode", "IFSC Code")}</span>
                <p className="text-sm font-mono font-extrabold text-[#0f766e] mt-1">{branch.ifsc_code || 'N/A'}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t("branchModals.openingDate", "Opening Date")}</span>
                <p className="text-sm font-extrabold text-[#0d9488] mt-1">{branch.opening_date || 'N/A'}</p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t("branchModals.operationalStatus", "Operational Status")}</span>
                <p className={`text-sm font-extrabold mt-1 ${branch.isActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {branch.isActive ? t("branchModals.online", "Online") : t("branchModals.offline", "Offline")}
                </p>
              </div>
            </div>

            {branch.created_at && (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-slate-400 font-medium">{t("branchModals.databaseRegistration", "Database Registration:")}</span>
                <span className="font-mono text-slate-700">{new Date(branch.created_at).toLocaleString()}</span>
              </div>
            )}
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
            <span>{branch.isActive ? t("branchModals.deactivateBranch", "Deactivate Branch") : t("branchModals.activateBranch", "Activate Branch")}</span>
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
              <span>{t("memberNominee.edit", "Edit")}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(branch);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("branchModals.delete", "Delete")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

