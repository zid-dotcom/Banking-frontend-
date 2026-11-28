import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { SuperAdminServiceRequestModal } from '../../components/dashboard/SuperAdminServiceRequestModal';
import {
  getSuperAdminServiceRequests,
  getSuperAdminServiceRequest,
  updateSuperAdminServiceRequestStatus
} from '../../services/serviceRequestService';
import { getBranches } from '../../services/branchService';
import {
  Headset,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckCircle,
  HelpCircle,
  Send,
  Building,
  MapPin
} from 'lucide-react';
import friendlySupportIllustration from '../../assets/Friendly Service Request Support Illustration.png';

function normalizeStatus(st) {
  const s = String(st || '').toLowerCase().trim();
  if (s === 'open' || s === 'pending') return 'pending';
  if (s === 'resolved' || s === 'closed' || s === 'completed' || s === 'solved') return 'solved';
  if (s === 'in_progress') return 'in_progress';
  return 'pending';
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

export default function SuperAdminServiceRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'solved'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Inspection
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Toasts
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
    name: storedUser?.name || 'Super Admin',
    id: storedUser?.id ? `SUPER-ADMIN-${storedUser.id}` : 'SUPER-ADMIN',
    avatarText: 'SA',
    role: 'Super Admin',
    roleTitle: 'Super Admin',
    office: storedUser?.office || 'Head Office - Apex Central Administration'
  };

  // Fetch Branches for Branch Filter Dropdown
  useEffect(() => {
    getBranches()
      .then((data) => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch((err) => console.warn('Could not load branches for filter:', err));
  }, []);

  // Fetch Super Admin Service Requests
  const loadRequests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = {
        limit: 100,
        skip: 0
      };
      if (selectedBranchId !== 'all') {
        params.branch_id = selectedBranchId;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const data = await getSuperAdminServiceRequests(params);
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Fetch superadmin service requests error:', err);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load society service requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [selectedBranchId, statusFilter]);

  // Client-side search matching
  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const reqId = String(req.id || req.request_id || req.ticket_id || '').toLowerCase();
    const subject = (req.subject || '').toLowerCase();
    const message = (req.message || '').toLowerCase();
    const memberName = (
      req.member?.full_name ||
      req.member?.name ||
      req.member_name ||
      req.user_name ||
      ''
    ).toLowerCase();
    const userCode = (
      req.member?.user_code ||
      req.user_code ||
      req.member?.member_code ||
      req.member_code ||
      (req.member_id ? `mem-${req.member_id}` : '')
    ).toLowerCase();
    const branchName = (
      req.branch?.name ||
      req.branch?.branch_name ||
      req.branch_name ||
      ''
    ).toLowerCase();
    const branchCode = String(
      req.branch?.branch_code ||
      req.branch_code ||
      ''
    ).toLowerCase();

    return (
      reqId.includes(q) ||
      subject.includes(q) ||
      message.includes(q) ||
      memberName.includes(q) ||
      userCode.includes(q) ||
      branchName.includes(q) ||
      branchCode.includes(q)
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter(
    (r) => normalizeStatus(r.status) === 'pending'
  ).length;
  const inProgressCount = requests.filter(
    (r) => normalizeStatus(r.status) === 'in_progress'
  ).length;
  const solvedCount = requests.filter(
    (r) => normalizeStatus(r.status) === 'solved'
  ).length;

  // Open Manage & Detail Modal
  const handleOpenDetail = async (req) => {
    setSelectedRequest(req);
    setModalOpen(true);

    const reqId = req.id || req.request_id || req.ticket_id;
    if (reqId) {
      setLoadingDetail(true);
      try {
        const fullDetail = await getSuperAdminServiceRequest(reqId);
        if (fullDetail) {
          setSelectedRequest((prev) => ({
            ...prev,
            ...fullDetail
          }));
        }
      } catch (err) {
        console.warn('Could not fetch full request detail, fallback to summary:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleRequestUpdated = (updatedReq) => {
    setRequests((prev) =>
      prev.map((r) => {
        const rId = r.id || r.request_id || r.ticket_id;
        const uId = updatedReq.id || updatedReq.request_id || updatedReq.ticket_id;
        if (String(rId) === String(uId)) {
          return { ...r, ...updatedReq };
        }
        return r;
      })
    );
  };

  // Direct Inline Status Update from Table
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const handleInlineStatusChange = async (e, req, newStatus) => {
    e.stopPropagation();
    const reqId = req.id || req.request_id || req.ticket_id;
    if (!reqId || !newStatus || newStatus === normalizeStatus(req.status) || updatingStatusId) return;

    setUpdatingStatusId(reqId);
    try {
      await updateSuperAdminServiceRequestStatus(reqId, newStatus);
      handleRequestUpdated({
        ...req,
        status: newStatus
      });
      const uCode = req.member?.user_code || req.user_code || req.member?.member_code || '';
      showToast(`Status for ${uCode ? `User ${uCode}` : 'request'} directly updated to "${newStatus.replace(/_/g, ' ')}"`);
    } catch (err) {
      console.error('Failed to directly update status:', err);
      showToast(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <DashboardLayout role="super_admin" user={currentUser} activeTab="service_requests">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Headset className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("superAdminCashReconciliation.roleSuperAdmin", "Role: Super Admin")}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">{t("superAdminServiceRequests.apexSocietyServiceDesk", "Apex Society Service Desk")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("branchManagerServiceRequests.liveDesk", "Live Desk")}
              </span>
            </div>

            {/* Title with teal bar */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                {t("superAdminServiceRequests.societyServiceRequests", "Society Service Requests")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("superAdminServiceRequests.centralApexOversightForCooperative", "Central apex oversight for cooperative member inquiries, support tickets, and service desk communications across all society branches.")}
            </p>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => loadRequests(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? t("dashboardModule.branchOverview.refreshing", "Refreshing...") : t("branchManagerMemberPasswordUpdate.refreshList", "Refresh List")}</span>
              </button>
            </div>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={friendlySupportIllustration}
              alt={t("superAdminServiceRequests.societyServiceRequests", "Society Service Requests")}
              className="h-36 sm:h-48 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none"
            />
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
          </div>
        </div>

        {/* Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("branchManagerServiceRequests.totalRequests", "TOTAL REQUESTS")}
            value={totalCount}
            subtitle={t("branchManagerServiceRequests.allLoggedMemberTickets", "All logged member tickets")}
            icon={Headset}
            trend={{ text: `${totalCount} registered`, positive: true }}
          />
          <StatCard
            title={t("branchManagerServiceRequests.pendingInquiries", "PENDING INQUIRIES")}
            value={pendingCount}
            subtitle={t("superAdminServiceRequests.awaitingSocietyReview", "Awaiting society review")}
            icon={Clock}
            trend={{ text: `${pendingCount} unhandled`, positive: pendingCount === 0 }}
          />
          <StatCard
            title={t("branchManagerServiceRequests.inProgress", "IN PROGRESS")}
            value={inProgressCount}
            subtitle={t("superAdminServiceRequests.underActiveFollowUp", "Under active follow-up")}
            icon={MessageSquare}
            trend={{ text: `${inProgressCount} active`, positive: inProgressCount > 0 }}
          />
          <StatCard
            title={t("branchManagerServiceRequests.solved", "SOLVED")}
            value={solvedCount}
            subtitle={t("branchManagerServiceRequests.completedMemberTickets", "Completed member tickets")}
            icon={CheckCircle}
            trend={{
              text: totalCount > 0 ? `${Math.round((solvedCount / totalCount) * 100)}% solved` : '0%',
              positive: true
            }}
          />
        </div>

        {/* Main Requests Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t("branchManagerServiceRequests.searchTicketSubjectMemberName", "Search ticket #, subject, member name or code...")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls: Branch Filter & Status Filter Tabs */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Branch Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">{t("superAdminMembers.allOperatingBranches", "All Operating Branches (")}{branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || `Branch #${b.branch_code || b.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                {[
                  { id: 'all', label: t("branchManagerNominees.allRequests", "All Requests") },
                  { id: 'pending', label: t("common.pending", "Pending") },
                  { id: 'in_progress', label: t("dashboardModule.branchOverview.statusInProgress", "In Progress") },
                  { id: 'solved', label: t("dashboardModule.branchOverview.statusSolved", "Solved") }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-white text-teal-800 shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-900">{t("memberHelpdesk.failedToLoadServiceRequests", "Failed to load service requests")}</p>
                  <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => loadRequests()}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {t("branchManagerServiceRequests.tryAgain", "Try Again")}
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">{t("superAdminServiceRequests.loadingSocietyServiceRequests", "Loading society service requests...")}</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                  <Headset className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? t("memberHelpdesk.noMatchingServiceRequestsFound", "No matching service requests found") : t("superAdminServiceRequests.noServiceRequestsRecorded", "No service requests recorded")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("superAdminServiceRequests.tryAdjustingYourSearchCriteria", "Try adjusting your search criteria or clearing filters.")
                      : t("superAdminServiceRequests.memberAssistanceTicketsSubmittedAcross", "Member assistance tickets submitted across branches will appear here.")}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{t("branchManagerServiceRequests.userCode", "User Code")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerServiceRequests.memberInfo", "Member Info")}</th>
                    <th className="py-3.5 px-6">{t("dashboard.branch", "Branch")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerServiceRequests.subjectDescription", "Subject & Description")}</th>
                    <th className="py-3.5 px-6">{t("branchManagerServiceRequests.dateLogged", "Date Logged")}</th>
                    <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                    <th className="py-3.5 px-6 text-right">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRequests.map((req) => {
  const { t } = useTranslation();
                    const reqId = req.id || req.request_id || req.ticket_id;
                    const st = normalizeStatus(req.status);
                    const userCode =
                      req.member?.user_code ||
                      req.user_code ||
                      req.member?.member_code ||
                      req.member_code ||
                      `MEM-${req.member_id || reqId}`;
                    const memberName =
                      req.member?.full_name ||
                      req.member?.name ||
                      req.member_name ||
                      req.user_name ||
                      'Member';
                    const branchName =
                      req.branch?.name ||
                      req.branch?.branch_name ||
                      req.branch_name ||
                      'Apex Main';
                    const branchCode =
                      req.branch?.branch_code ||
                      req.branch_code ||
                      '';

                    return (
                      <tr
                        key={reqId}
                        onClick={() => handleOpenDetail(req)}
                        className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                      >
                        {/* User Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            {userCode}
                          </span>
                        </td>

                        {/* Member Info */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="font-bold text-slate-800 text-xs">
                              {memberName}
                            </span>
                          </div>
                        </td>

                        {/* Branch */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span className="font-semibold text-slate-700 text-xs">
                              {branchName}
                            </span>
                            {branchCode && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{branchCode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Subject & Description */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors line-clamp-1 max-w-xs">
                            {req.subject}
                          </div>
                          {req.message && (
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {req.message}
                            </p>
                          )}
                        </td>

                        {/* Date Logged */}
                        <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDateTime(req.created_at)}</span>
                          </span>
                        </td>

                        {/* Status (Direct Inline Change) */}
                        <td
                          className="py-4 px-6 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block">
                            <select
                              value={st}
                              onChange={(e) => handleInlineStatusChange(e, req, e.target.value)}
                              disabled={updatingStatusId === reqId}
                              className={`text-xs font-bold py-1 pl-3 pr-7 rounded-full border cursor-pointer appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60 shadow-2xs ${
                                st === 'solved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : st === 'in_progress'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              <option value="pending" className="text-rose-700 font-bold bg-white">
                                {t("common.pending", "Pending")}
                              </option>
                              <option value="in_progress" className="text-amber-700 font-bold bg-white">
                                {t("dashboardModule.branchOverview.statusInProgress", "In Progress")}
                              </option>
                              <option value="solved" className="text-emerald-700 font-bold bg-white">
                                {t("dashboardModule.branchOverview.statusSolved", "Solved")}
                              </option>
                            </select>
                            <ChevronDown
                              className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                                st === 'solved'
                                  ? 'text-emerald-700'
                                  : st === 'in_progress'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(req);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("branchManagerServiceRequests.manageReply", "Manage & Reply")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                {t("superAdminServiceRequests.showingPage", "Showing page")} {currentPage} {t("common.of", "of")} {totalPages} ({filteredRequests.length} {t("superAdminServiceRequests.total", "total)")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Manage & Reply Modal */}
      {modalOpen && selectedRequest && (
        <SuperAdminServiceRequestModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onUpdated={handleRequestUpdated}
          showToast={showToast}
        />
      )}
    </DashboardLayout>
  );
}
