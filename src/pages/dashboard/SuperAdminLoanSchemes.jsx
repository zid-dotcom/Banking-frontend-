import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { LoanSchemeFormModal, LoanSchemeDetailModal } from '../../components/dashboard/LoanSchemeModals';
import * as loanSchemeService from '../../services/loanSchemeService';
import {
  Landmark,
  Coins,
  Percent,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Check,
  Building2,
  Calendar,
  CreditCard,
  Receipt
} from 'lucide-react';
import loanIllustration from '../../assets/Modern Cooperative Bank Loan Illustration.webp';

export default function SuperAdminLoanSchemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
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
    scheme: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scheme: null,
  });

  // Centered Feedback Popups
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Fetch schemes from API
  const fetchSchemes = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await loanSchemeService.getLoanSchemes();
      if (Array.isArray(data)) {
        setSchemes(data);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.warn('API getLoanSchemes error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load loan schemes from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  // Open Create
  const handleOpenCreate = () => {
    setFormModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false,
    });
  };

  // Open Edit
  const handleOpenEdit = (scheme) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      data: scheme,
      isSubmitting: false,
    });
  };

  // Save (Create or Update)
  const handleSaveScheme = async (payload) => {
    setFormModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const created = await loanSchemeService.createLoanScheme(payload);
        setSuccessPopup({
          title: i18n.t("superAdminLoanSchemes.loanSchemeCreated", "Loan Scheme Created!"),
          message: `Loan Scheme "${payload.scheme_name}" (${payload.scheme_code}) has been created successfully.`
        });
      } else {
        const schemeId = formModal.data.id || formModal.data.scheme_id;
        await loanSchemeService.updateLoanScheme(schemeId, payload);
        setSuccessPopup({
          title: i18n.t("superAdminLoanSchemes.loanSchemeUpdated", "Loan Scheme Updated!"),
          message: `Loan Scheme "${payload.scheme_name}" (${payload.scheme_code}) details have been updated.`
        });
      }
      await fetchSchemes();
      setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
    } catch (err) {
      console.error('Save loan scheme error:', err);
      setFormModal(prev => ({ ...prev, isSubmitting: false }));
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Scheme Creation Failed' : 'Scheme Update Failed',
        message: err.message || 'Failed to save loan scheme. Please verify the input values and try again.'
      });
      throw err;
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (scheme) => {
    const schemeId = scheme.id || scheme.scheme_id;
    const currentStatus = scheme.is_active !== false;
    const newStatus = !currentStatus;
    const name = scheme.scheme_name || scheme.scheme_code || `Scheme #${schemeId}`;

    setActionLoadingId(schemeId);
    try {
      await loanSchemeService.changeLoanSchemeStatus(schemeId, newStatus);
      setSchemes(prev => prev.map(s => (s.id === schemeId || s.scheme_id === schemeId) ? { ...s, is_active: newStatus } : s));
      setSuccessPopup({
        title: i18n.t("superAdminLoanSchemes.statusUpdated", "Status Updated!"),
        message: `Loan Scheme "${name}" is now ${newStatus ? 'Active' : 'Inactive'}.`
      });
    } catch (err) {
      console.error('Status toggle error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembers.statusUpdateFailed", "Status Update Failed"),
        message: err.message || `Failed to update status for "${name}".`
      });
      await fetchSchemes();
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Scheme
  const handleDeleteScheme = async () => {
    if (!deleteModal.scheme) return;
    const scheme = deleteModal.scheme;
    const schemeId = scheme.id || scheme.scheme_id;
    const name = scheme.scheme_name || scheme.scheme_code || `Scheme #${schemeId}`;

    setActionLoadingId(schemeId);
    try {
      await loanSchemeService.deleteLoanScheme(schemeId);
      setDeleteModal({ isOpen: false, scheme: null });
      setSuccessPopup({
        title: i18n.t("superAdminFdMisSchemes.schemeDeleted", "Scheme Deleted"),
        message: `Loan scheme "${name}" has been deleted successfully.`
      });
      await fetchSchemes();
    } catch (err) {
      console.error('Delete scheme error:', err);
      setErrorPopup({
        title: i18n.t("superAdminAnnouncements.deletionFailed", "Deletion Failed"),
        message: err.message || `Failed to delete scheme "${name}".`
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Schemes
  const filteredSchemes = schemes.filter(s => {
    const sName = (s.scheme_name || s.name || '').toLowerCase();
    const sCode = (s.scheme_code || s.code || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    if (q && !sName.includes(q) && !sCode.includes(q)) return false;

    if (statusFilter === 'active' && s.is_active === false) return false;
    if (statusFilter === 'inactive' && s.is_active !== false) return false;

    return true;
  });

  // Computed Stats
  const totalCount = schemes.length;
  const activeCount = schemes.filter(s => s.is_active !== false).length;
  const maxCap = schemes.reduce((max, s) => Math.max(max, Number(s.max_loan_amount) || 0), 0);
  const avgRate = activeCount > 0
    ? (schemes.filter(s => s.is_active !== false).reduce((sum, s) => sum + (Number(s.annual_interest_rate) || 0), 0) / activeCount).toFixed(1)
    : '0';

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatCharge = (amount, type) => {
    if (amount === undefined || amount === null) return '0';
    return type === 'percent' ? `${amount}%` : `₹${amount}`;
  };

  const formatDateTime = (isoString) => {
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
  };

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="loan_schemes"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("login.superAdmin.portalTitleLine1", "Super Admin")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("superAdminLoanSchemes.creditPortfolioSchemesPolicy", "Credit Portfolio & Schemes Policy")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t("common.active", "Active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                {t("memberLoanSchemes.cooperativeLoanSchemes", "Cooperative Loan Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminLoanSchemes.defineMultiTierLoanProducts", "Define multi-tier loan products, annual interest formulas, upfront processing charges, and per-EMI operational recovery levies.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={loanIllustration}
              alt={t("memberLoanSchemes.cooperativeLoanSchemesIllustration", "Cooperative Loan Schemes Illustration")}
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

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("branchManagerLoanSchemes.totalLoanSchemes", "Total Loan Schemes")}
            value={totalCount}
            subtitle={t("branchManagerLoanSchemes.registeredProducts", "Registered Products")}
            icon={Landmark}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerFdMisSchemes.activeSchemes", "Active Schemes")}
            value={activeCount}
            subtitle={t("branchManagerLoanSchemes.readyForMemberLoans", "Ready for Member Loans")}
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% ratio` : '100%'}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerLoanSchemes.maximumLoanAmount", "Maximum Loan Amount")}
            value={formatCurrency(maxCap)}
            subtitle={t("branchManagerLoanSchemes.highestPermissibleLimit", "Highest Permissible Limit")}
            icon={Coins}
          />
          <StatCard
            title={t("branchManagerLoanSchemes.avgAnnualRate", "Avg Annual Rate")}
            value={`${avgRate}%`}
            subtitle={t("branchManagerLoanSchemes.acrossActiveSchemes", "Across Active Schemes")}
            icon={Percent}
            trend="Reducing EMI"
            trendType="up"
          />
        </div>

        {/* Table & Controls Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Header Controls Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#008f85]" />
                <span>{t("superAdminLoanSchemes.loanSchemesDirectory", "Loan Schemes Directory")}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("superAdminLoanSchemes.manageProductParametersInterestStructures", "Manage product parameters, interest structures, and operational fees")}
              </p>
            </div>

            {/* Actions: Search, Filters & Create Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t("dashboardModule.productAccounts.searchSchemePlaceholder", "Search scheme name or code...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-800"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
              >
                <option value="all">{t("branchManagerFdMisSchemes.allStatuses", "All Statuses")}</option>
                <option value="active">{t("branchManagerFdMisSchemes.activeOnly", "Active Only")}</option>
                <option value="inactive">{t("branchManagerFdMisSchemes.inactiveOnly", "Inactive Only")}</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchSchemes(true)}
                disabled={refreshing || loading}
                title={t("superAdminLoanSchemes.refreshSchemes", "Refresh Schemes")}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Create Scheme Button */}
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-gradient-to-r from-[#008f85] to-[#00a89c] hover:from-[#00786f] hover:to-[#008f85] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("superAdminLoanSchemes.newLoanScheme", "New Loan Scheme")}</span>
              </button>
            </div>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchSchemes()}
                className="underline font-bold hover:text-rose-900 cursor-pointer ml-4"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Proper Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">{t("dashboardModule.productAccounts.schemeCode", "Scheme Code")}</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">{t("dashboardModule.productAccounts.schemeName", "Scheme Name")}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">{t("branchManagerLoanSchemes.maximumLoanAmount", "Maximum Loan Amount")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.tenure", "Tenure")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.annualRate", "Annual Rate")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.overdueRate", "Overdue Rate")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.gracePeriod", "Grace Period")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.processingFee", "Processing Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.stampDuty", "Stamp Duty")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.insuranceFee", "Insurance Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("superAdminLoanSchemes.docFee", "Doc Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.foreclosure", "Foreclosure")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.penalty", "Penalty")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("branchManagerLoanSchemes.smsFee", "SMS Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.stationeryFee", "Stationery Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.fieldTravelFee", "Field / Travel Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.maintenanceFee", "Maintenance Fee")}</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">{t("memberLoanSchemes.doorstepCollection", "Doorstep Collection")}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">{t("common.status", "Status")}</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={21} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        <span>{t("memberLoanSchemes.loadingLoanSchemesFromRegistry", "Loading loan schemes from registry...")}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">{t("branchManagerLoanSchemes.noLoanSchemesFound", "No Loan Schemes Found")}</p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusFilter !== 'all'
                            ? t("branchManagerLoanSchemes.tryClearingYourSearchOr", "Try clearing your search or filter options.")
                            : t("superAdminLoanSchemes.clickNewLoanSchemeTo", "Click \"New Loan Scheme\" to add your first credit product.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchemes.map((scheme) => {
  const { t } = useTranslation();
                    const schemeId = scheme.id || scheme.scheme_id;
                    const isActive = scheme.is_active !== false;
                    const isLoadingThis = actionLoadingId === schemeId;

                    return (
                      <tr
                        key={schemeId}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Scheme Code */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200/80">
                            {scheme.scheme_code || scheme.code || 'SCH-00'}
                          </span>
                        </td>

                        {/* Scheme Name */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                            {scheme.scheme_name || scheme.name}
                          </div>
                        </td>

                        {/* Maximum Loan Amount */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                          {formatCurrency(scheme.max_loan_amount)}
                        </td>

                        {/* Tenure */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-semibold">
                          {scheme.max_tenure_months || 0} {t("branchManagerLoanSchemes.mos", "mos")}
                        </td>

                        {/* Annual Interest Rate */}
                        <td className="py-4 px-3 text-center whitespace-nowrap font-bold text-teal-800">
                          {scheme.annual_interest_rate ?? 0}% p.a.
                        </td>

                        {/* Overdue Rate */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-amber-700 font-semibold">
                          {scheme.overdue_interest_rate ? `${scheme.overdue_interest_rate}%` : '0%'}
                        </td>

                        {/* Grace Period */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          {scheme.credit_period_days ? `${scheme.credit_period_days}d` : '0d'}
                        </td>

                        {/* Processing Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.processing_fee, scheme.processing_fee_type || 'percent')}
                        </td>

                        {/* Stamp Duty */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.stamp_duty_charge, scheme.stamp_duty_charge_type || 'percent')}
                        </td>

                        {/* Insurance Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.insurance_fee, scheme.insurance_fee_type || 'percent')}
                        </td>

                        {/* Documentation Fee */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.documentation_fee, scheme.documentation_fee_type || 'percent')}
                        </td>

                        {/* Foreclosure Charges */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                          {formatCharge(scheme.foreclosure_charges, scheme.foreclosure_charges_type || 'percent')}
                        </td>

                        {/* Penalty Charges */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-rose-600 font-semibold">
                          {formatCharge(scheme.penalty_charges, scheme.penalty_charges_type || 'percent')}
                        </td>

                        {/* SMS Fee (Dedicated column) */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.sms_charges, scheme.sms_charges_type || 'fixed')}
                        </td>

                        {/* Stationery Fee (Dedicated column) */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.stationary_charges, scheme.stationary_charges_type || 'fixed')}
                        </td>

                        {/* Travel / Fuel Fee (Dedicated column) */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.fuel_charges, scheme.fuel_charges_type || 'fixed')}
                        </td>

                        {/* Maintenance Fee (Dedicated column) */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.maintenance_charges, scheme.maintenance_charges_type || 'fixed')}
                        </td>

                        {/* Doorstep Collection Fee (Dedicated column) */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-slate-800 font-mono font-medium">
                          {formatCharge(scheme.collection_charges, scheme.collection_charges_type || 'fixed')}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{formatDateTime(scheme.created_at)}</span>
                        </td>

                        {/* Account Status Sliding Toggle Switch */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              onClick={() => handleToggleStatus(scheme)}
                              disabled={isLoadingThis}
                              title={`Click to ${isActive ? t("branchManagerMembers.deactivate", "deactivate") : t("branchManagerMembers.activate", "activate")} this scheme`}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              } ${isLoadingThis ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              <span className="sr-only">{t("superAdminLoanSchemes.toggleSchemeStatus", "Toggle Scheme Status")}</span>
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
                              {isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                            </span>
                          </div>
                        </td>

                        {/* Actions (View, Edit, Delete) */}
                        <td className="py-4 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#f6fcfb] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDetailModal({ isOpen: true, scheme })}
                              title={t("memberLoanSchemes.viewFullSchemeDetails", "View Full Scheme Details")}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(scheme)}
                              title={t("superAdminLoanSchemes.editSchemeParameters", "Edit Scheme Parameters")}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, scheme })}
                              title={t("superAdminFdMisSchemes.deleteScheme", "Delete Scheme")}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
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
        </div>
      </div>

      {/* Loan Scheme Form Modal (Create / Edit) */}
      <LoanSchemeFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        mode={formModal.mode}
        initialData={formModal.data}
        onSubmit={handleSaveScheme}
        isSubmitting={formModal.isSubmitting}
      />

      {/* Loan Scheme Detail Modal */}
      <LoanSchemeDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
        scheme={detailModal.scheme}
        onEdit={(sch) => handleOpenEdit(sch)}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <Trash2 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {t("superAdminLoanSchemes.deleteLoanScheme", "Delete Loan Scheme?")}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t("superAdminLoanSchemes.areYouSureYouWant", "Are you sure you want to permanently remove")} <strong className="text-slate-800">{deleteModal.scheme?.scheme_name}</strong> ({deleteModal.scheme?.scheme_code}{t("superAdminLoanSchemes.existingMemberLoansUnderThis", ")? Existing member loans under this scheme might be affected.")}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, scheme: null })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteScheme}
                disabled={actionLoadingId !== null}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {t("superAdminLoanSchemes.confirmDelete", "Confirm Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

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

