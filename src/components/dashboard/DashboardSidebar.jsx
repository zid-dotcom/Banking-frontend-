import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  UserCheck
} from 'lucide-react';

export default function DashboardSidebar({
  role = 'member',
  user = {},
  activeTab = 'overview',
  onTabChange,
  isOpen = false,
  onClose
}) {
  const navigate = useNavigate();

  // Role based navigation menus
  const roleNavItems = {
    member: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'accounts', label: 'Savings & Deposits', icon: Wallet },
      { id: 'loans', label: 'My Loans & EMIs', icon: CreditCard },
      { id: 'transactions', label: 'Passbook & History', icon: History },
      { id: 'shares', label: 'Society Shares', icon: Award },
      { id: 'statements', label: 'Tax & Statements', icon: FileText },
    ],
    branch_manager: [
      { id: 'overview', label: 'Branch Dashboard', icon: LayoutDashboard },
      { id: 'members', label: 'Member Registry', icon: Users },
      { id: 'loan_appraisals', label: 'Loan Appraisals', icon: CreditCard },
      { id: 'cash_counter', label: 'Cash & Daily Ledger', icon: Landmark },
      { id: 'day_end', label: 'Day-End Reconciliation', icon: History },
      { id: 'branch_reports', label: 'Branch Audit Reports', icon: FileText },
    ],
    super_admin: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'branches', label: 'Branches', icon: Building2 },
      { id: 'branch_admins', label: 'Branch Admin', icon: UserCheck },
      { id: 'member_base', label: 'View Members', icon: Users },
    ]
  };

  const currentNavItems = roleNavItems[role] || roleNavItems.member;

  const roleLabels = {
    member: { title: 'Member Portal', badge: 'Active Member', color: 'bg-teal-50 text-[#0f766e]' },
    branch_manager: { title: 'Branch Manager', badge: 'Thrissur Central Branch', color: 'bg-teal-50 text-[#0f766e]' },
    super_admin: { title: 'Super Admin', badge: 'Apex Society Authority', color: 'bg-teal-50 text-[#0f766e]' },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.member;

  const handleLogout = () => {
    if (role === 'member') navigate('/member-login');
    else if (role === 'branch_manager') navigate('/branch-manager-login');
    else navigate('/super-admin/login');
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
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
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
              </button>
            );
          })}

          {role !== 'super_admin' && (
            <>
              <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Support & Help
              </div>

              <Link
                to="/contact"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Society Helpdesk</span>
              </Link>
            </>
          )}
        </div>

        {/* User Profile & Bottom Logout Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-50 text-[#0f766e] font-bold flex items-center justify-center text-sm border border-teal-200/60">
              {user.avatarText || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'Demo User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.id || 'ID: 0000'}</p>
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
