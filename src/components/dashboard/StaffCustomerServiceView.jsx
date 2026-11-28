import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react';
import StatCard from './StatCard';
import StaffServiceRequestModal from './StaffServiceRequestModal';
import {
  getStaffCustomerServiceRequests,
  getStaffCustomerServicePendingCount,
  getStaffCustomerServiceRequest,
  updateStaffCustomerServiceRequestStatus
} from '../../services/serviceRequestService';
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

export default function StaffCustomerServiceView({ staffUser, showBanner = true }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'solved'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail & Reply Modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const branchName =
    staffUser?.branch?.name || staffUser?.branch_name || 'Society Branch';
  const branchCode =
    staffUser?.branch?.branch_code || staffUser?.branch_code || 'BRA-01';

  const loadRequests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getStaffCustomerServiceRequests({ limit: 100 });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customer service requests:', err);
      setError(err.message || 'Failed to load customer service requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const q = searchQuery.toLowerCase().trim();
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

      const matchesSearch =
        !q ||
        reqId.includes(q) ||
        subject.includes(q) ||
        message.includes(q) ||
        memberName.includes(q) ||
        userCode.includes(q);

      const st = normalizeStatus(req.status);
      const matchesStatus =
        statusFilter === 'all' ||
        st === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRequests, currentPage, itemsPerPage]);

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

  const handleOpenDetail = async (req) => {
    setActiveRequest(req);
    setModalOpen(true);

    const reqId = req.id || req.request_id || req.ticket_id;
    if (reqId) {
      try {
        const fullDetail = await getStaffCustomerServiceRequest(reqId);
        if (fullDetail) {
          setActiveRequest((prev) => ({
            ...prev,
            ...fullDetail
          }));
        }
      } catch (err) {
        console.warn('Could not fetch full staff request detail, fallback to summary:', err);
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
  const handleInlineStatusChange = async (e, req, newStatus) => {
    e.stopPropagation();
    const reqId = req.id || req.request_id || req.ticket_id;
    if (!reqId || !newStatus || newStatus === normalizeStatus(req.status) || updatingStatusId) return;

    setUpdatingStatusId(reqId);
    try {
      await updateStaffCustomerServiceRequestStatus(reqId, newStatus);
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

  const getStatusBadge = (st) => {
    const s = normalizeStatus(st);
    switch (s) {
      case 'solved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner (exact match to Branch Manager) */}
      {showBanner && (
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Headset className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("staffCustomerServiceView.roleCustomerServiceOfficer", "Role: Customer Service Officer")}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {branchName} (#{branchCode})
              </span>
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
                {t("branchManagerServiceRequests.memberServiceRequests", "Member Service Requests")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("branchManagerServiceRequests.reviewMemberAssistanceTicketsProvide", "Review member assistance tickets, provide official branch desk replies, and track resolution lifecycles for")} {branchName}.
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
              alt={t("branchManagerServiceRequests.memberServiceRequests", "Member Service Requests")}
              className="h-36 sm:h-48 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none"
            />
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
          </div>
        </div>
      )}

      {/* Metric Stat Cards (exact match to Branch Manager) */}
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
          subtitle={t("branchManagerServiceRequests.awaitingBranchReview", "Awaiting branch review")}
          icon={Clock}
          trend={{ text: `${pendingCount} unhandled`, positive: pendingCount === 0 }}
        />
        <StatCard
          title={t("branchManagerServiceRequests.inProgress", "IN PROGRESS")}
          value={inProgressCount}
          subtitle={t("branchManagerServiceRequests.underBranchFollowUp", "Under branch follow-up")}
          icon={MessageSquare}
          trend={{ text: `${inProgressCount} active`, positive: true }}
        />
        <StatCard
          title={t("branchManagerServiceRequests.solved", "SOLVED")}
          value={solvedCount}
          subtitle={t("branchManagerServiceRequests.completedMemberTickets", "Completed member tickets")}
          icon={CheckCircle2}
          trend={{
            text: totalCount > 0 ? `${Math.round((solvedCount / totalCount) * 100)}% solved` : '100% resolution',
            positive: true
          }}
        />
      </div>

      {/* Search, Filter Bar and Table Card (exact match to Branch Manager) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("branchManagerServiceRequests.searchTicketSubjectMemberName", "Search ticket #, subject, member name or code...")}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: t("branchManagerNominees.allRequests", "All Requests") },
              { id: 'pending', label: t("common.pending", "Pending") },
              { id: 'in_progress', label: t("dashboardModule.branchOverview.statusInProgress", "In Progress") },
              { id: 'solved', label: t("dashboardModule.branchOverview.statusSolved", "Solved") }
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-[#0f766e] border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">{t("branchManagerServiceRequests.loadingBranchServiceRequests", "Loading branch service requests...")}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={() => loadRequests()}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors cursor-pointer"
            >
              {t("branchManagerServiceRequests.tryAgain", "Try Again")}
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
              <Headset className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800">{t("branchManagerServiceRequests.noServiceRequestsFound", "No service requests found")}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {searchQuery || statusFilter !== 'all'
                ? t("branchManagerServiceRequests.noRequestsMatchedYourFilter", "No requests matched your filter criteria. Try clearing your search.")
                : t("branchManagerServiceRequests.thereAreCurrentlyNoActive", "There are currently no active member assistance requests logged for this branch.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">{t("branchManagerServiceRequests.userCode", "User Code")}</th>
                  <th className="py-3.5 px-4">{t("branchManagerServiceRequests.memberInfo", "Member Info")}</th>
                  <th className="py-3.5 px-4">{t("branchManagerServiceRequests.subjectDescription", "Subject & Description")}</th>
                  <th className="py-3.5 px-4">{t("branchManagerServiceRequests.dateLogged", "Date Logged")}</th>
                  <th className="py-3.5 px-4">{t("common.status", "Status")}</th>
                  <th className="py-3.5 px-4 text-right">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {paginatedRequests.map((req) => {
  const { t } = useTranslation();
                  const reqId = req.id || req.request_id || req.ticket_id;
                  const memberName =
                    req.member?.full_name ||
                    req.member?.name ||
                    req.member_name ||
                    req.user_name ||
                    'Member';
                  const userCodeDisplay =
                    req.member?.user_code ||
                    req.user_code ||
                    req.member?.member_code ||
                    req.member_code ||
                    (req.member_id ? `MEM-${req.member_id}` : `#${reqId}`);
                  const memberPhone = req.member?.mobile || req.member?.phone || req.member_phone || '';
                  const repliesCount = Array.isArray(req.replies)
                    ? req.replies.length
                    : req.reply
                    ? 1
                    : 0;

                  return (
                    <tr
                      key={reqId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(req)}
                    >
                      {/* User Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                          {userCodeDisplay}
                        </span>
                      </td>

                      {/* Member Details */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {memberName}
                            </p>
                            {memberPhone && (
                              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                {memberPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject & Description */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 text-xs truncate group-hover:text-teal-700 transition-colors">
                          {req.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate font-normal mt-0.5">
                          {req.message}
                        </p>
                        {repliesCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-100">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {repliesCount} {repliesCount === 1 ? t("branchManagerServiceRequests.reply", "reply") : t("branchManagerServiceRequests.replies", "replies")}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(req.created_at || req.date)}</span>
                        </div>
                      </td>

                      {/* Status with Direct Update Dropdown */}
                      <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center">
                          <select
                            value={normalizeStatus(req.status)}
                            onChange={(e) => handleInlineStatusChange(e, req, e.target.value)}
                            disabled={updatingStatusId === reqId}
                            title={t("branchManagerServiceRequests.clickToDirectlyUpdateStatus", "Click to directly update status")}
                            className={`text-xs font-bold pl-3 pr-7 py-1 rounded-full border transition-all cursor-pointer focus:outline-none appearance-none capitalize ${getStatusBadge(
                              req.status
                            )}`}
                          >
                            <option value="pending" className="bg-white text-rose-800 font-semibold">{t("common.pending", "Pending")}</option>
                            <option value="in_progress" className="bg-white text-amber-800 font-semibold">{t("dashboardModule.branchOverview.statusInProgress", "In Progress")}</option>
                            <option value="solved" className="bg-white text-emerald-800 font-semibold">{t("dashboardModule.branchOverview.statusSolved", "Solved")}</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                            {updatingStatusId === reqId ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(req)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 font-bold text-xs border border-teal-200/60 transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-700" />
                          <span>{t("branchManagerServiceRequests.manageReply", "Manage & Reply")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredRequests.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2 text-xs font-medium text-slate-500">
            <div>
              {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
              {Math.min(currentPage * itemsPerPage, filteredRequests.length)} {t("common.of", "of")}{' '}
              {filteredRequests.length} {t("branchManagerNominees.requests", "requests")}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-slate-800 font-bold">
                {t("branchManagerInvestmentSchemes.page", "Page")} {currentPage} {t("common.of", "of")} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Staff Service Request Modal */}
      <StaffServiceRequestModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveRequest(null);
        }}
        request={activeRequest}
        onUpdated={handleRequestUpdated}
        showToast={showToast}
      />
    </div>
  );
}
