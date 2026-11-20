import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Loans from './pages/Loans';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import SuperAdminLogin from './pages/SuperAdminLogin';
import BranchAdminLogin from './pages/BranchAdminLogin';
import MemberLogin from './pages/MemberLogin';
import StaffLogin from './pages/StaffLogin';
import MemberDashboard from './pages/dashboard/MemberDashboard';
import MemberSavingsSchemes from './pages/dashboard/MemberSavingsSchemes';
import MemberAccountTransactions from './pages/dashboard/MemberAccountTransactions';
import MemberFdMisSchemes from './pages/dashboard/MemberFdMisSchemes';
import MemberLoanSchemes from './pages/dashboard/MemberLoanSchemes';
import MemberHelpdesk from './pages/dashboard/MemberHelpdesk';
import MemberAnnouncements from './pages/dashboard/MemberAnnouncements';
import MemberNotifications from './pages/dashboard/MemberNotifications';
import MemberNominee from './pages/dashboard/MemberNominee';
import MemberProfile from './pages/dashboard/MemberProfile';
import MemberSecurityEvents from './pages/dashboard/MemberSecurityEvents';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import StaffCashReconciliation from './pages/dashboard/StaffCashReconciliation';
import StaffCashOperations from './pages/dashboard/StaffCashOperations';
import StaffServiceRequests from './pages/dashboard/StaffServiceRequests';
import StaffMembers from './pages/dashboard/StaffMembers';
import StaffAnnouncements from './pages/dashboard/StaffAnnouncements';

import BranchManagerDashboard from './pages/dashboard/BranchManagerDashboard';
import BranchManagerOverview from './pages/dashboard/BranchManagerOverview';
import BranchManagerMembers from './pages/dashboard/BranchManagerMembers';
import BranchManagerStaff from './pages/dashboard/BranchManagerStaff';
import BranchManagerLoanSchemes from './pages/dashboard/BranchManagerLoanSchemes';
import BranchManagerSavingsSchemes from './pages/dashboard/BranchManagerSavingsSchemes';
import BranchManagerCashTransactions from './pages/dashboard/BranchManagerCashTransactions';
import BranchManagerCashReconciliation from './pages/dashboard/BranchManagerCashReconciliation';
import BranchManagerFdMisSchemes from './pages/dashboard/BranchManagerFdMisSchemes';
import BranchManagerNominees from './pages/dashboard/BranchManagerNominees';
import BranchManagerAnnouncements from './pages/dashboard/BranchManagerAnnouncements';
import BranchManagerServiceRequests from './pages/dashboard/BranchManagerServiceRequests';
import BranchManagerEmergencyCases from './pages/dashboard/BranchManagerEmergencyCases';
import BranchManagerSecurityEvents from './pages/dashboard/BranchManagerSecurityEvents';

import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import SuperAdminBranchOverview from './pages/dashboard/SuperAdminBranchOverview';
import SuperAdminBranches from './pages/dashboard/SuperAdminBranches';
import SuperAdminBranchAdmin from './pages/dashboard/SuperAdminBranchAdmin';
import SuperAdminStaff from './pages/dashboard/SuperAdminStaff';
import SuperAdminMembers from './pages/dashboard/SuperAdminMembers';
import SuperAdminLoanSchemes from './pages/dashboard/SuperAdminLoanSchemes';
import SuperAdminStaffRoles from './pages/dashboard/SuperAdminStaffRoles';
import SuperAdminSavingsSchemes from './pages/dashboard/SuperAdminSavingsSchemes';
import SuperAdminCashTransactions from './pages/dashboard/SuperAdminCashTransactions';
import SuperAdminCashReconciliation from './pages/dashboard/SuperAdminCashReconciliation';
import SuperAdminFdMisSchemes from './pages/dashboard/SuperAdminFdMisSchemes';
import SuperAdminAnnouncements from './pages/dashboard/SuperAdminAnnouncements';
import SuperAdminServiceRequests from './pages/dashboard/SuperAdminServiceRequests';
import SuperAdminEmergencyCases from './pages/dashboard/SuperAdminEmergencyCases';
import SuperAdminSecurityEvents from './pages/dashboard/SuperAdminSecurityEvents';
import EnquiryModal from './components/EnquiryModal';
import PortalModal from './components/PortalModal';
import ChatWithUsWidget from './components/ChatWithUsWidget';
import SideActionToolbar from './components/SideActionToolbar';
import { ArrowUp } from 'lucide-react';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function MainApp() {
  const location = useLocation();
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryData, setEnquiryData] = useState(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Isolated administrative & member login routes
  const isSuperAdminLoginRoute = location.pathname === '/super-admin/login';
  const isBranchManagerLoginRoute = 
    location.pathname === '/branch-manager-login' || 
    location.pathname === '/branch-admin-login' || 
    location.pathname === '/branch-manager/login' ||
    location.pathname === '/branch/login';
  const isMemberLoginRoute = location.pathname === '/member-login' || location.pathname === '/member/login';
  const isStaffLoginRoute = location.pathname === '/staff-login' || location.pathname === '/staff/login';

  // Isolated role-based dashboard routes
  const isDashboardRoute =
    !isSuperAdminLoginRoute &&
    !isBranchManagerLoginRoute &&
    !isMemberLoginRoute &&
    !isStaffLoginRoute && (
      location.pathname.startsWith('/member/') ||
      location.pathname.startsWith('/branch-manager/') ||
      location.pathname.startsWith('/branch-admin/') ||
      location.pathname.startsWith('/super-admin/') ||
      location.pathname.startsWith('/staff/')
    );

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenEnquiry = (data = null) => {
    setEnquiryData(data);
    setEnquiryOpen(true);
  };

  const handleCloseEnquiry = () => {
    setEnquiryOpen(false);
    setEnquiryData(null);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on /super-admin/login, render isolated full-screen Super Admin portal
  if (isSuperAdminLoginRoute) {
    return (
      <Routes>
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      </Routes>
    );
  }

  // If on /branch-manager-login (or legacy /branch-admin-login), render isolated full-screen Branch Manager portal
  if (isBranchManagerLoginRoute) {
    return (
      <Routes>
        <Route path="/branch-manager-login" element={<BranchAdminLogin />} />
        <Route path="/branch-admin-login" element={<BranchAdminLogin />} />
        <Route path="/branch-manager/login" element={<BranchAdminLogin />} />
        <Route path="/branch/login" element={<BranchAdminLogin />} />
      </Routes>
    );
  }

  // If on /member-login, render isolated full-screen Member portal
  if (isMemberLoginRoute) {
    return (
      <Routes>
        <Route path="/member-login" element={<MemberLogin />} />
        <Route path="/member/login" element={<MemberLogin />} />
      </Routes>
    );
  }

  // If on /staff-login, render isolated full-screen Staff portal
  if (isStaffLoginRoute) {
    return (
      <Routes>
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/staff/login" element={<StaffLogin />} />
      </Routes>
    );
  }

  // If on any role dashboard route, render isolated modular dashboard view
  if (isDashboardRoute) {
    return (
      <Routes>
        {/* Super Admin Individual Page Routes */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/branch-overview" element={<SuperAdminBranchOverview />} />
        <Route path="/super-admin/overview" element={<SuperAdminBranchOverview />} />
        <Route path="/super-admin/branches" element={<SuperAdminBranches />} />
        <Route path="/super-admin/branch-admins" element={<SuperAdminBranchAdmin />} />
        <Route path="/super-admin/branch-admin" element={<SuperAdminBranchAdmin />} />
        <Route path="/super-admin/staff-roles" element={<SuperAdminStaffRoles />} />
        <Route path="/super-admin/staff-role" element={<SuperAdminStaffRoles />} />
        <Route path="/super-admin/roles" element={<SuperAdminStaffRoles />} />
        <Route path="/super-admin/staff" element={<SuperAdminStaff />} />
        <Route path="/super-admin/branch-staff" element={<SuperAdminStaff />} />
        <Route path="/super-admin/staff-members" element={<SuperAdminStaff />} />
        <Route path="/super-admin/savings-schemes" element={<SuperAdminSavingsSchemes />} />
        <Route path="/super-admin/savings-scheme" element={<SuperAdminSavingsSchemes />} />
        <Route path="/super-admin/savings" element={<SuperAdminSavingsSchemes />} />
        <Route path="/super-admin/cash-transactions" element={<SuperAdminCashTransactions />} />
        <Route path="/super-admin/cash-operations" element={<SuperAdminCashTransactions />} />
        <Route path="/super-admin/cash-reconciliation" element={<SuperAdminCashReconciliation />} />
        <Route path="/super-admin/cash-reconciliations" element={<SuperAdminCashReconciliation />} />
        <Route path="/super-admin/fd-mis-schemes" element={<SuperAdminFdMisSchemes />} />
        <Route path="/super-admin/fd-mis-scheme" element={<SuperAdminFdMisSchemes />} />
        <Route path="/super-admin/fd-mis" element={<SuperAdminFdMisSchemes />} />
        <Route path="/super-admin/loan-schemes" element={<SuperAdminLoanSchemes />} />
        <Route path="/super-admin/loan-scheme" element={<SuperAdminLoanSchemes />} />
        <Route path="/super-admin/schemes" element={<SuperAdminLoanSchemes />} />
        <Route path="/super-admin/announcements" element={<SuperAdminAnnouncements />} />
        <Route path="/super-admin/announcement" element={<SuperAdminAnnouncements />} />
        <Route path="/super-admin/service-requests" element={<SuperAdminServiceRequests />} />
        <Route path="/super-admin/service-request" element={<SuperAdminServiceRequests />} />
        <Route path="/super-admin/emergency-cases" element={<SuperAdminEmergencyCases />} />
        <Route path="/super-admin/emergency" element={<SuperAdminEmergencyCases />} />
        <Route path="/super-admin/security-events" element={<SuperAdminSecurityEvents />} />
        <Route path="/super-admin/security" element={<SuperAdminSecurityEvents />} />
        <Route path="/super-admin/members" element={<SuperAdminMembers />} />

        {/* Branch Manager Routes */}
        <Route path="/branch-manager/dashboard" element={<BranchManagerDashboard />} />
        <Route path="/branch-manager/branch-overview" element={<BranchManagerOverview />} />
        <Route path="/branch-admin/branch-overview" element={<BranchManagerOverview />} />
        <Route path="/branch-manager/overview" element={<BranchManagerOverview />} />
        <Route path="/branch-admin/overview" element={<BranchManagerOverview />} />
        <Route path="/branch-manager/members" element={<BranchManagerMembers />} />
        <Route path="/branch-admin/members" element={<BranchManagerMembers />} />
        <Route path="/branch-manager/nominees" element={<BranchManagerNominees />} />
        <Route path="/branch-admin/nominees" element={<BranchManagerNominees />} />
        <Route path="/branch-manager/nominee" element={<BranchManagerNominees />} />
        <Route path="/branch-admin/nominee" element={<BranchManagerNominees />} />
        <Route path="/branch-manager/staff" element={<BranchManagerStaff />} />
        <Route path="/branch-admin/staff" element={<BranchManagerStaff />} />
        <Route path="/branch-manager/savings-schemes" element={<BranchManagerSavingsSchemes />} />
        <Route path="/branch-admin/savings-schemes" element={<BranchManagerSavingsSchemes />} />
        <Route path="/branch-manager/cash-transactions" element={<BranchManagerCashTransactions />} />
        <Route path="/branch-admin/cash-transactions" element={<BranchManagerCashTransactions />} />
        <Route path="/branch-manager/cash-operations" element={<BranchManagerCashTransactions />} />
        <Route path="/branch-admin/cash-operations" element={<BranchManagerCashTransactions />} />
        <Route path="/branch-manager/cash-reconciliation" element={<BranchManagerCashReconciliation />} />
        <Route path="/branch-admin/cash-reconciliation" element={<BranchManagerCashReconciliation />} />
        <Route path="/branch-manager/cash-reconciliations" element={<BranchManagerCashReconciliation />} />
        <Route path="/branch-admin/cash-reconciliations" element={<BranchManagerCashReconciliation />} />
        <Route path="/branch-manager/fd-mis-schemes" element={<BranchManagerFdMisSchemes />} />
        <Route path="/branch-admin/fd-mis-schemes" element={<BranchManagerFdMisSchemes />} />
        <Route path="/branch-manager/loan-schemes" element={<BranchManagerLoanSchemes />} />
        <Route path="/branch-admin/loan-schemes" element={<BranchManagerLoanSchemes />} />
        <Route path="/branch-manager/announcements" element={<BranchManagerAnnouncements />} />
        <Route path="/branch-admin/announcements" element={<BranchManagerAnnouncements />} />
        <Route path="/branch-manager/service-requests" element={<BranchManagerServiceRequests />} />
        <Route path="/branch-admin/service-requests" element={<BranchManagerServiceRequests />} />
        <Route path="/branch-manager/emergency-cases" element={<BranchManagerEmergencyCases />} />
        <Route path="/branch-admin/emergency-cases" element={<BranchManagerEmergencyCases />} />
        <Route path="/branch-manager/emergency" element={<BranchManagerEmergencyCases />} />
        <Route path="/branch-admin/emergency" element={<BranchManagerEmergencyCases />} />
        <Route path="/branch-manager/security-events" element={<BranchManagerSecurityEvents />} />
        <Route path="/branch-admin/security-events" element={<BranchManagerSecurityEvents />} />
        <Route path="/branch-manager/security" element={<BranchManagerSecurityEvents />} />
        <Route path="/branch-admin/security" element={<BranchManagerSecurityEvents />} />
        <Route path="/branch-manager/helpdesk" element={<BranchManagerServiceRequests />} />
        <Route path="/branch-admin/helpdesk" element={<BranchManagerServiceRequests />} />
        <Route path="/branch-manager/*" element={<Navigate to="/branch-manager/dashboard" replace />} />

        {/* Member Page Routes */}
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/profile" element={<MemberProfile />} />
        <Route path="/member/profile/full" element={<MemberProfile />} />
        <Route path="/member/nominee" element={<MemberNominee />} />
        <Route path="/member/nominees" element={<MemberNominee />} />
        <Route path="/member/savings-schemes" element={<MemberSavingsSchemes />} />
        <Route path="/member/account-transactions" element={<MemberAccountTransactions />} />
        <Route path="/member/transactions" element={<MemberAccountTransactions />} />
        <Route path="/member/cash-transactions" element={<MemberAccountTransactions />} />
        <Route path="/member/fd-mis-schemes" element={<MemberFdMisSchemes />} />
        <Route path="/member/loan-schemes" element={<MemberLoanSchemes />} />
        <Route path="/member/announcements" element={<MemberAnnouncements />} />
        <Route path="/member/notifications" element={<MemberNotifications />} />
        <Route path="/member/security" element={<MemberSecurityEvents />} />
        <Route path="/member/security-events" element={<MemberSecurityEvents />} />
        <Route path="/member/helpdesk" element={<MemberHelpdesk />} />
        <Route path="/member/service-requests" element={<MemberHelpdesk />} />
        <Route path="/member/*" element={<Navigate to="/member/dashboard" replace />} />

        {/* Staff Dashboard Routes */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/cash-reconciliation" element={<StaffCashReconciliation />} />
        <Route path="/staff/cash-day" element={<StaffCashReconciliation />} />
        <Route path="/staff/reconciliation" element={<StaffCashReconciliation />} />
        <Route path="/staff/cash-operations" element={<StaffCashOperations />} />
        <Route path="/staff/service-requests" element={<StaffServiceRequests />} />
        <Route path="/staff/helpdesk" element={<StaffServiceRequests />} />
        <Route path="/staff/customer-service" element={<StaffServiceRequests />} />
        <Route path="/staff/members" element={<StaffMembers />} />
        <Route path="/staff/view-members" element={<StaffMembers />} />
        <Route path="/staff/branch-members" element={<StaffMembers />} />
        <Route path="/staff/announcements" element={<StaffAnnouncements />} />
        <Route path="/staff/notices" element={<StaffAnnouncements />} />
        <Route path="/staff/*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800 bg-white font-sans selection:bg-[#ffba00] selection:text-slate-900">
      
      {/* Navbar */}
      <Navbar 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenPortalModal={() => setPortalOpen(true)} 
      />

      {/* Left Floating Action Toolbar */}
      {!mobileMenuOpen && <SideActionToolbar />}

      {/* Bottom-Right Floating "Chat with us!" Widget (Hidden when mobile menu is open) */}
      {!mobileMenuOpen && (
        <ChatWithUsWidget
          onClick={() => handleOpenEnquiry({ title: 'Online Member Help Desk' })}
        />
      )}

      {/* Back to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-10 right-8 z-40 w-10 h-10 rounded-full bg-[#161c28] text-[#ffba00] flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Main Content Router */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home onOpenEnquiry={handleOpenEnquiry} />} />
          <Route path="/about" element={<About onOpenEnquiry={handleOpenEnquiry} />} />
          <Route path="/features" element={<Features onOpenEnquiry={handleOpenEnquiry} />} />
          <Route path="/loans" element={<Loans onOpenEnquiry={handleOpenEnquiry} />} />
          <Route path="/blog" element={<Blog onOpenEnquiry={handleOpenEnquiry} />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={handleCloseEnquiry}
        initialData={enquiryData}
      />

      <PortalModal
        isOpen={portalOpen}
        onClose={() => setPortalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <MainApp />
    </BrowserRouter>
  );
}
