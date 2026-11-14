import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  Pencil,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { getBranchAdminStaffRoles, getAvailableStaffRoles } from '../../services/branchStaffService';

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
 * Modal for Creating (POST) or Updating (PUT) a Branch Staff Member
 */
export function BranchStaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  availableRoles = null,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    contact_number: '',
    address: '',
    staff_role_id: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      if (Array.isArray(availableRoles) && availableRoles.length > 0) {
        setRoles(availableRoles);
        return;
      }

      setLoadingRoles(true);
      try {
        const fetched = await getBranchAdminStaffRoles();
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setRoles(fetched);
          return;
        }
      } catch (err) {
        console.warn('BranchStaffFormModal: failed to load roles:', err.message);
      } finally {
        if (isMounted) setLoadingRoles(false);
      }

      if (isMounted) {
        setRoles(getAvailableStaffRoles());
      }
    }

    if (isOpen) {
      loadRoles();

      if (mode === 'edit' && initialData) {
        const roleIdVal =
          initialData.staff_role_id !== undefined && initialData.staff_role_id !== null
            ? String(initialData.staff_role_id)
            : initialData.staff_role?.id !== undefined
            ? String(initialData.staff_role.id)
            : initialData.role_id
            ? String(initialData.role_id)
            : '';

        setFormData({
          full_name: initialData.full_name || '',
          email: initialData.email || '',
          password: '',
          contact_number: initialData.contact_number || '',
          address: initialData.address || '',
          staff_role_id: roleIdVal,
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          password: '',
          contact_number: '',
          address: '',
          staff_role_id: '',
        });
      }
      setFormErrors({});
      setShowPassword(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, mode, initialData, availableRoles]);

  // Synchronize role matching by name if staff_role_id was not explicitly in initialData
  useEffect(() => {
    if (mode === 'edit' && initialData && !formData.staff_role_id && roles.length > 0) {
      const roleName = initialData.staff_role_name || initialData.staff_role?.name;
      if (roleName) {
        const matched = roles.find(
          (r) => (r.name || r.role_name || '').toLowerCase() === roleName.toLowerCase()
        );
        if (matched) {
          setFormData((prev) => ({ ...prev, staff_role_id: String(matched.id) }));
        }
      }
    }
  }, [roles, mode, initialData]);

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
    const name = formData.full_name.trim();
    if (!name) {
      errors.full_name = 'Full name is required.';
    } else if (name.length < 2) {
      errors.full_name = 'Full name must be at least 2 characters.';
    } else if (name.length > 100) {
      errors.full_name = 'Full name cannot exceed 100 characters.';
    }

    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (mode === 'create') {
      if (!formData.password) {
        errors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
      } else if (formData.password.length > 72) {
        errors.password = 'Password cannot exceed 72 characters.';
      }
    } else if (mode === 'edit' && formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
      } else if (formData.password.length > 72) {
        errors.password = 'Password cannot exceed 72 characters.';
      }
    }

    const phone = formData.contact_number.trim();
    if (!phone) {
      errors.contact_number = 'Contact number is required.';
    } else if (phone.length < 7 || phone.length > 20) {
      errors.contact_number = 'Contact number must be between 7 and 20 digits.';
    }

    const address = formData.address.trim();
    if (!address) {
      errors.address = 'Address is required.';
    } else if (address.length < 5) {
      errors.address = 'Address must be at least 5 characters.';
    } else if (address.length > 255) {
      errors.address = 'Address cannot exceed 255 characters.';
    }

    if (!formData.staff_role_id) {
      errors.staff_role_id = 'Please select an assigned staff role.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#0f766e] border border-teal-500/20">
              <User className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {mode === 'create' ? 'Register New Staff Member' : 'Edit Staff Profile'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'create'
                  ? 'Add branch staff credentials and assign an operational role'
                  : 'Update contact information and assigned duties'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Suresh Kumar"
                maxLength={100}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                  formErrors.full_name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                }`}
              />
            </div>
            {formErrors.full_name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {formErrors.full_name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. suresh@aurumfx.org"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                    formErrors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="contact_number"
                  autoComplete="off"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                    formErrors.contact_number
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                  }`}
                />
              </div>
              {formErrors.contact_number && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {formErrors.contact_number}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Staff Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="staff_role_id"
                  value={formData.staff_role_id}
                  onChange={handleChange}
                  disabled={loadingRoles}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium appearance-none bg-white cursor-pointer ${
                    formErrors.staff_role_id
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                >
                  <option value="">
                    {loadingRoles ? 'Loading available roles...' : 'Select Staff Role'}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.role_name || `Role #${r.id}`}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.staff_role_id && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {formErrors.staff_role_id}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {mode === 'create' ? (
                  <>
                    Account Password <span className="text-red-500">*</span>
                  </>
                ) : (
                  <>New Password (Leave blank to keep)</>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'create' ? 'Min. 8 characters' : 'Enter new password'}
                  maxLength={72}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                    formErrors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {formErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Residential / Official Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete street address, village/city, pincode"
                maxLength={255}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium resize-none ${
                  formErrors.address
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                }`}
              />
            </div>
            {formErrors.address && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {formErrors.address}
              </p>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Create Staff' : 'Save Changes'}</span>
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
 * Modal for Viewing Complete Staff Member Details
 */
export function BranchStaffDetailModal({
  isOpen,
  staff,
  availableRoles = [],
  onClose,
  onEditClick,
  onDeleteClick
}) {
  if (!isOpen || !staff) return null;

  const roleName =
    staff.staff_role_name ||
    availableRoles?.find((r) => Number(r.id) === Number(staff.staff_role_id))?.name ||
    (staff.staff_role_id ? `Role #${staff.staff_role_id}` : 'Branch Staff');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-500/20">
              {staff.full_name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{staff.full_name}</h3>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                  {staff.staff_code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    staff.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {staff.is_active !== false ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold text-slate-700">
                  {roleName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Official Email
              </span>
              <p className="text-sm font-semibold text-slate-800 break-all">{staff.email}</p>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Contact Number
              </span>
              <p className="text-sm font-semibold text-slate-800">{staff.contact_number || 'N/A'}</p>
            </div>
          </div>

          {/* Address */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Residential / Official Address
            </span>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {staff.address || 'No address registered.'}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                Role Designation
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">
                {roleName} {staff.staff_role_id ? `(#${staff.staff_role_id})` : ''}
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                Created At
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">
                {formatDateTime(staff.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={() => {
              onClose();
              if (onDeleteClick) onDeleteClick(staff);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Staff</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEditClick) onEditClick(staff);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Staff</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#00b4a7] text-white hover:bg-[#00a296] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Confirming Staff Deletion
 */
export function BranchStaffDeleteModal({
  isOpen,
  staff,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Delete Staff Member?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
              Are you sure you want to remove{' '}
              <strong className="text-slate-800 font-bold">"{staff.full_name}"</strong> ({staff.staff_code})
              from the branch registry?
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-left">
            <p className="text-xs text-amber-800 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                This will immediately revoke their staff portal login access and active sessions.
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(staff)}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

