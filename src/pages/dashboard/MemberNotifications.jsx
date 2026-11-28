import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  getMemberNotifications,
  getMemberUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
  getMemberMe,
  getMemberServiceRequest,
  getMemberServiceRequests
} from '../../services/memberService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import { ServiceRequestDetailModal } from '../../components/dashboard/ServiceRequestModals';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  CheckCheck,
  Check,
  Filter,
  ShieldCheck,
  X,
  Mail,
  Coins,
  CreditCard,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import friendlySupportIllustration from '../../assets/Friendly Service Request Support Illustration.png';

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

export function formatNotificationText(text) {
  if (!text || typeof text !== 'string') return text || '';
  if (/\b(?:A\s+)?branch\s+(?:administrator|admin)\b/i.test(text)) {
    return text
      .replace(/\b(?:A\s+)?branch\s+(?:administrator|admin)\s+replied\b/gi, 'Branch Administrator replied')
      .replace(/\b(?:A\s+)?branch\s+(?:administrator|admin)\b/gi, 'Branch Administrator');
  }
  return text
    .replace(/\b(?:An\s+)?super\s+(?:administrator|admin)\s+replied\b/gi, 'Main Administrator replied')
    .replace(/\b(?:An\s+)?administrator\s+replied\b/gi, 'Main Administrator replied')
    .replace(/\bAn\s+admin\s+replied\b/gi, 'Main Administrator replied')
    .replace(/\b(?:An\s+)?super\s+(?:administrator|admin)\b/gi, 'Main Administrator')
    .replace(/\bAn\s+administrator\b/gi, 'Main Administrator');
}

export default function MemberNotifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState(null);

  // Service Request Detail Modal state
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    request: null,
    loading: false
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'read'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      .catch((err) => {
        if (isTokenExpiredError(null, err?.message)) {
          handleAuthExpired('member');
        }
      });
  }, []);

  // Fetch Notifications & Unread Count
  const fetchAllNotifications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [listData, countData] = await Promise.all([
        getMemberNotifications({ limit: 100 }),
        getMemberUnreadCount()
      ]);

      if (Array.isArray(listData)) {
        setNotifications(listData);
      } else {
        setNotifications([]);
      }
      const finalCount = typeof countData === 'number' ? countData : 0;
      setUnreadCount(finalCount);
      notifyNotificationsUpdated(finalCount);
    } catch (err) {
      console.warn('Fetch notifications error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('member');
        return;
      }
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();

    const handleNotificationsUpdated = (e) => {
      if (typeof e?.detail?.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      }
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT || 'member-notifications-updated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT || 'member-notifications-updated', handleNotificationsUpdated);
    };
  }, []);

  // Mark single as read (PATCH /member/notifications/{id}/read)
  const handleMarkAsRead = async (id) => {
    if (!id || markingId) return;
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      let nextUnread;
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          ((n.id || n.notification_id) === id ? { ...n, is_read: true } : n)
        );
        nextUnread = updated.filter(
          (n) => !(n.is_read === true || n.read === true || n.status === 'read')
        ).length;
        return updated;
      });
      setUnreadCount((c) => {
        const next = typeof nextUnread === 'number' ? nextUnread : Math.max(0, c - 1);
        notifyNotificationsUpdated(next);
        return next;
      });
    } catch (err) {
      console.warn('Mark notification read error:', err);
    } finally {
      setMarkingId(null);
    }
  };

  // Mark all as read (PATCH /member/notifications/read-all)
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      notifyNotificationsUpdated(0);
    } catch (err) {
      console.warn('Mark all read error:', err);
      alert(err.message || 'Failed to mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  // Handle View Replies for Service Request Notifications
  const handleViewReplies = async (item) => {
    const isUnread = !(item.is_read === true || item.read === true || item.status === 'read');
    if (isUnread) {
      handleMarkAsRead(item.id || item.notification_id);
    }

    let targetId =
      item.service_request_id ||
      item.request_id ||
      item.ticket_id ||
      (item.data && (item.data.service_request_id || item.data.request_id)) ||
      (item.metadata && (item.metadata.service_request_id || item.metadata.request_id));

    setDetailModal({
      isOpen: true,
      request: {
        id: targetId || '',
        subject: item.title || item.subject || 'Service Request',
        message: item.message || ''
      },
      loading: true
    });

    try {
      // If targetId is not directly in the notification object, match against recent service requests
      if (!targetId) {
        const allRequests = await getMemberServiceRequests({ limit: 100 }).catch(() => []);
        if (Array.isArray(allRequests) && allRequests.length > 0) {
          const msg = `${item.title || ''} ${item.message || ''}`;
          const matchQuote = msg.match(/['"]([^'"]+)['"]/);
          const quotedSubject = matchQuote ? matchQuote[1].trim().toLowerCase() : '';

          const matched = allRequests.find((r) => {
            if (quotedSubject && r.subject && r.subject.trim().toLowerCase() === quotedSubject) return true;
            if (r.subject && msg.toLowerCase().includes(r.subject.toLowerCase())) return true;
            if (r.id && (msg.includes(`#${r.id}`) || msg.includes(`request ${r.id}`) || msg.includes(`ticket ${r.id}`))) return true;
            return false;
          });

          if (matched) {
            targetId = matched.id;
          } else if (allRequests.length === 1) {
            targetId = allRequests[0].id;
          }
        }
      }

      if (targetId) {
        const fullDetail = await getMemberServiceRequest(targetId);
        if (fullDetail) {
          setDetailModal((prev) => ({
            ...prev,
            request: fullDetail,
            loading: false
          }));
          return;
        }
      }

      setDetailModal((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      console.warn('Failed to load full service request details:', err);
      setDetailModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filtering
  const filteredNotifications = notifications.filter((n) => {
    const isRead = n.is_read === true || n.read === true || n.status === 'read';
    if (filterType === 'unread' && isRead) return false;
    if (filterType === 'read' && !isRead) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const title = (n.title || n.subject || '').toLowerCase();
    const message = (n.message || n.description || n.desc || '').toLowerCase();
    return title.includes(q) || message.includes(q);
  });

  const totalCount = notifications.length;
  const computedUnread = notifications.filter(
    (n) => !(n.is_read === true || n.read === true || n.status === 'read')
  ).length;
  const readCount = totalCount - computedUnread;

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="notifications"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Bell className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("memberNotifications.memberActivityAlertCenter", "Member Activity & Alert Center")}</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {memberUser.branch_name || 'Society Branch Alerts'}
              </span>
              {computedUnread > 0 && (
                <>
                  <span className="text-teal-300 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {computedUnread} {t("memberNotifications.unread", "Unread")}
                  </span>
                </>
              )}
            </div>

            {/* Title with teal bar */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2e2e] tracking-tight">
                {t("memberNotifications.notificationsAlerts", "Notifications & Alerts")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("memberNotifications.realTimeActivityLedgerFor", "Real-time activity ledger for your society deposit folios, loan EMI installments, share dividends, and branch service request updates.")}
            </p>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {computedUnread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{markingAll ? t("memberNotifications.markingAllRead", "Marking All Read...") : t("memberNotifications.markAllAsRead", "Mark All as Read")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0">
            <img
              src={friendlySupportIllustration}
              alt={t("memberNotifications.memberNotifications", "Member Notifications")}
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
            title={t("memberNotifications.totalNotifications", "Total Notifications")}
            value={totalCount}
            subtitle={t("memberNotifications.loggedFolioEvents", "Logged Folio Events")}
            icon={Bell}
            trend="Active Ledger"
            trendType="up"
          />
          <StatCard
            title={t("memberNotifications.unreadAlerts", "Unread Alerts")}
            value={computedUnread}
            subtitle={t("memberNotifications.awaitingAttention", "Awaiting Attention")}
            icon={Clock}
            badge={computedUnread > 0 ? `${computedUnread} Pending` : 'All Caught Up'}
          />
          <StatCard
            title={t("dashboardModule.branchOverview.read", "Read")}
            value={readCount}
            subtitle={t("memberNotifications.markedAsRead", "Marked as Read")}
            icon={CheckCircle2}
            trend={totalCount > 0 ? `${Math.round((readCount / totalCount) * 100)}% Read` : '100%'}
            trendType="up"
          />
        </div>

        {/* Notifications Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {t("memberNotifications.recentNotificationStream", "Recent Notification Stream")}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("memberNotifications.officialAlertsDeliveredBySociety", "Official alerts delivered by society branch operations")}
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Type Filter Buttons */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 text-xs font-bold text-slate-600">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {t("branchManagerCashReconciliation.all", "All (")}{totalCount})
                </button>
                <button
                  onClick={() => {
                    setFilterType('unread');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'unread'
                      ? 'bg-white text-rose-600 shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {t("memberNotifications.unread2", "Unread (")}{computedUnread})
                </button>
                <button
                  onClick={() => {
                    setFilterType('read');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'read'
                      ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {t("memberNotifications.read", "Read (")}{readCount})
                </button>
              </div>

              {/* Search */}
              <div className="relative min-w-[180px] sm:min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("memberNotifications.searchNotifications", "Search notifications...")}
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

              {/* Refresh */}
              <button
                onClick={() => fetchAllNotifications(true)}
                disabled={refreshing}
                title={t("memberNotifications.refreshNotifications", "Refresh notifications")}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Mark All Read Button */}
              {computedUnread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all border border-teal-200/80 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">{t("memberNotifications.markAllRead", "Mark All Read")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">{t("memberNotifications.failedToLoadNotifications", "Failed to load notifications")}</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchAllNotifications()}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer flex-shrink-0"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Notification List Container */}
          <div>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">{t("memberNotifications.checkingNotificationRegistry", "Checking notification registry...")}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {searchQuery
                      ? t("memberNotifications.noMatchingNotificationsFound", "No matching notifications found")
                      : filterType === 'unread'
                      ? t("memberNotifications.noUnreadNotifications", "No unread notifications")
                      : t("memberNotifications.noNotificationsLoggedYet", "No notifications logged yet")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {searchQuery
                      ? t("memberNotifications.tryAdjustingYourSearchQuery", "Try adjusting your search query or reset filter to All.")
                      : filterType === 'unread'
                      ? t("memberNotifications.youAreAllCaughtUp", "You are all caught up! There are no unread alerts.")
                      : t("memberNotifications.activityNotificationsRegardingYourAccount", "Activity notifications regarding your account will appear here.")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedNotifications.map((item) => {
  const { t } = useTranslation();
                  const id = item.id || item.notification_id || Math.random();
                  const isRead = item.is_read === true || item.read === true || item.status === 'read';
                  const isBeingMarked = markingId === id;

                  return (
                    <div
                      key={id}
                      className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${
                        !isRead ? 'bg-rose-50/20 hover:bg-rose-50/35' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Icon Indicator */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            !isRead
                              ? 'bg-rose-50 text-rose-600 border-rose-200/80 shadow-2xs'
                              : 'bg-emerald-50/70 text-emerald-600 border-emerald-200/70'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                        </div>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm tracking-tight ${
                                !isRead
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-semibold text-slate-700'
                              }`}
                            >
                              {formatNotificationText(item.title || item.subject || 'Member Alert')}
                            </h4>

                            {!isRead ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                {t("memberNotifications.unread", "Unread")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {t("dashboardModule.branchOverview.read", "Read")}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                            {formatNotificationText(item.message || item.description || item.desc || 'No additional details provided.')}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDateTime(item.created_at || item.date || item.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: View Replies & Mark as read button or Read status */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {Boolean(
                          item.service_request_id ||
                          item.request_id ||
                          item.ticket_id ||
                          item.category === 'service_request' ||
                          item.type === 'service_request' ||
                          (item.title && /service\s*request|support\s*ticket|reply/i.test(item.title)) ||
                          (item.message && /service\s*request|replied to|replied with|is now/i.test(item.message))
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReplies(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 shadow-2xs transition-all cursor-pointer"
                            title={t("memberNotifications.viewServiceRequestReplies", "View service request replies")}
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />
                            <span>{t("memberHelpdesk.viewReplies", "View Replies")}</span>
                          </button>
                        )}

                        {isRead ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs select-none">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t("dashboardModule.branchOverview.read", "Read")}</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(id);
                            }}
                            disabled={isBeingMarked}
                            title={t("memberNotifications.markAsRead", "Mark as read")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200/80 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">
                              {isBeingMarked ? t("branchManagerMemberPasswordUpdate.updating", "Updating...") : t("memberNotifications.markRead", "Mark read")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredNotifications.length > itemsPerPage && (
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                {t("common.showing", "Showing")}{' '}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                {t("common.to", "to")}{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredNotifications.length)}
                </span>{' '}
                {t("common.of", "of")} <span className="font-bold text-slate-800">{filteredNotifications.length}</span> {t("memberNotifications.alerts", "alerts")}
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

      {/* Service Request Detail & Replies Modal */}
      <ServiceRequestDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, request: null, loading: false })}
        request={detailModal.request}
        loading={detailModal.loading}
      />
    </DashboardLayout>
  );
}
