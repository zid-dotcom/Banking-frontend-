import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  StaffRoleCreateModal,
  StaffRoleDetailModal,
  StaffRoleDeleteConfirmModal
} from '../../components/dashboard/StaffRoleModals';
import * as staffRoleService from '../../services/staffRoleService';
import {
  ShieldCheck,
  Briefcase,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Lock,
  Layers,
  X,
  Users
} from 'lucide-react';
import hrTeamIllustration from '../../assets/Modern HR Team Management Illustration.webp';

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

export default function SuperAdminStaffRoles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    role: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    role: null,
    isDeleting: false,
  });

  // Centered Feedback Popups
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const fetchStaffRoles = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await staffRoleService.getStaffRoles();
      if (Array.isArray(data)) {
        setRoles(data);
        try {
          localStorage.setItem('cached_staff_roles', JSON.stringify(data));
        } catch {}
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('Fetch staff roles error:', err);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load staff roles from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffRoles();
  }, []);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const newRole = await staffRoleService.createStaffRole(formData);
      setCreateModalOpen(false);
      setSuccessPopup({
        title: 'Staff Role Created',
        message: `Successfully created role "${newRole?.name || formData.name}" (ID #${newRole?.id || ''}).`
      });
      await fetchStaffRoles(true);
    } catch (err) {
      console.error('Create staff role error:', err);
      setErrorPopup({
        title: 'Failed to Create Role',
        message: err.message || 'Could not create staff role. Please check input requirements.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (role) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await staffRoleService.deleteStaffRole(role.id);
      setDeleteModal({ isOpen: false, role: null, isDeleting: false });
      setSuccessPopup({
        title: 'Role Deleted',
        message: `Staff role "${role.name}" (ID #${role.id}) was permanently deleted.`
      });
      await fetchStaffRoles(true);
    } catch (err) {
      console.error('Delete staff role error:', err);
      setDeleteModal({ isOpen: false, role: null, isDeleting: false });
      setErrorPopup({
        title: 'Deletion Failed',
        message: err.message || `Could not delete role "${role.name}". It may have assigned staff.`
      });
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

  // Filter roles based on search
  const filteredRoles = roles.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = r.name?.toLowerCase().includes(q);
    const descMatch = r.description?.toLowerCase().includes(q);
    const idMatch = String(r.id).includes(q);
    return nameMatch || descMatch || idMatch;
  });

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="staff_roles"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <Users className="w-4 h-4 text-[#00b4a7]" />
              <span className="font-bold text-[#00b4a7]">Staff Management</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                Staff Roles &amp; Designations
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              Manage and oversee staff roles, job titles, and organizational structure.
            </p>

            {/* Navigation Tabs Pill (Staff Roles vs Staff Members) */}
            <div className="mt-5 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-teal-200/70 rounded-2xl p-1.5 shadow-2xs">
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#00b4a7] text-white shadow-xs transition-all"
              >
                Staff Roles ({roles.length})
              </button>
              <button
                type="button"
                onClick={() => navigate('/super-admin/staff')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-teal-800 hover:bg-teal-50/70 transition-all cursor-pointer"
              >
                Staff Members Registry
              </button>
            </div>
          </div>

          <div className="relative z-10 flex justify-end pointer-events-none -my-3 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={hrTeamIllustration}
              alt="Staff Roles & Designations"
              className="h-36 sm:h-44 lg:h-52 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Active Roles"
            value={roles.length.toString()}
            subtitle="Configured Roles"
            icon={ShieldCheck}
            trend="Active in System"
            trendType="up"
          />
          <StatCard
            title="Staff Roles"
            value={
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 leading-tight">
                  {roles.length}
                </span>
                <span className="text-base sm:text-lg font-bold font-sans text-slate-800 -mt-0.5">
                  Total Roles
                </span>
              </div>
            }
            subtitle={
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Configured Roles
              </span>
            }
            icon={Briefcase}
          />
          <StatCard
            title="Central Governance"
            value="Super Admin"
            subtitle="Apex Role Authority"
            icon={Lock}
          />
          <StatCard
            title="Society Branches"
            value="Multi-Branch"
            subtitle="Shared Organization Model"
            icon={Layers}
          />
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff role by name, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => fetchStaffRoles(true)}
                disabled={refreshing}
                title="Refresh roles list"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Staff Role</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load staff roles</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchStaffRoles()}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">Loading staff roles...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching roles found' : 'No staff roles defined yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'Create designations like Branch Cashier, Loan Officer, or Field Agent.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create First Staff Role
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Role Name &amp; Title</th>
                    <th className="py-3.5 px-6">Description / Scope</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-4 px-6 font-mono text-xs font-bold text-teal-800">
                        #{role.id}
                      </td>

                      {/* Role Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            <Briefcase className="w-4 h-4 text-[#00b4a7]" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors flex items-center gap-2">
                              {role.name}
                            </div>
                            <span className="text-[11px] font-medium text-slate-400">
                              Designated Role
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6 max-w-md">
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {role.description || (
                            <span className="italic text-slate-400">No description provided</span>
                          )}
                        </p>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(role.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, role })}
                            title="View Role Details"
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, role, isDeleting: false })}
                            title="Delete Staff Role"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

          {/* Footer Count */}
          {!loading && filteredRoles.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
              <span>
                Showing <strong className="text-slate-700">{filteredRoles.length}</strong> of{' '}
                <strong className="text-slate-700">{roles.length}</strong> staff roles
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <StaffRoleCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      <StaffRoleDetailModal
        isOpen={detailModal.isOpen}
        role={detailModal.role}
        onClose={() => setDetailModal({ isOpen: false, role: null })}
        onDeleteClick={(r) => setDeleteModal({ isOpen: true, role: r, isDeleting: false })}
      />

      <StaffRoleDeleteConfirmModal
        isOpen={deleteModal.isOpen}
        role={deleteModal.role}
        onClose={() => setDeleteModal({ isOpen: false, role: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Centered Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {successPopup.title || 'Success'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {successPopup.message}
            </p>
            <button
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-600 transition-all cursor-pointer"
            >
              Okay, Great
            </button>
          </div>
        </div>
      )}

      {/* Centered Error Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {errorPopup.title || 'Error'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              {errorPopup.message}
            </p>
            <button
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

