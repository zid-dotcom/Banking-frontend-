import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  CreateServiceRequestModal,
  ServiceRequestDetailModal
} from '../../components/dashboard/ServiceRequestModals';
import {
  getMemberServiceRequests,
  createMemberServiceRequest,
  getMemberServiceRequest,
  getMemberMe
} from '../../services/memberService';
import {
  LifeBuoy,
  MessageSquare,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import supportSticker from '../../assets/Cooperative Banking Support Sticker.png';

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

export default function MemberHelpdesk() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    request: null,
    loading: false
  });

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Member';
        const branchObj = typeof parsed.branch === 'object' && parsed.branch !== null ? parsed.branch : null;
        const branchName = branchObj?.name || (typeof parsed.branch === 'string' ? parsed.branch : '');
        const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
        return {
          name,
          full_name: name,
          id: parsed.member_code || (parsed.id ? `MEM-${parsed.id}` : 'AFX-MEM-8842'),
          member_code: parsed.member_code || (parsed.id ? String(parsed.id) : ''),
          email: parsed.email || '',
          mobile: parsed.mobile || '',
          branch: branchName || 'Society Branch',
          branch_name: branchName,
          branch_location: branchLocation,
          status: parsed.status || 'approved',
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
        };
      }
    } catch {}
    return {
      name: 'Member',
      full_name: 'Member',
      id: 'AFX-MEM-8842',
      member_code: '',
      email: '',
      mobile: '',
      branch: 'Society Branch',
      branch_name: '',
      branch_location: '',
      status: 'approved',
      avatarText: 'M'
    };
  });

  useEffect(() => {
    getMemberMe()
      .then((data) => {
        if (data) {
          const name = data.full_name || data.name || 'Member';
          const branchObj = typeof data.branch === 'object' && data.branch !== null ? data.branch : null;
          const branchName = branchObj?.name || (typeof data.branch === 'string' ? data.branch : '');
          const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
          setMemberUser({
            name,
            full_name: name,
            id: data.member_code || (data.id ? `MEM-${data.id}` : 'AFX-MEM-8842'),
            member_code: data.member_code || (data.id ? String(data.id) : ''),
            email: data.email || '',
            mobile: data.mobile || '',
            branch: branchName || 'Society Branch',
            branch_name: branchName,
            branch_location: branchLocation,
            status: data.status || 'approved',
            avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Member Service Requests
  const fetchRequests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberServiceRequests({ limit: 100 });
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn('Fetch service requests error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load your service requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle Create Submission (POST /member/service-requests)
  const handleCreateSubmit = async ({ subject, message }) => {
    setIsSubmitting(true);
    try {
      await createMemberServiceRequest({ subject, message });
      setCreateModalOpen(false);
      showToast('Service request submitted successfully! Your home branch has been notified.');
      await fetchRequests(true);
    } catch (err) {
      alert(err.message || 'Failed to submit service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detail Modal with specific GET /member/service-requests/{request_id}
  const handleViewDetail = async (req) => {
    const reqId = req.id || req.request_id || req.ticket_id;
    setDetailModal({
      isOpen: true,
      request: req,
      loading: Boolean(reqId)
    });

    if (reqId) {
      try {
        const fullDetail = await getMemberServiceRequest(reqId);
        if (fullDetail) {
          setDetailModal((prev) => ({
            ...prev,
            request: { ...req, ...fullDetail },
            loading: false
          }));
        }
      } catch (err) {
        console.warn('Fetch single request detail error:', err);
        setDetailModal((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  // Filtering
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const subjectMatch = !q || (r.subject || '').toLowerCase().includes(q) || String(r.id || '').includes(q);
    const messageMatch = !q || (r.message || '').toLowerCase().includes(q);

    let statusMatch = true;
    const st = (r.status || 'open').toLowerCase();
    if (statusFilter === 'open') {
      statusMatch = st === 'open';
    } else if (statusFilter === 'in_progress') {
      statusMatch = st === 'in_progress' || st === 'pending';
    } else if (statusFilter === 'resolved') {
      statusMatch = st === 'resolved' || st === 'closed' || st === 'completed';
    }

    return (subjectMatch || messageMatch) && statusMatch;
  });

  // Computed Metrics
  const totalCount = requests.length;
  const openCount = requests.filter((r) => {
    const st = (r.status || 'open').toLowerCase();
    return st === 'open' || st === 'in_progress' || st === 'pending';
  }).length;
  const resolvedCount = requests.filter((r) => {
    const st = (r.status || '').toLowerCase();
    return st === 'resolved' || st === 'closed' || st === 'completed';
  }).length;

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="helpdesk"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner matching member theme */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <LifeBuoy className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Society Helpdesk &amp; Member Support</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {memberUser.branch_name || 'Home Branch Support Desk'}
              </span>
            </div>

            {/* Title with teal bar */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                Member Service Requests
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              Submit assistance tickets, inquire about schemes or transactions, and track society grievance resolutions directly with branch officers.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Service Request</span>
              </button>
            </div>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={supportSticker}
              alt="Society Member Support"
              className="h-36 sm:h-48 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none"
            />
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Requests"
            value={totalCount}
            subtitle="Logged Assistance Folios"
            icon={LifeBuoy}
            trend={`${openCount} pending`}
            trendType="up"
          />
          <StatCard
            title="Open / In Progress"
            value={openCount}
            subtitle="Active Attention"
            icon={Clock}
            badge="Assigned Desk"
          />
          <StatCard
            title="Resolved Requests"
            value={resolvedCount}
            subtitle="Completed Solutions"
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}% solved` : '100%'}
            trendType="up"
          />
          <StatCard
            title="Assistance Level"
            value="Priority"
            subtitle="Direct Branch Link"
            icon={ShieldCheck}
            trend="Active Member"
            trendType="up"
          />
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-teal-900 text-white shadow-2xl flex items-center gap-3 animate-slideIn">
            <CheckCircle2 className="w-5 h-5 text-teal-300 flex-shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Main Requests Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  My Service &amp; Support Requests
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Official grievances, clarification queries, and member desk folios
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by subject or ticket #..."
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

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Only</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <button
                onClick={() => fetchRequests(true)}
                disabled={refreshing}
                title="Refresh service requests"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Request</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load service requests</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchRequests()}
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
                <p className="text-sm text-slate-500 font-medium">Loading your support tickets...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                  <LifeBuoy className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching service requests found' : 'No service requests submitted yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try clearing your search query or adjusting status filter.'
                      : 'Have questions about your deposits, loans, or account? Click "New Request" to create one.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Your First Request</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Request ID</th>
                    <th className="py-3.5 px-6">Subject &amp; Description</th>
                    <th className="py-3.5 px-6">Created On</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRequests.map((req) => {
                    const reqId = req.id || req.request_id || req.ticket_id || 'REQ-01';
                    const st = (req.status || 'open').toLowerCase();

                    const getStatusBadge = (statusStr) => {
                      if (statusStr === 'resolved' || statusStr === 'closed' || statusStr === 'completed') {
                        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      }
                      if (statusStr === 'in_progress' || statusStr === 'pending') {
                        return 'bg-amber-50 text-amber-700 border-amber-200';
                      }
                      return 'bg-teal-50 text-teal-700 border-teal-200';
                    };

                    return (
                      <tr
                        key={reqId}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Ticket ID */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            #{reqId}
                          </span>
                        </td>

                        {/* Subject & Description */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors line-clamp-1 max-w-md">
                            {req.subject}
                          </div>
                          {req.message && (
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-md mt-0.5">
                              {req.message}
                            </p>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {formatDateTime(req.created_at || req.date)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(
                              st
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{st.replace(/_/g, ' ')}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetail(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                            title="View request details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />
                            <span>View</span>
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
          {filteredRequests.length > itemsPerPage && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                </span>{' '}
                of <span className="font-bold text-slate-800">{filteredRequests.length}</span> requests
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}

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

      {/* Create Modal */}
      <CreateServiceRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Detail Modal */}
      <ServiceRequestDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, request: null, loading: false })}
        request={detailModal.request}
        loading={detailModal.loading}
      />
    </DashboardLayout>
  );
}
