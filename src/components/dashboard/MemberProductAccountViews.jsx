import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  Coins,
  TrendingUp,
  FileText,
  Landmark,
  ShieldCheck,
  Building2,
  Calendar,
  Wallet,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  getMemberProductAccountRequests,
  getMemberProductAccountRequest,
  getMemberProductAccounts
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

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/* =========================================================================
   1. MEMBER PRODUCT ACCOUNT REQUESTS TAB
   ========================================================================= */
export function MemberProductAccountRequestsTab({
  productType = 'fd_mis', // 'fd_mis' | 'investment'
  onApplyNew = null,
}) {
  const isInvestment = productType === 'investment';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Single Application Details Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    loading: false,
    request: null,
    error: null,
  });

  const fetchRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getMemberProductAccountRequests({
        status: statusFilter !== 'all' ? statusFilter : null,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load member product requests:', err);
      setError(err.message || 'Failed to load your applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Scoped to product_type
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
        const sName = (req.scheme_name || '').toLowerCase();
        const sCode = (req.scheme_code || '').toLowerCase();
        const accNo = (req.account?.account_number || '').toLowerCase();
        const reqId = String(req.id || '');
        return (
          sName.includes(q) ||
          sCode.includes(q) ||
          accNo.includes(q) ||
          reqId.includes(q)
        );
      }
      return true;
    });
  }, [scopedRequests, statusFilter, searchQuery]);

  // Counts
  const pendingCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
  const approvedCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = scopedRequests.filter((r) => (r.status || '').toLowerCase() === 'rejected').length;

  // View single application detail with GET /member/product-account-requests/{request_id}
  const handleViewDetail = async (req) => {
    setDetailModal({ isOpen: true, loading: true, request: req, error: null });
    try {
      const fullDetail = await getMemberProductAccountRequest(req.id);
      setDetailModal({
        isOpen: true,
        loading: false,
        request: fullDetail || req,
        error: null,
      });
    } catch (err) {
      console.error('Failed to fetch full application detail:', err);
      // Fallback to currently available item
      setDetailModal({
        isOpen: true,
        loading: false,
        request: req,
        error: null,
      });
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Applied</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-slate-900 mt-1">{scopedRequests.length}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Submitted scheme folios</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-amber-900 mt-1">{pendingCount}</h4>
          <p className="text-[10px] text-amber-600 mt-0.5">Awaiting branch decision</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-emerald-900 mt-1">{approvedCount}</h4>
          <p className="text-[10px] text-emerald-600 mt-0.5">Active opened folios</p>
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
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My {isInvestment ? 'Investment' : 'FD & MIS'} Applications
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track real-time status and review decisions for your submitted scheme applications
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
            <div className="relative w-full sm:w-56 md:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheme name or code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs font-medium"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchRequests(true)}
              disabled={loading || refreshing}
              className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading your applications...</p>
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
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or status filter.'
                : `You haven't submitted any ${isInvestment ? 'investment' : 'FD / MIS'} applications yet.`}
            </p>
            {onApplyNew && (
              <button
                type="button"
                onClick={onApplyNew}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Apply for a Scheme</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
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
                  <th className="py-3.5 px-4 text-right">Action</th>
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

                      {/* Scheme Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg text-xs">
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
                          <span className="font-bold text-slate-900 block">
                            {req.scheme_name || 'Scheme'}
                          </span>
                        </div>
                      </td>

                      {/* Account Number */}
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
                        <button
                          type="button"
                          onClick={() => handleViewDetail(req)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Application Detail Modal */}
      {detailModal.isOpen && detailModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-teal-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                  Application Folio #{detailModal.request.id}
                </span>
                <h4 className="font-serif font-bold text-slate-900 text-lg mt-1">
                  {detailModal.request.scheme_name}
                </h4>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, loading: false, request: null, error: null })}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  detailModal.request.status === 'approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : detailModal.request.status === 'rejected'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {detailModal.request.status === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : detailModal.request.status === 'rejected' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                  <div>
                    <span className="font-bold capitalize block">
                      Application {detailModal.request.status}
                    </span>
                    <span className="text-[10px] opacity-80">
                      Submitted on {formatDateTime(detailModal.request.created_at)}
                    </span>
                  </div>
                </div>
                {detailModal.request.reviewed_at && (
                  <span className="text-[10px] font-mono opacity-80">
                    Reviewed: {formatDate(detailModal.request.reviewed_at)}
                  </span>
                )}
              </div>

              {/* Account Opened Info (if approved) */}
              {detailModal.request.account && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-700 block">
                        Active Account Generated
                      </span>
                      <span className="font-mono font-bold text-base text-teal-950">
                        {detailModal.request.account.account_number}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block">Current Balance</span>
                      <span className="font-bold text-sm text-teal-950">
                        {formatCurrency(Number(detailModal.request.account.balance || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {detailModal.request.rejection_reason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block text-[10px] uppercase">Reason for Rejection:</span>
                  <p className="mt-1 font-medium">{detailModal.request.rejection_reason}</p>
                </div>
              )}

              {/* Scheme Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheme Code</span>
                  <span className="font-mono font-bold text-teal-900 text-xs">
                    {detailModal.request.scheme_code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Category</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {detailModal.request.product_type === 'investment' ? 'Investment Scheme' : 'FD / MIS Term'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Debit Savings A/C</span>
                  <span className="font-mono font-bold text-slate-900">
                    Account #{detailModal.request.savings_account_id}
                  </span>
                </div>
                {!isInvestment && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested Deposit</span>
                    <span className="font-bold text-slate-900">
                      {detailModal.request.requested_principal
                        ? formatCurrency(Number(detailModal.request.requested_principal))
                        : '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, loading: false, request: null, error: null })}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
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

/* =========================================================================
   2. MEMBER PRODUCT ACCOUNTS TAB (Accounts opened after approval)
   ========================================================================= */
export function MemberProductAccountsTab({
  productType = 'fd_mis', // 'fd_mis' | 'investment'
  onApplyNew = null,
}) {
  const isInvestment = productType === 'investment';
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // View Account Modal
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getMemberProductAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load member product accounts:', err);
      setError(err.message || 'Failed to load your accounts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter accounts by product_type
  const scopedAccounts = useMemo(() => {
    if (!productType) return accounts;
    return accounts.filter((a) => a.product_type === productType);
  }, [accounts, productType]);

  // Client search filter
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return scopedAccounts;
    const q = searchQuery.toLowerCase().trim();
    return scopedAccounts.filter((acc) => {
      const accNo = (acc.account_number || '').toLowerCase();
      const sName = (acc.scheme_name || '').toLowerCase();
      const sCode = (acc.scheme_code || '').toLowerCase();
      const bName = (acc.branch_name || '').toLowerCase();
      return (
        accNo.includes(q) ||
        sName.includes(q) ||
        sCode.includes(q) ||
        bName.includes(q)
      );
    });
  }, [scopedAccounts, searchQuery]);

  // Total balance / deposit
  const totalBalance = useMemo(() => {
    return scopedAccounts.reduce((sum, a) => sum + Number(a.balance || a.requested_principal || 0), 0);
  }, [scopedAccounts]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-teal-200/80 shadow-2xs bg-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Active Folios</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-teal-950 mt-1">{scopedAccounts.length}</h4>
          <p className="text-[10px] text-teal-600 mt-0.5">Approved &amp; active in branch</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Portfolio Balance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-emerald-950 mt-1">{formatCurrency(totalBalance)}</h4>
          <p className="text-[10px] text-emerald-600 mt-0.5">Aggregated holding value</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Scope</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-slate-900 mt-1 capitalize">
            {isInvestment ? 'Investment Plans' : 'FD & MIS Deposits'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Society verified folios</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active {isInvestment ? 'Investment' : 'FD & MIS'} Accounts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your approved accounts, folios, balances, and servicing branch records
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account #, scheme, branch..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs font-medium"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchAccounts(true)}
              disabled={loading || refreshing}
              className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Refresh accounts"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading active accounts...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 px-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => fetchAccounts()}
              className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Landmark className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">No Active Accounts</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'No matching accounts found for your search query.'
                : `You do not have any active ${isInvestment ? 'investment' : 'FD / MIS'} accounts yet. Submit an application from the schemes catalogue.`}
            </p>
            {onApplyNew && (
              <button
                type="button"
                onClick={onApplyNew}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Apply for a Scheme</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Account Number</th>
                  <th className="py-3.5 px-4">Scheme Code</th>
                  <th className="py-3.5 px-4">Scheme Name</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">{isInvestment ? 'Balance' : 'Principal / Balance'}</th>
                  <th className="py-3.5 px-4">Opened Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAccounts.map((acc, idx) => {
                  const isFd = acc.product_type === 'fd_mis';
                  const bal = Number(acc.balance || acc.requested_principal || 0);

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Row Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-500 text-xs">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Account Number */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          {acc.account_number}
                        </span>
                      </td>

                      {/* Scheme Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md text-[11px]">
                          {acc.scheme_code || '—'}
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
                          <span className="font-bold text-slate-900 block">
                            {acc.scheme_name || 'Scheme'}
                          </span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{acc.branch_name || `Branch #${acc.branch_id}`}</span>
                        </div>
                      </td>

                      {/* Balance / Principal */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(bal)}
                      </td>

                      {/* Opened Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                        {formatDateTime(acc.opened_at)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="capitalize">{acc.status || 'Active'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAccount(acc)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-teal-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                  Account Folio
                </span>
                <h4 className="font-serif font-bold text-slate-900 text-lg mt-1 font-mono">
                  {selectedAccount.account_number}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">Total Balance</span>
                  <span className="font-black text-xl text-teal-950">
                    {formatCurrency(Number(selectedAccount.balance || selectedAccount.requested_principal || 0))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span className="capitalize">{selectedAccount.status || 'Active'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheme Name</span>
                  <span className="font-bold text-slate-900 text-xs block">{selectedAccount.scheme_name}</span>
                  <span className="text-[10px] text-teal-700 font-mono font-semibold">{selectedAccount.scheme_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Serving Branch</span>
                  <span className="font-bold text-slate-900 block">{selectedAccount.branch_name || 'Society Branch'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Branch ID: #{selectedAccount.branch_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Debit Savings A/C</span>
                  <span className="font-mono font-bold text-slate-900">
                    Account #{selectedAccount.savings_account_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Opened Date</span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(selectedAccount.opened_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
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
