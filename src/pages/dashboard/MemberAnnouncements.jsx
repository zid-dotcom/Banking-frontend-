import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { AnnouncementDetailModal } from '../../components/dashboard/AnnouncementModals';
import { getMemberAnnouncements, getMemberMe } from '../../services/memberService';
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
  Radio,
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

export default function MemberAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    announcement: null,
  });

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

  // Fetch Member Announcements (GET /member/announcements)
  const fetchAnnouncements = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberAnnouncements({ limit: 100 });
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.warn('Fetch member announcements error:', err.message);
      if (err.message && err.message.toLowerCase().includes('token is expired')) {
        return;
      }
      setError(err.message || 'Failed to load society announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filtering
  const filteredAnnouncements = announcements.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = !q || (a.title || '').toLowerCase().includes(q);
    const msgMatch = !q || (a.message || '').toLowerCase().includes(q);
    return titleMatch || msgMatch;
  });

  // Computed Metrics
  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => a.is_active !== false).length;

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="announcements"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Megaphone className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Official Society Notices &amp; Broadcasts</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Bulletin
              </span>
            </div>

            {/* Title with teal bar */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                Society Announcements
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              Stay up-to-date with official cooperative circulars, annual general meetings (AGM), dividend distributions, festival loan drives, and policy revisions.
            </p>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={noticeIllustration}
              alt="Society Announcements Notice Collection"
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
            title="Total Notices"
            value={totalCount}
            subtitle="Published by Cooperative Board"
            icon={Megaphone}
            trend={`${activeCount} active`}
            trendType="up"
          />
          <StatCard
            title="Active Notices"
            value={activeCount}
            subtitle="Current In-Effect Notices"
            icon={CheckCircle2}
            badge="Verified Circulars"
          />
          <StatCard
            title="Notification Channel"
            value="Official"
            subtitle="Direct Member Feed"
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
                  Notice Board &amp; Official Circulars
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Browse announcements published by apex society management
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search announcements..."
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
                  <p className="text-sm font-bold text-red-900">Failed to load announcements</p>
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
                <p className="text-sm text-slate-500 font-medium">Loading society notices...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery ? 'No matching announcements found' : 'No announcements published yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? 'Try adjusting your search keywords.'
                      : 'Society broadcasts and circulars will be displayed here once posted.'}
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Notice ID</th>
                    <th className="py-3.5 px-6">Announcement Title &amp; Details</th>
                    <th className="py-3.5 px-6">Published Date</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedAnnouncements.map((item) => {
                    const noticeId = item.id || item.announcement_id || 'ANN-01';
                    const isActive = item.is_active !== false;

                    return (
                      <tr
                        key={noticeId}
                        className="hover:bg-teal-50/20 transition-colors group"
                      >
                        {/* Notice ID */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-2xs">
                            #{noticeId}
                          </span>
                        </td>

                        {/* Title & Message */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors line-clamp-1 max-w-md">
                            {item.title}
                          </div>
                          {item.message && (
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-md mt-0.5">
                              {item.message}
                            </p>
                          )}
                        </td>

                        {/* Published Date */}
                        <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {formatDateTime(item.created_at || item.date)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Published' : 'Archived'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDetailModal({ isOpen: true, announcement: item })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200/60 shadow-2xs"
                            title="Read complete announcement"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />
                            <span>Read Notice</span>
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
          {filteredAnnouncements.length > itemsPerPage && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)}
                </span>{' '}
                of <span className="font-bold text-slate-800">{filteredAnnouncements.length}</span> notices
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

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={detailModal.isOpen}
        announcement={detailModal.announcement}
        onClose={() => setDetailModal({ isOpen: false, announcement: null })}
      />
    </DashboardLayout>
  );
}
