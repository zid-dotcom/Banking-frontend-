import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  BranchStaffFormModal,
  BranchStaffDetailModal,
  BranchStaffDeleteModal
} from '../../components/dashboard/BranchStaffModals';
import * as branchStaffService from '../../services/branchStaffService';
import { getAvailableStaffRoles } from '../../services/branchStaffService';
import {
  Users,
  User,
  UserCheck,
  UserX,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  Building2
} from 'lucide-react';
import hrIllustration from '../../assets/Teal HR Team Registry Illustration.webp';

function parseBranchInfo(obj = {}) {
  const b = obj.branch;
  const isObj = b && typeof b === 'object';

  const name =
    (isObj ? (b.name || b.branch_name) : null) ||
    (typeof obj.branch_name === 'string' ? obj.branch_name : null) ||
    (typeof b === 'string' ? b : null) ||
    'Society Branch';

  const code =
    (isObj ? b.branch_code : null) ||
    (typeof obj.branch_code === 'string' ? obj.branch_code : null) ||
    (obj.branch_id ? `BRA-${obj.branch_id}` : 'BRA-01');

  const loc =
    (isObj ? (b.city ? `${b.city}, ${b.state || 'Kerala'}` : b.state) : null) ||
    (typeof obj.location === 'string' ? obj.location : 'Kerala');

  return { name, code, loc };
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

export default function BranchManagerStaff({ embedded = false }) {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    staff: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    staff: null,
    isDeleting: false,
  });

  // Centered Feedback Popups
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const [managerUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Branch Manager';
        const { name: bName, code: bCode, loc: bLoc } = parseBranchInfo(parsed);
        return {
          name,
          full_name: name,
          id: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          user_code: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          avatarText: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
          role: 'Branch Manager',
          branch: bName,
          branch_name: bName,
          branch_code: bCode,
          location: bLoc,
          is_active: parsed.is_active !== false,
          branch_id: parsed.branch_id || (typeof parsed.branch === 'object' ? parsed.branch?.id : null)
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      user_code: 'MGR-001',
      avatarText: 'BM',
      role: 'Branch Manager',
      branch: 'Main City Branch',
      branch_name: 'Main City Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
      is_active: true
    };
  });

  // Fetch Staff List & Available Staff Roles
  const fetchStaff = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel fetch staff and dedicated branch admin staff roles
      const [staffRes, rolesRes] = await Promise.allSettled([
        branchStaffService.getBranchStaff({ limit: 100 }),
        branchStaffService.getBranchAdminStaffRoles(),
      ]);

      let loadedRoles = [];
      if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) && rolesRes.value.length > 0) {
        loadedRoles = rolesRes.value;
        setRoles(loadedRoles);
      }

      if (staffRes.status === 'fulfilled') {
        const staffData = staffRes.value;
        if (Array.isArray(staffData)) {
          setStaffList(staffData);
          if (loadedRoles.length === 0) {
            setRoles(getAvailableStaffRoles(staffData));
          }
        } else {
          setStaffList([]);
        }
      } else {
        throw staffRes.reason;
      }
    } catch (err) {
      console.warn('getBranchStaff error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load branch staff list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Form Submit Handler (Create & Edit)
  const handleFormSubmit = async (formData) => {
    setFormModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const res = await branchStaffService.createBranchStaff(formData);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("branchManagerStaff.staffMemberCreated", "Staff Member Created"),
          message: `Staff member "${res?.full_name || formData.full_name}" has been registered successfully with code ${res?.staff_code || 'newly assigned'}.`
        });
      } else {
        const staffId = formModal.data?.id;
        const res = await branchStaffService.updateBranchStaff(staffId, formData);
        setFormModal({ isOpen: false, mode: 'edit', data: null, isSubmitting: false });
        setSuccessPopup({
          title: i18n.t("branchManagerStaff.staffProfileUpdated", "Staff Profile Updated"),
          message: `Staff member "${res?.full_name || formData.full_name}" details updated successfully.`
        });
      }
      await fetchStaff(true);
    } catch (err) {
      console.error('Staff form submit error:', err);
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Failed to Register Staff' : 'Failed to Update Staff',
        message: err.message || 'Server rejected the request. Please verify inputs and try again.'
      });
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = async (staff) => {
    const newStatus = !staff.is_active;
    setActionLoadingId(staff.id);
    try {
      await branchStaffService.changeBranchStaffStatus(staff.id, newStatus);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, is_active: newStatus } : s))
      );
      setSuccessPopup({
        title: i18n.t("branchManagerMembers.statusUpdated", "Status Updated"),
        message: `Staff member "${staff.full_name}" is now ${newStatus ? 'Active' : 'Inactive'}.`
      });
    } catch (err) {
      console.error('Failed to change staff status:', err);
      setErrorPopup({
        title: i18n.t("branchManagerStaff.statusChangeFailed", "Status Change Failed"),
        message: err.message || 'Unable to update staff active status.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Confirm Handler
  const handleDeleteConfirm = async (staff) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await branchStaffService.deleteBranchStaff(staff.id);
      setDeleteModal({ isOpen: false, staff: null, isDeleting: false });
      setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
      setSuccessPopup({
        title: i18n.t("branchManagerStaff.staffMemberRemoved", "Staff Member Removed"),
        message: `Staff member "${staff.full_name}" (${staff.staff_code}) was removed from this branch.`
      });
    } catch (err) {
      console.error('Failed to delete staff member:', err);
      setErrorPopup({
        title: i18n.t("branchManagerStaff.deleteFailed", "Delete Failed"),
        message: err.message || 'Unable to delete staff member from registry.'
      });
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Filtered List
  const filteredStaff = staffList.filter((s) => {
    const name = (s.full_name || '').toLowerCase();
    const code = (s.staff_code || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    if (q && !name.includes(q) && !code.includes(q) && !email.includes(q)) {
      return false;
    }

    if (statusFilter === 'active' && s.is_active === false) return false;
    if (statusFilter === 'inactive' && s.is_active !== false) return false;

    if (roleFilter !== 'all' && String(s.staff_role_id) !== String(roleFilter)) {
      return false;
    }

    return true;
  });

  // Stats calculation
  const totalCount = staffList.length;
  const activeCount = staffList.filter((s) => s.is_active !== false).length;
  const inactiveCount = totalCount - activeCount;
  const uniqueRolesCount = new Set(staffList.map((s) => s.staff_role_id).filter(Boolean)).size;

  // Pagination slice
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const content = (
    <>
      <div className="space-y-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <span className="w-4 h-4 rounded-full bg-teal-500/15 flex items-center justify-center text-[#00b4a7]">
                  <User className="w-2.5 h-2.5 stroke-[2.5]" />
                </span>
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("nav.branchManager", "Branch Manager")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 text-slate-700 sm:text-[#0f766e] font-semibold">
                <MapPin className="w-3 h-3 text-[#00b4a7]" />
                <span>{managerUser.branch_name || 'Society Branch'}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("common.active", "Active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("branchManagerStaff.branchStaffRegistry", "Branch Staff Registry")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("branchManagerStaff.registerBranchEmployeesAssignOperational", "Register branch employees, assign operational roles, oversee account credentials, and regulate service privileges.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end items-center pointer-events-none -my-2 sm:-my-4 lg:-my-5 flex-shrink-0 w-full md:w-auto">
            <img
              src={hrIllustration}
              alt={t("branchManagerStaff.branchStaffRegistry", "Branch Staff Registry")}
              className="h-28 sm:h-36 lg:h-44 max-w-full w-auto object-contain select-none pointer-events-none transform hover:scale-102 transition-transform duration-300 mx-auto md:mx-0 drop-shadow-xs"
            />
          </div>

          {/* Ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("branchManagerStaff.totalBranchStaff", "Total Branch Staff")}
            value={totalCount.toString()}
            subtitle={t("branchManagerStaff.registeredEmployees", "Registered Employees")}
            icon={Users}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerStaff.activePersonnel", "Active Personnel")}
            value={activeCount.toString()}
            subtitle={t("branchManagerStaff.onDutyInBranch", "On-Duty in Branch")}
            icon={UserCheck}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% on duty` : '100%'}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerStaff.inactiveOnLeave", "Inactive / On-Leave")}
            value={inactiveCount.toString()}
            subtitle={t("branchManagerStaff.suspendedOrOnLeave", "Suspended or On-Leave")}
            icon={UserX}
            trend={inactiveCount > 0 ? `${inactiveCount} offline` : 'None'}
            trendType="neutral"
          />
          <StatCard
            title={t("branchManagerStaff.rolesRepresented", "Roles Represented")}
            value={uniqueRolesCount.toString()}
            subtitle={t("branchManagerStaff.designatedStaffRoles", "Designated Staff Roles")}
            icon={Briefcase}
            trend="Operational"
            trendType="neutral"
          />
        </div>

        {/* Staff Management Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Table Header Filter & Action Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t("branchManagerStaff.branchStaffDirectory", "Branch Staff Directory")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("branchManagerStaff.comprehensiveDirectoryOfStaffMembers", "Comprehensive directory of staff members stationed at this branch")}
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t("branchManagerStaff.searchNameCodeOrEmail", "Search name, code, or email...")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">{t("branchManagerLoanSchemes.allStatus", "All Status")}</option>
                <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">{t("branchManagerSecurityEvents.allRoles", "All Roles")}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchStaff(true)}
                disabled={refreshing}
                title={t("branchManagerStaff.refreshStaffList", "Refresh staff list")}
                className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Create Staff Button */}
              <button
                onClick={() => setFormModal({ isOpen: true, mode: 'create', data: null, isSubmitting: false })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("branchManagerStaff.registerStaff", "Register Staff")}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">{t("branchManagerStaff.failedToLoadBranchStaff", "Failed to load branch staff")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchStaff()}
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
                <p className="text-sm text-slate-500 font-medium">{t("branchManagerStaff.loadingBranchStaffFromServer", "Loading branch staff from server...")}</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{t("branchManagerStaff.noStaffMembersFound", "No Staff Members Found")}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                      ? t("branchManagerStaff.noStaffMembersMatchThe", "No staff members match the selected filter or search criteria.")
                      : t("branchManagerStaff.noEmployeesRegisteredUnderThis", "No employees registered under this branch yet. Click below to add one.")}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => setFormModal({ isOpen: true, mode: 'create', data: null, isSubmitting: false })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t("branchManagerStaff.registerFirstStaff", "Register First Staff")}
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("branchManagerStaff.staffCode", "Staff Code")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerStaff.staffName", "Staff Name")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerSecurityEvents.role", "Role")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerStaff.officialEmail", "Official Email")}</th>
                    <th className="py-3.5 px-6">{t("modal.branchAdmin.contactNumberLabel", "Contact Number")}</th>
                    <th className="py-3.5 px-6">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                    <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-6 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* Staff Code */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                          {staff.staff_code || `STF-${staff.id}`}
                        </span>
                      </td>

                      {/* Staff Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center font-bold text-xs border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            {staff.full_name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {staff.full_name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              {t("branchManagerStaff.id", "ID: #")}{staff.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Briefcase className="w-3 h-3 text-teal-600" />
                          <span>
                            {staff.staff_role_name ||
                              roles.find((r) => Number(r.id) === Number(staff.staff_role_id))?.name ||
                              (staff.staff_role_id ? `Role #${staff.staff_role_id}` : t("dashboardModule.passwordUpdate.fallbackBranchStaff", "Branch Staff"))}
                          </span>
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staff.email}</span>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staff.contact_number || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Created At (With Date and Time) */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(staff.created_at)}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          disabled={actionLoadingId === staff.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            staff.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          } ${actionLoadingId === staff.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={`Click to ${staff.is_active ? t("branchManagerMembers.deactivate", "deactivate") : t("branchManagerMembers.activate", "activate")} this staff member`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              staff.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, staff })}
                            title={t("branchManagerStaff.viewStaffDetails", "View Staff Details")}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFormModal({ isOpen: true, mode: 'edit', data: staff, isSubmitting: false })}
                            title={t("branchManagerStaff.editStaffMember", "Edit Staff Member")}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, staff, isDeleting: false })}
                            title={t("branchManagerStaff.deleteStaffMember", "Delete Staff Member")}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Pagination & Counter */}
          {!loading && filteredStaff.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium bg-slate-50/50">
              <span>
                {t("common.showing", "Showing")} <strong className="text-slate-700">{paginatedStaff.length}</strong> {t("common.of", "of")}{' '}
                <strong className="text-slate-700">{filteredStaff.length}</strong> {t("branchManagerStaff.staffMembers", "staff members")}
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.previous", "Previous")}
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    {t("branchManagerInvestmentSchemes.page", "Page")} {currentPage} {t("common.of", "of")} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.next", "Next")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create & Edit) */}
      <BranchStaffFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.data}
        availableRoles={roles}
        isSubmitting={formModal.isSubmitting}
        onClose={() => setFormModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Modal */}
      <BranchStaffDetailModal
        isOpen={detailModal.isOpen}
        staff={detailModal.staff}
        availableRoles={roles}
        onClose={() => setDetailModal({ isOpen: false, staff: null })}
        onEditClick={(s) => setFormModal({ isOpen: true, mode: 'edit', data: s, isSubmitting: false })}
        onDeleteClick={(s) => setDeleteModal({ isOpen: true, staff: s, isDeleting: false })}
      />

      {/* Delete Confirmation Modal */}
      <BranchStaffDeleteModal
        isOpen={deleteModal.isOpen}
        staff={deleteModal.staff}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, staff: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success Notification Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{successPopup.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{successPopup.message}</p>
            </div>
            <button
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
            >
              {t("branchManagerMembershipSettings.continue", "Continue")}
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{errorPopup.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{errorPopup.message}</p>
            </div>
            <button
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              {t("branchManagerMemberPasswordUpdate.dismiss", "Dismiss")}
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout role="branch_manager" user={managerUser} activeTab="staff">
      {content}
    </DashboardLayout>
  );
}

