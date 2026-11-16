import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FileText,
  Users,
  Settings,
  LogOut,
  Building2,
  ShieldCheck,
  CreditCard,
  History,
  TrendingUp,
  Award,
  HelpCircle,
  X,
  UserCheck,
  PiggyBank,
  Coins,
  HeartHandshake,
  Megaphone,
  Bell,
  Headset,
  User,
  AlertOctagon
} from 'lucide-react';
import {
  getMemberUnreadCount
} from '../../services/memberService';
import {
  getBranchAdminEmergencyUnreadCount,
  getSuperadminEmergencyUnreadCount,
} from '../../services/emergencyService';

export default function DashboardSidebar({
  role = 'member',
  user = {},
  activeTab = 'overview',
  onTabChange,
  isOpen = false,
  onClose
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Role based navigation menus with dedicated page routes
  const roleNavItems = {
    member: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/member/dashboard' },
      { id: 'profile', label: 'My Profile', icon: User, path: '/member/profile' },
      { id: 'nominee', label: 'Nominee Details', icon: HeartHandshake, path: '/member/nominee' },
      { id: 'savings_schemes', label: 'Savings Schemes', icon: PiggyBank, path: '/member/savings-schemes' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/member/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/member/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/member/announcements' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/member/notifications' },
    ],
    branch_manager: [
      { id: 'overview', label: 'Branch Dashboard', icon: LayoutDashboard, path: '/branch-manager/dashboard' },
      { id: 'members', label: 'Branch Members', icon: Users, path: '/branch-manager/members' },
      { id: 'nominees', label: 'Branch Nominees', icon: HeartHandshake, path: '/branch-manager/nominees' },
      { id: 'staff', label: 'Branch Staff', icon: ShieldCheck, path: '/branch-manager/staff' },
      { id: 'savings_schemes', label: 'Savings Schemes', icon: PiggyBank, path: '/branch-manager/savings-schemes' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/branch-manager/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/branch-manager/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/branch-manager/announcements' },
      { id: 'service_requests', label: 'Service Requests', icon: Headset, path: '/branch-manager/service-requests' },
      { id: 'emergency_cases', label: 'Emergency Cases', icon: AlertOctagon, path: '/branch-manager/emergency-cases' },
    ],
    super_admin: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
      { id: 'branches', label: 'Branches', icon: Building2, path: '/super-admin/branches' },
      { id: 'branch_admins', label: 'Branch Manager', icon: UserCheck, path: '/super-admin/branch-admins' },
      { id: 'staff_roles', label: 'Staff Roles', icon: ShieldCheck, path: '/super-admin/staff-roles' },
      { id: 'savings_schemes', label: 'Savings Schemes', icon: PiggyBank, path: '/super-admin/savings-schemes' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/super-admin/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/super-admin/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/super-admin/announcements' },
      { id: 'service_requests', label: 'Service Requests', icon: Headset, path: '/super-admin/service-requests' },
      { id: 'emergency_cases', label: 'Emergency Cases', icon: AlertOctagon, path: '/super-admin/emergency-cases' },
      { id: 'member_base', label: 'View Members', icon: Users, path: '/super-admin/members' },
    ]
  };

  const currentNavItems = roleNavItems[role] || roleNavItems.member;

  const branchDisplayName =
    typeof user?.branch === 'string'
      ? user.branch
      : (user?.branch_name || user?.branch?.name || user?.branch?.branch_name || 'Society Branch');

  const roleLabels = {
    member: { title: 'Member Portal', badge: 'Active Member', color: 'bg-teal-50 text-[#0f766e]' },
    branch_manager: { title: 'Branch Manager', badge: branchDisplayName, color: 'bg-teal-50 text-[#0f766e]' },
    super_admin: { title: 'Super Admin', badge: 'Apex Society Authority', color: 'bg-teal-50 text-[#0f766e]' },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.member;

  // Member Notification Real-time Counter (for sidebar menu badge)
  const [unreadCount, setUnreadCount] = useState(0);
  const [emergencyUnreadCount, setEmergencyUnreadCount] = useState(0);

  // Poll / refresh unread count for member & emergency cases
  useEffect(() => {
    let isMounted = true;
    if (role === 'member') {
      getMemberUnreadCount()
        .then((count) => {
          if (isMounted) setUnreadCount(typeof count === 'number' ? count : 0);
        })
        .catch(() => {});
    } else if (role === 'branch_manager') {
      getBranchAdminEmergencyUnreadCount()
        .then((res) => {
          const count = typeof res === 'number' ? res : (res?.unread_count || 0);
          if (isMounted) setEmergencyUnreadCount(count);
        })
        .catch(() => {});
    } else if (role === 'super_admin') {
      getSuperadminEmergencyUnreadCount()
        .then((res) => {
          const count = typeof res === 'number' ? res : (res?.total_unread_count ?? res?.unread_count ?? 0);
          if (isMounted) setEmergencyUnreadCount(count);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [role, location.pathname]);

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

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 min-h-[78px] sm:min-h-[86px] lg:min-h-[92px] border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] flex items-center justify-center text-white shadow-sm shadow-teal-500/25">
              <Landmark className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-baseline leading-none">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Aurum</span>
                <span className="font-extrabold text-lg text-[#14b8a6] tracking-tight">FX</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                Co-operative Society
              </p>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Badge */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">{currentRoleInfo.title}</span>
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] ring-4 ring-teal-100" />
          </div>
          <p className="text-[11px] text-[#0f766e] font-semibold mt-0.5">{currentRoleInfo.badge}</p>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>

          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.path && location.pathname === item.path);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path && location.pathname !== item.path) {
                    navigate(item.path);
                  }
                  if (onTabChange) onTabChange(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white shadow-md shadow-teal-500/20'
                    : 'text-slate-600 hover:bg-teal-50/70 hover:text-[#0f766e]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'notifications' && role === 'member' && unreadCount > 0 && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-black rounded-full shadow-2xs ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
                {item.id === 'emergency_cases' && emergencyUnreadCount > 0 && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-black rounded-full shadow-2xs ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {emergencyUnreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {role !== 'super_admin' && role !== 'branch_manager' && (
            <>
              <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Support & Help
              </div>

              {role === 'member' ? (
                <button
                  onClick={() => {
                    navigate('/member/helpdesk');
                    if (onTabChange) onTabChange('helpdesk');
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    location.pathname === '/member/helpdesk' || location.pathname === '/member/service-requests' || activeTab === 'helpdesk'
                      ? 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white shadow-md shadow-teal-500/20'
                      : 'text-slate-600 hover:bg-teal-50/70 hover:text-[#0f766e]'
                  }`}
                >
                  <HelpCircle className={`w-4 h-4 ${
                    location.pathname === '/member/helpdesk' || location.pathname === '/member/service-requests' || activeTab === 'helpdesk'
                      ? 'text-white'
                      : 'text-slate-400'
                  }`} />
                  <span>Society Helpdesk</span>
                </button>
              ) : (
                <Link
                  to="/contact"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Society Helpdesk</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Profile & Bottom Logout Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div
            onClick={() => {
              if (role === 'member') {
                navigate('/member/profile');
                if (onClose) onClose();
              }
            }}
            className={`flex items-center gap-3 mb-3 p-1.5 -m-1.5 rounded-xl transition-colors ${
              role === 'member' ? 'hover:bg-teal-50/70 cursor-pointer group' : ''
            }`}
            title={role === 'member' ? 'View My Full Profile' : ''}
          >
            <div className="w-9 h-9 rounded-full bg-teal-50 text-[#0f766e] font-bold flex items-center justify-center text-sm border border-teal-200/60 group-hover:scale-105 transition-transform">
              {user.avatarText || (role === 'super_admin' ? 'SA' : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                {user.name || (role === 'super_admin' ? 'Super Admin' : 'Demo User')}
              </p>
              <p className="text-[11px] text-[#0d9488] font-bold truncate">
                {user.role || (role === 'super_admin' ? 'Super Admin' : user.id || 'Member')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
