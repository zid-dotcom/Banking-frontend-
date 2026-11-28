import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import MemberDetailModal from '../../components/dashboard/MemberDetailModal';
import MemberCashTransactionsModal from '../../components/dashboard/MemberCashTransactionsModal';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Building2,
  RefreshCw,
  Eye,
  Filter,
  ShieldCheck,
  Phone,
  Mail,
  Receipt
} from 'lucide-react';
import memberRegistryScene from '../../assets/Membership Registry Illustration.png';
import { listAccountantMembers } from '../../services/accountantMemberService';
import { getStaffMe } from '../../services/branchStaffService';

export default function StaffMembers() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Staff user state
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const u = localStorage.getItem('staff_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Filters & search
  const [memberSearch, setMemberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal states
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [selectedMemberForTransactions, setSelectedMemberForTransactions] = useState(null);

  const fetchStaffProfile = async () => {
    try {
      const data = await getStaffMe();
      if (data) {
        setStaffUser(data);
        localStorage.setItem('staff_user', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not refresh staff profile:', err);
    }
  };

  const fetchMembers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await listAccountantMembers({ skip: 0, limit: 100 });
      const rawList =
        (res && Array.isArray(res.members) ? res.members : null) ||
        (Array.isArray(res) ? res : []) ||
        (res && Array.isArray(res.items) ? res.items : []) ||
        (res && Array.isArray(res.data) ? res.data : []) ||
        [];

      const defaultBranchName =
        staffUser?.branch?.name ||
        staffUser?.branch_name ||
        (staffUser?.branch?.branch_code ? `Branch #${staffUser.branch.branch_code}` : 'Society Branch');
      const defaultBranchId = staffUser?.branch?.id || staffUser?.branch_id;
      const defaultBranchCode = staffUser?.branch?.branch_code || staffUser?.branch_code;

      const enriched = rawList.map((m) => ({
        ...m,
        branch_id: m.branch_id || defaultBranchId,
        branch_name: m.branch_name || defaultBranchName,
        branch_code: m.branch_code || defaultBranchCode,
      }));

      setMembers(enriched);
    } catch (err) {
      console.error('StaffMembers fetch error:', err);
      setError(err.message || 'Failed to connect to accountant members API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
    fetchMembers();
  }, []);

  const handleRefresh = async () => {
    await fetchStaffProfile();
    await fetchMembers(true);
  };

  // Inspect member details
  const handleInspect = (member) => {
    setSelectedMember(member);
    setInspectModalOpen(true);
  };

  // View member transactions
  const handleViewTransactions = (member) => {
    setSelectedMemberForTransactions(member);
    setTransactionsModalOpen(true);
  };

  // Dynamic statistics calculations
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.is_active === true).length;
  const approvedCount = members.filter((m) => (m.status || '').toUpperCase() === 'APPROVED').length;
  const pendingCount = members.filter((m) => (m.status || '').toUpperCase() === 'PENDING').length;
  const verifiedPercentage = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    // Search match
    const q = memberSearch.toLowerCase().trim();
    const matchSavings =
      (m.savings_account_number && String(m.savings_account_number).toLowerCase().includes(q)) ||
      (m.savings_account_no && String(m.savings_account_no).toLowerCase().includes(q)) ||
      (m.account_number && String(m.account_number).toLowerCase().includes(q)) ||
      (m.account_no && String(m.account_no).toLowerCase().includes(q)) ||
      (m.bank_account_number && String(m.bank_account_number).toLowerCase().includes(q)) ||
      (Array.isArray(m.accounts) && m.accounts.some(a => String(a.account_number || a.account_no || '').toLowerCase().includes(q))) ||
      (Array.isArray(m.savings_accounts) && m.savings_accounts.some(a => String(a.account_number || a.account_no || '').toLowerCase().includes(q)));

    const matchSearch =
      !q ||
      (m.full_name && m.full_name.toLowerCase().includes(q)) ||
      (m.member_code && m.member_code.toLowerCase().includes(q)) ||
      (m.user_code && String(m.user_code).toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.mobile && m.mobile.toLowerCase().includes(q)) ||
      (m.city && m.city.toLowerCase().includes(q)) ||
      (m.branch_name && m.branch_name.toLowerCase().includes(q)) ||
      matchSavings;

    // KYC Status match
    const mStatus = (m.status || '').toUpperCase();
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && mStatus === 'APPROVED') ||
      (statusFilter === 'pending' && mStatus === 'PENDING') ||
      (statusFilter === 'rejected' && mStatus === 'REJECTED');

    // Active status match
    const matchActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && m.is_active === true) ||
      (activeFilter === 'inactive' && m.is_active === false);

    return matchSearch && matchStatus && matchActive;
  });

  const branchName =
    staffUser?.branch?.name ||
    staffUser?.branch_name ||
    'Society Branch';
  const branchCode = staffUser?.branch?.branch_code || staffUser?.branch_code;

  const layoutUser = {
    name: staffUser?.full_name || staffUser?.name || 'Accountant',
    id: staffUser?.staff_code || (staffUser?.id ? `STF-${staffUser.id}` : 'STF-01'),
    avatarText: 'AC',
    role: 'staff',
    roleTitle: 'Accountant',
    office: branchName ? `${branchName} (#${branchCode || 'Central'})` : 'Branch Accounts Desk',
    branch: branchName,
    staff_role: staffUser?.staff_role || { name: 'Accountant' },
    branch_name: branchName,
  };

  return (
    <DashboardLayout role="staff" user={layoutUser} activeTab="members">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">

        {/* View Members Hero Banner */}
        <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
              <Users className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>{t("staffMembers.roleAccountantBranchMemberRegistry", "Role: Accountant • Branch Member Registry & Verification")}</span>
            </div>

            {/* Headline with Vertical Teal Accent Bar */}
            <div className="flex items-center gap-3 mt-1">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{t("staffMembers.branchRegisteredMembers", "Branch Registered Members")}</span>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#6366f1] stroke-[2.2]" />
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              {t("staffMembers.liveBranchOversightOfAll", "Live branch oversight of all registered cooperative society shareholders across branches, complete with full KYC records, Aadhaar verification, and document auditing.")}
            </p>

            {/* Dynamic Metric Pills */}
            <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {loading ? '...' : `${totalCount} Members`}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("staffMembers.totalBranchRecords", "Total Branch Records")}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {loading ? '...' : `${verifiedPercentage}% Verified`}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("staffMembers.kycApprovedStatus", "KYC Approved Status")}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {loading ? '...' : `${activeCount} Active`}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t("staffMembers.operationalMembers", "Operational Members")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: 3D Membership Registry Scene Illustration */}
          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <img
              src={memberRegistryScene}
              alt={t("staffMembers.aurumfxMemberManagementAndRegistration", "AurumFX Member Management and Registration")}
              className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
        </div>

        {/* 4 Dynamic Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("dashboard.totalMembers", "Total Members")}</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00b4a7] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {loading ? '...' : totalCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t("staffMembers.registeredUnderBranchFolio", "Registered under branch folio")}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t("staffMembers.activeMembers", "Active Members")}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {loading ? '...' : activeCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t("staffMembers.activeStatusEnabled", "Active status enabled")}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{t("staffMembers.kycApproved", "KYC Approved")}</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-teal-800 mt-2">
              {loading ? '...' : approvedCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t("staffMembers.verifiedDocumentation", "Verified documentation")}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{t("branchManagerMembers.pendingReview", "Pending Review")}</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
              {loading ? '...' : pendingCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t("staffMembers.awaitingKycAppraisal", "Awaiting KYC appraisal")}</p>
          </div>
        </div>

        {/* View Members Search, Filter & Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t("staffMembers.branchMemberDirectory", "Branch Member Directory")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("staffMembers.centralizedShareholderDatabaseAcrossOperating", "Centralized shareholder database across operating branches")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
              {/* Branch Indicator Chip */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex-1 sm:flex-initial min-w-0">
                <Building2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-500 flex-shrink-0">{t("branchManagerCashReconciliation.branch", "Branch:")}</span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-full sm:max-w-[210px]">
                  {branchName} {branchCode ? `(#${branchCode})` : ''}
                </span>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex-1 sm:flex-initial min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                >
                  <option value="all">{t("staffMembers.allKycStatuses", "All KYC Statuses")}</option>
                  <option value="approved">{t("common.approved", "Approved")}</option>
                  <option value="pending">{t("common.pending", "Pending")}</option>
                  <option value="rejected">{t("common.rejected", "Rejected")}</option>
                </select>
              </div>

              {/* Search Box & Refresh Group */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:w-56 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t("branchManagerMembers.searchNameCodePhoneSavings", "Search name, code, phone, savings A/C...")}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-2xs"
                  />
                </div>

                {/* Sync / Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-[#0f766e] bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs flex-shrink-0"
                  title={t("branchManagerMembers.refreshMemberData", "Refresh Member Data")}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00b4a7]' : ''}`} />
                </button>
              </div>
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
                onClick={handleRefresh}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">{t("modal.member.memberCode", "Member Code")}</th>
                  <th className="py-3.5 px-5">{t("dashboardModule.productAccounts.memberName", "Member Name")}</th>
                  <th className="py-3.5 px-5">{t("modal.member.emailAddress", "Email Address")}</th>
                  <th className="py-3.5 px-5">{t("modal.branchAdmin.contactNumberLabel", "Contact Number")}</th>
                  <th className="py-3.5 px-5">{t("staffMembers.branchLocation", "Branch / Location")}</th>
                  <th className="py-3.5 px-5">{t("branchManagerMembers.kycStatus", "KYC Status")}</th>
                  <th className="py-3.5 px-5">{t("staffMembers.activeStatus", "Active Status")}</th>
                  <th className="py-3.5 px-5">{t("branchManagerMembers.registeredAt", "Registered At")}</th>
                  <th className="py-3.5 px-5 text-right">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00b4a7]" />
                        <span>{t("staffMembers.synchronizingMembersFromAccountantRegistry", "Synchronizing members from accountant registry...")}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">{t("branchManagerMembers.noMembersFound", "No Members Found")}</p>
                        <p className="text-xs text-slate-400">
                          {memberSearch || statusFilter !== 'all'
                            ? t("branchManagerMembers.tryClearingYourSearchOr", "Try clearing your search or status filters.")
                            : t("staffMembers.noMembersRegisteredUnderThis", "No members registered under this branch yet.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
  const { t } = useTranslation();
                    const statusUpper = (m.status || 'PENDING').toUpperCase();
                    const isActive = m.is_active !== false;

                    return (
                      <tr key={m.id || m.member_code} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Code */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 whitespace-nowrap">
                            {m.user_code || m.member_code || m.id}
                          </span>
                        </td>

                        {/* Full Name */}
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900 whitespace-nowrap">{m.full_name || '—'}</p>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-5">
                          {m.email ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium whitespace-nowrap">
                              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{m.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Mobile */}
                        <td className="py-4 px-5">
                          {m.mobile ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs whitespace-nowrap">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{m.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Branch / City */}
                        <td className="py-4 px-5">
                          <p className="font-semibold text-slate-800">{m.branch_name || `Branch #${m.branch_id}`}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.city ? `${m.city}, ${m.state || 'Kerala'}` : m.state || 'Kerala'}
                          </p>
                        </td>

                        {/* KYC Status */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              statusUpper === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : statusUpper === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {statusUpper === 'APPROVED' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : statusUpper === 'REJECTED' ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {statusUpper}
                          </span>
                        </td>

                        {/* Active Status */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isActive ? 'bg-teal-50 text-[#0f766e]' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#00b4a7]' : 'bg-slate-400'}`} />
                            {isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                          </span>
                        </td>

                        {/* Registered At */}
                        <td className="py-4 px-5 text-slate-600 text-xs">
                          {m.created_at ? (
                            <div>
                              <p className="font-semibold text-slate-800">
                                {new Date(m.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(m.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Action: View Details & View Transactions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleInspect(m)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-[#0f766e] font-bold text-xs rounded-xl border border-teal-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              title={t("staffMembers.viewFullCertifiedMemberDetails", "View full certified member details & savings accounts")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t("branchManagerFdMisSchemes.viewDetails", "View Details")}</span>
                            </button>

                            <button
                              onClick={() => handleViewTransactions(m)}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              title={t("branchManagerMembers.viewMemberCounterCashTransactions", "View member counter cash transactions history")}
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{t("branchManagerMembers.viewTransactions", "View Transactions")}</span>
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

          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              {t("common.showing", "Showing")} {filteredMembers.length} {t("common.of", "of")} {members.length} {t("staffMembers.membersFor", "members for")} {branchName}
            </span>
          </div>
        </div>

      </div>

      {/* Member Details & Documents Inspection Modal */}
      {inspectModalOpen && selectedMember && (
        <MemberDetailModal
          isOpen={inspectModalOpen}
          onClose={() => {
            setInspectModalOpen(false);
            setSelectedMember(null);
          }}
          branchId={selectedMember.branch_id || staffUser?.branch?.id}
          memberId={selectedMember.id}
          initialMember={selectedMember}
          branchName={selectedMember.branch_name || branchName}
          portal="accountant"
        />
      )}

      {/* Member Cash Transactions Modal */}
      {transactionsModalOpen && selectedMemberForTransactions && (
        <MemberCashTransactionsModal
          isOpen={transactionsModalOpen}
          onClose={() => {
            setTransactionsModalOpen(false);
            setSelectedMemberForTransactions(null);
          }}
          member={selectedMemberForTransactions}
          portal="accountant"
          branchId={selectedMemberForTransactions?.branch_id || staffUser?.branch?.id}
        />
      )}
    </DashboardLayout>
  );
}
