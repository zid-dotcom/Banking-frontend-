import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Globe,
  CheckCircle,
  LogOut,
  CheckCheck,
  Check,
  Loader2,
  X
} from 'lucide-react';
import { SOCIETY_INFO } from '../../data/societyData';
import {
  getMemberNotifications,
  getMemberUnreadCount,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/memberService';

function formatNotificationText(text) {
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

export default function DashboardHeader({
  role = 'member',
  user = {},
  onMenuToggle
}) {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [memberNotifications, setMemberNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (role === 'member') {
      getMemberUnreadCount()
        .then((c) => setUnreadCount(typeof c === 'number' ? c : 0))
        .catch(() => {});
    }
  }, [role]);

  const loadMemberNotes = async () => {
    if (role !== 'member') return;
    setLoadingNotes(true);
    try {
      const data = await getMemberNotifications({ limit: 10 });
      setMemberNotifications(Array.isArray(data) ? data : []);
      const c = await getMemberUnreadCount();
      setUnreadCount(typeof c === 'number' ? c : 0);
    } catch (err) {
      console.warn('loadMemberNotes error:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleToggleNotes = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next && role === 'member') {
      loadMemberNotes();
    }
  };

  const handleMarkOne = async (id) => {
    if (!id) return;
    try {
      await markNotificationRead(id);
      setMemberNotifications((prev) =>
        prev.map((n) => ((n.id || n.notification_id) === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setMemberNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_expired_message');

    if (role === 'member') {
      localStorage.removeItem('member_token');
      localStorage.removeItem('member_user');
      navigate('/member-login');
    } else if (role === 'branch_manager') {
      localStorage.removeItem('branch_token');
      localStorage.removeItem('branch_user');
      navigate('/branch-manager-login');
    } else {
      navigate('/super-admin/login');
    }
  };

  const notifications = [
    { id: 1, title: 'Dividend Credited', desc: 'Annual society share dividend of ₹1,850 credited.', time: '2h ago' },
    { id: 2, title: 'KYC Verified', desc: 'Your agrarian membership ledger is completely updated.', time: '1d ago' },
    { id: 3, title: 'Quarterly Audit Note', desc: 'Statutory inspection report uploaded for members.', time: '3d ago' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[78px] sm:min-h-[86px] lg:min-h-[92px] flex items-center justify-between gap-3 sm:gap-4">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="hidden sm:block">
          <p className="text-[11px] sm:text-xs font-bold text-[#0d9488] uppercase tracking-wider">
            {SOCIETY_INFO.shortName} Multi-State Cooperative
          </p>
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-snug mt-0.5">
            Welcome back, <span className="text-[#0d9488]">{role === 'super_admin' ? (user.name || 'Super Admin') : (user.name?.split(' ')[0] || 'User')}</span>
          </h2>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account no, folio, or transaction..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2dd4bf] focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile & TOP-RIGHT LOGOUT BUTTON */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Visit public site link */}
        <Link
          to="/"
          title="Back to Public Website"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>Website</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={handleToggleNotes}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 relative cursor-pointer transition-colors flex items-center justify-center"
            aria-label="Notifications"
          >
            <div className="relative inline-flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-600" />
              {role === 'member' ? (
                unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center shadow-xs pointer-events-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )
              ) : (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2dd4bf] rounded-full ring-2 ring-white" />
              )}
            </div>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-[350px] sm:w-[430px] bg-white rounded-3xl shadow-2xl border border-slate-100 py-3.5 z-50 animate-fadeIn">
              {/* Dropdown Header */}
              <div className="px-4 sm:px-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">Notifications</span>
                  {role === 'member' && (
                    <span className="text-[11px] font-bold text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60 shadow-2xs">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {role === 'member' && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAll}
                      className="text-xs text-teal-700 hover:text-teal-900 hover:underline font-bold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dropdown Notification Stream */}
              <div className="divide-y divide-slate-100 max-h-80 sm:max-h-96 overflow-y-auto">
                {role === 'member' ? (
                  loadingNotes ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto" />
                      <span className="text-xs font-medium">Loading alerts...</span>
                    </div>
                  ) : memberNotifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      No notifications logged.
                    </div>
                  ) : (
                    memberNotifications.map((n) => {
                      const id = n.id || n.notification_id;
                      const isRead = n.is_read === true || n.read === true || n.status === 'read';
                      return (
                        <div
                          key={id || Math.random()}
                          className={`p-3.5 sm:p-4 transition-colors ${
                            !isRead ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs sm:text-sm leading-snug ${!isRead ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {formatNotificationText(n.title || n.subject || 'Member Alert')}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!isRead ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Unread
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkOne(id);
                                    }}
                                    title="Mark as read"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200/80 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 text-teal-600" />
                                    <span>Mark read</span>
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Read
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                            {formatNotificationText(n.message || n.description || n.desc)}
                          </p>
                        </div>
                      );
                    })
                  )
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))
                )}
              </div>

              {role === 'member' && (
                <div className="pt-2.5 px-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/member/notifications');
                    }}
                    className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold text-center block transition-colors cursor-pointer border border-teal-200/60"
                  >
                    View All Notifications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Pill */}
        <div
          onClick={() => {
            if (role === 'member') {
              navigate('/member/profile');
            }
          }}
          className={`flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 ${
            role === 'member'
              ? 'cursor-pointer hover:opacity-90 group transition-all'
              : ''
          }`}
          title={role === 'member' ? 'View My Full Profile' : ''}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-teal-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
            {user.avatarText || (role === 'super_admin' ? 'SA' : 'U')}
          </div>
          <div className="hidden lg:block text-left leading-none">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[130px] group-hover:text-teal-700 transition-colors">
              {user.name || (role === 'super_admin' ? 'Super Admin' : 'User')}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle className="w-2.5 h-2.5" />
              {user.role || (role === 'super_admin' ? 'Super Admin' : 'Verified')}
            </span>
          </div>
        </div>

        {/* TOP RIGHT LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          title="Sign out of portal"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs sm:text-sm font-bold border border-rose-200/70 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
