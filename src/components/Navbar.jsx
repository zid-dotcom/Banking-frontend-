import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  Landmark,
  Tractor,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  Layers,
} from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';
import { PROJECT_GROUPS, PROJECTS } from '../data/projectsData';
import BrandLogo from './BrandLogo';
import LanguageSelector from './LanguageSelector';


export default function Navbar({ 
  onOpenPortalModal,
  mobileMenuOpen = false,
  setMobileMenuOpen = () => {} 
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const [portalSelectionOpen, setPortalSelectionOpen] = useState(false);
  const [desktopMegaOpen, setDesktopMegaOpen] = useState(false);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState('group-1');
  const megaContainerRef = useRef(null);

  // Close portal selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPortalSelectionOpen(false);
        setDesktopMegaOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (megaContainerRef.current && !megaContainerRef.current.contains(e.target)) {
        setDesktopMegaOpen(false);
      }
    };
    if (desktopMegaOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [desktopMegaOpen]);

  // Close selection modal, mega menu and mobile drawer on route change
  useEffect(() => {
    setPortalSelectionOpen(false);
    setDesktopMegaOpen(false);
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
    { name: t("nav.home", "Home"), path: '/' },
    { name: t("nav.about", "About"), path: '/about' },
    { name: t("nav.features", "Features"), path: '/features' },
    { name: t("nav.projects", "Projects"), path: '/projects', isMega: true },
    { name: t("nav.loans", "Loans"), path: '/loans' },
    { name: t("nav.blog", "Blog"), path: '/blog' },
    { name: t("nav.contact", "Contacts"), path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getGroupIcon = (groupId) => {
    switch (groupId) {
      case 'group-1':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'group-2':
        return <Landmark className="w-4 h-4 text-emerald-600" />;
      case 'group-3':
        return <Tractor className="w-4 h-4 text-amber-600" />;
      case 'group-4':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Layers className="w-4 h-4 text-teal-600" />;
    }
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
      <div className="hidden lg:flex items-center bg-white shadow-xl h-20 lg:h-24 pl-8 xl:pl-12 pr-0 ml-auto relative">
        
        {/* Navigation Links */}
        <nav className="flex items-center space-x-6 xl:space-x-7 text-[15px] font-medium">
          {navLinks.map((link) => {
  const { t } = useTranslation();
            if (link.isMega) {
              return (
                <div
                  key={link.name}
                  ref={megaContainerRef}
                  className="relative flex items-center h-20 lg:h-24"
                >
                  <button
                    type="button"
                    onClick={() => setDesktopMegaOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 transition-colors duration-200 py-1 relative cursor-pointer ${
                      isActive(link.path) || desktopMegaOpen
                        ? 'text-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    aria-expanded={desktopMegaOpen}
                    aria-label={t("navbar.toggleProjectsMenu", "Toggle Projects Menu")}
                  >
                    <span>{link.name}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        desktopMegaOpen ? 'rotate-180 text-[#008579]' : 'text-slate-400'
                      }`}
                    />
                    {isActive(link.path) && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#ffba00]" />
                    )}
                  </button>

                  {/* =================================================================
                      DESKTOP MEGA MENU DROPDOWN (Click to open, 4 Groups)
                     ================================================================= */}
                  {desktopMegaOpen && (
                    <div
                      className="absolute top-[82px] -right-28 xl:-right-16 w-[940px] xl:w-[980px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-7 z-50 text-left animate-fadeIn pointer-events-auto"
                    >
                      {/* Top Header Badge */}
                      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {t("navbar.enterpriseErpArchitecture", "Enterprise ERP Architecture")}
                          </span>
                          <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/70">
                            {t("navbar.4CoreGroups12Solutions", "4 Core Groups • 12 Solutions")}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {t("navbar.multiStateSocietyEdition", "Multi-State Society Edition")}
                        </span>
                      </div>

                      {/* 4 Clean Columns for 4 Groups */}
                      <div className="grid grid-cols-4 gap-6">
                        
                        {/* Group 1 – Administration */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                              {getGroupIcon('group-1')}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              {t("navbar.administration", "Administration")}
                            </h4>
                          </div>

                          <ul className="space-y-2">
                            {PROJECTS.filter((p) => p.groupId === 'group-1').map((item) => (
                              <li key={item.slug}>
                                <Link
                                  to={`/projects/${item.slug}`}
                                  onClick={() => setDesktopMegaOpen(false)}
                                  className="text-xs font-medium text-slate-600 hover:text-[#008579] hover:translate-x-1 transition-all duration-150 block py-1 group"
                                >
                                  <span className="group-hover:font-semibold">{item.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Group 2 – Financial Services */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                              {getGroupIcon('group-2')}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              {t("navbar.financialServices", "Financial Services")}
                            </h4>
                          </div>

                          <ul className="space-y-2">
                            {PROJECTS.filter((p) => p.groupId === 'group-2').map((item) => (
                              <li key={item.slug}>
                                <Link
                                  to={`/projects/${item.slug}`}
                                  onClick={() => setDesktopMegaOpen(false)}
                                  className="text-xs font-medium text-slate-600 hover:text-[#008579] hover:translate-x-1 transition-all duration-150 block py-1 group"
                                >
                                  <span className="group-hover:font-semibold">{item.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>

                          {/* Section summary note aligned with column start */}
                          <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
                            <span className="font-semibold text-emerald-800 block mb-0.5">
                              {t("navbar.coreBankingEngine", "Core Banking Engine")}
                            </span>
                            <span>
                              {t("navbar.dailyInterestAccrualsTermDeposits", "Daily interest accruals, term deposits & statutory balance sheets.")}
                            </span>
                          </div>
                        </div>

                        {/* Group 3 – Operations */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                              {getGroupIcon('group-3')}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              {t("navbar.operations", "Operations")}
                            </h4>
                          </div>

                          <ul className="space-y-2">
                            {PROJECTS.filter((p) => p.groupId === 'group-3').map((item) => (
                              <li key={item.slug}>
                                <Link
                                  to={`/projects/${item.slug}`}
                                  onClick={() => setDesktopMegaOpen(false)}
                                  className="text-xs font-medium text-slate-600 hover:text-[#008579] hover:translate-x-1 transition-all duration-150 block py-1 group"
                                >
                                  <span className="group-hover:font-semibold">{item.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Group 4 – Technology & Control */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                              {getGroupIcon('group-4')}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              {t("navbar.technologyControl", "Technology & Control")}
                            </h4>
                          </div>

                          <ul className="space-y-2">
                            {PROJECTS.filter((p) => p.groupId === 'group-4').map((item) => (
                              <li key={item.slug}>
                                <Link
                                  to={`/projects/${item.slug}`}
                                  onClick={() => setDesktopMegaOpen(false)}
                                  className="text-xs font-medium text-slate-600 hover:text-[#008579] hover:translate-x-1 transition-all duration-150 block py-1 group"
                                >
                                  <span className="group-hover:font-semibold">{item.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>

                          {/* Section summary note aligned with column start */}
                          <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
                            <span className="font-semibold text-purple-800 block mb-0.5">
                              {t("navbar.securityAudits", "Security & Audits")}
                            </span>
                            <span>
                              {t("navbar.256BitSslEncryptionAutomated", "256-bit SSL encryption, automated tamper-proof logs & RBI guidelines.")}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Clean Bottom Bar without sparkle or explore link */}
                      <div className="border-t border-slate-100 pt-3.5 mt-5 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>{t("navbar.completeEcosystemForMultiState", "Complete ecosystem for Multi-State Agro Co-operatives")}</span>
                        <span className="text-slate-400">{t("navbar.integratedEnterpriseSuite", "Integrated Enterprise Suite")}</span>
                      </div>

                    </div>
                  )}
                </div>
              );
            }

            return (
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
            );
          })}
        </nav>

        {/* Thin Vertical Divider matching reference screenshot */}
        <div className="h-7 w-[1px] bg-slate-200 mx-4 xl:mx-6" />

        {/* Multilingual Selector in Desktop Navbar */}
        <div className="mr-4 xl:mr-6">
          <LanguageSelector variant="navbar" />
        </div>

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
          title={t("navbar.accessPortals", "Access Portals")}
          className="bg-[#00b4a7] hover:bg-[#009d91] active:bg-[#00897d] text-white h-20 lg:h-24 w-20 lg:w-24 flex items-center justify-center transition-colors duration-200 cursor-pointer flex-shrink-0"
          aria-label={t("navbar.memberAndBranchPortals", "Member and Branch Portals")}
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
          aria-label={t("navbar.memberAndBranchPortals", "Member and Branch Portals")}
        >
          <User className="w-5 h-5" />
        </button>
        
        {/* Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2.5 rounded-lg bg-white text-slate-900 shadow hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={t("navbar.openNavigation", "Open Navigation")}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* =====================================================================
          CENTERED PORTAL SELECTION MODAL
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
                  {t("nav.selectPortal", "Select Portal")}
                </span>
                <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-0.5 rounded-full">
                  {t("navbar.aurumfxAccess", "AurumFX Access")}
                </span>
              </div>
              
              {/* Top-Right 'X' Close Button */}
              <button
                type="button"
                onClick={() => setPortalSelectionOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={t("navbar.closePortalSelection", "Close portal selection")}
                title={t("common.close", "Close")}
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
                    {t("nav.branchManager", "Branch Manager")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1">
                    {t("common.login", "Login")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                  {t("nav.branchManagerDesc", "Branch Manager Operations Portal")}
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
                    {t("nav.memberPortal", "Member Portal")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1">
                    {t("common.login", "Login")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                  {t("nav.memberPortalDesc", "Society Folio & Member Account")}
                </p>
              </div>
            </Link>

            <div className="my-2.5 sm:my-3 border-t border-slate-100" />

            {/* Staff Portal Option */}
            <Link
              to="/staff-login"
              onClick={() => setPortalSelectionOpen(false)}
              className="flex items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-2xl hover:bg-teal-50/80 active:bg-teal-100/70 group transition-all my-2"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#008579] flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-teal-200/80 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-900">
                    {t("nav.staffPortal", "Staff Portal")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1">
                    {t("common.login", "Login")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                  {t("nav.staffPortalDesc", "Branch Staff Operations Portal")}
                </p>
              </div>
            </Link>

          </div>
        </div>
      )}

      {/* =====================================================================
          MOBILE NAVIGATION MENU (Accordion Support for Projects)
         ===================================================================== */}
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
                  aria-label={t("navbar.closeNavigation", "Close Navigation")}
                >
                  <X className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Society Legal Title */}
            <div className="py-3 px-1 text-[11px] sm:text-xs font-semibold tracking-normal [word-spacing:0.12em] text-slate-600 border-b border-slate-100">
              {SOCIETY_INFO.fullName}
            </div>

            {/* Mobile Multi-Language Selector */}
            <div className="py-3 border-b border-slate-100">
              <LanguageSelector variant="mobile" />
            </div>

            {/* Navigation Links list */}
            <nav className="flex flex-col py-3">
              {navLinks.map((link) => {
  const { t } = useTranslation();
                if (link.isMega) {
                  return (
                    <div
                      key={link.name}
                      className="my-1 rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/70"
                    >
                      {/* Accordion Header Toggle */}
                      <div className="flex items-center justify-between">
                        <Link
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex-1 py-3.5 px-4 text-lg font-semibold flex items-center justify-between ${
                            isActive(link.path)
                              ? 'text-[#008579] font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Layers className="w-5 h-5 text-[#008579]" />
                            <span>{link.name}</span>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setMobileProjectsOpen(!mobileProjectsOpen)}
                          className="px-4 py-3.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                          aria-label={t("navbar.toggleProjectsCategories", "Toggle Projects categories")}
                        >
                          <ChevronDown
                            className={`w-5 h-5 transition-transform duration-200 ${
                              mobileProjectsOpen ? 'rotate-180 text-[#008579]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expandable Accordion Body */}
                      {mobileProjectsOpen && (
                        <div className="p-4 pt-2 space-y-4 border-t border-slate-200 bg-white">
                          
                          {/* 4 Groups Accordion List */}
                          <div className="space-y-3">
                            {PROJECT_GROUPS.map((group) => {
                              const isExpanded = mobileExpandedGroup === group.id;
                              return (
                                <div
                                  key={group.id}
                                  className="rounded-xl border border-slate-100 overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMobileExpandedGroup(isExpanded ? null : group.id)
                                    }
                                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                                      {getGroupIcon(group.id)}
                                      <span>{group.title}</span>
                                    </div>
                                    <ChevronDown
                                      className={`w-4 h-4 text-slate-400 transition-transform ${
                                        isExpanded ? 'rotate-180 text-teal-700' : ''
                                      }`}
                                    />
                                  </button>

                                  {isExpanded && (
                                    <div className="p-2 space-y-1 bg-white">
                                      {PROJECTS.filter((p) => p.groupId === group.id).map(
                                        (item) => (
                                          <Link
                                            key={item.slug}
                                            to={`/projects/${item.slug}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#008579] hover:bg-teal-50/50 rounded-lg transition-colors"
                                          >
                                            {item.title}
                                          </Link>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                }

                return (
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
                );
              })}
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
                <span>{t("login.branchAdmin.title", "Branch Manager Login")}</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Quick Access Staff Portal Link in Mobile Drawer */}
            <Link
              to="/staff-login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between bg-[#008579] hover:bg-[#007469] text-white font-bold text-base py-3 px-4 rounded-xl shadow transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5" />
                <span>{t("login.staff.badge", "Staff Portal Login")}</span>
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
              <span>{t("navbar.memberAccountPortal", "Member Account Portal")}</span>
            </Link>
            
            <p className="text-center text-[11px] text-slate-400 pt-1">
              {SOCIETY_INFO.address.landmark}{t("navbar.thrissurKerala", ", Thrissur, Kerala")}
            </p>
          </div>

        </div>
      )}

    </header>
  );
}
