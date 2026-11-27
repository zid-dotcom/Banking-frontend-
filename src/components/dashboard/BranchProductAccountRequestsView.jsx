import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  User,
  Landmark,
  IndianRupee,
  Calendar,
  Layers,
  Coins,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';
import {
  getBranchAdminProductAccountRequests,
  decideBranchAdminProductAccountRequest,
} from '../../services/productAccountService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
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
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function BranchProductAccountRequestsView({
  productType = null, // null (all) | 'fd_mis' | 'investment'
  title = 'Scheme Applications & Requests',
}) {
  const isInvestment = productType === 'investment';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [detailModal, setDetailModal] = useState({ isOpen: false, request: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null, reason: '' });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getBranchAdminProductAccountRequests({
        status: statusFilter !== 'all' ? statusFilter : null,
        search: searchQuery || undefined,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load branch product account requests:', err);
      setError(err.message || 'Failed to load branch scheme applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Filter by product_type if passed as prop
  const scopedRequests = useMemo(() => {
    if (!productType) return requests;
    return requests.filter((r) => r.product_type === productType);
  }, [requests, productType]);

  // Client search filter
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter((req) => {
      if (statusFilter !== 'all' && (req.status || '').toLowerCase() !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = (req.member_name || '').toLowerCase();
        const mCode = (req.member_code || '').toLowerCase();
        const mEmail = (req.member_email || '').toLowerCase();
        const mPhone = (req.member_mobile || '').toLowerCase();
        const sName = (req.scheme_name || '').toLowerCase();
        const sCode = (req.scheme_code || '').toLowerCase();
        const accNo = (req.account?.account_number || '').toLowerCase();
        const reqId = String(req.id || '');
        return (
          mName.includes(q) ||
          mCode.includes(q) ||
          mEmail.includes(q) ||
          mPhone.includes(q) ||
          sName.includes(q) ||
          sCode.includes(q) ||
          accNo.includes(q) ||
          reqId.includes(q)
        );
      }
      return true;
    });
  }, [scopedRequests, statusFilter, searchQuery]);

  // Metric counts
  const pendingCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
  const approvedCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'rejected').length;

  // Handle Approve
  const handleApprove = async (req) => {
    setActionLoadingId(req.id);
    try {
      await decideBranchAdminProductAccountRequest(req.id, { status: 'approved' });
      showToast(`Application #${req.id} for "${req.member_name || 'Member'}" approved successfully!`);
      await fetchRequests(true);
    } catch (err) {
      console.error('Approve application error:', err);
      alert(err.message || 'Failed to approve application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.request) return;

    setActionLoadingId(rejectModal.request.id);
    try {
      await decideBranchAdminProductAccountRequest(rejectModal.request.id, {
        status: 'rejected',
        rejection_reason: rejectModal.reason || null,
      });
      showToast(`Application #${rejectModal.request.id} rejected.`);
      setRejectModal({ isOpen: false, request: null, reason: '' });
      await fetchRequests(true);
    } catch (err) {
      console.error('Reject application error:', err);
      alert(err.message || 'Failed to reject application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-slate-900 mt-1">{scopedRequests.length}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Submitted scheme folios</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Action</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-amber-900 mt-1">{pendingCount}</h4>
          <p className="text-[10px] text-amber-600 mt-0.5">Awaiting branch review</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-emerald-900 mt-1">{approvedCount}</h4>
          <p className="text-[10px] text-emerald-600 mt-0.5">Folios active in branch</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-rose-900 mt-1">{rejectedCount}</h4>
          <p className="text-[10px] text-rose-600 mt-0.5">Declined applications</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and audit member scheme applications submitted under your branch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
    
            {/* Search Input */}
            <div className="relative w-full sm:w-56 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, scheme, folio..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchRequests(true)}
              disabled={loading || refreshing}
              className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading branch applications...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 px-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => fetchRequests()}
              className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">No Applications Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or status filter.'
                : 'No member scheme applications have been submitted for your branch yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Member Code</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Scheme Code</th>
                  <th className="py-3.5 px-4">Scheme Name</th>
                  <th className="py-3.5 px-4">Account Number</th>
                  {!isInvestment && (
                    <>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Principal Amount</th>
                    </>
                  )}
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRequests.map((req, idx) => {
                  const status = (req.status || 'pending').toLowerCase();
                  const isPending = status === 'pending';
                  const isApproved = status === 'approved';
                  const isRejected = status === 'rejected';
                  const isFd = req.product_type === 'fd_mis';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Row Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-500 text-xs">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Member Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg text-xs">
                          {req.member_code || `M-${req.member_id}`}
                        </span>
                      </td>

                      {/* Member Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {req.member_name || `Member #${req.member_id}`}
                        </span>
                      </td>

                      {/* Email Address */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        {req.member_email || '—'}
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-700">
                        {req.member_mobile || '—'}
                      </td>

                      {/* Scheme Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          {req.scheme_code || '—'}
                        </span>
                      </td>

                      {/* Scheme Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isFd ? (
                            <Coins className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-slate-900 block">
                            {req.scheme_name || 'Scheme'}
                          </span>
                        </div>
                      </td>

                      {/* Generated Account Number */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {req.account?.account_number ? (
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                            {req.account.account_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {!isInvestment && (
                        <>
                          {/* Type */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 inline-block">
                              {isFd ? 'FD / MIS Term' : 'Recurring Investment'}
                            </span>
                          </td>

                          {/* Principal Amount */}
                          <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                            {req.requested_principal
                              ? formatCurrency(Number(req.requested_principal))
                              : '—'}
                          </td>
                        </>
                      )}

                      {/* Submitted Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                        {formatDateTime(req.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPending ? 'bg-amber-500 animate-pulse' : isApproved ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                disabled={actionLoadingId === req.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                title="Approve scheme application"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectModal({ isOpen: true, request: req, reason: '' })}
                                disabled={actionLoadingId === req.id}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reject scheme application"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setDetailModal({ isOpen: true, request: req })}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Reject Application</h4>
                  <p className="text-xs text-slate-500 font-mono">#{rejectModal.request?.id}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModal({ isOpen: false, request: null, reason: '' })}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Explain why this scheme application is rejected..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, request: null, reason: '' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModal.request?.id}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-teal-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  Application Details
                </span>
                <h4 className="font-serif font-bold text-slate-900 text-lg mt-1">
                  #{detailModal.request.id} • {detailModal.request.scheme_name}
                </h4>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, request: null })}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant</span>
                  <span className="font-bold text-slate-900">{detailModal.request.member_name}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">{detailModal.request.member_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                  <span className="text-slate-700 block">{detailModal.request.member_email || '—'}</span>
                  <span className="text-slate-700 block">{detailModal.request.member_mobile || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheme Code</span>
                  <span className="font-bold text-teal-800 font-mono">{detailModal.request.scheme_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Type</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {detailModal.request.product_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Linked Savings A/C</span>
                  <span className="font-bold text-slate-900 font-mono">#{detailModal.request.savings_account_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested Principal</span>
                  <span className="font-bold text-slate-900">
                    {detailModal.request.requested_principal
                      ? formatCurrency(Number(detailModal.request.requested_principal))
                      : 'Scheduled Policy'}
                  </span>
                </div>
              </div>

              {detailModal.request.rejection_reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block text-[10px] uppercase">Rejection Reason:</span>
                  <p className="mt-0.5">{detailModal.request.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModal({ isOpen: false, request: null })}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
