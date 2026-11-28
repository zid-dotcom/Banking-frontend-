import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  Landmark,
  Tractor,
  ShieldCheck,
  Layers,
  PhoneCall,
  Calendar,
  ExternalLink,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import PageBanner from '../components/PageBanner';
import { PROJECTS, getProjectBySlug } from '../data/projectsData';


function DetailImage({ src, alt, className = '' }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-teal-50 via-slate-100 to-teal-100 flex items-center justify-center ${className}`}
      >
        <Building2 className="w-16 h-16 text-[#008579]/40" />
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

export default function ProjectDetail({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();

  const project = getProjectBySlug(slug);

  // If slug is not found
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 pt-36 pb-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t("projectDetail.notFoundTitle", "Project Not Found")}
          </h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            {t("projectDetail.notFoundDescription", "The ERP project or module you are looking for does not exist or may have been relocated.")}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#008579] hover:bg-[#007469] text-white font-semibold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("projectDetail.backToAllProjects", "Back to All Projects")}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Find index for Next & Previous project navigation
  const currentIndex = PROJECTS.findIndex((p) => p.slug === project.slug);
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject = currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : null;

  // Other projects in the same group
  const relatedProjects = PROJECTS.filter(
    (p) => p.group === project.group && p.slug !== project.slug
  ).slice(0, 3);

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

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <PageBanner
        title={project.title}
        subtitle={project.description}
        breadcrumbs={[
          { name: t("projectDetail.breadcrumbProjects", "Projects & ERP Solutions"), path: '/projects' },
          { name: project.title },
        ]}
        image={project.image}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#008579] hover:text-[#007068] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("projectDetail.backToAllErpProjects", "Back to All ERP Projects")}</span>
          </Link>
        </div>

        {/* Project Header Block */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-sm mb-12">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-teal-50 text-[#008579] border border-teal-200">
                {getGroupIcon(project.groupId)}
                <span>{project.group}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onOpenEnquiry ? (
                <button
                  type="button"
                  onClick={() => onOpenEnquiry({ title: t("projectDetail.demoRequestTitle", "Demo Request: {title}", { title: project.title }) })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008579] hover:bg-[#007469] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{t("projectDetail.requestDemo", "Request a Demo")}</span>
                </button>
              ) : (
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008579] hover:bg-[#007469] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <span>{t("projectDetail.contactUs", "Contact Us")}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Grid: Overview Text + Hero Media */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
                {project.title}
              </h2>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                {project.description}
              </p>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {project.overview}
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#008579]" />
                  <span>{t("projectDetail.compliantBadge", "Co-operative Act Compliant")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#008579]" />
                  <span>{t("projectDetail.auditLogsBadge", "Automated Audit Logs")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#008579]" />
                  <span>{t("projectDetail.roleBasedAccessBadge", "Role-Based Access")}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-slate-100">
                <DetailImage
                  src={project.image}
                  alt={project.imageAlt || project.title}
                  className="w-full h-72 sm:h-80 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffba00]">
                    {t("projectDetail.enterpriseSolutionArchitecture", "Enterprise Solution Architecture")}
                  </span>
                  <div className="text-sm font-semibold text-white/95 mt-0.5 truncate">
                    {project.title}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Section: Key Features & Capabilities */}
        <div className="mb-12">
          <div className="mb-6">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#008579]">
              {t("projectDetail.capabilitiesEyebrow", "Capabilities")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {t("projectDetail.keyFeaturesHeading", "Key Features & System Specifications")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.keyFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-teal-200 hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#008579] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm text-slate-700 leading-relaxed font-medium">
                  {feature}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Included Sub-Modules & Functionalities */}
        <div className="mb-12">
          <div className="mb-6">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#008579]">
              {t("projectDetail.architectureEyebrow", "Architecture")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {t("projectDetail.subModulesHeading", "Included Sub-Modules & Functionalities")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.modules.map((mod, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#ffba00] flex items-center justify-center font-bold text-sm">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-slate-900">
                    {mod.name}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Business Benefits */}
        <div className="mb-12 bg-gradient-to-br from-teal-900 via-[#008579] to-teal-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ffba00]">
              {t("projectDetail.strategicValueEyebrow", "Strategic Value")}
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mt-1">
              {t("projectDetail.businessBenefitsHeading", "Business Benefits for Your Co-operative")}
            </h3>
            <p className="text-sm sm:text-base text-teal-100 mt-2">
              {t("projectDetail.businessBenefitsSubtitle", "Transforming manual bureaucratic workflows into high-efficiency automated operations.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffba00] text-slate-950 flex items-center justify-center font-bold mb-4">
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Interactive Call-to-Action Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md text-center max-w-4xl mx-auto mb-16">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#008579] flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-7 h-7" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {t("projectDetail.readyToImplement", "Ready to Implement {title}?", { title: project.title })}
          </h3>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            {t("projectDetail.ctaDescription", "Connect with our technical architects for a deep-dive demonstration and custom deployment consultation tailored to your multi-state society's rules and branch footprint.")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {onOpenEnquiry ? (
              <button
                type="button"
                onClick={() => onOpenEnquiry({ title: t("projectDetail.scheduleDemoTitle", "Schedule Demo: {title}", { title: project.title }) })}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#008579] hover:bg-[#007469] active:bg-[#006359] text-white font-semibold text-sm sm:text-base shadow-md transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-[#ffba00]" />
                <span>{t("projectDetail.requestDemo", "Request a Demo")}</span>
              </button>
            ) : null}

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base shadow-md transition-all"
            >
              <PhoneCall className="w-4 h-4 text-[#ffba00]" />
              <span>{t("projectDetail.contactOurTeam", "Contact Our Team")}</span>
            </Link>
          </div>
        </div>

        {/* Related Modules in Same Group */}
        {relatedProjects.length > 0 && (
          <div className="mb-16">
            <h4 className="text-xl font-serif font-bold text-slate-900 mb-6">
              {t("projectDetail.otherModulesInGroup", "Other Modules in {group}", { group: project.group })}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/projects/${rel.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="w-full aspect-[16/9] overflow-hidden bg-slate-100">
                    <DetailImage
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h5 className="font-bold text-slate-900 group-hover:text-[#008579] transition-colors line-clamp-1">
                      {rel.title}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {rel.description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#008579]">
                      <span>{t("projectDetail.learnMore", "Learn more")}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Previous & Next Project Navigation */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-between gap-4">
          {prevProject ? (
            <Link
              to={`/projects/${prevProject.slug}`}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all text-left max-w-[45%]"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  {t("projectDetail.previousSolution", "Previous Solution")}
                </div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {prevProject.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextProject ? (
            <Link
              to={`/projects/${nextProject.slug}`}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all text-right ml-auto max-w-[45%]"
            >
              <div className="overflow-hidden">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  {t("projectDetail.nextSolution", "Next Solution")}
                </div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {nextProject.title}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>

      </div>
    </div>
  );
}
