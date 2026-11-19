import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import {
  BranchStaffFormModal,
  BranchStaffDetailModal,
  BranchStaffDeleteModal
} from '../../components/dashboard/BranchStaffModals';
import * as superadminStaffService from '../../services/superadminStaffService';
import { getStaffRoles } from '../../services/staffRoleService';
import { getBranches } from '../../services/branchService';
import {
  Users,
  User,
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
  Building2,
  Filter,
  Layers,
  Check,
  X
} from 'lucide-react';
import hrIllustration from '../../assets/Teal HR Team Registry Illustration.webp';

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

export default function SuperAdminStaff() {
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
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

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchData, roleData] = await Promise.all([
        getBranches().catch(() => []),
        getStaffRoles().catch(() => []),
      ]);

      setBranches(branchData || []);
      setRoles(roleData || []);

      await fetchStaffList({
        branch_id: branchFilter !== 'all' ? branchFilter : null,
        staff_role_id: roleFilter !== 'all' ? roleFilter : null,
        is_active: statusFilter === 'all' ? null : statusFilter === 'active',
        search: searchQuery
      });
    } catch (err) {
      console.error('SuperAdminStaff loadInitialData error:', err);
      setError(err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async (options = {}, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await superadminStaffService.listSuperAdminStaff(options);
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('SuperAdminStaff fetch error:', err);
      setError(err.message || 'Failed to load staff list from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStaffList({
      branch_id: branchFilter !== 'all' ? branchFilter : null,
      staff_role_id: roleFilter !== 'all' ? roleFilter : null,
      is_active: statusFilter === 'all' ? null : statusFilter === 'active',
      search: searchQuery
    }, true);
  };

  // Re-fetch when branch, role, or status filter changes
  const handleFilterChange = (type, value) => {
    let nextBranch = branchFilter;
    let nextRole = roleFilter;
    let nextStatus = statusFilter;

    if (type === 'branch') {
      setBranchFilter(value);
      nextBranch = value;
    } else if (type === 'role') {
      setRoleFilter(value);
      nextRole = value;
    } else if (type === 'status') {
      setStatusFilter(value);
      nextStatus = value;
    }

    setCurrentPage(1);

    fetchStaffList({
      branch_id: nextBranch !== 'all' ? nextBranch : null,
      staff_role_id: nextRole !== 'all' ? nextRole : null,
      is_active: nextStatus === 'all' ? null : nextStatus === 'active',
      search: searchQuery
    });
  };

  // Search submission or debounce
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchStaffList({
      branch_id: branchFilter !== 'all' ? branchFilter : null,
      staff_role_id: roleFilter !== 'all' ? roleFilter : null,
      is_active: statusFilter === 'all' ? null : statusFilter === 'active',
      search: searchQuery
    });
  };

  // Toggle active status (PATCH /superadmin/staff/{staff_id}/status)
  const handleToggleStatus = async (staff) => {
    const currentActive = staff.is_active !== false;
    const nextStatus = !currentActive;
    setActionLoadingId(staff.id);
    try {
      await superadminStaffService.toggleSuperAdminStaffStatus(staff.id, nextStatus);

      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, is_active: nextStatus } : s))
      );

      setSuccessPopup({
        title: nextStatus ? 'Staff Member Activated' : 'Staff Member Deactivated',
        message: `${staff.full_name} has been ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
      setErrorPopup({
        title: 'Status Update Failed',
        message: err.message || 'Could not update staff operational status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create or Update submit handler
  const handleFormSubmit = async (formData) => {
    setFormModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const created = await superadminStaffService.createSuperAdminStaff(formData);

        setStaffList((prev) => [created, ...prev]);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });

        setSuccessPopup({
          title: 'Staff Member Created Successfully',
          message: `${created.full_name || formData.full_name} has been registered with staff code ${
            created.staff_code || 'STF'
          }.`,
        });
      } else {
        const staffId = formModal.data?.id;
        const updated = await superadminStaffService.updateSuperAdminStaff(staffId, formData);

        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, ...updated } : s))
        );
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });

        setSuccessPopup({
          title: 'Staff Profile Updated',
          message: `${updated.full_name || formModal.data?.full_name} details have been updated.`,
        });
      }
    } catch (err) {
      console.error('Staff form submission error:', err);
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Staff Registration Failed' : 'Update Failed',
        message: err.message || 'Server encountered an error while saving staff details.',
      });
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Delete staff submit handler
  const handleDeleteConfirm = async () => {
    const staffId = deleteModal.staff?.id;
    if (!staffId) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await superadminStaffService.deleteSuperAdminStaff(staffId);

      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      const deletedName = deleteModal.staff.full_name;

      setDeleteModal({ isOpen: false, staff: null, isDeleting: false });
      setSuccessPopup({
        title: 'Staff Member Removed',
        message: `${deletedName} has been deleted from the staff registry.`,
      });
    } catch (err) {
      console.error('Failed to delete staff:', err);
      setErrorPopup({
        title: 'Delete Staff Failed',
        message: err.message || 'Could not delete staff member.',
      });
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Client-side search enhancement
  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = String(s.full_name || '').toLowerCase();
    const code = String(s.staff_code || '').toLowerCase();
    const email = String(s.email || '').toLowerCase();
    const phone = String(s.contact_number || '').toLowerCase();
    const branchName = String(s.branch_name || s.branch?.name || '').toLowerCase();
    const roleName = String(s.staff_role_name || s.staff_role?.name || '').toLowerCase();

    return (
      name.includes(q) ||
      code.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      branchName.includes(q) ||
      roleName.includes(q)
    );
  });

  // Dynamic statistics
  const totalCount = staffList.length;
  const activeCount = staffList.filter((s) => s.is_active !== false).length;
  const inactiveCount = staffList.filter((s) => s.is_active === false).length;
  const uniqueBranchesCount = new Set(
    staffList.map((s) => s.branch_id || s.branch?.id).filter(Boolean)
  ).size;

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout role="super_admin" user={currentUser} activeTab="staff">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">

        {/* Hero Banner with Modern HR Team Registry Illustration */}
        <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>Role: Super Admin &bull; Society-wide Staff Governance &amp; Operations Desk</span>
            </div>

            {/* Headline with Vertical Teal Accent Bar */}
            <div className="flex items-center gap-3 mt-1">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Cooperative Society Staff Registry</span>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f766e] stroke-[2.2]" />
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              Apex administration of cashier drawers, branch accountants, and service desks across all cooperative society branches.
            </p>

            {/* Navigation Tabs Pill (Staff Members vs Staff Roles) */}
            <div className="mt-5 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-teal-200/70 rounded-2xl p-1.5 shadow-2xs">
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#00b4a7] text-white shadow-xs transition-all"
              >
                Staff Members ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => navigate('/super-admin/staff-roles')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-teal-800 hover:bg-teal-50/70 transition-all cursor-pointer"
              >
                Staff Roles ({roles.length})
              </button>
            </div>
          </div>

          {/* Right Section: 3D Illustration */}
          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <img
              src={hrIllustration}
              alt="Staff Registry Management"
              className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
        </div>

        {/* 4 Dynamic Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00b4a7] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {loading ? '...' : totalCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Across all operating branches</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Staff</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {loading ? '...' : activeCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Operational drawer credentials</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Inactive Staff</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
              {loading ? '...' : inactiveCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Access suspended / off-duty</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Assigned Branches</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-teal-800 mt-2">
              {loading ? '...' : uniqueBranchesCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Branches staffed</p>
          </div>
        </div>

        {/* Staff Table & Multi-filter Controls Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch Staff Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-branch staff credentials, operational role designations, and drawer status
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
              {/* Branch Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex-1 sm:flex-initial min-w-0">
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-500 flex-shrink-0">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full truncate max-w-full sm:max-w-[190px]"
                >
                  <option value="all">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || `Branch #${b.branch_code || b.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex-1 sm:flex-initial min-w-0">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full max-w-full sm:max-w-[160px] truncate"
                >
                  <option value="all">All Staff Roles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || `Role #${r.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex-1 sm:flex-initial min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00b4a7] shadow-2xs"
                />
              </form>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-[#0f766e] bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs flex-shrink-0"
                title="Refresh Staff List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00b4a7]' : ''}`} />
              </button>

              {/* Register Staff Button */}
              <button
                type="button"
                onClick={() =>
                  setFormModal({
                    isOpen: true,
                    mode: 'create',
                    data: {
                      branch_id: branchFilter !== 'all' ? branchFilter : (branches[0]?.id || '')
                    },
                    isSubmitting: false,
                  })
                }
                className="px-4 py-2 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Staff</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Staff Code</th>
                  <th className="py-3.5 px-5">Staff Name</th>
                  <th className="py-3.5 px-5">Role Designation</th>
                  <th className="py-3.5 px-5">Branch Office</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Joined At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#00b4a7] mb-2" />
                      <span className="font-semibold text-xs">Loading society staff records...</span>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">No Staff Members Found</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {searchQuery || branchFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'No staff records matched the active search or filter criteria. Try clearing filters.'
                          : 'No staff members have been registered yet under the society system.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((staff) => {
                    const isActive = staff.is_active !== false;
                    const roleName =
                      staff.staff_role_name ||
                      staff.staff_role?.name ||
                      roles.find((r) => Number(r.id) === Number(staff.staff_role_id))?.name ||
                      (staff.staff_role_id ? `Role #${staff.staff_role_id}` : 'Staff');

                    const branchObj = branches.find((b) => Number(b.id) === Number(staff.branch_id));
                    const branchName =
                      staff.branch_name ||
                      staff.branch?.name ||
                      branchObj?.name ||
                      (staff.branch_id ? `Branch #${staff.branch_id}` : 'Society Branch');
                    const branchCode =
                      staff.branch_code ||
                      staff.branch?.branch_code ||
                      branchObj?.branch_code;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Staff Code */}
                        <td className="py-3.5 px-5 font-mono font-bold text-teal-800">
                          <span className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/70 inline-block shadow-2xs">
                            {staff.staff_code || (staff.id ? `STF-${staff.id}` : '—')}
                          </span>
                        </td>

                        {/* Full Name */}
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900 capitalize text-sm">{staff.full_name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{staff.address || '—'}</p>
                        </td>

                        {/* Role Designation */}
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0f766e] border border-teal-200/60 shadow-2xs">
                            <Briefcase className="w-3 h-3 text-[#00b4a7]" />
                            <span>{roleName}</span>
                          </span>
                        </td>

                        {/* Branch Office */}
                        <td className="py-3.5 px-5">
                          <div>
                            <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{branchName}</span>
                            </p>
                            {branchCode && (
                              <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                                #{branchCode}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="py-3.5 px-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{staff.email || '—'}</span>
                            </div>
                            {staff.contact_number && (
                              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{staff.contact_number}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Toggle Switch (calls PATCH /superadmin/staff/{id}/status) */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              onClick={() => handleToggleStatus(staff)}
                              disabled={actionLoadingId === staff.id}
                              title={`Click to ${isActive ? 'deactivate' : 'activate'} this staff member`}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              } ${actionLoadingId === staff.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              <span className="sr-only">Toggle Staff Status</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-bold select-none ${
                                isActive ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        {/* Joined At */}
                        <td className="py-3.5 px-5 text-slate-500 font-medium">
                          {formatDateTime(staff.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setDetailModal({ isOpen: true, staff })}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-900 bg-white hover:bg-teal-50/40 transition-colors cursor-pointer shadow-2xs"
                              title="View Staff Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormModal({
                                  isOpen: true,
                                  mode: 'edit',
                                  data: staff,
                                  isSubmitting: false,
                                })
                              }
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-900 bg-white hover:bg-teal-50/40 transition-colors cursor-pointer shadow-2xs"
                              title="Edit Staff Member"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Staff */}
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, staff, isDeleting: false })}
                              className="p-1.5 rounded-lg border border-rose-200 hover:border-rose-400 text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 transition-colors cursor-pointer shadow-2xs"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Showing {paginatedStaff.length} of {filteredStaff.length} staff members across {branches.length} branches
            </span>

            {filteredStaff.length > itemsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                >
                  Prev
                </button>
                <span className="font-bold font-mono px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Staff Form Modal (Create / Edit) */}
      <BranchStaffFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        onSubmit={handleFormSubmit}
        mode={formModal.mode}
        initialData={formModal.data}
        availableRoles={roles}
        branches={branches}
        isSuperAdmin={true}
        isSubmitting={formModal.isSubmitting}
      />

      {/* Staff Detail Modal */}
      <BranchStaffDetailModal
        isOpen={detailModal.isOpen}
        staff={detailModal.staff}
        availableRoles={roles}
        onClose={() => setDetailModal({ isOpen: false, staff: null })}
        onEditClick={(st) => {
          setDetailModal({ isOpen: false, staff: null });
          setFormModal({ isOpen: true, mode: 'edit', data: st, isSubmitting: false });
        }}
        onDeleteClick={(st) => {
          setDetailModal({ isOpen: false, staff: null });
          setDeleteModal({ isOpen: true, staff: st, isDeleting: false });
        }}
      />

      {/* Staff Delete Confirmation Modal */}
      <BranchStaffDeleteModal
        isOpen={deleteModal.isOpen}
        staff={deleteModal.staff}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, staff: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Centered Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{successPopup.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{successPopup.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00b4a7] hover:bg-[#0f766e] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Okay, Understood
            </button>
          </div>
        </div>
      )}

      {/* Centered Error Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{errorPopup.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{errorPopup.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
