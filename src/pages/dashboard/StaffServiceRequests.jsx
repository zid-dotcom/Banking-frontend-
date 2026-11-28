import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StaffCustomerServiceView from '../../components/dashboard/StaffCustomerServiceView';
import { getStaffMe } from '../../services/branchStaffService';
import { AlertOctagon, ArrowRight } from 'lucide-react';


export default function StaffServiceRequests() {
  const { t } = useTranslation();
  const [staffData, setStaffData] = useState(() => {
    try {
      const cached = localStorage.getItem('staff_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const fetchStaffProfile = async () => {
    try {
      const data = await getStaffMe();
      if (data) {
        setStaffData(data);
        localStorage.setItem('staff_user', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not fetch staff profile:', err);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
  }, []);

  const roleStr = String(staffData?.staff_role?.name || staffData?.account_role || staffData?.role || '').toLowerCase();
  const isAccountant = roleStr.includes('accountant') || roleStr.includes('auditor');
  const isCustomerService =
    roleStr.includes('customer') ||
    roleStr.includes('cso') ||
    roleStr.includes('support') ||
    (roleStr.includes('service') && !roleStr.includes('cashier'));

  const staffName = staffData?.full_name || staffData?.name || t("dashboardModule.serviceRequests.defaultStaffName", "Customer Service Staff");
  const roleName = staffData?.staff_role?.name || staffData?.account_role || (isCustomerService ? t("dashboardModule.serviceRequests.customerServiceOfficer", "Customer Service Officer") : t("dashboardModule.serviceRequests.branchStaff", "Branch Staff"));
  const branchName = staffData?.branch?.name || staffData?.branch_name || t("dashboardModule.serviceRequests.defaultBranchName", "Branch Hub");
  const branchCode = staffData?.branch?.branch_code || '—';

  const userForSidebar = {
    name: staffName,
    full_name: staffName,
    role: roleName,
    staff_role: staffData?.staff_role || { name: roleName },
    account_role: staffData?.account_role || roleName,
    branch: branchName,
    branch_name: branchName,
    branch_code: branchCode,
    avatarText: staffName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CS'
  };

  return (
    <DashboardLayout
      role="staff"
      activeTab="service_requests"
      user={userForSidebar}
    >
      {staffData && !isCustomerService ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-900">
            {t("dashboardModule.serviceRequests.restrictedTitle", "Restricted to Customer Service Officers")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("dashboardModule.serviceRequests.signedInAs", "You are signed in as")} <strong>{roleName}</strong>. {t("dashboardModule.serviceRequests.restrictedDescription", "Member service request handling and helpdesk replies are reserved for Customer Service Officers.")}
          </p>
          <div className="pt-2">
            <Link
              to="/staff/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>{t("dashboardModule.serviceRequests.returnToStaffDashboard", "Return to Staff Dashboard")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <StaffCustomerServiceView staffUser={staffData} showBanner={true} />
      )}
    </DashboardLayout>
  );
}
