import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  FileText,
  Users,
  Building,
  Check,
  Shield,
  ChevronDown
} from 'lucide-react';
import { getStaffRoles } from '../../services/staffRoleService';

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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_active: true,
    target_account_roles: [],
    target_staff_role_ids: []
  });
  const [staffRolesList, setStaffRolesList] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.audience-dropdown-container')) {
        setAudienceDropdownOpen(false);
      }
    };
    if (audienceDropdownOpen) {
      document.addEventListener('click', handleGlobalClick);
    }
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [audienceDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          title: initialData.title || '',
          message: initialData.message || '',
          is_active: initialData.is_active !== undefined ? Boolean(initialData.is_active) : true,
          target_account_roles: Array.isArray(initialData.target_account_roles)
            ? [...initialData.target_account_roles]
            : [],
          target_staff_role_ids: Array.isArray(initialData.target_staff_role_ids)
            ? [...initialData.target_staff_role_ids].map(Number)
            : []
        });
      } else {
        setFormData({
          title: '',
          message: '',
          is_active: true,
          target_account_roles: [],
          target_staff_role_ids: []
        });
      }
      setErrors({});

      // Fetch staff roles to populate role dropdown
      setLoadingRoles(true);
      getStaffRoles({ limit: 100 })
        .then((roles) => {
          const raw = Array.isArray(roles) ? roles : [];
          setStaffRolesList(raw);
        })
        .catch((err) => {
          console.warn('Could not load staff roles:', err);
        })
        .finally(() => {
          setLoadingRoles(false);
        });
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

  const totalRolesCount = 2 + (staffRolesList.length || 0);
  const selectedCount =
    (formData.target_account_roles?.length || 0) +
    (formData.target_staff_role_ids?.length || 0);

  const isAllSelected =
    formData.target_account_roles?.length === 2 &&
    staffRolesList.length > 0 &&
    formData.target_staff_role_ids?.length === staffRolesList.length;

  const handleSelectAll = (e) => {
    if (e) e.stopPropagation();
    if (isAllSelected) {
      setFormData((prev) => ({
        ...prev,
        target_account_roles: [],
        target_staff_role_ids: []
      }));
    } else {
      const allStaffIds = staffRolesList
        .map((r) => Number(r.id))
        .filter((id) => !isNaN(id));
      setFormData((prev) => ({
        ...prev,
        target_account_roles: ['branch_admin', 'member'],
        target_staff_role_ids: allStaffIds
      }));
    }
  };

  const toggleAccountRole = (roleKey, e) => {
    if (e) e.stopPropagation();
    setFormData((prev) => {
      const exists = prev.target_account_roles.includes(roleKey);
      const updated = exists
        ? prev.target_account_roles.filter((r) => r !== roleKey)
        : [...prev.target_account_roles, roleKey];
      return { ...prev, target_account_roles: updated };
    });
  };

  const toggleStaffRole = (roleId, e) => {
    if (e) e.stopPropagation();
    const idNum = Number(roleId);
    setFormData((prev) => {
      const exists = prev.target_staff_role_ids.includes(idNum);
      const updated = exists
        ? prev.target_staff_role_ids.filter((id) => id !== idNum)
        : [...prev.target_staff_role_ids, idNum];
      return { ...prev, target_staff_role_ids: updated };
    });
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
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-visible transform transition-all my-8">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-lg flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                {mode === 'edit' ? t("announcementModals.updateAnnouncement", "Update Announcement") : t("announcementModals.createNewAnnouncement", "Create New Announcement")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {t("announcementModals.broadcastAdministrativeNoticeAcrossPortals", "Broadcast administrative notice across portals and members")}
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
              {t("announcementModals.announcementTitle", "Announcement Title")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("announcementModals.eGSocietyAnnualGeneral", "e.g. Society Annual General Meeting 2026 Scheduled")}
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
              {t("announcementModals.noticeMessage", "Notice Message")} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              placeholder={t("announcementModals.writeTheFullAnnouncementMessage", "Write the full announcement message, circular text, or official notice details here...")}
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

          {/* Target Audience Section - Unified Single Dropdown (No Checkboxes) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t("announcementModals.targetAudienceBroadcastScope", "Target Audience & Broadcast Scope")}
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {t("announcementModals.selectAllOrSelectEach", "Select all or select each role individually")}
              </span>
            </div>

            <div className="relative audience-dropdown-container">
              <button
                type="button"
                onClick={() => setAudienceDropdownOpen(!audienceDropdownOpen)}
                className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer font-medium text-xs sm:text-sm ${
                  audienceDropdownOpen
                    ? 'border-teal-500 ring-2 ring-teal-100 bg-white'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <div className="flex-1 flex flex-wrap items-center gap-1.5 py-0.5">
                  {selectedCount === 0 ? (
                    <span className="text-slate-400">
                      {t("announcementModals.allAudiencesLeaveEmptyTo", "All Audiences (Leave empty to broadcast to everyone)")}
                    </span>
                  ) : isAllSelected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      {t("announcementModals.allRolesPortalsSelected", "All Roles & Portals Selected (")}{totalRolesCount})
                    </span>
                  ) : (
                    <>
                      {formData.target_account_roles.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80"
                        >
                          {r === 'branch_admin' ? t("superAdminAnnouncements.branchAdmin", "Branch Admin") : r === 'member' ? t("dashboardModule.accountTransactions.roleMember", "Member") : r}
                          <span
                            onClick={(e) => toggleAccountRole(r, e)}
                            className="hover:text-amber-950 p-0.5 cursor-pointer"
                          >
                            ×
                          </span>
                        </span>
                      ))}

                      {formData.target_staff_role_ids.map((id) => {
                        const roleObj = staffRolesList.find((r) => Number(r.id) === Number(id));
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80"
                          >
                            {roleObj?.name || `Role #${id}`}
                            <span
                              onClick={(e) => toggleStaffRole(id, e)}
                              className="hover:text-teal-950 p-0.5 cursor-pointer"
                            >
                              ×
                            </span>
                          </span>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {selectedCount > 0 && !isAllSelected && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {selectedCount} {t("announcementModals.selected", "selected")}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      audienceDropdownOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Single Floating Dropdown Menu (No Checkboxes) */}
              {audienceDropdownOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain animate-fadeIn divide-y divide-slate-100">
                  {/* Select All Option */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isAllSelected
                          ? 'bg-teal-50 text-teal-950 font-bold'
                          : 'hover:bg-slate-50 text-slate-800 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                            isAllSelected
                              ? 'bg-teal-600 text-white'
                              : 'border-2 border-slate-300'
                          }`}
                        >
                          {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm">{t("announcementModals.selectAll", "Select All")}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {isAllSelected ? t("announcementModals.allSelected", "All selected") : t("announcementModals.allAudiences", "All audiences")}
                      </span>
                    </button>
                  </div>

                  {/* Portals / Account Roles */}
                  <div className="p-1.5">
                    <span className="px-3 py-1 block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("announcementModals.portalsAccountRoles", "Portals / Account Roles")}
                    </span>

                    {/* Branch Admin */}
                    {(() => {
  const { t } = useTranslation();
                      const isSelected = formData.target_account_roles.includes('branch_admin');
                      return (
                        <button
                          type="button"
                          onClick={(e) => toggleAccountRole('branch_admin', e)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50/70 text-teal-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm">{t("superAdminAnnouncements.branchAdmin", "Branch Admin")}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {t("announcementModals.branchManagersDeskOfficers", "Branch managers & desk officers")}
                          </span>
                        </button>
                      );
                    })()}

                    {/* Members */}
                    {(() => {
  const { t } = useTranslation();
                      const isSelected = formData.target_account_roles.includes('member');
                      return (
                        <button
                          type="button"
                          onClick={(e) => toggleAccountRole('member', e)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50/70 text-teal-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm">{t("dashboardModule.branchOverview.tabMembers", "Members")}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {t("announcementModals.societyShareholders", "Society shareholders")}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
       
                  {/* Staff Roles */}
                  <div className="p-1.5">
                    <span className="px-3 py-1 block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("sidebar.staffRoles", "Staff Roles")}
                    </span>

                    {loadingRoles ? (
                      <div className="py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        <span>{t("superAdminStaffRoles.loadingStaffRoles", "Loading staff roles...")}</span>
                      </div>
                    ) : staffRolesList.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-400 italic">{t("announcementModals.noStaffRolesFound", "No staff roles found.")}</p>
                    ) : (
                      staffRolesList.map((role) => {
                        const isSelected = formData.target_staff_role_ids.includes(Number(role.id));
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={(e) => toggleStaffRole(role.id, e)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50/70 text-teal-950 font-bold'
                                : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'border-2 border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="text-xs sm:text-sm">{role.name}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
                  {t("announcementModals.activePublishImmediately", "Active (Publish Immediately)")}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {t("announcementModals.whenEnabledThisNoticeWill", "When enabled, this notice will be immediately visible to members and branches.")}
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
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("announcementModals.publishing", "Publishing...")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'edit' ? t("memberNominee.saveChanges", "Save Changes") : t("announcementModals.publishAnnouncement", "Publish Announcement")}</span>
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
  onDeleteClick,
  showAudience = false
}) {
  const { t } = useTranslation();
  if (!isOpen || !announcement) return null;

  const isActive = announcement.is_active !== false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-visible transform transition-all my-8">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-xl flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {t("announcementModals.notice", "Notice #")}{announcement.id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isActive ? t("announcementModals.active", "● Active") : t("announcementModals.inactive", "○ Inactive")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t("announcementModals.officialSocietyAnnouncementCircular", "Official Society Announcement Circular")}
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
              {t("staffAnnouncements.noticeTitle", "Notice Title")}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {announcement.title}
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00b4a7]" />
              {t("announcementModals.announcementMessageBody", "Announcement Message Body")}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
              {announcement.message}
            </p>
          </div>

          {/* Target Audience Badges (Visible only when showAudience is true, e.g. in Super Admin) */}
          {showAudience && (
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                {t("announcementModals.targetAudienceBroadcastScope", "Target Audience & Broadcast Scope")}
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {Array.isArray(announcement.target_account_roles) && announcement.target_account_roles.length > 0 ? (
                  announcement.target_account_roles.map((r) => (
                    <span
                      key={r}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1"
                    >
                      <Building className="w-3 h-3 text-amber-600" />
                      {r === 'branch_admin' ? t("superAdminAnnouncements.branchAdmin", "Branch Admin") : r === 'member' ? t("dashboardModule.branchOverview.tabMembers", "Members") : r}
                    </span>
                  ))
                ) : null}

                {Array.isArray(announcement.target_staff_role_ids) && announcement.target_staff_role_ids.length > 0 ? (
                  announcement.target_staff_role_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center gap-1"
                    >
                      <Users className="w-3 h-3 text-teal-600" />
                      {t("announcementModals.staffRole", "Staff Role #")}{id}
                    </span>
                  ))
                ) : null}

                {(!announcement.target_account_roles || announcement.target_account_roles.length === 0) &&
                  (!announcement.target_staff_role_ids || announcement.target_staff_role_ids.length === 0) && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {t("announcementModals.allPortalsAudiencesGeneralBroadcast", "All Portals & Audiences (General Broadcast)")}
                    </span>
                  )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-slate-500 block font-medium">{t("dashboardModule.announcements.colPublishedDate", "Published Date")}</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {formatDateTime(announcement.created_at)}
              </span>
            </div>

            {announcement.updated_at && (
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 block font-medium">{t("announcementModals.lastModified", "Last Modified")}</span>
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
              <span>{t("announcementModals.deleteNotice", "Delete Notice")}</span>
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
                <span>{t("announcementModals.editNotice", "Edit Notice")}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
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
 * Modal for Confirming Announcement Deletion
 */ 
export function AnnouncementDeleteModal({
  isOpen,
  announcement,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  const { t } = useTranslation();
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
              {t("superAdminAnnouncements.deleteAnnouncement", "Delete Announcement")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("announcementModals.notice", "Notice #")}{announcement.id}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {t("announcementModals.areYouSureYouWant", "Are you sure you want to permanently delete the announcement")}{' '}
          <strong className="text-slate-900 font-bold">"{announcement.title}"</strong>{t("announcementModals.thisNoticeWillBePermanently", "? This notice will be permanently removed from all member and branch noticeboards.")}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
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
            <span>{t("superAdminAnnouncements.deleteAnnouncement", "Delete Announcement")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
