import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { BranchFormModal, BranchDetailModal } from '../../components/dashboard/BranchModals';
import * as branchService from '../../services/branchService';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  Search,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import branchMapScene from '../../assets/AurumFX Branch and Map Pin.png';

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

function normalizeBranch(b) {
  const rawId = b.id ?? b.branch_id;
  const isActive = b.is_active !== undefined
    ? Boolean(b.is_active)
    : (b.isActive !== undefined ? Boolean(b.isActive) : true);

  return {
    rawId,
    id: rawId,
    name: b.name || `Branch #${rawId}`,
    ifsc_code: b.ifsc_code || b.ifsc || '',
    city: b.city || '',
    state: b.state || '',
    address: b.address || '',
    contact_number: b.contact_number || b.phone || '',
    branch_code: b.branch_code || (rawId ? String(rawId) : ''),
    opening_date: b.opening_date || b.created_at || '',
    created_at: b.created_at || b.opening_date || '',
    isActive,
    is_active: isActive,
  };
}

export default function SuperAdminBranches() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchSearch, setBranchSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchError, setBranchError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  // Branch CRUD Modals state
  const [branchModal, setBranchModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    branch: null,
    isLoading: false,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBranches = async () => {
    setIsLoadingBranches(true);
    setBranchError(null);
    try {
      const data = await branchService.getBranches();
      if (Array.isArray(data)) {
        setBranches(data.map(normalizeBranch));
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.warn('API getBranches error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setBranchError(err.message || 'Failed to load branches from server');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenCreateBranch = () => {
    setBranchModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false
    });
  };

  const handleOpenEditBranch = (br) => {
    setBranchModal({
      isOpen: true,
      mode: 'edit',
      data: br,
      isSubmitting: false
    });
  };

  const handleSaveBranch = async (formData) => {
    setBranchModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        name: formData.name.trim(),
        ifsc_code: formData.ifsc_code ? formData.ifsc_code.trim().toUpperCase() : '',
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        contact_number: formData.contact_number.trim(),
      };

      if (branchModal.mode === 'create') {
        await branchService.createBranch(payload);
        setSuccessPopup({
          title: i18n.t("superAdminBranches.branchCreatedSuccessfully", "Branch Created Successfully!"),
          message: `Branch "${formData.name}" has been registered and added to the network.`
        });
      } else {
        const branchId = branchModal.data.rawId || branchModal.data.id;
        await branchService.updateBranch(branchId, payload);
        setSuccessPopup({
          title: i18n.t("superAdminBranches.branchUpdatedSuccessfully", "Branch Updated Successfully!"),
          message: `Branch "${formData.name}" details have been updated.`
        });
      }
      await fetchBranches();
      setBranchModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
    } catch (err) {
      console.error('Save branch error:', err);
      setBranchModal(prev => ({ ...prev, isSubmitting: false }));
      setErrorPopup({
        title: branchModal.mode === 'create' ? 'Branch Creation Failed' : 'Branch Update Failed',
        message: err.message || 'Failed to save branch. Please check the details and try again.'
      });
      throw err;
    }
  };

  const handleToggleStatus = async (br) => {
    const newStatus = !br.isActive;
    try {
      const branchId = br.rawId || br.id;
      await branchService.changeBranchStatus(branchId, newStatus);
      setSuccessPopup({
        title: i18n.t("superAdminBranches.branchStatusUpdated", "Branch Status Updated"),
        message: `Branch "${br.name}" marked as ${newStatus ? 'Active' : 'Inactive'}.`
      });
      await fetchBranches();
    } catch (err) {
      console.error('Status toggle error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || `Failed to update status for "${br.name}".`
      });
      await fetchBranches();
    }
  };

  const handleDeleteBranch = async (br) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete branch "${br.name}"?`);
    if (!confirmDelete) return;

    try {
      const branchId = br.rawId || br.id;
      await branchService.deleteBranch(branchId);
      setSuccessPopup({
        title: i18n.t("superAdminBranches.branchDeleted", "Branch Deleted"),
        message: `Branch "${br.name}" has been removed from the network.`
      });
      await fetchBranches();
    } catch (err) {
      console.error('Delete branch error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerStaff.deleteFailed", "Delete Failed"),
        message: err.message || `Failed to delete branch "${br.name}".`
      });
      await fetchBranches();
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

  const filteredBranches = branches.filter(b =>
    (b.name && b.name.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.ifsc_code && b.ifsc_code.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.city && b.city.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.state && b.state.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.address && b.address.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.branch_code && b.branch_code.toLowerCase().includes(branchSearch.toLowerCase())) ||
    (b.contact_number && b.contact_number.toLowerCase().includes(branchSearch.toLowerCase()))
  );

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="branches"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Branches Banner: Custom Matching 3D Scene Banner */}
        <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
              <Building2 className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>{t("superAdminBranches.roleSuperAdminMultiState", "Role: Super Admin • Multi-State Branch Network Control")}</span>
            </div>

            {/* Headline with Vertical Teal Accent Bar */}
            <div className="flex items-center gap-3 mt-1">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{t("superAdminBranches.multiStateBranchNetwork", "Multi-State Branch Network")}</span>
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#00b4a7] stroke-[2.2]" />
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              {t("superAdminBranches.centralRealTimeOversightOf", "Central real-time oversight of operating branches across Kerala, Tamil Nadu, and regional expansion hubs with unified performance control.")}
            </p>

            {/* 3 Feature Pills */}
            <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {isLoadingBranches ? '...' : `${branches.length} Operating Branches`}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("superAdminBranches.keralaTnKarnataka", "Kerala • TN • Karnataka")}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{t("superAdminBranches.100Operational", "100% Operational")}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("superAdminBranches.activeReconciled", "Active & Reconciled")}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{t("superAdminBranches.428CrReserves", "₹42.8 Cr Reserves")}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("superAdminBranches.branchLiquidityPool", "Branch Liquidity Pool")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: 3D Branch Scene with Folded Map & Map Pins */}
          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <img
              src={branchMapScene}
              alt={t("superAdminBranches.aurumfxMultiStateBranchNetwork", "AurumFX Multi-State Branch Network and Map Pin")}
              className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
        </div>

        {/* Search Filter Header with Charter Action & API Sync */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("superAdminBranches.branchNetworkDirectory", "Branch Network Directory")}</h3>
              <p className="text-xs text-slate-500">{t("superAdminBranches.filterOperationalBranchesByName", "Filter operational branches by name, location or jurisdiction")}</p>
            </div>
            <button
              onClick={fetchBranches}
              disabled={isLoadingBranches}
              title={t("superAdminBranches.syncBranchesFromApi", "Sync branches from API")}
              className="p-2 text-slate-400 hover:text-[#00b4a7] hover:bg-teal-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBranches ? 'animate-spin text-[#00b4a7]' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("superAdminBranches.searchBranches", "Search branches...")}
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
              />
            </div>
            <button
              onClick={handleOpenCreateBranch}
              className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("superAdminBranches.newBranch", "New Branch")}</span>
            </button>
          </div>
        </div>

        {/* Branches List / Empty State / Loader / Error */}
        {isLoadingBranches ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#00b4a7] animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-800">{t("superAdminBranches.loadingBranchNetwork", "Loading branch network...")}</p>
            <p className="text-xs text-slate-400 mt-1">{t("superAdminBranches.fetchingLiveBranchesFromThe", "Fetching live branches from the server")}</p>
          </div>
        ) : branchError ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xs flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-900">{t("superAdminBranches.failedToLoadBranchesFrom", "Failed to load branches from server")}</p>
            <p className="text-xs text-rose-600 mt-1 max-w-md font-medium">{branchError}</p>
            <button
              onClick={fetchBranches}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t("superAdminBranchAdmin.retrySync", "Retry Sync")}
            </button>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00b4a7] flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {branchSearch ? t("superAdminBranches.noMatchingBranchesFound", "No matching branches found") : t("superAdminBranches.noBranchesRegisteredYet", "No Branches Registered Yet")}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {branchSearch
                ? `No operational branches matched "${branchSearch}". Try searching with another term.`
                : t("superAdminBranches.thereAreCurrentlyNoOperating", "There are currently no operating branches in the database. Click below to create your first branch.")}
            </p>
            {!branchSearch && (
              <button
                onClick={handleOpenCreateBranch}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("superAdminBranches.createBranch", "Create Branch")}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((br) => (
              <div key={br.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-[#2dd4bf] transition-all group">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                        {br.state || 'kerala'}
                      </span>
                      {br.branch_code && (
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          #{br.branch_code}
                        </span>
                      )}
                      {br.ifsc_code && (
                        <span className="text-[11px] font-mono font-extrabold text-[#0f766e] bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-200/60">
                          {br.ifsc_code}
                        </span>
                      )}
                    </div>
                    {/* Status Display Badge (Non-clickable) & Dedicated Toggle Switch (PATCH /superadmin/branches/{id}/status) */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border select-none cursor-default ${
                          br.isActive
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                            : 'text-slate-600 bg-slate-100 border-slate-200/80'
                        }`}
                      >
                        <CheckCircle2 className={`w-3 h-3 ${br.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{br.isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}</span>
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={br.isActive}
                        onClick={() => handleToggleStatus(br)}
                        title={br.isActive ? t("superAdminBranches.clickToDeactivateBranch", "Click to deactivate branch") : t("superAdminBranches.clickToActivateBranch", "Click to activate branch")}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          br.isActive ? 'bg-[#00b4a7]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            br.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mt-3 gap-2">
                    <div>
                      <h3
                        onClick={() => setDetailModal({ isOpen: true, branch: br, isLoading: false })}
                        className="text-base font-bold text-slate-900 group-hover:text-[#0f766e] transition-colors cursor-pointer"
                      >
                        {br.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{br.address}</span>
                      </p>
                    </div>

                    {/* View, Edit (PUT) & Delete (DELETE) actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setDetailModal({ isOpen: true, branch: br, isLoading: false })}
                        title={t("superAdminBranches.viewBranchDetails", "View Branch Details")}
                        className="p-1.5 text-slate-400 hover:text-[#00b4a7] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditBranch(br)}
                        title={t("superAdminBranches.editBranchPut", "Edit Branch (PUT)")}
                        className="p-1.5 text-slate-400 hover:text-[#00b4a7] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(br)}
                        title={t("superAdminBranches.deleteBranchDelete", "Delete Branch (DELETE)")}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Only Real Data available in the backend API */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t("branchManagerCashTransactions.branchCode", "Branch Code:")}</span>
                      <span className="font-mono font-bold text-slate-800">#{br.branch_code || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t("superAdminBranches.ifscCode", "IFSC Code:")}</span>
                      <span className="font-mono font-bold text-[#0f766e] bg-teal-50/80 px-2 py-0.5 rounded border border-teal-100">
                        {br.ifsc_code || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t("superAdminBranches.city", "City:")}</span>
                      <span className="font-bold text-slate-800">{br.city || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t("modal.member.state", "State:")}</span>
                      <span className="font-bold text-slate-800">{br.state || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t("superAdminBranches.createdAt", "Created At:")}</span>
                      <span className="font-semibold text-slate-700">
                        {formatDateTime(br.created_at || br.opening_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-mono font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{br.contact_number || 'N/A'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branch Create (POST) & Edit (PUT) Modal */}
      <BranchFormModal
        isOpen={branchModal.isOpen}
        onClose={() => setBranchModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        mode={branchModal.mode}
        initialData={branchModal.data}
        onSubmit={handleSaveBranch}
        isSubmitting={branchModal.isSubmitting}
      />

      {/* Branch Detail Dossier Modal */}
      <BranchDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, branch: null, isLoading: false })}
        branch={detailModal.branch}
        isLoading={detailModal.isLoading}
        onEdit={(b) => handleOpenEditBranch(b)}
        onDelete={(b) => handleDeleteBranch(b)}
        onToggleStatus={(b) => handleToggleStatus(b)}
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
