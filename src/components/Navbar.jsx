import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, User, Menu, X, ChevronRight, Building2, ArrowRight } from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';
import BrandLogo from './BrandLogo';

export default function Navbar({ 
  onOpenPortalModal,
  mobileMenuOpen = false,
  setMobileMenuOpen = () => {} 
}) {
  const location = useLocation();
  const [portalSelectionOpen, setPortalSelectionOpen] = useState(false);

  // Close portal selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPortalSelectionOpen(false);
      }
    };
    if (portalSelectionOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [portalSelectionOpen]);

  // Close selection modal and mobile drawer on route change
  useEffect(() => {
    setPortalSelectionOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  // Automatically close mobile menu when transitioning to desktop breakpoint (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Blog', path: '/blog' },
    { name: 'Loans', path: '/loans' },
    { name: 'Contacts', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full flex items-center justify-between pointer-events-auto select-none">
      
      {/* =====================================================================
          LEFT END: Logo Content (Positioned at the far left edge with padding)
         ===================================================================== */}
      <div className="pl-6 sm:pl-10 lg:pl-14 py-4 flex items-center h-20 lg:h-24">
        <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
          {/* Refined Banking Brand Logo */}
          <BrandLogo />

          {/* Tagline beside logo matching reference */}
          <div className="hidden md:block pl-4 sm:pl-5 border-l-2 border-white/30">
            <span className="text-base lg:text-lg xl:text-[19px] text-white font-medium tracking-normal [word-spacing:0.18em]">
              {SOCIETY_INFO.tagline}
            </span>
          </div>
        </Link>
      </div>

      {/* =====================================================================
          RIGHT END: White Navigation Panel (Flush to the right viewport edge)
         ===================================================================== */}
      <div className="hidden lg:flex items-center bg-white shadow-xl h-20 lg:h-24 pl-8 xl:pl-12 pr-0 ml-auto">
        
        {/* Navigation Links */}
        <nav className="flex items-center space-x-7 xl:space-x-8 text-[15px] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`transition-colors duration-200 py-1 relative ${
                isActive(link.path)
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#ffba00]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Thin Vertical Divider matching reference screenshot */}
        <div className="h-7 w-[1px] bg-slate-200 mx-6 xl:mx-8" />

        {/* Yellow Phone / Contact Number Area matching reference exactly */}
        <div className="flex items-center gap-2.5 mr-6 xl:mr-8">
          <Phone className="w-4 h-4 text-[#ffba00] stroke-[2.5]" />
          <a 
            href="tel:+917510104000"
            className="text-[#ffba00] font-bold text-sm xl:text-[15px] tracking-wide hover:underline whitespace-nowrap"
          >
            +91 751 010 4000
          </a>
        </div>

        {/* Teal Action Button at Far Right (Opens Centered Portal Modal) */}
        <button
          onClick={() => setPortalSelectionOpen(true)}
          title="Access Portals"
          className="bg-[#00b4a7] hover:bg-[#009d91] active:bg-[#00897d] text-white h-20 lg:h-24 w-20 lg:w-24 flex items-center justify-center transition-colors duration-200 cursor-pointer flex-shrink-0"
          aria-label="Member and Branch Portals"
        >
          <User className="w-6 h-6 stroke-[2]" />
        </button>

      </div>

      {/* Mobile Hamburger & Action Button at the Right */}
      <div className="flex lg:hidden items-center gap-2 pr-4 sm:pr-6">
        
        {/* Mobile Teal Button (Opens Centered Portal Modal) */}
        <button
          onClick={() => setPortalSelectionOpen(true)}
          className="bg-[#00b4a7] active:bg-[#009d91] text-white p-2.5 rounded-lg shadow cursor-pointer flex items-center justify-center"
          aria-label="Member and Branch Portals"
        >
          <User className="w-5 h-5" />
        </button>
        
        {/* Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2.5 rounded-lg bg-white text-slate-900 shadow hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* =====================================================================
          CENTERED PORTAL SELECTION MODAL
          Matches reference design:
          - Centered dialog in the middle of the viewport
          - Dark blurred backdrop
          - Top-right 'X' close button
          - Clean cards for Branch and Member Portal
         ===================================================================== */}
      {portalSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          
          {/* Backdrop Click Dismiss */}
          <div 
            className="fixed inset-0"
            onClick={() => setPortalSelectionOpen(false)}
            aria-hidden="true"
          />

          {/* Centered Modal Card */}
          <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-[540px] bg-white rounded-3xl shadow-2xl shadow-slate-950/25 border border-slate-100 p-6 sm:p-8 animate-scaleUp">
            
            {/* Header: Title, Badge, and 'X' Close Button */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                  Select Portal
                </span>
                <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-0.5 rounded-full">
                  AurumFX Access
                </span>
              </div>
              
              {/* Top-Right 'X' Close Button */}
              <button
                type="button"
                onClick={() => setPortalSelectionOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close portal selection"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Branch Manager Login Option */}
            <Link
              to="/branch-manager-login"
              onClick={() => setPortalSelectionOpen(false)}
              className="flex items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-2xl hover:bg-teal-50/80 active:bg-teal-100/70 group transition-all my-2"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#008579] flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-teal-200/80 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-900">
                    Branch Manager
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1">
                    Login <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                  Branch Manager Operations Portal
                </p>
              </div>
            </Link>

            <div className="my-2.5 sm:my-3 border-t border-slate-100" />

            {/* Member Portal Option */}
            <Link
              to="/member-login"
              onClick={() => setPortalSelectionOpen(false)}
              className="flex items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-2xl hover:bg-teal-50/80 active:bg-teal-100/70 group transition-all my-2"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#008579] flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-teal-200/80 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-900">
                    Member Portal
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1">
                    Login <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                  Society Folio & Member Account
                </p>
              </div>
            </Link>

          </div>
        </div>
      )}

      {/* Fullscreen Mobile Navigation Menu (Edge-to-Edge, Zero Extra Spaces, Hidden on Desktop) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 w-full h-full bg-white z-[100] lg:hidden flex flex-col justify-between p-6 sm:p-8 overflow-y-auto select-none">
          
          {/* Top Section */}
          <div>
            {/* Header: Brand Logo & Close Button */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-200">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                <BrandLogo light={true} size="small" />
              </Link>
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors cursor-pointer"
                  aria-label="Close Navigation"
                >
                  <X className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Society Legal Title */}
            <div className="py-3 px-1 text-[11px] sm:text-xs font-semibold tracking-normal [word-spacing:0.12em] text-slate-600 border-b border-slate-100">
              {SOCIETY_INFO.fullName}
            </div>

            {/* Navigation Links list */}
            <nav className="flex flex-col py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3.5 px-4 rounded-lg text-lg font-semibold flex items-center justify-between transition-colors my-1 ${
                    isActive(link.path)
                      ? 'bg-[#ffba00]/15 text-slate-950 font-bold border-l-4 border-[#ffba00]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Section: Dedicated Direct Mobile Portal Links */}
          <div className="pt-6 border-t border-slate-200 flex flex-col gap-3 mt-auto">
            
            {/* Direct Dial Phone Button */}
            <a
              href="tel:+917510104000"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2.5 text-[#ffba00] font-bold text-base py-3 px-4 bg-slate-900 hover:bg-slate-800 rounded-xl shadow transition-colors"
            >
              <Phone className="w-4 h-4 text-[#ffba00] stroke-[2.5]" />
              <span>+91 751 010 4000</span>
            </a>

            {/* Quick Access Branch Manager Link in Mobile Drawer */}
            <Link
              to="/branch-manager-login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between bg-[#008579] hover:bg-[#007469] text-white font-bold text-base py-3 px-4 rounded-xl shadow transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5" />
                <span>Branch Manager Login</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Member Gateway Portal CTA */}
            <Link
              to="/member-login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#008579] hover:bg-[#007469] text-white font-bold text-base py-3 px-4 rounded-xl shadow transition-colors cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span>Member Account Portal</span>
            </Link>
            
            <p className="text-center text-[11px] text-slate-400 pt-1">
              {SOCIETY_INFO.address.landmark}, Thrissur, Kerala
            </p>
          </div>

        </div>
      )}

    </header>
  );
}
