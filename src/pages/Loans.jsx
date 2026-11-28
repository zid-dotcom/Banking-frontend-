import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Plus,
  Phone,
  UserCheck,
  ClipboardList,
  Percent,
  Sprout
} from 'lucide-react';
import PageBanner from '../components/PageBanner';
import LoanCalculator from '../components/LoanCalculator';
import { SOCIETY_INFO } from '../data/societyData';


/* -------------------------------------------------------------------------
   Helpers
   Theme: teal (#00b4a7) + white, with light greys for section backgrounds.
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

// One photo per loan scheme (keyed by the scheme id)
const LOAN_IMAGES = {
  'agro-crop': u('photo-1625246333195-78d9c38ad449'),
  'msme-enterprise': u('photo-1556761175-5973dc0f32e7'),
  'machinery-equipment': u('photo-1574943320219-553eb213f72d'),
  'gold-secured': u('photo-1579621970563-ebec7560ff3e'),
  'dairy-allied': u('photo-1500595046743-cd271d694d30'),
  'thrift-personal': u('photo-1573164713714-d95e436ab8d6')
};

/* -------------------------------------------------------------------------
   Content
   ------------------------------------------------------------------------- */

const loanCategories = [
  {
    id: 'agro-crop',
    title: i18n.t("loans.seasonalAgroCropCultivationLoan", "Seasonal Agro & Crop Cultivation Loan"),
    badge: 'Priority Agricultural Scheme',
    description: i18n.t("loans.shortToMediumTermCredit", "Short to medium-term credit tailored to finance seasonal inputs such as seeds, natural fertilizers, pest control, irrigation, and labor expenses."),
    tenure: '6 to 24 Months (Aligned to Harvest)',
    documents: ['Society Membership Pass', 'Aadhaar / Voter ID', 'Land Holding / Lease Details', 'Crop Plan Declaration'],
    features: ['Disbursed in tranches if required', 'Repayable post-harvest sale', 'No prepayment penalty']
  },
  {
    id: 'msme-enterprise',
    title: i18n.t("loans.ruralMsmeEnterpriseWorkingCapital", "Rural MSME & Enterprise Working Capital"),
    badge: 'Small Business Growth',
    description: i18n.t("loans.termAndRevolvingCreditFor", "Term and revolving credit for local retailers, spice processors, agro-commodity traders, and cottage manufacturing enterprises in rural and semi-urban belts."),
    tenure: '12 to 60 Months',
    documents: ['Society Membership Number', 'Identity & Address Proof', 'Business Trade / Registration Proof', 'Bank Statement (Last 6 Months)'],
    features: ['Structured working capital lines', 'Flexible quarterly or monthly review', 'Fast local committee sanctions']
  },
  {
    id: 'machinery-equipment',
    title: i18n.t("loans.farmMechanizationMachineryFinance", "Farm Mechanization & Machinery Finance"),
    badge: 'Asset Modernization',
    description: i18n.t("loans.longerTenureFinancingToAcquire", "Longer-tenure financing to acquire tractors, power tillers, solar irrigation sets, harvesters, and cold chain equipment for enhanced agricultural productivity."),
    tenure: '12 to 84 Months',
    documents: ['Society Membership Verification', 'Identity & Address Proof', 'Equipment Quotation / Proforma Invoice', 'Land Revenue Records'],
    features: ['Hypothecation of asset', 'Direct supplier settlement', 'Competitive cooperative terms']
  },
  {
    id: 'gold-secured',
    title: i18n.t("loans.instantSecuredGoldLoanFacility", "Instant Secured Gold Loan Facility"),
    badge: 'Immediate Disbursal',
    description: i18n.t("loans.emergencyAndSeasonalCreditAgainst", "Emergency and seasonal credit against gold ornaments evaluated by certified appraisers, stored in insured bank-grade society vaults."),
    tenure: '3 to 12 Months (Renewable)',
    documents: ['Society Membership Form', 'Government Photo ID Proof', 'Gold Ornaments for Appraisal'],
    features: ['Sanctioned within 30-45 minutes', 'High per-gram valuation', 'Insured safety custody']
  },
  {
    id: 'dairy-allied',
    title: i18n.t("loans.dairyAlliedAnimalHusbandryLoan", "Dairy & Allied Animal Husbandry Loan"),
    badge: 'Allied Agriculture',
    description: i18n.t("loans.dedicatedFinancialAssistanceToProcure", "Dedicated financial assistance to procure milch cattle, shed construction, feed supply, and chilling equipment for dairy farming families."),
    tenure: '12 to 36 Months',
    documents: ['Society Membership Card', 'Identity Proof', 'Veterinary Health & Purchase Certificate'],
    features: ['Lactation cycle synchronized repayments', 'Livestock insurance facilitation', 'Direct milk society linkages']
  },
  {
    id: 'thrift-personal',
    title: i18n.t("loans.memberThriftEmergencyAssistance", "Member Thrift & Emergency Assistance"),
    badge: 'Member Welfare',
    description: i18n.t("loans.cleanPersonalCreditFacilityAvailable", "Clean personal credit facility available exclusively for standing registered cooperative members to meet educational, medical, or family requirements."),
    tenure: '12 to 36 Months',
    documents: ['Society Membership Record', 'Two Member Co-signatories / Guarantees', 'Income / KYC Documents'],
    features: ['Clean member credit line', 'Nominal administration processing', 'Transparent statutory terms']
  }
];

const faqs = [
  {
    q: 'Who is eligible to apply for loans at Aurumfx?',
    a: 'Any person who is an admitted registered member of Aurumfx Multi State Agro Co-operative Society Limited and fulfills the criteria outlined in society bye-laws can apply for loan schemes.'
  },
  {
    q: 'What is the procedure to become a member before borrowing?',
    a: 'Membership is straightforward: submit the prescribed membership admission form along with standard KYC documents (Aadhaar/Voter ID, PAN) and the nominal share capital subscription at our establishment counter in Antony Master Square, Kunnathangadi, Thrissur.'
  },
  {
    q: 'Are there any hidden processing charges or foreclosing fees?',
    a: 'No. Unlike conventional commercial banks, cooperative societies do not levy hidden fees or prepayment penalties. All applicable statutory processing costs are explicitly detailed upfront under society guidelines.'
  },
  {
    q: 'Can agricultural loan repayments be synchronized with crop harvests?',
    a: 'Yes. Our agricultural loan schemes are specifically designed to accommodate agricultural cash-flow patterns, allowing farmers to schedule repayments following the sale of their seasonal yield.'
  }
];

// One icon per FAQ, in the same order as the list above
const faqIcons = [UserCheck, ClipboardList, Percent, Sprout];

/* -------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------- */

export default function Loans({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="bg-white">
      {/* Banner: calculator and loan papers */}
      <PageBanner
        title={t("loans.bannerTitle", "Cooperative Credit & Loan Schemes")}
        subtitle={t("loans.bannerDesc", "Tailored financing with zero hidden fees and member-first interest rates.")}
        breadcrumbs={[{ name: t("nav.loans", "Loans") }]}
        image="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=1920&q=80"
      />

      {/* ======================= Loan schemes (image cards) ======================= */}
      <section className="bg-[#f5f7fb] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-16 max-w-3xl text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#00b4a7]">
              {t("loans.creditCategories", "Credit Categories")}
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              {t("loans.flexibleLoanSolutionsForEvery", "Flexible Loan Solutions for Every Agrarian & Commercial Need")}
            </h2>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">
              {t("loans.allLoanProductsAreGoverned", "All loan products are governed by the democratic bye-laws of")}{' '}
              <strong>{SOCIETY_INFO.fullName}</strong>{t("loans.reviewOurCategoriesBelowAnd", ". Review our categories below and submit an enquiry for counter processing.")}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loanCategories.map((loan, idx) => (
              <Reveal key={loan.id} delay={(idx % 3) * 120} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00b4a7] hover:shadow-xl hover:shadow-slate-200">
                  {/* Photo */}
                  <div className="relative h-48 overflow-hidden bg-teal-50">
                    <Img
                      src={LOAN_IMAGES[loan.id]}
                      alt={loan.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00b4a7]/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#008f85] shadow">
                      {loan.badge}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="mb-3 font-serif text-xl font-bold text-slate-900 transition-colors group-hover:text-[#00b4a7]">
                      {loan.title}
                    </h3>

                    <p className="mb-5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {loan.description}
                    </p>

                    <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00b4a7]/10 text-[#00b4a7]">
                        <Clock className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </span>
                      <div>
                        <span className="block text-xs text-slate-500">{t("loans.availableTenure", "Available tenure")}</span>
                        <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                          {loan.tenure}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <span className="block text-xs font-bold text-slate-700">{t("loans.keyHighlights", "Key highlights")}</span>
                      {loan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#00b4a7]" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto border-t border-slate-100 pt-4">
                      <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-[#00b4a7]" />
                        {t("loans.requiredDocuments", "Required documents")}
                      </span>
                      <ul className="space-y-1 text-xs text-slate-500">
                        {loan.documents.map((doc) => (
                          <li key={doc} className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <button
                      onClick={() => onOpenEnquiry(loan)}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#00b4a7] px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#008f85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b4a7]"
                    >
                      <span>{t("loans.applyForThisScheme", "Apply for this Scheme")}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== Loan calculator ========================== */}
      <section className="border-y border-slate-200 bg-[#f2f2f0] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#00b4a7]">
              {t("loans.emiSimulation", "EMI Simulation")}
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              {t("loans.calculateYourLoanCommitment", "Calculate Your Loan Commitment")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("loans.adjustAmountAndTenureTo", "Adjust amount and tenure to estimate your monthly outflow before visiting the society branch.")}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <LoanCalculator onOpenEnquiry={onOpenEnquiry} />
          </Reveal>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
          {/* Left: intro panel */}
          <Reveal className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl bg-[#00b4a7] p-8 text-white sm:p-10">
              <Img
                src={u('photo-1573164713714-d95e436ab8d6', 900)}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
              />
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-white/10" />

              <div className="relative">
                <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white">
                  {t("loans.commonInquiries", "Common inquiries")}
                </span>
                <h2 className="mt-5 font-serif text-3xl font-bold leading-tight sm:text-4xl">
                  {t("loans.frequentlyAskedQuestions", "Frequently Asked Questions")}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-teal-50 sm:text-base">
                  {t("loans.essentialClarityForMembersRegarding", "Essential clarity for members regarding lending policies and documentation.")}
                </p>

                <div className="mt-8 rounded-2xl bg-white p-5 text-slate-800 shadow-lg">
                  <p className="text-sm font-semibold text-slate-900">
                    {t("loans.stillHaveAQuestion", "Still have a question?")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {t("loans.askAboutCustomizedAgriculturalFinancing", "Ask about customized agricultural financing or share capital requirements.")}
                  </p>

                  <a
                    href={`tel:${SOCIETY_INFO.phoneRaw}`}
                    className="mt-4 flex items-center gap-3 text-sm font-semibold text-[#008f85] hover:underline"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00b4a7]/10">
                      <Phone className="h-4 w-4" />
                    </span>
                    {SOCIETY_INFO.phone}
                  </a>

                  <button
                    onClick={() => onOpenEnquiry({ title: i18n.t("loans.specializedLoanQuery", "Specialized Loan Query") })}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#00b4a7] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#008f85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b4a7]"
                  >
                    <span>{t("loans.speakWithACreditOfficer", "Speak with a Credit Officer")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: accordion */}
          <div className="space-y-4 lg:col-span-7">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const Icon = faqIcons[index % faqIcons.length];
              return (
                <Reveal key={faq.q} delay={index * 90}>
                  <div
                    className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                      isOpen
                        ? 'border-[#00b4a7]/40 shadow-xl shadow-slate-200/70'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* accent bar */}
                    <span
                      className={`absolute inset-y-0 left-0 w-1 bg-[#00b4a7] transition-opacity duration-300 ${
                        isOpen ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center gap-4 p-5 text-left sm:p-6"
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                          isOpen ? 'bg-[#00b4a7] text-white' : 'bg-[#f2f2f0] text-slate-500'
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>

                      <span className="flex-1 font-serif text-base font-bold leading-snug text-slate-900 sm:text-lg">
                        {faq.q}
                      </span>

                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isOpen
                            ? 'rotate-45 border-[#00b4a7] bg-[#00b4a7] text-white'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>

                    {/* Smooth height animation */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-6 text-sm leading-relaxed text-slate-600 sm:pl-[5.5rem] sm:pr-8">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}