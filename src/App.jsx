import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import MemberDashboard from './pages/dashboard/MemberDashboard';
import BranchManagerDashboard from './pages/dashboard/BranchManagerDashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
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

  // Isolated role-based dashboard routes
  const isDashboardRoute =
    location.pathname.startsWith('/member/dashboard') ||
    location.pathname.startsWith('/branch-manager/dashboard') ||
    location.pathname.startsWith('/super-admin/dashboard');

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

  // If on any role dashboard route, render isolated modular dashboard view
  if (isDashboardRoute) {
    return (
      <Routes>
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/branch-manager/dashboard" element={<BranchManagerDashboard />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
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
