import React, { useState } from 'react';
import { i18n } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Landmark,
  Tractor,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Globe2,
  Lock,
  BarChart3,
  Smartphone,
  ChevronRight,
  Search,
} from 'lucide-react';
import PageBanner from '../components/PageBanner';
import { PROJECTS, PROJECT_GROUPS } from '../data/projectsData';

// Image component with fallback to smooth gradient placeholder
function ProjectImage({ src, alt, className = '' }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-teal-50 via-slate-100 to-teal-100 flex items-center justify-center ${className}`}
      >
        <Building2 className="w-12 h-12 text-[#008579]/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={className}
    />
  );
}

export default function Projects({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on selected group and search query
  const filteredProjects = PROJECTS.filter((project) => {
    const matchesGroup =
      selectedGroup === 'all' ||
      project.groupId === selectedGroup ||
      project.group.toLowerCase() === selectedGroup.toLowerCase();

    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.group.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGroup && matchesSearch;
  });

  const scrollToSolutions = () => {
    const el = document.getElementById('solutions-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getGroupIcon = (groupId) => {
    switch (groupId) {
      case 'group-1':
        return <Building2 className="w-4 h-4" />;
      case 'group-2':
        return <Landmark className="w-4 h-4" />;
      case 'group-3':
        return <Tractor className="w-4 h-4" />;
      case 'group-4':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const whyChooseReasons = [
    {
      icon: <Building2 className="w-6 h-6 text-[#008579]" />,
      title: t("projects.centralisedManagement", "Centralised Management"),
      description: t("projects.consolidateMultipleStatesApexAdministrative", "Consolidate multiple states, apex administrative policies, and local branches into one unified governance console."),
    },
    {
      icon: <Globe2 className="w-6 h-6 text-[#008579]" />,
      title: t("projects.multiStateOperations", "Multi-State Operations"),
      description: t("projects.tailoredForMultiStateCo", "Tailored for multi-state co-operative jurisdiction, managing state bylaws, diverse tax rules, and local registries."),
    },
    {
      icon: <Layers className="w-6 h-6 text-[#008579]" />,
      title: t("projects.integratedBusinessModules", "Integrated Business Modules"),
      description: t("projects.seamlessDataFlowConnectingGovernance", "Seamless data flow connecting governance, banking, credit, procurement, cold storage, retail, and payroll."),
    },
    {
      icon: <Lock className="w-6 h-6 text-[#008579]" />,
      title: t("projects.secureRoleBasedAccess", "Secure Role-Based Access"),
      description: t("projects.militaryGrade256BitSsl", "Military-grade 256-bit SSL encryption with granular permission controls for directors, managers, and field staff."),
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-[#008579]" />,
      title: t("projects.realTimeReports", "Real-Time Reports"),
      description: t("projects.instantFinancialLedgersAuditRegisters", "Instant financial ledgers, audit registers, balance sheets, and statutory returns ready for inspection."),
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#008579]" />,
      title: t("projects.webMobileAccessibility", "Web & Mobile Accessibility"),
      description: t("projects.accessible247AcrossModern", "Accessible 24/7 across modern desktop browsers, tablets, and field mobile devices with zero lag."),
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Banner with Breadcrumbs */}
      <PageBanner
        title={t("projects.enterpriseErpSolutions", "Enterprise ERP Solutions")}
        subtitle={t("projects.empoweringMultiStateCoOperative", "Empowering Multi-State Co-operative Societies with integrated cloud technology for governance, banking, agriculture, and operations.")}
        breadcrumbs={[{ name: 'Projects & ERP Solutions' }]}
        image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80"
      />

      {/* =====================================================================
          HERO SECTION: Integrated Solutions for Every Business Operation
         ===================================================================== */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/80 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-teal-50/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-amber-50/50 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading, Description & CTA */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-[#008579] text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#008579]"></span>
                <span>{t("projects.nextGenCoOperativeErp", "Next-Gen Co-operative ERP Architecture")}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-bold text-slate-900 tracking-tight leading-[1.18]">
                {t("projects.integratedSolutionsForEveryBusiness", "Integrated Solutions for Every Business Operation")}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {t("projects.exploreOurComprehensiveErpSolutions", "Explore our comprehensive ERP solutions designed to simplify management, streamline operations and connect every level of your organisation. From corporate governance and banking folios to harvest procurement, warehouse logistics, and retail billing.")}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={scrollToSolutions}
                  className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#008579] hover:bg-[#007469] active:bg-[#006359] text-white font-semibold text-base shadow-lg shadow-teal-900/15 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <span>{t("projects.exploreOurSolutions", "Explore Our Solutions")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {onOpenEnquiry && (
                  <button
                    type="button"
                    onClick={() => onOpenEnquiry({ title: i18n.t("projects.erpSolutionsDemoRequest", "ERP Solutions Demo Request") })}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
                  >
                    <span>{t("projects.requestPlatformDemo", "Request Platform Demo")}</span>
                  </button>
                )}
              </div>

              {/* Quick stats banner */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-100 max-w-lg">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">12</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">{t("projects.integratedModules", "Integrated Modules")}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#008579]">4</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">{t("projects.coreFunctionalPillars", "Core Functional Pillars")}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#ffba00]">100%</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">{t("projects.coOpCompliance", "Co-op Compliance")}</div>
                </div>
              </div>

            </div>

            {/* Right Column: High-Grade Business Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Visual Image Card with subtle tilt shadow */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15 border-4 border-white bg-white">
                  <ProjectImage
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80"
                    alt={t("projects.aurumfxEnterpriseErpDashboardAnd", "AurumFX Enterprise ERP Dashboard and Digital Analytics")}
                    className="w-full h-80 sm:h-96 object-cover object-center"
                  />
                  
                  {/* Subtle gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {/* Floating card caption */}
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#ffba00] text-slate-950 text-xs font-bold uppercase tracking-wider mb-1.5">
                      {t("projects.unifiedCommand", "Unified Command")}
                    </span>
                    <h3 className="text-lg font-bold">{t("projects.multiStateSocietyErpSuite", "Multi-State Society ERP Suite")}</h3>
                    <p className="text-xs text-slate-200 mt-0.5">{t("projects.realTimeLedgerSyncAcross", "Real-time ledger sync across 100+ branches & agro centres")}</p>
                  </div>
                </div>

                {/* Floating badge top-left */}
                <div className="absolute -top-4 -left-4 sm:-top-5 sm:-left-5 bg-white rounded-2xl shadow-xl p-3.5 sm:p-4 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#008579]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t("projects.256BitSsl", "256-Bit SSL")}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{t("projects.encryptedBankingHub", "Encrypted Banking Hub")}</div>
                  </div>
                </div>

                {/* Floating badge bottom-right */}
                <div className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 bg-slate-900 text-white rounded-2xl shadow-xl p-3.5 sm:p-4 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ffba00]/20 flex items-center justify-center text-[#ffba00]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t("projects.realTimeMis", "Real-Time MIS")}</div>
                    <div className="text-[11px] text-slate-300 font-medium">{t("projects.automatedLedgerAudits", "Automated Ledger Audits")}</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          PROJECT CATEGORIES SECTION (12 Individual Cards in Responsive Grid)
         ===================================================================== */}
      <section id="solutions-grid" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 bg-teal-100/70 text-[#008579] rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3">
              {t("projects.comprehensiveErpPortfolio", "Comprehensive ERP Portfolio")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {t("projects.12IntegratedModulesBuiltFor", "12 Integrated Modules Built for Cooperative Scale")}
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t("projects.everyBusinessActivityFromAdministrative", "Every business activity—from administrative board oversight to field crop procurement—interconnected through a single, secure cloud platform.")}
            </p>
          </div>

          {/* Group Filter Tabs & Search Bar */}
          <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGroup === 'all'
                    ? 'bg-[#008579] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {t("projects.allSolutions12", "All Solutions (12)")}
              </button>

              {PROJECT_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedGroup === group.id
                      ? 'bg-[#008579] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {getGroupIcon(group.id)}
                  <span>{group.title}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("projects.searchErpModules", "Search ERP modules...")}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008579] focus:ring-2 focus:ring-teal-100 transition-all shadow-xs"
              />
            </div>

          </div>

          {/* Project Cards Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">{t("projects.noMatchingErpSolutionsFound", "No matching ERP solutions found")}</h3>
              <p className="text-sm text-slate-500 mt-1">{t("projects.tryAdjustingYourSearchCriteria", "Try adjusting your search criteria or resetting filters.")}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-[#008579] text-white rounded-xl text-xs font-semibold hover:bg-[#007469] cursor-pointer"
              >
                {t("blog.resetFilters", "Reset Filters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Card Image Container with Consistent Aspect Ratio */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
                    <ProjectImage
                      src={project.image}
                      alt={project.imageAlt || project.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Group Badge Tag */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 backdrop-blur-xs shadow-sm border border-slate-100">
                        {getGroupIcon(project.groupId)}
                        <span>{project.group}</span>
                      </span>
                    </div>

                    {/* Arrow Button Overlay */}
                    <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 group-hover:bg-[#ffba00] text-slate-900 flex items-center justify-center shadow-md transition-colors duration-200">
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    
                    {/* Title */}
                    <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-[#008579] transition-colors leading-snug">
                      {project.title}
                    </h3>

                    {/* Short Description */}
                    <p className="mt-2.5 text-sm text-slate-600 leading-relaxed flex-1">
                      {project.description}
                    </p>

                    {/* Card Footer: Explore More Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-[#008579] group-hover:text-[#007068]">
                      <span>{t("projects.exploreModuleCapabilities", "Explore Module Capabilities")}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* =====================================================================
          WHY CHOOSE OUR ERP SOLUTIONS? SECTION
         ===================================================================== */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3">
              {t("projects.builtForScaleSecurity", "Built for Scale & Security")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {t("projects.whyChooseOurErpSolutions", "Why Choose Our ERP Solutions?")}
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t("projects.standardCommercialSoftwareFallsShort", "Standard commercial software falls short when managing multi-state agricultural cooperatives. Our platform was purpose-engineered around cooperative statutory requirements.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseReasons.map((item, idx) => (
              <div
                key={idx}
                className="p-7 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/70 hover:border-teal-200 hover:bg-teal-50/20 hover:shadow-md transition-all duration-200"
              >
                <div className="w-13 h-13 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =====================================================================
          FINAL CTA SECTION: Ready to Transform Your Business Operations?
         ===================================================================== */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#161c28] via-[#1a2332] to-[#0f141d] text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#00b4a7]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#ffba00]/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <span className="inline-block px-3.5 py-1 bg-white/10 text-[#ffba00] border border-white/10 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4">
            {t("projects.transformYourCooperativeEcosystem", "Transform Your Cooperative Ecosystem")}
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            {t("projects.readyToTransformYourBusiness", "Ready to Transform Your Business Operations?")}
          </h2>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t("projects.discoverHowOurIntegratedErp", "Discover how our integrated ERP solutions can simplify your organisation's daily operations. Schedule a tailored presentation with our enterprise banking and cooperative technology specialists.")}
          </p>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#ffba00] hover:bg-[#e6a800] active:bg-[#cc9500] text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all cursor-pointer"
            >
              <span>{t("projectDetail.contactUs", "Contact Us")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {onOpenEnquiry && (
              <button
                type="button"
                onClick={() => onOpenEnquiry({ title: i18n.t("projects.scheduleErpConsultation", "Schedule ERP Consultation") })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
              >
                <span>{t("projects.scheduleConsultation", "Schedule Consultation")}</span>
              </button>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00b4a7]" />
              <span>{t("projects.dedicatedOnPremiseCloudHosting", "Dedicated On-Premise & Cloud Hosting")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#ffba00]" />
              <span>{t("projects.fullDataMigrationSupport", "Full Data Migration Support")}</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
