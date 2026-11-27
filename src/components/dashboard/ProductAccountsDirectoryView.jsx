import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Coins,
  TrendingUp,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Filter
} from 'lucide-react';
import {
  getBranchAdminInvestmentAccounts,
  getBranchAdminFdMisAccounts,
  getAccountantInvestmentAccounts,
  getAccountantFdMisAccounts,
  getSuperAdminBranchInvestmentAccounts,
  getSuperAdminBranchFdMisAccounts
} from '../../services/productAccountService';
import { getBranches } from '../../services/branchService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
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

export default function ProductAccountsDirectoryView({
  role = 'branch_admin', // 'branch_admin' | 'accountant' | 'super_admin'
  productType = 'fd_mis', // 'fd_mis' | 'investment'
  title = null,
}) {
  const isInvestment = productType === 'investment';
  const isSuperAdmin = role === 'super_admin';

  const defaultTitle = isInvestment ? 'Investment Accounts Directory' : 'FD & MIS Accounts Directory';
  const displayTitle = title || defaultTitle;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Super Admin Branch State
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load branches for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      setLoadingBranches(true);
      getBranches()
        .then((bList) => {
          const list = Array.isArray(bList) ? bList : (bList?.items || []);
          setBranches(list);
          if (list.length > 0 && !selectedBranchId) {
            setSelectedBranchId(String(list[0].id));
          }
        })
        .catch((err) => {
          console.error('Failed to load branches for accounts directory:', err);
        })
        .finally(() => setLoadingBranches(false));
    }
  }, [isSuperAdmin]);

  // Fetch accounts based on role and productType
  const fetchAccounts = async (isBackground = false) => {
    if (isSuperAdmin && !selectedBranchId) return;

    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      let data = [];
      if (role === 'branch_admin') {
        if (productType === 'investment') {
          data = await getBranchAdminInvestmentAccounts();
        } else {
          data = await getBranchAdminFdMisAccounts();
        }
      } else if (role === 'accountant') {
        if (productType === 'investment') {
          data = await getAccountantInvestmentAccounts();
        } else {
          data = await getAccountantFdMisAccounts();
        }
      } else if (role === 'super_admin') {
        if (productType === 'investment') {
          data = await getSuperAdminBranchInvestmentAccounts(selectedBranchId);
        } else {
          data = await getSuperAdminBranchFdMisAccounts(selectedBranchId);
        }
      }
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Failed to load ${productType} accounts for ${role}:`, err);
      setError(err.message || 'Failed to load product accounts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [role, productType, selectedBranchId]);

  // Client search and filter
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (statusFilter !== 'all' && (acc.status || '').toLowerCase() !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const accNo = (acc.account_number || '').toLowerCase();
        const mName = (acc.member_name || '').toLowerCase();
        const mCode = (acc.member_code || '').toLowerCase();
        const mEmail = (acc.member_email || '').toLowerCase();
        const mMobile = (acc.member_mobile || '').toLowerCase();
        const sName = (acc.scheme_name || '').toLowerCase();
        const sCode = (acc.scheme_code || '').toLowerCase();
        const bName = (acc.branch_name || '').toLowerCase();

        return (
          accNo.includes(q) ||
          mName.includes(q) ||
          mCode.includes(q) ||
          mEmail.includes(q) ||
          mMobile.includes(q) ||
          sName.includes(q) ||
          sCode.includes(q) ||
          bName.includes(q)
        );
      }
      return true;
    });
  }, [accounts, statusFilter, searchQuery]);

  // Calculated Metrics
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + Number(a.balance || a.requested_principal || 0), 0);
  }, [accounts]);

  const activeCount = accounts.filter((a) => (a.status || '').toLowerCase() === 'active').length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-teal-200/80 shadow-2xs bg-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Total Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-teal-950 mt-1">{accounts.length}</h4>
          <p className="text-[10px] text-teal-600 mt-0.5">Approved &amp; active folios</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Portfolio Balance
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="text-xl font-black text-emerald-950 mt-1">{formatCurrency(totalBalance)}</h4>
          <p className="text-[10px] text-emerald-600 mt-0.5">Aggregated holding value</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Category</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              {isInvestment ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <Coins className="w-3.5 h-3.5 text-teal-600" />}
            </div>
          </div>
          <h4 className="text-xl font-black text-slate-900 mt-1 capitalize">
            {isInvestment ? 'Investment Folios' : 'FD & MIS Accounts'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isSuperAdmin && branches.length > 0
              ? `Branch: ${branches.find((b) => String(b.id) === String(selectedBranchId))?.name || 'Selected'}`
              : 'Branch operational accounts'}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{displayTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit of opened member product folios, balances, and operational status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Super Admin Branch Filter Selector */}
            {isSuperAdmin && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-xs font-bold text-slate-600">Branch:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={loadingBranches}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.branch_name} (#{b.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', 'active', 'awaiting_initial_funding'].map((st) => (
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
                  {st === 'awaiting_initial_funding' ? 'Funding Pending' : st}
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
                placeholder="Search account, member, scheme..."
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
            <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading product accounts...</p>
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
            <p className="text-sm font-bold text-slate-700 mb-1">No Product Accounts Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or status filter.'
                : `No active ${isInvestment ? 'investment' : 'FD / MIS'} accounts have been opened under this branch yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Account Number</th>
                  <th className="py-3.5 px-4">Member Code</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Scheme Code</th>
                  <th className="py-3.5 px-4">Scheme Name</th>
                  {isSuperAdmin && <th className="py-3.5 px-4">Branch</th>}
                  {!isInvestment && (
                    <>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Principal Amount</th>
                    </>
                  )}
                  <th className="py-3.5 px-4">Balance</th>
                  <th className="py-3.5 px-4">Opened Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAccounts.map((acc, idx) => {
                  const isFd = acc.product_type === 'fd_mis';
                  const bal = Number(acc.balance || acc.requested_principal || 0);
                  const isFundingPending = acc.status === 'awaiting_initial_funding';

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

                      {/* Member Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg text-xs">
                          {acc.member_code || `M-${acc.member_id}`}
                        </span>
                      </td>

                      {/* Member Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {acc.member_name || `Member #${acc.member_id}`}
                        </span>
                      </td>

                      {/* Member Email */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        {acc.member_email || '—'}
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-700">
                        {acc.member_mobile || '—'}
                      </td>

                      {/* Scheme Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
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
                          <span className="font-semibold text-slate-900 block">
                            {acc.scheme_name || 'Scheme'}
                          </span>
                        </div>
                      </td>

                      {/* Branch (Superadmin only) */}
                      {isSuperAdmin && (
                        <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                          {acc.branch_name || `Branch #${acc.branch_id}`}
                        </td>
                      )}

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
                            {acc.requested_principal
                              ? formatCurrency(Number(acc.requested_principal))
                              : '—'}
                          </td>
                        </>
                      )}

                      {/* Balance */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(bal)}
                      </td>

                      {/* Opened Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                        {formatDateTime(acc.opened_at)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isFundingPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFundingPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="capitalize">
                            {isFundingPending ? 'Funding Pending' : (acc.status || 'Active')}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAccount(acc)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View account details"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 capitalize">
                    {selectedAccount.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Member Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Holder (Member)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{selectedAccount.member_name}</span>
                    <span className="text-[10px] text-teal-700 font-mono font-semibold">
                      Code: {selectedAccount.member_code || `M-${selectedAccount.member_id}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700 block font-mono">{selectedAccount.member_mobile || '—'}</span>
                    <span className="text-slate-500 block truncate">{selectedAccount.member_email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Scheme & Branch Info */}
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
