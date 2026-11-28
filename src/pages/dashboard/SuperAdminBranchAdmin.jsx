import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { BranchAdminFormModal } from '../../components/dashboard/BranchAdminModals';
import * as branchService from '../../services/branchService';
import * as branchAdminService from '../../services/branchAdminService';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Key,
  Phone,
  Mail,
  UserCheck,
  UserPlus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import adminOrgScene from '../../assets/Connected Organization Map Illustration.png';

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

export default function SuperAdminBranchAdmin() {
  const { t } = useTranslation();
  const [adminSearch, setAdminSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchAdmins, setBranchAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [adminError, setAdminError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const [adminModal, setAdminModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      if (Array.isArray(data)) {
        setBranches(data);
      }
    } catch (err) {
      console.warn('API getBranches error in BranchAdmins:', err.message);
    }
  };

  const fetchBranchAdmins = async () => {
    setIsLoadingAdmins(true);
    setAdminError(null);
    try {
      const data = await branchAdminService.getBranchAdmins();
      if (Array.isArray(data)) {
        setBranchAdmins(data);
      } else {
        setBranchAdmins([]);
      }
    } catch (err) {
      console.warn('API getBranchAdmins error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setAdminError(err.message || 'Failed to load branch admins from server');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchBranchAdmins();
  }, []);

  const handleOpenCreateAdmin = () => {
    setAdminModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false,
    });
  };

  const handleOpenEditAdmin = (adm) => {
    setAdminModal({
      isOpen: true,
      mode: 'edit',
      data: adm,
      isSubmitting: false,
    });
  };

  const handleSaveAdmin = async (formData) => {
    setAdminModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim(),
        branch_id: Number(formData.branch_id),
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const assignedBranchName = getBranchName(formData.branch_id);

      if (adminModal.mode === 'create') {
        await branchAdminService.createBranchAdmin(payload);
        setSuccessPopup({
          title: i18n.t("superAdminBranchAdmin.branchManagerAppointedSuccessfully", "Branch Manager Appointed Successfully!"),
          message: `Branch Manager "${payload.full_name}" has been created and assigned to ${assignedBranchName}.`
        });
      } else {
        const adminId = adminModal.data.id;
        await branchAdminService.updateBranchAdmin(adminId, payload);
        setSuccessPopup({
          title: i18n.t("superAdminBranchAdmin.branchManagerUpdatedSuccessfully", "Branch Manager Updated Successfully!"),
          message: `Branch Manager "${payload.full_name}" details have been updated.`
        });
      }
      await fetchBranchAdmins();
      setAdminModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
    } catch (err) {
      console.error('Save branch manager error:', err);
      setAdminModal(prev => ({ ...prev, isSubmitting: false }));
      setErrorPopup({
        title: adminModal.mode === 'create' ? 'Branch Manager Creation Failed' : 'Branch Manager Update Failed',
        message: err.message || 'Failed to save branch manager. Please check the input and try again.'
      });
      throw err;
    }
  };

  const handleToggleAdminStatus = async (adm) => {
    const adminId = adm.id;
    const currentStatus = adm.is_active !== undefined ? Boolean(adm.is_active) : true;
    const newStatus = !currentStatus;
    const adminName = adm.full_name || adm.name || `Manager #${adminId}`;
    try {
      await branchAdminService.changeBranchAdminStatus(adminId, newStatus);
      setSuccessPopup({
        title: i18n.t("superAdminBranchAdmin.managerStatusUpdated", "Manager Status Updated"),
        message: `${adminName} has been marked as ${newStatus ? 'Active' : 'Inactive'}.`
      });
      await fetchBranchAdmins();
    } catch (err) {
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || 'Failed to update branch manager status'
      });
    }
  };

  const handleUnlockAdmin = async (adm) => {
    const adminId = adm.id;
    const adminName = adm.full_name || adm.name || `Manager #${adminId}`;
    try {
      await branchAdminService.unlockBranchAdmin(adminId);
      setSuccessPopup({
        title: i18n.t("superAdminBranchAdmin.managerAccountUnlocked", "Manager Account Unlocked"),
        message: `Branch manager ${adminName} has been unlocked successfully!`
      });
      await fetchBranchAdmins();
    } catch (err) {
      setErrorPopup({
        title: i18n.t("branchManagerMembers.unlockFailed", "Unlock Failed"),
        message: err.message || 'Failed to unlock branch manager'
      });
    }
  };

  const handleDeleteAdmin = async (adm) => {
    const adminId = adm.id;
    const adminName = adm.full_name || adm.name || `Manager #${adminId}`;
    if (!window.confirm(`Are you sure you want to remove Branch Manager "${adminName}"? This action will revoke their access.`)) {
      return;
    }
    try {
      await branchAdminService.deleteBranchAdmin(adminId);
      setSuccessPopup({
        title: i18n.t("superAdminBranchAdmin.branchManagerRemoved", "Branch Manager Removed"),
        message: `Branch manager "${adminName}" deleted successfully!`
      });
      await fetchBranchAdmins();
    } catch (err) {
      setErrorPopup({
        title: i18n.t("superAdminAnnouncements.deletionFailed", "Deletion Failed"),
        message: err.message || 'Failed to delete branch manager'
      });
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId && branchId !== 0) return 'Not Assigned';
    const found = branches.find(b => (b.rawId ?? b.id) == branchId);
    if (found) {
      return `${found.name}${found.city ? ` (${found.city})` : ''}`;
    }
    return `Branch #${branchId}`;
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

  const filteredAdmins = branchAdmins.filter(adm => {
    const name = adm.full_name || adm.name || '';
    const email = adm.email || '';
    const phone = adm.contact_number || adm.phone || '';
    const idStr = String(adm.id || '');
    const userCodeStr = String(adm.user_code || adm.userCode || '');
    const bName = getBranchName(adm.branch_id) || (typeof adm.branch === 'string' ? adm.branch : adm.branch?.name || '');
    const q = adminSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      idStr.toLowerCase().includes(q) ||
      userCodeStr.toLowerCase().includes(q) ||
      bName.toLowerCase().includes(q)
    );
  });

  // 4 Dynamic Metrics calculated directly from live API records
  const totalBranchAdminsCount = Array.isArray(branchAdmins) ? branchAdmins.length : 0;
  const activeAdminsCount = Array.isArray(branchAdmins)
    ? branchAdmins.filter(a => a.is_active === true).length
    : 0;
  const inactiveAdminsCount = Array.isArray(branchAdmins)
    ? branchAdmins.filter(a => a.is_active === false).length
    : 0;
  const branchesWithAdminsCount = Array.isArray(branchAdmins)
    ? new Set(
        branchAdmins
          .map(a => a.branch_id)
          .filter(id => id !== undefined && id !== null && id !== '' && id !== false)
      ).size
    : 0;

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="branch_admins"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Branch Admins Banner */}
        <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
              <UserCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>{t("superAdminBranchAdmin.roleSuperAdminBranchManager", "Role: Super Admin • Branch Manager Administration")}</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{t("superAdminBranchAdmin.branchManagers", "Branch Managers")}</span>
                <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#00b4a7] stroke-[2.2]" />
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              {t("superAdminBranchAdmin.empowerAndSuperviseAppointedBranch", "Empower and supervise appointed branch managers, configure operational permissions, enforce 2FA verification, and monitor daily activities across all society branches.")}
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {isLoadingAdmins ? '...' : `${totalBranchAdminsCount} Branch Managers`}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("superAdminBranchAdmin.assignedBranchManagers", "Assigned Branch Managers")}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{t("superAdminBranchAdmin.secureControl", "Secure Control")}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("superAdminBranchAdmin.permissionsCompliance", "Permissions & Compliance")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <img
              src={adminOrgScene}
              alt={t("superAdminBranchAdmin.aurumfxBranchManagementAndAdministration", "AurumFX Branch Management and Administration")}
              className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
        </div>

        {/* Search Filter Header with Add Branch Admin Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{t("superAdminBranchAdmin.branchManagersDirectory", "Branch Managers Directory")}</h3>
              <button
                onClick={fetchBranchAdmins}
                disabled={isLoadingAdmins}
                title={t("superAdminBranchAdmin.refreshBranchManagers", "Refresh branch managers")}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAdmins ? 'animate-spin text-[#00b4a7]' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500">{t("superAdminBranchAdmin.filterAppointedManagersByName", "Filter appointed managers by name, branch unit, email, or contact number")}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("superAdminBranchAdmin.searchManagerByNameId", "Search manager by name, ID, branch...")}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
              />
            </div>
            <button
              onClick={handleOpenCreateAdmin}
              className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("modal.branchAdmin.addTitle", "Add Branch Manager")}</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics - 4 Dynamic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Branch Managers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-[#0f766e] uppercase">{t("superAdminBranchAdmin.totalBranchManagers", "Total Branch Managers")}</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoadingAdmins ? <Loader2 className="w-5 h-5 animate-spin text-[#00b4a7] inline-block" /> : totalBranchAdminsCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {totalBranchAdminsCount === 1 ? t("superAdminBranchAdmin.1AppointedManager", "1 Appointed Manager") : `${totalBranchAdminsCount} Appointed Managers`}
            </p>
          </div>

          {/* Card 2: Active Managers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase">{t("superAdminBranchAdmin.activeManagers", "Active Managers")}</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {isLoadingAdmins ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500 inline-block" /> : activeAdminsCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {totalBranchAdminsCount > 0
                ? `${Math.round((activeAdminsCount / totalBranchAdminsCount) * 100)}% Operational`
                : t("superAdminBranchAdmin.currentlyActive", "Currently Active")}
            </p>
          </div>

          {/* Card 3: Inactive Managers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-rose-600 uppercase">{t("superAdminBranchAdmin.inactiveManagers", "Inactive Managers")}</span>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
              {isLoadingAdmins ? <Loader2 className="w-5 h-5 animate-spin text-rose-500 inline-block" /> : inactiveAdminsCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {inactiveAdminsCount > 0 ? t("superAdminBranchAdmin.accessSuspended", "Access Suspended") : t("superAdminBranchAdmin.allAccountsActive", "All Accounts Active")}
            </p>
          </div>

          {/* Card 4: Branches with Managers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-purple-600 uppercase">{t("superAdminBranchAdmin.branchesWithManagers", "Branches with Managers")}</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoadingAdmins ? <Loader2 className="w-5 h-5 animate-spin text-purple-500 inline-block" /> : branchesWithAdminsCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {branches.length > 0 ? `Out of ${branches.length} Total Branches` : t("superAdminBranchAdmin.assignedBranchUnits", "Assigned Branch Units")}
            </p>
          </div>
        </div>

        {/* Branch Admins Content Area */}
        {adminError ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{t("superAdminBranchAdmin.failedToLoadBranchManagers", "Failed to load branch managers")}</h4>
            <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{adminError}</p>
            <button
              onClick={fetchBranchAdmins}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {t("superAdminBranchAdmin.retrySync", "Retry Sync")}
            </button>
          </div>
        ) : isLoadingAdmins && branchAdmins.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00b4a7] mb-3" />
            <p className="text-sm font-semibold text-slate-700">{t("superAdminBranchAdmin.loadingBranchManagers", "Loading branch managers...")}</p>
            <p className="text-xs text-slate-400 mt-1">{t("superAdminBranchAdmin.connectingToSocietyApexDatabase", "Connecting to society apex database")}</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{t("superAdminBranchAdmin.noBranchManagersFound", "No branch managers found")}</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {adminSearch
                ? `No records matched "${adminSearch}". Try another search term.`
                : t("superAdminBranchAdmin.noBranchManagersHaveBeen", "No branch managers have been appointed yet.")}
            </p>
            {!adminSearch && (
              <button
                onClick={handleOpenCreateAdmin}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t("modal.branchAdmin.addTitle", "Add Branch Manager")}
              </button>
            )}
          </div>
        ) : (
          /* Branch Admins Table */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">{t("login.branchAdmin.managerIdLabel", "Manager ID")}</th>
                    <th className="py-3.5 px-5">{t("superAdminBranchAdmin.managerName", "Manager Name")}</th>
                    <th className="py-3.5 px-5">{t("memberProfile.assignedBranch", "Assigned Branch")}</th>
                    <th className="py-3.5 px-5">{t("branchManagerStaff.officialEmail", "Official Email")}</th>
                    <th className="py-3.5 px-5">{t("modal.branchAdmin.contactNumberLabel", "Contact Number")}</th>
                    <th className="py-3.5 px-5">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                    <th className="py-3.5 px-5">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-5">{t("superAdminBranchAdmin.security", "Security")}</th>
                    <th className="py-3.5 px-5 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                  {filteredAdmins.map((adm) => {
  const { t } = useTranslation();
                    const adminName = adm.full_name || adm.name || 'Unnamed Manager';
                    const isActive = adm.is_active !== undefined ? Boolean(adm.is_active) : true;
                    const isLocked = Boolean(adm.is_locked);
                    const assignedBranchName = getBranchName(adm.branch_id);

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Manager ID */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 whitespace-nowrap">
                            {adm.user_code || adm.userCode || (adm.id ? `MGR-${adm.id}` : '—')}
                          </span>
                        </td>

                        {/* Manager Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold flex-shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 whitespace-nowrap">{adminName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Branch */}
                        <td className="py-4 px-5 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span>{assignedBranchName}</span>
                          </div>
                        </td>

                        {/* Official Email */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium whitespace-nowrap">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{adm.email || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Contact Number */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{adm.contact_number || adm.phone || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-5 text-slate-600 whitespace-nowrap text-xs font-medium">
                          {formatDateTime(adm.created_at)}
                        </td>

                        {/* Status with Toggle Button */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                            </span>

                            {/* Status Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(adm)}
                              title={isActive ? t("superAdminBranchAdmin.deactivateThisManager", "Deactivate this manager") : t("superAdminBranchAdmin.activateThisManager", "Activate this manager")}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? 'bg-[#00b4a7]' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Security / Lock */}
                        <td className="py-4 px-5">
                          {isLocked ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                {t("branchManagerMemberPasswordUpdate.locked", "Locked")}
                              </span>
                              <button
                                onClick={() => handleUnlockAdmin(adm)}
                                title={t("superAdminBranchAdmin.unlockThisManagerAccount", "Unlock this manager account")}
                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Unlock className="w-3 h-3" />
                                {t("branchManagerMembers.unlock", "Unlock")}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              {t("superAdminBranchAdmin.secure", "Secure")}
                            </span>
                          )}
                        </td>

                        {/* Actions (Edit / Delete) */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditAdmin(adm)}
                              title={t("superAdminBranchAdmin.editBranchManager", "Edit branch manager")}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(adm)}
                              title={t("superAdminBranchAdmin.deleteBranchManager", "Delete branch manager")}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
            </div>
          </div>
        )}
      </div>

      {/* Branch Admin Create (POST) & Edit (PUT) Modal */}
      <BranchAdminFormModal
        isOpen={adminModal.isOpen}
        onClose={() => setAdminModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        mode={adminModal.mode}
        initialData={adminModal.data}
        branches={branches}
        onSubmit={handleSaveAdmin}
        isSubmitting={adminModal.isSubmitting}
      />

      {/* Centered Backend Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {typeof errorPopup === 'object' ? (errorPopup.title || 'Action Error') : t("modal.member.notice", "Notice")}
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

      {/* Centered Successful Action Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {typeof successPopup === 'object' ? (successPopup.title || 'Action Successful!') : t("modal.member.success", "Success!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {typeof successPopup === 'object' ? successPopup.message : String(successPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t("modal.branchAdmin.okayGotIt", "Okay, Got It")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Centered Toast */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn backdrop-blur-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </DashboardLayout>
  );
}
