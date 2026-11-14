import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  PlusCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Percent,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Landmark,
  PiggyBank
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import fdMisSchemeService from '../../services/fdMisSchemeService';
import {
  FdMisSchemeFormModal,
  FdMisSchemeDetailModal,
  FdMisSchemeDeleteModal
} from '../../components/dashboard/FdMisSchemeModals';
import mintFdMisIllustration from '../../assets/Mint FD & MIS Investment Growth.webp';

export default function SuperAdminFdMisSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modals State
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
    isDeleting: false,
  });

  // Action status loading tracker (for toggle switch)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Popups
  const [successPopup, setSuccessPopup] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchSchemes = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await fdMisSchemeService.getFdMisSchemes({ limit: 100 });
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch FD/MIS schemes:', err);
      setError(err.message || 'Unable to retrieve FD/MIS schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleCreateOpen = () => {
    setFormModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false,
    });
  };

  const handleEditOpen = (scheme) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      data: scheme,
      isSubmitting: false,
    });
  };

  const handleFormSubmit = async (formData) => {
    setFormModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (formModal.mode === 'create') {
        const res = await fdMisSchemeService.createFdMisScheme(formData);
        setFormModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
        setSuccessPopup({
          title: 'FD / MIS Scheme Created',
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" (${res?.scheme_code || formData.scheme_code}) was successfully created and registered.`
        });
      } else {
        const schemeId = formModal.data?.id;
        const res = await fdMisSchemeService.updateFdMisScheme(schemeId, formData);
        setFormModal({ isOpen: false, mode: 'edit', data: null, isSubmitting: false });
        setSuccessPopup({
          title: 'FD / MIS Scheme Updated',
          message: `Scheme "${res?.scheme_name || formData.scheme_name}" has been updated.`
        });
      }
      await fetchSchemes(true);
    } catch (err) {
      console.error('FD/MIS scheme form submit error:', err);
      setErrorPopup({
        title: formModal.mode === 'create' ? 'Failed to Create Scheme' : 'Failed to Update Scheme',
        message: err.message || 'The server rejected this request. Please review the inputs and try again.'
      });
      setFormModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleToggleStatus = async (scheme) => {
    const newStatus = !scheme.is_active;
    setActionLoadingId(scheme.id);
    try {
      await fdMisSchemeService.changeFdMisSchemeStatus(scheme.id, newStatus);
      setSchemes((prev) =>
        prev.map((s) => (s.id === scheme.id ? { ...s, is_active: newStatus } : s))
      );
      setSuccessPopup({
        title: 'Status Updated',
        message: `Scheme "${scheme.scheme_name}" is now ${newStatus ? 'Active' : 'Inactive'}.`
      });
    } catch (err) {
      console.error('Failed to change status:', err);
      setErrorPopup({
        title: 'Status Change Failed',
        message: err.message || 'Unable to update scheme operational status.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async (scheme) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await fdMisSchemeService.deleteFdMisScheme(scheme.id);
      setDeleteModal({ isOpen: false, scheme: null, isDeleting: false });
      setSuccessPopup({
        title: 'Scheme Deleted',
        message: `Scheme "${scheme.scheme_name}" has been removed.`
      });
      await fetchSchemes(true);
    } catch (err) {
      console.error('Failed to delete scheme:', err);
      setErrorPopup({
        title: 'Delete Failed',
        message: err.message || 'Unable to delete this FD/MIS scheme.'
      });
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Filter schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
        (s.scheme_code && s.scheme_code.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [schemes, searchQuery, statusFilter]);

  // Metric computations
  const totalCount = schemes.length;
  const activeCount = schemes.filter((s) => s.is_active).length;
  const maxInterest = schemes.reduce((max, s) => {
    const rate = Number(s.annual_interest_rate) || 0;
    return rate > max ? rate : max;
  }, 0);
  const minDeposit = schemes.reduce((min, s) => {
    const amt = Number(s.minimum_fd_mis_amount) || 0;
    if (min === null) return amt;
    return amt < min ? amt : min;
  }, null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
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

  // Pagination slice
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = filteredSchemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout role="super_admin" activeTab="fd_mis_schemes">
      <div className="space-y-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: <strong className="font-bold text-teal-950">Super Admin</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">Term Deposit &amp; MIS Policy</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Cooperative FD &amp; MIS Term Schemes
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Manage fixed deposit accounts, track monthly income schemes (MIS), configure annual yield matrices, and handle lock-in intervals.
            </p>
          </div>

          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={mintFdMisIllustration}
              alt="Mint FD & MIS Investment Growth"
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
            title="Total FD / MIS Schemes"
            value={totalCount.toString()}
            subtitle="Registered Term Products"
            icon={Coins}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Active Deposit Schemes"
            value={activeCount.toString()}
            subtitle="Ready for Members"
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% active` : '100%'}
            trendType="up"
          />
          <StatCard
            title="Max Annual Yield"
            value={`${maxInterest}%`}
            subtitle="Highest Term Yield p.a."
            icon={TrendingUp}
            trend="Per Annum"
            trendType="neutral"
          />
          <StatCard
            title="Min Investment Scheme"
            value={minDeposit !== null ? formatCurrency(minDeposit) : '₹0'}
            subtitle="Minimum Opening Deposit"
            icon={PiggyBank}
            trend="Base Entry"
            trendType="neutral"
          />
        </div>

        {/* Schemes Management Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Table Header Filter & Action Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Term Deposit &amp; MIS Schemes Directory
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive catalogue of term fixed deposits and regular payout instruments
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scheme name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => fetchSchemes(true)}
                disabled={refreshing}
                title="Refresh schemes catalogue"
                className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Create Scheme Button */}
              <button
                onClick={handleCreateOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create FD / MIS Scheme</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load FD/MIS schemes</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchSchemes()}
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
                <p className="text-sm text-slate-500 font-medium">Loading FD / MIS schemes...</p>
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching schemes found' : 'No FD / MIS schemes configured yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'Define term deposit products with lock-in duration, annual interest yield, and payout schedules.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={handleCreateOpen}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create First FD / MIS Scheme
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Scheme Name</th>
                    <th className="py-3.5 px-6">Scheme Code</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Annual Yield</th>
                    <th className="py-3.5 px-6">Min Deposit</th>
                    <th className="py-3.5 px-6">Payout Frequency</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Minimum Deposit Period</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedSchemes.map((scheme) => (
                    <tr
                      key={scheme.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* Scheme Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            <Coins className="w-5 h-5 text-[#00b4a7]" />
                          </div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                            {scheme.scheme_name}
                          </div>
                        </div>
                      </td>

                      {/* Scheme Code */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                          {scheme.scheme_code}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-6 whitespace-nowrap font-bold font-sans text-slate-800">
                        {scheme.tenure_value} <span className="text-xs text-slate-500 font-medium capitalize">{scheme.tenure_unit || 'months'}</span>
                      </td>

                      {/* Annual Yield */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold font-sans text-teal-900 text-sm">
                          {scheme.annual_interest_rate}% <span className="text-xs text-slate-400 font-medium">p.a.</span>
                        </div>
                      </td>

                      {/* Min Deposit */}
                      <td className="py-4 px-6 font-bold font-sans text-slate-800 whitespace-nowrap">
                        {formatCurrency(scheme.minimum_fd_mis_amount)}
                      </td>

                      {/* Payout Frequency */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {(scheme.interest_payout_type || 'cumulative_yearly').replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Minimum Deposit Period */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs font-bold text-slate-700">
                        {scheme.fd_mis_lock_in_period_months ? `${scheme.fd_mis_lock_in_period_months} Months` : 'None'}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(scheme.created_at)}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(scheme)}
                          disabled={actionLoadingId === scheme.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            scheme.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          } ${actionLoadingId === scheme.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={`Click to ${scheme.is_active ? 'deactivate' : 'activate'} this scheme`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              scheme.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <div className="text-[10px] font-bold mt-1">
                          {scheme.is_active ? (
                            <span className="text-emerald-700">Active</span>
                          ) : (
                            <span className="text-slate-400">Inactive</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, scheme })}
                            title="View Scheme Details"
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditOpen(scheme)}
                            title="Edit Scheme"
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, scheme, isDeleting: false })}
                            title="Delete Scheme"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredSchemes.length > itemsPerPage && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredSchemes.length)} of {filteredSchemes.length} schemes
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <FdMisSchemeFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.data}
        isSubmitting={formModal.isSubmitting}
        onClose={() => setFormModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Modal */}
      <FdMisSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
        onEditClick={(scheme) => handleEditOpen(scheme)}
        onDeleteClick={(scheme) => setDeleteModal({ isOpen: true, scheme, isDeleting: false })}
      />

      {/* Delete Confirmation Modal */}
      <FdMisSchemeDeleteModal
        isOpen={deleteModal.isOpen}
        scheme={deleteModal.scheme}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, scheme: null, isDeleting: false })}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success Notification Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{successPopup.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{successPopup.message}</p>
            </div>
            <button
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{errorPopup.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{errorPopup.message}</p>
            </div>
            <button
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

