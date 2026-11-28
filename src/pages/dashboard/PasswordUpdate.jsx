import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import PasswordUpdateCard from '../../components/dashboard/PasswordUpdateCard';
import { getRoleFromLocation } from '../../services/branchService';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Building2,
  User,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';


export default function PasswordUpdate() {
  const { t } = useTranslation();
  const currentRole = getRoleFromLocation(); // 'super_admin' | 'branch_manager' | 'staff' | 'member'

  // Retrieve authenticated user from respective storage
  const [currentUser] = useState(() => {
    try {
      if (currentRole === 'super_admin') {
        const u = localStorage.getItem('superadmin_user');
        const parsed = u ? JSON.parse(u) : null;
        return {
          name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackSuperAdmin", "Super Admin"),
          full_name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackSuperAdmin", "Super Admin"),
          id: 'HQ-ADMIN',
          avatarText: 'SA',
          role: t("dashboardModule.passwordUpdate.fallbackSuperAdmin", "Super Admin"),
        };
      }
      if (currentRole === 'branch_manager') {
        const u = localStorage.getItem('branch_user');
        const parsed = u ? JSON.parse(u) : null;
        return {
          name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackBranchManager", "Branch Manager"),
          full_name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackBranchManager", "Branch Manager"),
          id: parsed?.id || parsed?.user_code || 'MGR-001',
          avatarText: 'BM',
          role: t("dashboardModule.passwordUpdate.fallbackBranchManager", "Branch Manager"),
          branch: parsed?.branch?.name || parsed?.branch_name || t("dashboardModule.passwordUpdate.fallbackSocietyBranch", "Society Branch"),
          branch_name: parsed?.branch?.name || parsed?.branch_name || t("dashboardModule.passwordUpdate.fallbackSocietyBranch", "Society Branch"),
          branch_code: parsed?.branch?.branch_code || parsed?.branch_code || 'BRA-01',
        };
      }
      if (currentRole === 'staff') {
        const u = localStorage.getItem('staff_user');
        const parsed = u ? JSON.parse(u) : null;
        return {
          name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackStaffMember", "Staff Member"),
          full_name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackStaffMember", "Staff Member"),
          id: parsed?.staff_code || (parsed?.staff_id ? `STF-${parsed.staff_id}` : 'STF-01'),
          avatarText: 'ST',
          role: parsed?.staff_role?.name || parsed?.account_role || t("dashboardModule.passwordUpdate.fallbackBranchStaff", "Branch Staff"),
          branch: parsed?.branch?.name || parsed?.branch_name || t("dashboardModule.passwordUpdate.fallbackSocietyBranch", "Society Branch"),
          branch_name: parsed?.branch?.name || parsed?.branch_name || t("dashboardModule.passwordUpdate.fallbackSocietyBranch", "Society Branch"),
          branch_code: parsed?.branch?.branch_code || parsed?.branch_code || 'BRA-01',
        };
      }
      // member
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      return {
        name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackMember", "Member"),
        full_name: parsed?.full_name || parsed?.name || t("dashboardModule.passwordUpdate.fallbackMember", "Member"),
        id: parsed?.member_code || (parsed?.id ? `#${parsed.id}` : '#M-001'),
        avatarText: 'MB',
        role: t("dashboardModule.passwordUpdate.fallbackMember", "Member"),
        branch_name: parsed?.branch_name || t("dashboardModule.passwordUpdate.fallbackSocietyBranch", "Society Branch"),
      };
    } catch {
      return {
        name: t("dashboardModule.passwordUpdate.fallbackUser", "User"),
        role: currentRole,
      };
    }
  });

  const roleBadgeLabel = {
    super_admin: t("dashboardModule.passwordUpdate.roleBadge.superAdmin", "Super Admin Apex Authority"),
    branch_manager: t("dashboardModule.passwordUpdate.roleBadge.branchManager", "Branch Administration Hub"),
    staff: t("dashboardModule.passwordUpdate.roleBadge.staff", "Branch Staff Operations Desk"),
    member: t("dashboardModule.passwordUpdate.roleBadge.member", "Member Security Portal"),
  }[currentRole] || t("dashboardModule.passwordUpdate.roleBadge.default", "Security Management");

  return (
    <DashboardLayout
      role={currentRole}
      user={currentUser}
      activeTab="password_update"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner matching AurumFX standard styling */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <KeyRound className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.passwordUpdate.badge", "Password Update")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{roleBadgeLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{t("dashboardModule.passwordUpdate.title", "Change Account Password")}</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("dashboardModule.passwordUpdate.subtitle", "Keep your operational account secure by updating your master password. The update applies immediately across all cooperative society authorization endpoints.")}
            </p>
          </div>

          {/* Right Icon Graphic */}
          <div className="relative z-10 flex justify-center md:justify-end flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl bg-white/90 border border-teal-200/80 shadow-md flex items-center justify-center text-[#00b4a7] backdrop-blur-xs">
              <KeyRound className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 stroke-[1.75]" />
            </div>
          </div>

          {/* Background subtle radial glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* Password Update Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8">
            <PasswordUpdateCard
              title={t("dashboardModule.passwordUpdate.cardTitle", "Change Account Password")}
              description={t("dashboardModule.passwordUpdate.cardDescription", "Enter your current password followed by your new password to complete verification.")}
              role={currentRole}
            />
          </div>

          {/* Security Best Practices Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                <span>{t("dashboardModule.passwordUpdate.recommendationsTitle", "Security Recommendations")}</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{t("dashboardModule.passwordUpdate.recommendation1", "Use at least 8 characters with a mix of letters, numbers, and symbols.")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{t("dashboardModule.passwordUpdate.recommendation2", "Never share or write down your cooperative operational credentials.")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{t("dashboardModule.passwordUpdate.recommendation3", "Ensure you log out whenever leaving your terminal or desk unattended.")}</span>
                </li>
              </ul>
            </div>

            <div className="bg-teal-50/70 rounded-3xl border border-teal-200/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#0f766e] font-bold text-xs">
                <Info className="w-4 h-4 text-[#00b4a7]" />
                <span>{t("dashboardModule.passwordUpdate.syncTitle", "Instant Synchronization")}</span>
              </div>
              <p className="text-[11px] text-teal-900/80 leading-relaxed font-medium">
                {t("dashboardModule.passwordUpdate.syncDescription", "Once submitted, all subsequent requests and future sign-ins across society portals must use the new password.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
