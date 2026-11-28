import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  AnnouncementFormModal,
  AnnouncementDetailModal,
  AnnouncementDeleteModal
} from '../../components/dashboard/AnnouncementModals';
import * as announcementService from '../../services/announcementService';
import { getStaffRoles } from '../../services/staffRoleService';
import {
  Megaphone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  Radio,
  FileText,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import announcementIllustration from '../../assets/Glossy Banking Notice Collection.png';

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

export default function SuperAdminAnnouncements() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modals state
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    announcement: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    announcement: null,
    isDeleting: false,
  });

  // Centered Feedback Popups
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);
  const [staffRolesMap, setStaffRolesMap] = useState({});

  useEffect(() => {
    getStaffRoles({ limit: 100 })
      .then((roles) => {
        if (Array.isArray(roles)) {
          const map = {};
          roles.forEach((r) => {
            if (r.id) map[r.id] = r.name;
          });
          setStaffRolesMap(map);
        }
      })
      .catch((err) => console.warn('Could not load staff roles mapping:', err));
  }, []);

  const fetchAnnouncementsList = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await announcementService.getAnnouncements({ limit: 100 });
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Fetch announcements error:', err);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load announcements from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncementsList();
  }, []);

  // Form submit (Create or Update)
  const handleFormSubmit = async (formData) => {
    setFormModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const res = await announcementService.createAnnouncement(formData);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminAnnouncements.announcementPublished", "Announcement Published"),
          message: `Notice "${res?.title || formData.title}" was published successfully.`
        });
      } else {
        const id = formModal.data.id;
        const res = await announcementService.updateAnnouncement(id, formData);
        setFormModal({ isOpen: false, mode: 'edit', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("superAdminAnnouncements.announcementUpdated", "Announcement Updated"),
          message: `Notice #${id} ("${res?.title || formData.title}") was updated successfully.`
        });
      }
      await fetchAnnouncementsList(true);
    } catch (err) {
      console.error('Save announcement error:', err);
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Creation Failed' : 'Update Failed',
        message: err.message || 'Could not save announcement.'
      });
    }
  };

  // Delete announcement
  const handleDeleteConfirm = async (announcementId) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await announcementService.deleteAnnouncement(announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      setDeleteModal({ isOpen: false, announcement: null, isDeleting: false });
      setSuccessPopup({
        title: i18n.t("superAdminAnnouncements.announcementDeleted", "Announcement Deleted"),
        message: `Notice #${announcementId} was deleted successfully.`
      });
    } catch (err) {
      console.error('Delete announcement error:', err);
      setDeleteModal({ isOpen: false, announcement: null, isDeleting: false });
      setErrorPopup({
        title: i18n.t("superAdminAnnouncements.deletionFailed", "Deletion Failed"),
        message: err.message || 'Could not delete announcement.'
      });
    }
  };

  // Toggle active status
  const handleToggleStatus = async (item) => {
    setActionLoadingId(item.id);
    const newStatus = item.is_active === false;
    try {
      await announcementService.changeAnnouncementStatus(item.id, newStatus);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_active: newStatus } : a))
      );
      setSuccessPopup({
        title: i18n.t("branchManagerMembers.statusUpdated", "Status Updated"),
        message: `Notice "${item.title}" is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`
      });
    } catch (err) {
      console.error('Toggle status error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || 'Could not change announcement status.'
      });
      await fetchAnnouncementsList(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('superadmin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = {
    name: storedUser?.name || storedUser?.full_name || 'Super Admin',
    id: storedUser?.id ? `SUPER-ADMIN-${storedUser.id}` : 'SUPER-ADMIN',
    avatarText: 'SA',
    role: 'Super Admin',
    roleTitle: 'Super Admin',
    office: storedUser?.office || 'Head Office - Apex Central Administration',
  };

  // Computed Metrics
  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => a.is_active !== false).length;
  const inactiveCount = totalCount - activeCount;
  const latestNotice = announcements.length > 0 ? announcements[0]?.title : 'None';

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = !q || (a.title || '').toLowerCase().includes(q);
    const msgMatch = !q || (a.message || '').toLowerCase().includes(q);

    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = a.is_active !== false;
    else if (statusFilter === 'inactive') statusMatch = a.is_active === false;

    return (titleMatch || msgMatch) && statusMatch;
  });

  // Pagination slice
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="announcements"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Megaphone className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("login.superAdmin.portalTitleLine1", "Super Admin")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("superAdminAnnouncements.broadcastNoticeBoard", "Broadcast & Notice Board")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("superAdminAnnouncements.liveBroadcast", "Live Broadcast")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("superAdminAnnouncements.societyAnnouncementsNotices", "Society Announcements & Notices")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminAnnouncements.broadcastAdministrativeCircularsHolidaySchedules", "Broadcast administrative circulars, holiday schedules, regulatory updates, and notifications across branch portals and member dashboards.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={announcementIllustration}
              alt={t("superAdminAnnouncements.announcementsBroadcastIllustration", "Announcements Broadcast Illustration")}
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300 mx-auto md:mx-0"
            />
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title={t("superAdminAnnouncements.totalAnnouncements", "Total Announcements")}
            value={totalCount.toString()}
            subtitle={t("superAdminAnnouncements.registeredNotices", "Registered Notices")}
            icon={Megaphone}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title={t("superAdminAnnouncements.activeAnnouncements", "Active Announcements")}
            value={activeCount.toString()}
            subtitle={t("superAdminAnnouncements.liveAcrossPortals", "Live Across Portals")}
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% active` : '100%'}
            trendType="up"
          />
          <StatCard
            title={t("superAdminAnnouncements.inactiveNotices", "Inactive Notices")}
            value={inactiveCount.toString()}
            subtitle={t("superAdminAnnouncements.archivedDisabled", "Archived / Disabled")}
            icon={Clock}
          />
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {t("superAdminAnnouncements.noticeboardDirectory", "Noticeboard Directory")}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t("superAdminAnnouncements.manageAdministrativeNoticesPublishUpdates", "Manage administrative notices, publish updates, and regulate broadcast visibility")}
              </p>
            </div>

            {/* Right-side controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("superAdminAnnouncements.searchAnnouncementsByTitleOr", "Search announcements by title or message...")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                  <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                  <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnnouncementsList(true)}
                disabled={refreshing}
                title={t("dashboardModule.announcements.refreshTooltip", "Refresh announcements")}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Create Announcement Button */}
              <button
                onClick={() =>
                  setFormModal({
                    isOpen: true,
                    mode: 'create',
                    data: null,
                    isSubmitting: false
                  })
                }
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("superAdminAnnouncements.newAnnouncement", "New Announcement")}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">{t("memberAnnouncements.failedToLoadAnnouncements", "Failed to load announcements")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchAnnouncementsList()}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">{t("superAdminAnnouncements.loadingAnnouncementsFromCentralServer", "Loading announcements from central server...")}</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("dashboardModule.announcements.noMatchingTitle", "No matching announcements found") : t("dashboardModule.announcements.emptyTitle", "No announcements published yet")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("branchManagerFdMisSchemes.tryAdjustingYourSearchQuery", "Try adjusting your search query or clear the filter.")
                      : t("superAdminAnnouncements.publishAdministrativeNoticesHolidayCalendars", "Publish administrative notices, holiday calendars, or policy updates to broadcast to all users.")}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() =>
                      setFormModal({
                        isOpen: true,
                        mode: 'create',
                        data: null,
                        isSubmitting: false
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t("superAdminAnnouncements.publishFirstAnnouncement", "Publish First Announcement")}
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("staffAnnouncements.noticeTitle", "Notice Title")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.branchOverview.colMessagePreview", "Message Preview")}</th>
                    <th className="py-3.5 px-6">{t("superAdminAnnouncements.targetAudience", "Target Audience")}</th>
                    <th className="py-3.5 px-6">{t("staffAnnouncements.publishedAt", "Published At")}</th>
                    <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-6 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedAnnouncements.map((item) => {
  const { t } = useTranslation();
                    const isActive = item.is_active !== false;
                    const isActing = actionLoadingId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Title */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                              <Megaphone className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                                {item.title}
                              </div>
                              <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mt-0.5 inline-block">
                                #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Message Preview */}
                        <td className="py-4 px-6 max-w-md">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        </td>

                        {/* Target Audience */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(item.target_account_roles) && item.target_account_roles.length > 0 ? (
                              item.target_account_roles.map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80"
                                >
                                  {r === 'branch_admin' ? t("superAdminAnnouncements.branchAdmin", "Branch Admin") : r === 'member' ? t("dashboardModule.branchOverview.tabMembers", "Members") : r}
                                </span>
                              ))
                            ) : null}

                            {Array.isArray(item.target_staff_role_ids) && item.target_staff_role_ids.length > 0 ? (
                              item.target_staff_role_ids.map((id) => (
                                <span
                                  key={id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/80"
                                >
                                  {staffRolesMap[id] || `Role #${id}`}
                                </span>
                              ))
                            ) : null}

                            {(!item.target_account_roles || item.target_account_roles.length === 0) &&
                              (!item.target_staff_role_ids || item.target_staff_role_ids.length === 0) && (
                                <span className="text-[10px] font-medium text-slate-400 italic">
                                  {t("superAdminAnnouncements.allAudiences", "All Audiences")}
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Published Date */}
                        <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(item.created_at)}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isActing}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            } ${isActing ? 'opacity-50 cursor-wait' : ''}`}
                            title={`Click to ${isActive ? t("branchManagerMembers.deactivate", "deactivate") : t("branchManagerMembers.activate", "activate")} this announcement`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="text-[10px] font-bold mt-1">
                            {isActive ? (
                              <span className="text-emerald-700">{t("common.active", "Active")}</span>
                            ) : (
                              <span className="text-slate-400">{t("common.inactive", "Inactive")}</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail */}
                            <button
                              onClick={() =>
                                setDetailModal({
                                  isOpen: true,
                                  announcement: item
                                })
                              }
                              title={t("superAdminAnnouncements.viewAnnouncementDetails", "View Announcement Details")}
                              className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() =>
                                setFormModal({
                                  isOpen: true,
                                  mode: 'edit',
                                  data: item,
                                  isSubmitting: false
                                })
                              }
                              title={t("superAdminAnnouncements.editAnnouncement", "Edit Announcement")}
                              className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  announcement: item,
                                  isDeleting: false
                                })
                              }
                              title={t("superAdminAnnouncements.deleteAnnouncement", "Delete Announcement")}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && filteredAnnouncements.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} {t("common.of", "of")} {filteredAnnouncements.length} {t("dashboardModule.announcements.noticesUnit", "notices")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.previous", "Previous")}
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Form Modal (Create / Edit) */}
      <AnnouncementFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.data}
        isSubmitting={formModal.isSubmitting}
        onClose={() => setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={detailModal.isOpen}
        announcement={detailModal.announcement}
        showAudience={true}
        onClose={() => setDetailModal({ isOpen: false, announcement: null })}
        onEditClick={(item) =>
          setFormModal({
            isOpen: true,
            mode: 'edit',
            data: item,
            isSubmitting: false
          })
        }
        onDeleteClick={(item) =>
          setDeleteModal({
            isOpen: true,
            announcement: item,
            isDeleting: false
          })
        }
      />

      {/* Delete Confirmation Modal */}
      <AnnouncementDeleteModal
        isOpen={deleteModal.isOpen}
        announcement={deleteModal.announcement}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, announcement: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{successPopup.title}</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{successPopup.message}</p>
            <button
              onClick={() => setSuccessPopup(null)}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
            >
              {t("branchManagerMembershipSettings.continue", "Continue")}
            </button>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{errorPopup.title}</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{errorPopup.message}</p>
            <button
              onClick={() => setErrorPopup(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              {t("branchManagerMemberPasswordUpdate.dismiss", "Dismiss")}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
