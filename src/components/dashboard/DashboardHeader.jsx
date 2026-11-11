import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Globe,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { SOCIETY_INFO } from '../../data/societyData';

export default function DashboardHeader({
  role = 'member',
  user = {},
  onMenuToggle
}) {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    if (role === 'member') navigate('/member-login');
    else if (role === 'branch_manager') navigate('/branch-manager-login');
    else navigate('/super-admin/login');
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
            Welcome back, <span className="text-[#0d9488]">{user.name?.split(' ')[0] || 'User'}</span>
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
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 relative cursor-pointer transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#2dd4bf] rounded-full ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-fadeIn">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
                  3 unread
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <p className="text-xs font-bold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-teal-500/20 flex-shrink-0">
            {user.avatarText || 'U'}
          </div>
          <div className="hidden lg:block text-left leading-none">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
              {user.name || 'Demo User'}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle className="w-2.5 h-2.5" />
              Verified
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
