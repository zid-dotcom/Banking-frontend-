import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import NomineeDetailModal from '../../components/dashboard/NomineeDetailModal';
import {
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  XCircle,
  Filter,
  Check,
  ShieldCheck,
  HeartHandshake,
  User,
  Loader2,
  FileText,
} from 'lucide-react';
import nomineeIllustration from '../../assets/Nominee Registration Family Security Illustration.png';
import {
  getBranchAdminNominees,
  reviewBranchAdminNominee
} from '../../services/branchAdminService';
import {
  getBranchAdminNomineeChangeRequests,
  getBranchAdminNomineeChangeRequest,
  reviewBranchAdminNomineeChangeRequest,
} from '../../services/nomineeService';

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

export default function BranchManagerNominees() {
  const { t } = useTranslation();
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Feedback
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    nomineeId: null,
    initialData: null,
  });

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    nominee: null,
    reason: '',
    loading: false,
    error: null,
  });

  const [quickActionLoadingId, setQuickActionLoadingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Sub-tabs: 'registrations' | 'change_requests'
  const [activeSubTab, setActiveSubTab] = useState('registrations');

  // Change Requests States
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequestsLoading, setChangeRequestsLoading] = useState(false);
  const [changeRequestsRefreshing, setChangeRequestsRefreshing] = useState(false);
  const [changeRequestsStatusFilter, setChangeRequestsStatusFilter] = useState('all');
  const [changeRequestsSearchQuery, setChangeRequestsSearchQuery] = useState('');
  const [changeRequestPage, setChangeRequestPage] = useState(1);
  const [changeRequestDetailModal, setChangeRequestDetailModal] = useState({
    isOpen: false,
    request: null,
    loading: false,
  });
  const [changeRequestRejectModal, setChangeRequestRejectModal] = useState({
    isOpen: false,
    request: null,
    reason: '',
    loading: false,
    error: null,
  });
  const [quickChangeRequestLoadingId, setQuickChangeRequestLoadingId] = useState(null);

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
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
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
      branch: 'Main Branch',
      branch_name: 'Main Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
      is_active: true
    };
  });

  // Fetch Nominees from GET /branch-admin/nominees
  const fetchNominees = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getBranchAdminNominees({ limit: 100 });
      if (Array.isArray(data)) {
        setNominees(data);
      } else {
        setNominees([]);
      }
    } catch (err) {
      console.warn('API getBranchAdminNominees error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load nominee records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNominees();
  }, []);

  // Quick Approve
  const handleQuickApprove = async (nominee) => {
    setQuickActionLoadingId(nominee.id);
    try {
      await reviewBranchAdminNominee(nominee.id, { status: 'approved' });
      setNominees((prev) =>
        prev.map((n) => (n.id === nominee.id ? { ...n, status: 'approved' } : n))
      );
      setSuccessToast(`Nominee ${nominee.nominee_name} approved successfully.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to approve nominee.');
    } finally {
      setQuickActionLoadingId(null);
    }
  };

  // Submit Quick Reject
  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      setRejectModal((prev) => ({ ...prev, error: 'Please enter a rejection reason.' }));
      return;
    }

    setRejectModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await reviewBranchAdminNominee(rejectModal.nominee.id, {
        status: 'rejected',
        rejection_reason: rejectModal.reason.trim()
      });

      setNominees((prev) =>
        prev.map((n) =>
          n.id === rejectModal.nominee.id
            ? { ...n, status: 'rejected', rejection_reason: rejectModal.reason.trim() }
            : n
        )
      );

      setSuccessToast(`Nominee ${rejectModal.nominee.nominee_name} rejected.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setRejectModal({ isOpen: false, nominee: null, reason: '', loading: false, error: null });
    } catch (err) {
      setRejectModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to reject nominee.'
      }));
    }
  };

  // Status update from detail modal
  const handleStatusUpdated = (nomineeId, newStatus, updatedData) => {
    setNominees((prev) =>
      prev.map((n) => (n.id === nomineeId ? { ...n, ...updatedData, status: newStatus } : n))
    );
  };

  // Fetch Change Requests
  const fetchChangeRequests = async (isManual = false) => {
    if (isManual) setChangeRequestsRefreshing(true);
    else setChangeRequestsLoading(true);

    try {
      const data = await getBranchAdminNomineeChangeRequests({
        limit: 100,
        status: changeRequestsStatusFilter !== 'all' ? changeRequestsStatusFilter : null,
        search: changeRequestsSearchQuery.trim() || null,
      });
      setChangeRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('getBranchAdminNomineeChangeRequests error:', err);
    } finally {
      setChangeRequestsLoading(false);
      setChangeRequestsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChangeRequests();
  }, [changeRequestsStatusFilter, changeRequestsSearchQuery]);

  // Quick Approve Change Request
  const handleApproveChangeRequest = async (req) => {
    setQuickChangeRequestLoadingId(req.id);
    try {
      await reviewBranchAdminNomineeChangeRequest(req.id, { status: 'approved' });
      setChangeRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: 'approved', reviewed_at: new Date().toISOString() }
            : r
        )
      );
      setSuccessToast(`Change request #${req.id} for ${req.member_name || 'member'} approved.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to approve change request.');
    } finally {
      setQuickChangeRequestLoadingId(null);
    }
  };

  // Open Reject Modal for Change Request
  const handleOpenChangeRequestRejectModal = (req) => {
    setChangeRequestRejectModal({
      isOpen: true,
      request: req,
      reason: '',
      loading: false,
      error: null,
    });
  };

  // Confirm Reject Change Request
  const handleConfirmChangeRequestReject = async () => {
    if (!changeRequestRejectModal.request) return;
    if (!changeRequestRejectModal.reason.trim()) {
      setChangeRequestRejectModal((prev) => ({ ...prev, error: 'Please enter a rejection reason.' }));
      return;
    }

    setChangeRequestRejectModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await reviewBranchAdminNomineeChangeRequest(changeRequestRejectModal.request.id, {
        status: 'rejected',
        rejection_reason: changeRequestRejectModal.reason.trim(),
      });
      setChangeRequests((prev) =>
        prev.map((r) =>
          r.id === changeRequestRejectModal.request.id
            ? {
                ...r,
                status: 'rejected',
                rejection_reason: changeRequestRejectModal.reason.trim(),
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
      setSuccessToast(`Change request #${changeRequestRejectModal.request.id} rejected.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setChangeRequestRejectModal({ isOpen: false, request: null, reason: '', loading: false, error: null });
    } catch (err) {
      setChangeRequestRejectModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to reject change request.',
      }));
    }
  };

  // View Change Request Detail Modal
  const handleViewChangeRequest = async (req) => {
    setChangeRequestDetailModal({ isOpen: true, request: req, loading: true });
    try {
      const full = await getBranchAdminNomineeChangeRequest(req.id);
      setChangeRequestDetailModal({ isOpen: true, request: full || req, loading: false });
    } catch {
      setChangeRequestDetailModal({ isOpen: true, request: req, loading: false });
    }
  };

  // Filter logic
  const filteredNominees = nominees.filter((n) => {
    const q = searchQuery.toLowerCase().trim();
    const nomName = (n.nominee_name || '').toLowerCase();
    const memName = (n.member_name || '').toLowerCase();
    const memCode = (n.member_code || '').toLowerCase();
    const rel = (n.relationship_type || '').toLowerCase();

    const matchesQuery = !q || nomName.includes(q) || memName.includes(q) || memCode.includes(q) || rel.includes(q);

    let matchesStatus = true;
    const currentSt = (n.status || 'pending').toLowerCase();
    if (statusFilter !== 'all') {
      matchesStatus = currentSt === statusFilter.toLowerCase();
    }

    return matchesQuery && matchesStatus;
  });

  // Computed metrics
  const totalCount = nominees.length;
  const pendingCount = nominees.filter((n) => (n.status || 'pending').toLowerCase() === 'pending').length;
  const approvedCount = nominees.filter((n) => (n.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = nominees.filter((n) => (n.status || '').toLowerCase() === 'rejected').length;
  const pendingChangeRequestsCount = changeRequests.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length;

  // Pagination
  const totalPages = Math.ceil(filteredNominees.length / itemsPerPage) || 1;
  const paginatedNominees = filteredNominees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter & Pagination - Change Requests
  const changeRequestItemsPerPage = 10;
  const filteredChangeRequests = changeRequests.filter((r) => {
    const q = changeRequestsSearchQuery.toLowerCase().trim();
    const memName = (r.member_name || '').toLowerCase();
    const memCode = (r.member_code || '').toLowerCase();
    const subj = (r.subject || '').toLowerCase();
    const msg = (r.message || '').toLowerCase();
    const matchesQuery = !q || memName.includes(q) || memCode.includes(q) || subj.includes(q) || msg.includes(q);

    let matchesStatus = true;
    const currentSt = (r.status || 'pending').toLowerCase();
    if (changeRequestsStatusFilter !== 'all') {
      matchesStatus = currentSt === changeRequestsStatusFilter.toLowerCase();
    }
    return matchesQuery && matchesStatus;
  });

  const changeRequestTotalPages = Math.ceil(filteredChangeRequests.length / changeRequestItemsPerPage) || 1;
  const paginatedChangeRequests = filteredChangeRequests.slice(
    (changeRequestPage - 1) * changeRequestItemsPerPage,
    changeRequestPage * changeRequestItemsPerPage
  );

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="nominees"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <HeartHandshake className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("nav.branchManager", "Branch Manager")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {managerUser.branch_name || 'Society Branch'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("branchManagerNominees.activeRegistry", "Active Registry")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("branchManagerNominees.branchNomineesRegistry", "Branch Nominees Registry")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("branchManagerNominees.reviewAndVerifyMemberNominee", "Review and verify member nominee registrations, inspect Aadhaar identification documents, and approve or reject nomination claims.")}
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={nomineeIllustration}
              alt={t("branchManagerNominees.branchNomineesIllustration", "Branch Nominees Illustration")}
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

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={t("branchManagerNominees.totalNominees", "Total Nominees")}
            value={totalCount.toString()}
            subtitle={t("branchManagerNominees.registeredNominations", "Registered Nominations")}
            icon={HeartHandshake}
            trend={`${totalCount} recorded`}
            trendType="up"
          />
          <StatCard
            title={t("modal.member.pendingVerification", "Pending Verification")}
            value={pendingCount.toString()}
            subtitle={t("branchManagerNominees.awaitingVerification", "Awaiting Verification")}
            icon={Clock}
            trend={pendingCount > 0 ? `${pendingCount} action required` : 'All cleared'}
            trendType={pendingCount > 0 ? 'down' : 'up'}
          />
          <StatCard
            title={t("branchManagerNominees.approvedNominees", "Approved Nominees")}
            value={approvedCount.toString()}
            subtitle={t("branchManagerNominees.verifiedActive", "Verified & Active")}
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((approvedCount / totalCount) * 100)}% approved` : '0%'}
            trendType="up"
          />
          <StatCard
            title={t("branchManagerNominees.rejectedNominees", "Rejected Nominees")}
            value={rejectedCount.toString()}
            subtitle={t("branchManagerNominees.declinedClaims", "Declined Claims")}
            icon={XCircle}
          />
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('registrations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === 'registrations'
                ? 'bg-[#0f766e] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-teal-50/60 hover:text-[#0f766e] border border-slate-200/80'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t("branchManagerNominees.nomineeRegistrations", "Nominee Registrations")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === 'registrations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('change_requests');
              fetchChangeRequests();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === 'change_requests'
                ? 'bg-[#0f766e] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-teal-50/60 hover:text-[#0f766e] border border-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t("branchManagerNominees.nomineeChangeRequests", "Nominee Change Requests")}</span>
            {pendingChangeRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingChangeRequestsCount} {t("branchManagerNominees.pending", "pending")}
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeSubTab === 'change_requests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {changeRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'registrations' ? (
          /* Main Panel: Nominee Registrations */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {t("branchManagerNominees.memberNomineesCatalogue", "Member Nominees Catalogue")}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t("branchManagerNominees.officialNomineeRecordsForMembers", "Official nominee records for members registered under this branch")}
              </p>
            </div>

            {/* Search Input & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("branchManagerNominees.searchNomineeMemberNameOr", "Search nominee, member name or code...")}
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
                  <option value="all">{t("branchManagerNominees.allNominees", "All Nominees")}</option>
                  <option value="pending">{t("branchManagerMembers.pendingReview", "Pending Review")}</option>
                  <option value="approved">{t("common.approved", "Approved")}</option>
                  <option value="rejected">{t("common.rejected", "Rejected")}</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchNominees(true)}
                disabled={refreshing}
                title={t("branchManagerNominees.refreshNomineeList", "Refresh nominee list")}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">{t("branchManagerNominees.failedToLoadNominees", "Failed to load nominees")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchNominees()}
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
                <p className="text-sm text-slate-500 font-medium">{t("branchManagerNominees.loadingNomineeRecordsFromBranch", "Loading nominee records from branch registry...")}</p>
              </div>
            ) : filteredNominees.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("branchManagerNominees.noMatchingNomineesFound", "No matching nominees found") : t("branchManagerNominees.noNomineesRegisteredYet", "No nominees registered yet")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("branchManagerFdMisSchemes.tryAdjustingYourSearchQuery", "Try adjusting your search query or clear the filter.")
                      : t("branchManagerNominees.whenMembersRegisterTheirNominees", "When members register their nominees through the portal, their records will appear here for verification.")}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">{t("branchManagerNominees.nomineeName", "Nominee Name")}</th>
                    <th className="py-3.5 px-5">{t("branchManagerNominees.memberAccount", "Member Account")}</th>
                    <th className="py-3.5 px-5">{t("modal.member.memberCode", "Member Code")}</th>
                    <th className="py-3.5 px-5">{t("modal.nominee.relationship", "Relationship")}</th>
                    <th className="py-3.5 px-5">{t("dashboardModule.branchOverview.colSubmittedAt", "Submitted At")}</th>
                    <th className="py-3.5 px-5 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.details", "Details")}</th>
                    <th className="py-3.5 px-4 text-center">{t("branchManagerMembers.approve", "Approve")}</th>
                    <th className="py-3.5 px-4 text-center">{t("modal.nominee.reject", "Reject")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedNominees.map((nominee) => {
  const { t } = useTranslation();
                    const status = (nominee.status || 'pending').toLowerCase();
                    const isActing = quickActionLoadingId === nominee.id;

                    return (
                      <tr
                        key={nominee.id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Nominee Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0 font-bold">
                              <HeartHandshake className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                                {nominee.nominee_name}
                              </div>
                              <span className="text-[11px] text-slate-400 capitalize">
                                {t("branchManagerNominees.nominee", "Nominee #")}{nominee.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Member Account */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="font-semibold text-slate-800">
                              {nominee.member_name}
                            </span>
                          </div>
                        </td>

                        {/* Member Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            {nominee.member_code || `MEM-${nominee.id}`}
                          </span>
                        </td>

                        {/* Relationship */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {nominee.relationship_type || 'N/A'}
                          </span>
                        </td>

                        {/* Submitted At */}
                        <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(nominee.submitted_at)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                status === 'approved'
                                  ? 'bg-emerald-500'
                                  : status === 'rejected'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            {status}
                          </span>
                        </td>

                        {/* Details Column */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() =>
                              setDetailModal({
                                isOpen: true,
                                nomineeId: nominee.id,
                                initialData: nominee
                              })
                            }
                            title={t("branchManagerNominees.inspectNomineeDetails", "Inspect Nominee Details")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("dashboardModule.monthlyTargets.details", "Details")}</span>
                          </button>
                        </td>

                        {/* Approve Column */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {status === 'pending' ? (
                            <button
                              onClick={() => handleQuickApprove(nominee)}
                              disabled={isActing}
                              title={t("modal.nominee.approveNominee", "Approve Nominee")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                              )}
                              <span>{t("branchManagerMembers.approve", "Approve")}</span>
                            </button>
                          ) : status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{t("common.approved", "Approved")}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-sm">—</span>
                          )}
                        </td>

                        {/* Reject Column */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {status === 'pending' ? (
                            <button
                              onClick={() =>
                                setRejectModal({
                                  isOpen: true,
                                  nominee,
                                  reason: '',
                                  loading: false,
                                  error: null
                                })
                              }
                              disabled={isActing}
                              title={t("branchManagerNominees.rejectNominee", "Reject Nominee")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5] text-rose-600" />
                              <span>{t("modal.nominee.reject", "Reject")}</span>
                            </button>
                          ) : status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{t("common.rejected", "Rejected")}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
            {!loading && filteredNominees.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
                  {Math.min(currentPage * itemsPerPage, filteredNominees.length)} {t("common.of", "of")} {filteredNominees.length} {t("branchManagerNominees.nominees", "nominees")}
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
        ) : (
          /* Main Panel: Nominee Change Requests */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Action & Filter Toolbar */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#00b4a7]" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    {t("branchManagerNominees.nomineeChangeRequests", "Nominee Change Requests")}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {t("branchManagerNominees.requestsSubmittedByBranchMembers", "Requests submitted by branch members to authorize updating their nominee")}
                </p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t("branchManagerNominees.searchByMemberCodeOr", "Search by member, code, or subject...")}
                    value={changeRequestsSearchQuery}
                    onChange={(e) => {
                      setChangeRequestsSearchQuery(e.target.value);
                      setChangeRequestPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 font-medium transition-all"
                  />
                  {changeRequestsSearchQuery && (
                    <button
                      onClick={() => {
                        setChangeRequestsSearchQuery('');
                        setChangeRequestPage(1);
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
                    value={changeRequestsStatusFilter}
                    onChange={(e) => {
                      setChangeRequestsStatusFilter(e.target.value);
                      setChangeRequestPage(1);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="all">{t("branchManagerNominees.allRequests", "All Requests")}</option>
                    <option value="pending">{t("common.pending", "Pending")}</option>
                    <option value="approved">{t("common.approved", "Approved")}</option>
                    <option value="rejected">{t("common.rejected", "Rejected")}</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchChangeRequests(true)}
                  disabled={changeRequestsRefreshing}
                  title={t("branchManagerNominees.refreshRequests", "Refresh requests")}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-teal-600 ${
                      changeRequestsRefreshing ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Change Requests Table */}
            {changeRequestsLoading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto" />
                <p className="text-xs text-slate-500 font-medium">{t("branchManagerNominees.loadingNomineeChangeRequests", "Loading nominee change requests...")}</p>
              </div>
            ) : filteredChangeRequests.length === 0 ? (
              <div className="py-20 text-center space-y-3 p-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0f766e] flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7 text-[#00b4a7]" />
                </div>
                <p className="text-base font-bold text-slate-800">
                  {changeRequestsSearchQuery ? t("branchManagerNominees.noMatchingChangeRequestsFound", "No matching change requests found") : t("branchManagerNominees.noChangeRequestsReceived", "No change requests received")}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t("branchManagerNominees.whenMembersRequestToUpdate", "When members request to update an approved nominee, their requests will appear here for review and approval.")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">{t("branchManagerNominees.requestId", "Request ID")}</th>
                      <th className="py-3.5 px-6">{t("branchManagerNominees.memberAccount", "Member Account")}</th>
                      <th className="py-3.5 px-6">{t("branchManagerNominees.subjectReason", "Subject & Reason")}</th>
                      <th className="py-3.5 px-6">{t("dashboardModule.emergency.table.createdAt", "Created At")}</th>
                      <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                      <th className="py-3.5 px-4 text-center">{t("dashboardModule.monthlyTargets.details", "Details")}</th>
                      <th className="py-3.5 px-4 text-center">{t("branchManagerMembers.approve", "Approve")}</th>
                      <th className="py-3.5 px-4 text-center">{t("modal.nominee.reject", "Reject")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedChangeRequests.map((req) => {
  const { t } = useTranslation();
                      const st = (req.status || 'pending').toLowerCase();
                      const isPending = st === 'pending';
                      const isApproved = st === 'approved';
                      const isRejected = st === 'rejected';
                      const isActing = quickChangeRequestLoadingId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-teal-50/20 transition-colors group">
                          {/* Request ID */}
                          <td className="py-4 px-6 font-bold text-[#0f766e] whitespace-nowrap">
                            #{req.id}
                          </td>

                          {/* Member */}
                          <td className="py-4 px-6">
                            <p className="font-extrabold text-slate-900 leading-tight">
                              {req.member_name || `Member #${req.member_id}`}
                            </p>
                            <span className="text-xs text-[#0f766e] font-semibold">
                              {t("branchManagerNominees.code", "Code: #")}{req.member_code || req.member_id}
                            </span>
                          </td>

                          {/* Subject & Message */}
                          <td className="py-4 px-6 max-w-xs">
                            <p className="font-bold text-slate-800 leading-snug">
                              {req.subject}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {req.message}
                            </p>
                            {isRejected && req.rejection_reason && (
                              <p className="text-xs font-bold text-red-600 mt-1">
                                {t("branchManagerNominees.rejection", "Rejection:")} {req.rejection_reason}
                              </p>
                            )}
                          </td>

                          {/* Created At */}
                          <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                            {formatDateTime(req.created_at)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isApproved
                                    ? 'bg-emerald-500'
                                    : isRejected
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500 animate-pulse'
                                }`}
                              />
                              {st}
                            </span>
                          </td>

                          {/* Details Column */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewChangeRequest(req)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs rounded-xl border border-teal-200 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t("dashboardModule.monthlyTargets.details", "Details")}</span>
                            </button>
                          </td>

                          {/* Approve Column */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveChangeRequest(req)}
                                disabled={isActing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isActing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                                )}
                                <span>{t("branchManagerMembers.approve", "Approve")}</span>
                              </button>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{t("common.approved", "Approved")}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold text-sm">—</span>
                            )}
                          </td>

                          {/* Reject Column */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleOpenChangeRequestRejectModal(req)}
                                disabled={isActing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5] text-rose-600" />
                                <span>{t("modal.nominee.reject", "Reject")}</span>
                              </button>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{t("common.rejected", "Rejected")}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!changeRequestsLoading && filteredChangeRequests.length > changeRequestItemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {t("common.showing", "Showing")} {(changeRequestPage - 1) * changeRequestItemsPerPage + 1} {t("common.to", "to")}{' '}
                  {Math.min(changeRequestPage * changeRequestItemsPerPage, filteredChangeRequests.length)} {t("common.of", "of")} {filteredChangeRequests.length} {t("branchManagerNominees.requests", "requests")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChangeRequestPage((p) => Math.max(1, p - 1))}
                    disabled={changeRequestPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.previous", "Previous")}
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {changeRequestPage} / {changeRequestTotalPages}
                  </span>
                  <button
                    onClick={() => setChangeRequestPage((p) => Math.min(changeRequestTotalPages, p + 1))}
                    disabled={changeRequestPage === changeRequestTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {t("branchManagerFdMisSchemes.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Detail Modal */}
      <NomineeDetailModal
        isOpen={detailModal.isOpen}
        nomineeId={detailModal.nomineeId}
        initialData={detailModal.initialData}
        onClose={() => setDetailModal({ isOpen: false, nomineeId: null, initialData: null })}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("branchManagerNominees.rejectNomineeApplication", "Reject Nominee Application")}
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectModal.nominee?.nominee_name} {t("branchManagerNominees.member", "(Member:")} {rejectModal.nominee?.member_name})
                </p>
              </div>
            </div>

            {rejectModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {rejectModal.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("branchManagerMembershipSettings.rejectionReason", "Rejection Reason")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={255}
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((prev) => ({ ...prev, reason: e.target.value, error: null }))
                }
                placeholder={t("branchManagerNominees.specifyTheReasonWhyThis", "Specify the reason why this nominee was rejected (e.g. document mismatch)...")}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 font-medium"
              />
              <span className="text-[10px] text-slate-400 block text-right mt-1">
                {rejectModal.reason.length} / 255
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setRejectModal({ isOpen: false, nominee: null, reason: '', loading: false, error: null })
                }
                disabled={rejectModal.loading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectModal.loading || !rejectModal.reason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {rejectModal.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{t("modal.nominee.confirmRejection", "Confirm Rejection")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Reject Modal */}
      {changeRequestRejectModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("branchManagerNominees.rejectNomineeChangeRequest", "Reject Nominee Change Request")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("branchManagerNominees.request", "Request #")}{changeRequestRejectModal.request?.id} — {changeRequestRejectModal.request?.member_name}
                </p>
              </div>
            </div>

            {changeRequestRejectModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {changeRequestRejectModal.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("branchManagerMembershipSettings.rejectionReason", "Rejection Reason")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={255}
                value={changeRequestRejectModal.reason}
                onChange={(e) =>
                  setChangeRequestRejectModal((prev) => ({ ...prev, reason: e.target.value, error: null }))
                }
                placeholder={t("branchManagerNominees.specifyTheReasonWhyThis2", "Specify the reason why this nominee change request was rejected...")}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 font-medium"
              />
              <span className="text-[10px] text-slate-400 block text-right mt-1">
                {changeRequestRejectModal.reason.length} / 255
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setChangeRequestRejectModal({ isOpen: false, request: null, reason: '', loading: false, error: null })
                }
                disabled={changeRequestRejectModal.loading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeRequestReject}
                disabled={changeRequestRejectModal.loading || !changeRequestRejectModal.reason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {changeRequestRejectModal.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{t("modal.nominee.confirmRejection", "Confirm Rejection")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Detail Modal */}
      {changeRequestDetailModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("branchManagerNominees.nomineeChangeRequest", "Nominee Change Request #")}{changeRequestDetailModal.request?.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("branchManagerNominees.member2", "Member:")} {changeRequestDetailModal.request?.member_name} (#{changeRequestDetailModal.request?.member_code || changeRequestDetailModal.request?.member_id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangeRequestDetailModal({ isOpen: false, request: null, loading: false })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboardModule.emergency.table.subject", "Subject")}</span>
                <p className="font-bold text-slate-800 text-sm">
                  {changeRequestDetailModal.request?.subject}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("branchManagerNominees.reasonMessage", "Reason / Message")}</span>
                <p className="font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {changeRequestDetailModal.request?.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("common.status", "Status")}</span>
                  <div className="pt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      changeRequestDetailModal.request?.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : changeRequestDetailModal.request?.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {changeRequestDetailModal.request?.status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboardModule.branchOverview.submittedOn", "Submitted On")}</span>
                  <p className="font-semibold text-slate-800 text-[11px]">
                    {formatDateTime(changeRequestDetailModal.request?.created_at)}
                  </p>
                </div>
              </div>

              {changeRequestDetailModal.request?.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">{t("branchManagerMembershipSettings.rejectionReason", "Rejection Reason")}</span>
                  <p className="font-semibold text-rose-900 text-xs">
                    {changeRequestDetailModal.request.rejection_reason}
                  </p>
                </div>
              )}

              {changeRequestDetailModal.request?.reviewed_at && (
                <p className="text-[11px] text-slate-400 text-right">
                  {t("branchManagerNominees.reviewedOn", "Reviewed on:")} {formatDateTime(changeRequestDetailModal.request.reviewed_at)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangeRequestDetailModal({ isOpen: false, request: null, loading: false })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
