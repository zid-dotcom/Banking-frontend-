import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import nomineeIllustration from '../../assets/Nominee Registration Family Security Illustration.png';
import {
  getBranchAdminNominees,
  reviewBranchAdminNominee
} from '../../services/branchAdminService';

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

  // Pagination
  const totalPages = Math.ceil(filteredNominees.length / itemsPerPage) || 1;
  const paginatedNominees = filteredNominees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
                <span>Role: <strong className="font-bold text-teal-950">Branch Manager</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">
                {managerUser.branch_name || 'Society Branch'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Registry
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Branch Nominees Registry
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Review and verify member nominee registrations, inspect Aadhaar identification documents, and approve or reject nomination claims.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={nomineeIllustration}
              alt="Branch Nominees Illustration"
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
            title="Total Nominees"
            value={totalCount.toString()}
            subtitle="Registered Nominations"
            icon={HeartHandshake}
            trend={`${totalCount} recorded`}
            trendType="up"
          />
          <StatCard
            title="Pending Verification"
            value={pendingCount.toString()}
            subtitle="Awaiting Verification"
            icon={Clock}
            trend={pendingCount > 0 ? `${pendingCount} action required` : 'All cleared'}
            trendType={pendingCount > 0 ? 'down' : 'up'}
          />
          <StatCard
            title="Approved Nominees"
            value={approvedCount.toString()}
            subtitle="Verified & Active"
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((approvedCount / totalCount) * 100)}% approved` : '0%'}
            trendType="up"
          />
          <StatCard
            title="Rejected Nominees"
            value={rejectedCount.toString()}
            subtitle="Declined Claims"
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

        {/* Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Action & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Member Nominees Catalogue
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Official nominee records for members registered under this branch
              </p>
            </div>

            {/* Search Input & Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search nominee, member name or code..."
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
                  <option value="all">All Nominees</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchNominees(true)}
                disabled={refreshing}
                title="Refresh nominee list"
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
                  <p className="text-sm font-bold text-red-900">Failed to load nominees</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchNominees()}
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
                <p className="text-sm text-slate-500 font-medium">Loading nominee records from branch registry...</p>
              </div>
            ) : filteredNominees.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching nominees found' : 'No nominees registered yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'When members register their nominees through the portal, their records will appear here for verification.'}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nominee Name</th>
                    <th className="py-3.5 px-6">Member Account</th>
                    <th className="py-3.5 px-6">Member Code</th>
                    <th className="py-3.5 px-6">Relationship</th>
                    <th className="py-3.5 px-6">Submitted At</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedNominees.map((nominee) => {
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
                                Nominee #{nominee.id}
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
                        <td className="py-4 px-6 text-center whitespace-nowrap">
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

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Modal */}
                            <button
                              onClick={() =>
                                setDetailModal({
                                  isOpen: true,
                                  nomineeId: nominee.id,
                                  initialData: nominee
                                })
                              }
                              title="Inspect Nominee Details"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-all cursor-pointer active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            {/* Quick Approve (if pending) */}
                            {status === 'pending' && (
                              <button
                                onClick={() => handleQuickApprove(nominee)}
                                disabled={isActing}
                                title="Quick Approve Nominee"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {isActing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                              </button>
                            )}

                            {/* Quick Reject (if pending) */}
                            {status === 'pending' && (
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
                                title="Quick Reject Nominee"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && filteredNominees.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredNominees.length)} of {filteredNominees.length} nominees
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
                  Reject Nominee Application
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectModal.nominee?.nominee_name} (Member: {rejectModal.nominee?.member_name})
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
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={255}
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((prev) => ({ ...prev, reason: e.target.value, error: null }))
                }
                placeholder="Specify the reason why this nominee was rejected (e.g. document mismatch)..."
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
                Cancel
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
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
