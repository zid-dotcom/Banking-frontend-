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
  AlertOctagon,
  ShieldAlert,
  Calculator,
  Scale,
} from 'lucide-react';
import {
  getMemberUnreadCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from '../../services/memberService';
import {
  getBranchAdminEmergencyUnreadCount,
  getSuperadminEmergencyUnreadCount,
  EMERGENCY_UNREAD_UPDATED_EVENT,
} from '../../services/emergencyService';
import { getStaffCustomerServicePendingCount } from '../../services/serviceRequestService';

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
      { id: 'account_transactions', label: 'Account Transactions', icon: History, path: '/member/account-transactions' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/member/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/member/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/member/announcements' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/member/notifications' },
      { id: 'security_events', label: 'Security & Access', icon: ShieldCheck, path: '/member/security' },
    ],
    branch_manager: [
      { id: 'overview', label: 'Branch Dashboard', icon: LayoutDashboard, path: '/branch-manager/dashboard' },
      { id: 'members', label: 'Branch Members', icon: Users, path: '/branch-manager/members' },
      { id: 'nominees', label: 'Branch Nominees', icon: HeartHandshake, path: '/branch-manager/nominees' },
      { id: 'staff', label: 'Branch Staff', icon: ShieldCheck, path: '/branch-manager/staff' },
      { id: 'savings_schemes', label: 'Savings Schemes', icon: PiggyBank, path: '/branch-manager/savings-schemes' },
      { id: 'cash_transactions', label: 'Cash Transactions', icon: Coins, path: '/branch-manager/cash-transactions' },
      { id: 'cash_reconciliation', label: 'Cash Reconciliation', icon: Scale, path: '/branch-manager/cash-reconciliation' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/branch-manager/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/branch-manager/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/branch-manager/announcements' },
      { id: 'service_requests', label: 'Service Requests', icon: Headset, path: '/branch-manager/service-requests' },
      { id: 'emergency_cases', label: 'Emergency Cases', icon: AlertOctagon, path: '/branch-manager/emergency-cases' },
      { id: 'security_events', label: 'Security Events', icon: ShieldCheck, path: '/branch-manager/security-events' },
    ],
    super_admin: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
      { id: 'branches', label: 'Branches', icon: Building2, path: '/super-admin/branches' },
      { id: 'branch_admins', label: 'Branch Manager', icon: UserCheck, path: '/super-admin/branch-admins' },
      { id: 'staff_roles', label: 'Staff Roles', icon: ShieldCheck, path: '/super-admin/staff-roles' },
      { id: 'staff', label: 'Staff Registry', icon: Users, path: '/super-admin/staff' },
      { id: 'savings_schemes', label: 'Savings Schemes', icon: PiggyBank, path: '/super-admin/savings-schemes' },
      { id: 'cash_transactions', label: 'Cash Transactions', icon: Coins, path: '/super-admin/cash-transactions' },
      { id: 'cash_reconciliation', label: 'Cash Reconciliation', icon: Scale, path: '/super-admin/cash-reconciliation' },
      { id: 'fd_mis_schemes', label: 'FD / MIS Schemes', icon: Coins, path: '/super-admin/fd-mis-schemes' },
      { id: 'loan_schemes', label: 'Loan Schemes', icon: Landmark, path: '/super-admin/loan-schemes' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/super-admin/announcements' },
      { id: 'service_requests', label: 'Service Requests', icon: Headset, path: '/super-admin/service-requests' },
      { id: 'emergency_cases', label: 'Emergency Cases', icon: AlertOctagon, path: '/super-admin/emergency-cases' },
      { id: 'security_events', label: 'Security Events', icon: ShieldAlert, path: '/super-admin/security-events' },
      { id: 'member_base', label: 'View Members', icon: Users, path: '/super-admin/members' },
    ],
    staff: (() => {
      const roleStr = String(user?.staff_role?.name || user?.account_role || user?.role || '').toLowerCase();
      const isAccountant = roleStr.includes('accountant') || roleStr.includes('auditor');
      const isCustomerService =
        roleStr.includes('customer') ||
        roleStr.includes('cso') ||
        roleStr.includes('support') ||
        (roleStr.includes('service') && !roleStr.includes('cashier'));

      if (isCustomerService) {
        return [
          { id: 'overview', label: 'Staff Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
          { id: 'service_requests', label: 'Service Requests', icon: Headset, path: '/staff/service-requests' },
        ];
      }
      if (isAccountant) {
        return [
          { id: 'overview', label: 'Staff Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
          { id: 'cash_reconciliation', label: 'Cash Reconciliation', icon: Calculator, path: '/staff/cash-reconciliation' },
          { id: 'members', label: 'View Members', icon: Users, path: '/staff/members' },
        ];
      }
      return [
        { id: 'overview', label: 'Staff Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
        { id: 'cash_operations', label: 'Cash Operations', icon: Wallet, path: '/staff/cash-operations' },
        { id: 'cash_reconciliation', label: 'Cash Reconciliation', icon: Calculator, path: '/staff/cash-reconciliation' },
      ];
    })()
  };

  const currentNavItems = roleNavItems[role] || roleNavItems.member;

  const branchDisplayName =
    typeof user?.branch === 'string'
      ? user.branch
      : (user?.branch_name || user?.branch?.name || user?.branch?.branch_name || 'Society Branch');

  const rawStaffTitle = user?.staff_role?.name || 'Branch Staff';
  const staffTitle = /cashier\/teller/i.test(String(rawStaffTitle)) ? 'Cashier' : rawStaffTitle;

  const roleLabels = {
    member: { title: 'Member Portal', badge: 'Active Member', color: 'bg-teal-50 text-[#0f766e]' },
    branch_manager: { title: 'Branch Manager', badge: branchDisplayName, color: 'bg-teal-50 text-[#0f766e]' },
    super_admin: { title: 'Super Admin', badge: 'Apex Society Authority', color: 'bg-teal-50 text-[#0f766e]' },
    staff: { title: staffTitle, badge: branchDisplayName, color: 'bg-teal-50 text-[#0f766e]' },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.member;

  // Member Notification Real-time Counter (for sidebar menu badge)
  const [unreadCount, setUnreadCount] = useState(0);
  const [emergencyUnreadCount, setEmergencyUnreadCount] = useState(0);
  const [staffPendingCount, setStaffPendingCount] = useState(0);

  // Poll / refresh unread count for member & emergency cases & staff service requests
  useEffect(() => {
    let isMounted = true;

    const refreshMemberUnread = () => {
      if (role === 'member') {
        getMemberUnreadCount()
          .then((count) => {
            if (isMounted) setUnreadCount(typeof count === 'number' ? count : 0);
          })
          .catch(() => {});
      }
    };

    const refreshStaffPending = () => {
      const roleStr = String(user?.staff_role?.name || user?.account_role || user?.role || '').toLowerCase();
      const isCustomerService =
        roleStr.includes('customer') ||
        roleStr.includes('cso') ||
        roleStr.includes('support') ||
        (roleStr.includes('service') && !roleStr.includes('cashier'));

      if (role === 'staff' && isCustomerService) {
        getStaffCustomerServicePendingCount()
          .then((count) => {
            if (isMounted) setStaffPendingCount(typeof count === 'number' ? count : 0);
          })
          .catch(() => {});
      }
    };

    const refreshEmergencyUnread = () => {
      if (role === 'branch_manager' || role === 'branch_admin') {
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
    };

    refreshMemberUnread();
    refreshEmergencyUnread();
    refreshStaffPending();

    const handleNotificationsUpdated = (e) => {
      if (role === 'member') {
        if (typeof e?.detail?.unreadCount === 'number') {
          if (isMounted) setUnreadCount(e.detail.unreadCount);
        } else {
          refreshMemberUnread();
        }
      }
    };

    const handleEmergencyUpdated = (e) => {
      const detail = e?.detail;
      const targetRole = detail?.role;
      const isBranchTarget = targetRole === 'branch_manager' || targetRole === 'branch_admin';
      const isSuperTarget = targetRole === 'super_admin';
      const isCurrentBranch = role === 'branch_manager' || role === 'branch_admin';
      const isCurrentSuper = role === 'super_admin';

      const roleMatches = !targetRole || (isBranchTarget && isCurrentBranch) || (isSuperTarget && isCurrentSuper);

      if (roleMatches) {
        if (typeof detail?.count === 'number') {
          if (isMounted) setEmergencyUnreadCount(detail.count);
        } else {
          refreshEmergencyUnread();
        }
      }
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT || 'member-notifications-updated', handleNotificationsUpdated);
    window.addEventListener(EMERGENCY_UNREAD_UPDATED_EVENT || 'emergency-unread-updated', handleEmergencyUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT || 'member-notifications-updated', handleNotificationsUpdated);
      window.removeEventListener(EMERGENCY_UNREAD_UPDATED_EVENT || 'emergency-unread-updated', handleEmergencyUpdated);
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
    } else if (role === 'staff') {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      navigate('/staff-login');
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
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate whitespace-nowrap text-left">{item.label}</span>
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
                {item.id === 'service_requests' && role === 'staff' && staffPendingCount > 0 && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-black rounded-full shadow-2xs ${
                      isActive ? 'bg-white text-amber-700' : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {staffPendingCount}
                  </span>
                )}
              </button>
            );
          })}

          {role !== 'super_admin' && role !== 'branch_manager' && role !== 'staff' && (
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
        {(() => {
          const resolvedSidebarName =
            user?.full_name ||
            user?.name ||
            user?.username ||
            (role === 'super_admin' ? 'Super Admin' : role === 'staff' ? 'Staff Member' : role === 'branch_manager' ? 'Branch Manager' : 'Member');

          const rawSidebarRole =
            user?.staff_role?.name ||
            user?.account_role ||
            user?.role_name ||
            user?.role ||
            (role === 'super_admin' ? 'Super Admin' : role === 'staff' ? 'Staff' : role === 'branch_manager' ? 'Branch Manager' : (user?.id ? `Member #${user.id}` : 'Member'));

          const resolvedSidebarRole =
            /cashier\/teller/i.test(String(rawSidebarRole)) ? 'Cashier' : rawSidebarRole;

          const resolvedSidebarAvatar =
            user?.avatarText ||
            (resolvedSidebarName ? resolvedSidebarName.trim().charAt(0).toUpperCase() : (role === 'super_admin' ? 'SA' : 'U'));

          return (
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
                  {resolvedSidebarAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                    {resolvedSidebarName}
                  </p>
                  <p className="text-[11px] text-[#0d9488] font-bold truncate capitalize">
                    {resolvedSidebarRole}
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
          );
        })()}
      </aside>
    </>
  );
}
