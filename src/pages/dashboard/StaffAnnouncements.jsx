import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { AnnouncementDetailModal } from '../../components/dashboard/AnnouncementModals';
import { getStaffAnnouncements } from '../../services/announcementService';
import { getStaffMe } from '../../services/branchStaffService';
import {
  Megaphone,
  Bell,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import noticeIllustration from '../../assets/Glossy Banking Notice Collection.png';

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

export default function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    announcement: null,
  });

  const [staffUser, setStaffUser] = useState(() => {
    try {
      const u = localStorage.getItem('staff_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const fetchStaffData = async () => {
    try {
      const data = await getStaffMe();
      if (data) {
        setStaffUser(data);
        localStorage.setItem('staff_user', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Could not refresh staff profile:', e);
    }
  };

  const fetchAnnouncements = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getStaffAnnouncements({
        limit: 100,
        search: searchQuery
      });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch staff announcements error:', err);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load announcements targeted for your staff role.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    fetchAnnouncements();
  }, []);

  // Filter announcements locally if searching
  const filteredAnnouncements = announcements.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const t = (a.title || '').toLowerCase();
    const m = (a.message || '').toLowerCase();
    return t.includes(q) || m.includes(q);
  });

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => a.is_active !== false).length;
  const staffRoleTitle = staffUser?.staff_role?.name || staffUser?.role || 'Staff Member';

  return (
    <DashboardLayout role="staff" activeTab="announcements">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl relative z-10">
            {/* Context Pills */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-teal-200/60 shadow-2xs text-xs font-semibold text-teal-800 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-teal-900 font-bold">
                <Users className="w-3.5 h-3.5 text-[#00b4a7]" />
                Role: {staffRoleTitle}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {staffUser?.branch?.name || staffUser?.branch_name || 'Society Branch'}
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Desk Feed
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                Staff Circulars & Notices
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              Official operational guidelines, regulatory circulars, and departmental directives targeted to your assigned staff role across all branch desks.
            </p>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={noticeIllustration}
              alt="Notice Collection"
              className="h-36 sm:h-48 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none"
            />
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
          </div>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Total Role Notices"
            value={totalCount}
            subtitle={`Targeted to ${staffRoleTitle}`}
            icon={Megaphone}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Active Directives"
            value={activeCount}
            subtitle="Currently In Effect"
            icon={CheckCircle2}
            badge="Verified Directives"
          />
          <StatCard
            title="Broadcast Channel"
            value="Super Admin Feed"
            subtitle="Central Apex Authority"
            icon={Bell}
            trend="Instant Updates"
            trendType="up"
          />
        </div>

        {/* Main Announcements Table Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Staff Role Noticeboard
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Notices broadcasted to your department &amp; assigned role
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search notices by title or content..."
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

              <button
                onClick={() => fetchAnnouncements(true)}
                disabled={refreshing}
                title="Refresh announcements"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
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
                  <p className="text-sm font-bold text-red-900">Failed to load staff announcements</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchAnnouncements()}
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
                <p className="text-sm text-slate-500 font-medium">Checking notice registry for your staff role...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching announcements found' : 'No announcements logged for your role'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try modifying your search term or clear the filter.'
                      : `When Superadmin issues notices targeted to ${staffRoleTitle}, they will immediately appear on this desk.`}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Notice Title</th>
                    <th className="py-3.5 px-6">Circular Preview</th>
                    <th className="py-3.5 px-6">Published At</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedAnnouncements.map((item) => {
                    const isActive = item.is_active !== false;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Title */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0f766e] flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                              <Megaphone className="w-5 h-5 text-[#00b4a7]" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                                {item.title}
                              </div>
                              <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mt-0.5 inline-block">
                                #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Circular Preview */}
                        <td className="py-4 px-6 max-w-md">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        </td>

                        {/* Published Date */}
                        <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatDateTime(item.created_at)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Active' : 'Archived'}
                          </span>
                        </td>

                        {/* Action - View Full Notice */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, announcement: item })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Read Notice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && filteredAnnouncements.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} notices
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
      <AnnouncementDetailModal
        isOpen={detailModal.isOpen}
        announcement={detailModal.announcement}
        onClose={() => setDetailModal({ isOpen: false, announcement: null })}
      />
    </DashboardLayout>
  );
}
