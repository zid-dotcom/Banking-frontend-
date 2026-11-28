import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  Briefcase,
  AlignLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  KeyRound
} from 'lucide-react';

/**
 * Modal for Creating (POST) a Staff Role
 * Aligned with backend API schema:
 * {
 *   "name": "string", (2 to 50 chars, required)
 *   "description": "string" (up to 255 chars, optional)
 * }
 */
export function StaffRoleCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
      });
      setFormErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errors.name = 'Role name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Role name must be at least 2 characters.';
    } else if (trimmedName.length > 50) {
      errors.name = 'Role name cannot exceed 50 characters.';
    }

    if (formData.description && formData.description.length > 255) {
      errors.description = 'Description cannot exceed 255 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#0f766e] border border-teal-500/20">
              <ShieldCheck className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {t("staffRoleModals.createNewStaffRole", "Create New Staff Role")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("staffRoleModals.defineDesignatedAuthorityAndRole", "Define designated authority and role title for staff members")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Role Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-teal-600" />
              {t("staffRoleModals.roleName", "Role Name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("staffRoleModals.eGLoanOfficerCashier", "e.g. Loan Officer, Cashier, Field Agent")}
              maxLength={50}
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                formErrors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                  : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-slate-50/40 focus:bg-white'
              }`}
            />
            {formErrors.name ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {formErrors.name}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                {t("staffRoleModals.between2And50Characters", "Between 2 and 50 characters (e.g. Accountant, Branch Assistant)")}
              </p>
            )}
          </div>

          {/* Role Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-teal-600" />
                {t("staffRoleModals.description", "Description")}
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.description.length}/255
              </span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              maxLength={255}
              placeholder={t("staffRoleModals.describeTheOperationalResponsibilitiesCounter", "Describe the operational responsibilities, counter functions, or permissions assigned to this staff role...")}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium resize-none ${
                formErrors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                  : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-slate-50/40 focus:bg-white'
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {formErrors.description}
              </p>
            )}
          </div>

          {/* Quick presets helper */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t("staffRoleModals.suggestedCommonRoles", "Suggested Common Roles:")}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Loan Officer', desc: 'Processes member loan requests, verifications, and documentation.' },
                { name: 'Branch Cashier', desc: 'Handles counter cash deposits, withdrawals, and passbook operations.' },
                { name: 'Field Recovery Agent', desc: 'Conducts doorstep collections, field visits, and KYC verifications.' },
                { name: 'Branch Accountant', desc: 'Oversees day-end balancing, voucher auditing, and ledger reporting.' }
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setFormData({ name: preset.name, description: preset.desc });
                    setFormErrors({});
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("staffRoleModals.creatingRole", "Creating Role...")}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {t("superAdminStaffRoles.createStaffRole", "Create Staff Role")}
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
 * Modal for Viewing Details of a Staff Role
 */
export function StaffRoleDetailModal({
  isOpen,
  role,
  onClose,
  onDeleteClick
}) {
  const { t } = useTranslation();
  if (!isOpen || !role) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
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
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#00b4a7] border border-teal-500/20 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {role.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/70 text-[#0f766e]">
                  {t("staffRoleModals.id", "ID #")}{role.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t("staffRoleModals.societyStaffRoleDesignation", "Society Staff Role Designation")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t("staffRoleModals.roleTitleDesignation", "Role Title / Designation")}
              </span>
              <p className="text-base font-bold text-slate-800">
                {role.name}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t("staffRoleModals.descriptionResponsibilities", "Description & Responsibilities")}
              </span>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
                {role.description || 'No detailed description provided for this staff role.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {t("staffRoleModals.systemRoleId", "System Role ID")}
                </span>
                <span className="font-mono text-xs font-bold text-teal-800">
                  #{role.id}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {t("memberHelpdesk.createdOn", "Created On")}
                </span>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  {formatDate(role.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                onClose();
                if (onDeleteClick) onDeleteClick(role);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("staffRoleModals.deleteRole", "Delete Role")}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Confirming Staff Role Deletion
 */
export function StaffRoleDeleteConfirmModal({
  isOpen,
  role,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  const { t } = useTranslation();
  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("staffRoleModals.deleteStaffRole", "Delete Staff Role?")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
              {t("staffRoleModals.areYouSureYouWant", "Are you sure you want to permanently delete the staff role")}{' '}
              <strong className="text-slate-800 font-bold">"{role.name}"</strong> {t("staffRoleModals.id2", "(ID #")}{role.id})?
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-left">
            <p className="text-xs text-amber-800 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                {t("staffRoleModals.ifAnyBranchStaffMembers", "If any branch staff members are currently assigned to this role, the backend may reject the deletion until staff are reassigned.")}
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={() => onConfirm(role)}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("branchStaffModals.deleting", "Deleting...")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("branchStaffModals.yesDelete", "Yes, Delete")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

