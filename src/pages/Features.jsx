import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Layers,
  Check,
  X,
  Target,
  Percent,
  CalendarClock,
  FileText,
  Vote,
  Landmark,
  Building2
} from 'lucide-react';
import PageBanner from '../components/PageBanner';
import { SERVICES, SOCIETY_INFO } from '../data/societyData';


/* -------------------------------------------------------------------------
   Helpers
   Theme: teal (#00b4a7) + white only. Slate is used just for text/borders.
   ------------------------------------------------------------------------- */

// Pop-up reveal: scales and slides in once when scrolled into view.
function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1.2,0.36,1)] will-change-transform ${
        shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

// Image with a soft teal fallback so a broken link never leaves a gap.
function Img({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-teal-50 to-teal-200 ${className}`}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const u = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Picks a fitting photo for a service from its category/title; falls back to a rotating pool.
const KEYWORD_IMAGES = [
  [/thrift|deposit|saving/, u('photo-1579621970563-ebec7560ff3e')],
  [/agri|farm|crop|kisan|harvest/, u('photo-1625246333195-78d9c38ad449')],
  [/dairy|livestock|cattle/, u('photo-1500595046743-cd271d694d30')],
  [/business|enterprise|msme|trade|shop/, u('photo-1554224155-6726b3ff858f')],
  [/home|housing|house/, u('photo-1560520653-9e0e4c89eb11')],
  [/self.?help|shg|group|women/, u('photo-1521791136064-7986c2920216')],
  [/education|student|school/, u('photo-1523240795612-9a054b0db644')]
];
const FALLBACK_IMAGES = [
  u('photo-1500382017468-9049fed747ef'),
  u('photo-1573164713714-d95e436ab8d6'),
  u('photo-1556761175-5973dc0f32e7'),
  u('photo-1450101499163-c8848c66ca85'),
  u('photo-1563013544-824ae1b704d3'),
  u('photo-1574943320219-553eb213f72d')
];
function pickImage(item, index) {
  if (item.image) return item.image;
  const text = `${item.category || ''} ${item.title || ''}`.toLowerCase();
  const hit = KEYWORD_IMAGES.find(([re]) => re.test(text));
  return hit ? hit[1] : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

/* -------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------- */

const steps = [
  {
    step: '01',
    title: i18n.t("features.submitSocietyMembershipApplication", "Submit Society Membership Application"),
    desc: 'Fill out the standard member entry folio with identity verification and basic applicant details.',
    image: u('photo-1450101499163-c8848c66ca85', 700)
  },
  {
    step: '02',
    title: i18n.t("features.schemeSelectionCounseling", "Scheme Selection & Counseling"),
    desc: 'Consult with society counter officers to select the agricultural or enterprise scheme matching your need.',
    image: u('photo-1521791136064-7986c2920216', 700)
  },
  {
    step: '03',
    title: i18n.t("features.promptCommitteeReview", "Prompt Committee Review"),
    desc: 'Transparent scrutiny conducted under society bye-laws ensuring democratic, non-discriminatory approval.',
    image: u('photo-1552664730-d307ca884978', 700)
  },
  {
    step: '04',
    title: i18n.t("features.directDisbursalAccountCredit", "Direct Disbursal & Account Credit"),
    desc: 'Funds disbursed swiftly into member accounts with clear, flexible repayment schedules.',
    image: u('photo-1579621970563-ebec7560ff3e', 700)
  }
];

const comparison = [
  {
    icon: Target,
    label: i18n.t("features.primaryObjective", "Primary Objective"),
    coop: 'Member Welfare & Growth',
    other: 'Corporate Shareholder Profit'
  },
  {
    icon: Percent,
    label: i18n.t("features.prepaymentPenalty", "Prepayment Penalty"),
    coop: 'Zero Penalty on Foreclosure',
    other: 'Often 2% – 5% Foreclosure Fees'
  },
  {
    icon: CalendarClock,
    label: i18n.t("features.harvestCycleFlexibility", "Harvest Cycle Flexibility"),
    coop: 'Custom Seasonal Schedules',
    other: 'Rigid Fixed Monthly EMIs'
  },
  {
    icon: FileText,
    label: i18n.t("features.hiddenExtraCharges", "Hidden / Extra Charges"),
    coop: 'Transparent Statutory Bye-laws',
    other: 'Processing, Admin & Penal Add-ons'
  },
  {
    icon: Vote,
    label: i18n.t("features.votingVoice", "Voting & Voice"),
    coop: 'One Member, One Vote',
    other: 'No Say in Institutional Policy'
  }
];

export default function Features({ onOpenEnquiry }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white">
      {/* Page Banner */}
      <PageBanner
        title={t("features.bannerTitle", "Features & Modern Banking ERP")}
        subtitle={t("features.bannerDesc", "Comprehensive digital banking infrastructure tailored for multi-state agro cooperatives.")}
        breadcrumbs={[{ name: t("nav.features", "Features") }]}
        image="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
      />

      {/* ===================== Services (image cards) ===================== */}
      <section className="relative overflow-hidden bg-[#f5f7fb] py-20 lg:py-28">

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#00b4a7]">
              {t("features.coreOfferings", "Core Offerings")}
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {t("home.aboutTitle", "Committed to Empowering Rural & Semi-Urban Growth")}
            </h2>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              {t("features.exploreTheDistinguishingFeaturesThat", "Explore the distinguishing features that make")}{' '}
              <strong>{SOCIETY_INFO.shortName}</strong> {t("features.aTrustedPartnerForFarmers", "a trusted partner for farmers, families, and agro-enterprises.")}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((item, idx) => (
              <Reveal key={item.id} delay={(idx % 3) * 120} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00b4a7] hover:shadow-xl hover:shadow-teal-100">
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-teal-50">
                    <Img
                      src={pickImage(item, idx)}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00b4a7]/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#008f85] shadow">
                      {item.category}
                    </span>
                    {/* Floating icon badge */}
                    <span className="absolute -bottom-0 right-5 flex h-12 w-12 translate-y-1/2 items-center justify-center rounded-xl bg-[#00b4a7] text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Layers className="h-5 w-5" />
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-7 pt-9">
                    <h3 className="mb-3 font-serif text-xl font-bold text-slate-900 transition-colors group-hover:text-[#00b4a7]">
                      {item.title}
                    </h3>
                    <p className="mb-6 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>

                    <div className="space-y-2.5 border-t border-slate-100 pt-4">
                      {item.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#00b4a7]" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6">
                      <button
                        onClick={() => onOpenEnquiry(item)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#00b4a7] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#008f85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b4a7]"
                      >
                        <span>{t("features.requestSchemeInformation", "Request Scheme Information")}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Cooperative vs Commercial ================= */}
      <section className="border-y border-slate-200 bg-[#f2f2f0] py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-[#00b4a7]">
              {t("features.whyCooperativesStandApart", "Why cooperatives stand apart")}
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              {t("features.cooperativeMembershipVsCommercialLending", "Cooperative Membership vs. Commercial Lending")}
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th scope="col" className="w-[32%] px-6 py-5 text-sm font-semibold text-slate-500">
                        {t("features.serviceDimension", "Service dimension")}
                      </th>
                      <th scope="col" className="w-[36%] bg-[#00b4a7] px-6 py-5 text-sm font-semibold text-white">
                        <span className="flex items-center gap-2.5">
                          <Landmark className="h-4 w-4" />
                          {t("features.aurumfxCooperative", "Aurumfx Cooperative")}
                        </span>
                      </th>
                      <th scope="col" className="w-[32%] bg-slate-100 px-6 py-5 text-sm font-semibold text-slate-500">
                        <span className="flex items-center gap-2.5">
                          <Building2 className="h-4 w-4" />
                          {t("features.traditionalLenders", "Traditional Lenders")}
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {comparison.map((row) => {
                      const Icon = row.icon;
                      return (
                        <tr
                          key={row.label}
                          className="group border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                        >
                          <th scope="row" className="px-6 py-4 align-middle">
                            <span className="flex items-center gap-3.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#00b4a7]/10 group-hover:text-[#00b4a7]">
                                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                              </span>
                              <span className="text-sm font-semibold text-slate-800">
                                {row.label}
                              </span>
                            </span>
                          </th>

                          <td className="bg-[#00b4a7]/[0.04] px-6 py-4 align-middle">
                            <span className="flex items-start gap-2.5 text-sm font-medium text-[#007a70]">
                              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#00b4a7] text-white">
                                <Check className="h-3 w-3" strokeWidth={3.5} />
                              </span>
                              {row.coop}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            <span className="flex items-start gap-2.5 text-sm text-slate-500">
                              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                                <X className="h-3 w-3" strokeWidth={3.5} />
                              </span>
                              {row.other}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================= 4-step process ========================= */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#00b4a7]">
              {t("features.simpleTransparent", "Simple & Transparent")}
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              {t("features.howToAvailCooperativeFacilities", "How to Avail Cooperative Facilities")}
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              {t("features.weHaveStreamlinedTheApplication", "We have streamlined the application and member onboarding journey for maximum speed and simplicity.")}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((st, i) => (
              <Reveal key={st.step} delay={i * 130} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00b4a7] hover:shadow-xl hover:shadow-teal-100">
                  <div className="relative h-40 overflow-hidden bg-teal-50">
                    <Img
                      src={st.image}
                      alt={st.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[#00b4a7]/25 mix-blend-multiply" />
                    <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white font-serif text-lg font-black text-[#00b4a7] shadow-lg">
                      {st.step}
                    </span>
                  </div>
                  <div className="p-6">
                    <h4 className="mb-2 font-serif text-base font-bold text-slate-900">
                      {st.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {st.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ Bottom CTA ============================ */}
      <section className="relative overflow-hidden bg-[#00b4a7] py-16">
        <Img
          src={u('photo-1500382017468-9049fed747ef', 1600)}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-25 [mask-image:linear-gradient(to_left,black,transparent)] md:block"
        />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h3 className="mb-3 font-serif text-2xl font-bold text-white sm:text-3xl">
              {t("features.readyToExploreOurMember", "Ready to explore our member-first facilities?")}
            </h3>
            <p className="mx-auto mb-7 max-w-xl text-sm text-teal-50 sm:text-base">
              {t("features.submitAnEnquiryOrDrop", "Submit an enquiry or drop by our registered office at Antony Master Square, Kunnathangadi, Veluthur P.O., Thrissur.")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => onOpenEnquiry({ title: i18n.t("features.featureEnquiry", "Feature Enquiry") })}
                className="cursor-pointer rounded-lg bg-white px-7 py-3 text-sm font-bold text-[#008f85] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t("features.contactMemberDesk", "Contact Member Desk")}
              </button>
              <Link
                to="/loans"
                className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#008f85]"
              >
                {t("features.browseLoanSchemes", "Browse Loan Schemes")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}