import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Sprout,
  Eye,
  Landmark
} from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';
import ramjithImg from '../assets/ramjith2.png';


/* -------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------- */

// Pop-up reveal: element scales/slides in once when it enters the viewport.
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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
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

// Image with a soft fallback so a broken link never leaves a hole in the layout.
function Img({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-amber-100 to-teal-100 ${className}`}
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

// Left/right padding for the hero. Match this to your header's logo padding.
const GUTTER = 'px-6 sm:px-10 lg:px-14 xl:px-[76px]';

const u = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* -------------------------------------------------------------------------
   Content
   ------------------------------------------------------------------------- */

const services = [
  {
    title: i18n.t("about.thriftDeposits", "Thrift deposits"),
    text: 'Save a little every month and earn better returns than a regular bank.',
    image: u('photo-1579621970563-ebec7560ff3e')
  },
  {
    title: i18n.t("about.agriLoans", "Agri loans"),
    text: 'Seasonal finance for seed, equipment and harvest, repaid when your crop sells.',
    image: u('photo-1625246333195-78d9c38ad449')
  },
  {
    title: i18n.t("about.businessLoans", "Business loans"),
    text: 'Working capital for small traders and shop owners in our community.',
    image: u('photo-1554224155-6726b3ff858f')
  },
  {
    title: i18n.t("about.selfHelpGroupCredit", "Self-help group credit"),
    text: 'Group lending that helps women and farmer collectives grow together.',
    image: u('photo-1521791136064-7986c2920216')
  },
  {
    title: i18n.t("about.homePersonalLoans", "Home & personal loans"),
    text: 'Clear terms and affordable instalments for the big moments in life.',
    image: u('photo-1560520653-9e0e4c89eb11')
  },
  {
    title: i18n.t("about.easyDigitalPayments", "Easy digital payments"),
    text: 'Pay instalments and check balances without a trip to the office.',
    image: u('photo-1563013544-824ae1b704d3')
  }
];

const ideals = [
  {
    icon: TrendingUp,
    title: i18n.t("about.ladders", "Ladders"),
    text: 'We give members an actionable path to move up and earn access to more capital at lower cooperative rates.'
  },
  {
    icon: Sprout,
    title: i18n.t("about.notChutes", "Not chutes"),
    text: 'Our model works only when members succeed: repaying seasonal farm loans on time and building lasting agricultural equity.'
  },
  {
    icon: Eye,
    title: i18n.t("about.transparency", "Transparency"),
    text: 'You set the exact terms you want before applying. No fine-print traps.'
  },
  {
    icon: Landmark,
    title: i18n.t("about.buildingCreditMatters", "Building credit matters"),
    text: 'We reward the actions that raise credit scores and strengthen thrift savings over time.'
  }
];

const benefits = [
  'We service the loans we originate directly',
  'No expensive retail offices or middle-men markups',
  'A full range of loan products and cooperative services'
];

const steps = [
  'Visit our office or send an enquiry online',
  'Complete your KYC and join as a member',
  'Start saving with a thrift deposit',
  'Apply for a loan with the terms you choose'
];

// NOTE: placeholder stock photos. Replace with real pictures from your society.
const gallery = [
  {
    title: i18n.t("about.farmersMeet", "Farmers' meet"),
    image: u('photo-1592982537447-7440770cbfc9', 900)
  },
  {
    title: i18n.t("about.loanCounselling", "Loan counselling"),
    image: u('photo-1573164713714-d95e436ab8d6', 900)
  },
  {
    title: i18n.t("about.harvestSeasonSupport", "Harvest season support"),
    image: u('photo-1464226184884-fa280b87c399', 900)
  },
  {
    title: i18n.t("about.selfHelpGroupSessions", "Self-help group sessions"),
    image: u('photo-1552664730-d307ca884978', 900)
  },
  {
    title: i18n.t("about.thriftCollection", "Thrift collection"),
    image: u('photo-1579621970563-ebec7560ff3e', 900)
  },
  {
    title: i18n.t("about.memberAwarenessCamps", "Member awareness camps"),
    image: u('photo-1531482615713-2afd69097998', 900)
  }
];

// NOTE: placeholder people and stock photos. Replace with your real team.
const teamMembers = [
  {
    id: 1,
    name: 'Mark Stivens',
    role: 'Head of Credit Operations',
    bio: 'Member credit operations, risk assessment and seasonal agricultural financing.',
    image: u('photo-1507003211169-0a1dd7228f2d', 700)
  },
  {
    id: 2,
    name: 'Linda Green',
    role: 'Chief Financial Officer',
    bio: 'Thrift deposits, audit compliance and multi-state statutory governance.',
    image: u('photo-1580489944761-15a19d654956', 700)
  },
  {
    id: 3,
    name: 'Roberta Brook',
    role: 'Senior Agro-Advisory Specialist',
    bio: 'Community outreach, self-help groups and agricultural loan guidance.',
    image: u('photo-1573497019940-1c28c88b4f3e', 700)
  }
];

/* -------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------- */

export default function About({ onOpenEnquiry }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white text-slate-900">
      {/* Keyframes for the few always-on motions (hero badges) */}
      <style>{`
        @keyframes aurum-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .aurum-float { animation: aurum-float 5s ease-in-out infinite; }
        .aurum-float-slow { animation: aurum-float 7s ease-in-out infinite; animation-delay: -2s; }
        @media (prefers-reduced-motion: reduce) { .aurum-float, .aurum-float-slow { animation: none; } }
      `}</style>

      {/* ============================ 1. HERO (original banner, aligned) ============================ */}
      <section className="relative overflow-hidden bg-slate-800 pt-36 pb-20 md:pt-44 md:pb-28">
        <img
          src={u('photo-1556761175-5973dc0f32e7', 1920)}
          alt={t("about.aboutUsAurumfx", "About Us AurumFX")}
          className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950/20" />

        {/* Same left gutter as the header logo so the title lines up with it */}
        <div className={`relative z-10 w-full ${GUTTER}`}>
          <Reveal>
            <h1 className="mb-3 font-serif text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-[56px]">
              {t("nav.about", "About")}
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <nav className="flex items-center gap-2 text-sm font-medium text-white/90 drop-shadow-sm">
              <Link to="/" className="transition-colors hover:text-white">
                {t("nav.home", "Home")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-white/70" />
              <span className="font-semibold text-[#ffc107]">{t("nav.about", "About")}</span>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* ======================= 2. LEADER + STORY ======================= */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-20 lg:px-8">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="mb-3 text-sm font-semibold text-[#00a89a]">{t("about.bannerTitle", "About Our Cooperative Society")}</p>
              <h2 className="font-serif text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-[44px]">
                {t("about.visionDesc", "To be India's premier multi-state agro cooperative, driving sustainable rural wealth and equitable financial dignity.")}
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 text-base leading-[1.75] text-slate-600">
                <strong className="text-slate-900">{SOCIETY_INFO.fullName}</strong>{' '}
                {t("about.wasEstablishedUnderTheMulti", "was established under the Multi-State Co-Operative Societies statutory framework with the vision of democratizing financial facilities for rural and semi-urban agricultural communities.")}
              </p>
              <p className="mt-4 text-base leading-[1.75] text-slate-600">
                {t("about.unlikeProfitSeekingCommercialLenders", "Unlike profit-seeking commercial lenders, we operate on cooperative, member-first principles. We return surpluses to our registered members through lower borrowing rates, higher thrift returns and community agro-development programs.")}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                <span className="h-12 w-1 rounded-full bg-[#00a89a]" />
                <div>
                  <p className="font-serif text-2xl font-bold italic">
                    {SOCIETY_INFO.employer}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("about.authorizedRepresentativeLeadership", "Authorized Representative / Leadership")}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={150} className="lg:col-span-6">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative overflow-hidden rounded-[2rem] bg-amber-50 shadow-2xl">
                <img
                  src={ramjithImg}
                  alt={SOCIETY_INFO.employer}
                  className="h-[460px] w-full object-cover object-top sm:h-[520px]"
                />
              </div>
              <div className="aurum-float-slow absolute -bottom-5 -left-3 rounded-2xl bg-white px-5 py-3 shadow-xl ring-1 ring-slate-100 sm:-left-8">
                <p className="font-serif text-lg font-bold leading-tight">
                  {SOCIETY_INFO.employer}
                </p>
                <p className="text-xs text-[#00877b]">{t("about.leadingTheSociety", "Leading the society")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== 3. SERVICES (image cards) ===================== */}
      <section id="services" className="bg-teal-50/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-[44px]">
              {t("about.everythingYouNeedFromA", "Everything you need from a bank, owned by you")}
            </h2>
            <p className="mt-3 text-slate-500">
              {t("about.simpleProductsWithHonestTerms", "Simple products with honest terms.")}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 120}>
                <article className="group h-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="h-52 overflow-hidden">
                    <Img
                      src={s.image}
                      alt={s.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {s.text}
                    </p>
                    <button
                      onClick={onOpenEnquiry}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#00877b] transition-colors hover:text-[#00a89a]"
                    >
                      {t("about.enquireNow", "Enquire now")}
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= 4. FOUR IDEALS ========================= */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-[44px]">
              {t("about.qualityCreditCreatesOpportunities", "Quality credit creates opportunities")}
            </h2>
            <p className="mt-3 text-slate-500">{t("about.ourProductsReflectFourIdeals", "Our products reflect four ideals")}</p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {ideals.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={(i % 2) * 120}>
                  <div className="group flex h-full gap-5 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-7 transition-all duration-300 hover:border-[#00a89a] hover:shadow-lg">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00a89a] text-white shadow-md shadow-teal-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="font-serif text-xl font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 4b. HOW MEMBERSHIP WORKS (teal photo banner) ================= */}
      <section className="relative overflow-hidden bg-[#00a89a] py-20 lg:py-28">
        <img
          src={u('photo-1522202176988-66273c2fd55f', 1920)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] brightness-110"
        />
        <div className="absolute inset-0 bg-[#00a89a]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#009688]/70 via-transparent to-[#009688]/40" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 xl:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-5">
              <p className="mb-3 text-base font-semibold text-[#ffc83b]">{t("about.joiningIsSimple", "Joining is simple")}</p>
              <h2 className="font-serif text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
                {t("about.fromFirstVisitToFirst", "From first visit to first loan in four steps")}
              </h2>
            </Reveal>

            <ol className="space-y-3.5 lg:col-span-7">
              {steps.map((text, i) => (
                <Reveal as="li" key={text} delay={120 + i * 120}>
                  <div className="flex items-center gap-4 border-l-4 border-[#ffc83b] bg-[#008f83]/65 px-6 py-4 backdrop-blur-[2px]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/80 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-white sm:text-base">{text}</span>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ================= 4c. GALLERY (medium images) ================= */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-[44px]">
              {t("about.ourCommunityAtWork", "Our community at work")}
            </h2>
            <p className="mt-3 text-slate-500">
              {t("about.momentsFromTheFieldsThe", "Moments from the fields, the office and the villages we serve.")}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 pb-10 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, i) => (
              <Reveal key={g.title} delay={(i % 3) * 120} className={i % 3 === 1 ? 'lg:mt-10' : ''}>
                <figure className="group relative overflow-hidden rounded-3xl bg-teal-50 shadow-sm">
                  <Img
                    src={g.image}
                    alt={g.title}
                    className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-72"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[#00a89a]/15 mix-blend-multiply" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#00a89a]/60 to-transparent" />
                  <figcaption className="absolute bottom-4 left-4">
                    <span className="inline-block rounded-full bg-white/95 px-4 py-1.5 text-sm font-semibold text-slate-800 shadow">
                      {g.title}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= 5. WHY CHOOSE (teal banner) ======================= */}
      <section className="relative overflow-hidden bg-[#00a89a] py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <img
            src={u('photo-1544005313-94ddf0286df2', 1800)}
            alt=""
            className="h-full w-full object-cover object-[center_30%] brightness-110 contrast-125 grayscale"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#009688]/85 via-[#00a89a]/70 to-[#009688]/85" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 xl:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-5">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#ffc83b]">
                {t("about.ourBenefits", "Our benefits")}
              </span>
              <h2 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                {t("about.whyChooseAurumfx", "Why choose aurumfx")}
              </h2>
            </Reveal>

            <ul className="space-y-3.5 lg:col-span-7">
              {benefits.map((b, i) => (
                <Reveal as="li" key={b} delay={150 + i * 120}>
                  <div className="flex items-center gap-4 border border-teal-300/30 bg-[#008f83]/70 px-6 py-4 transition-colors hover:bg-[#008f83]/90">
                    <CheckCircle2 className="h-6 w-6 shrink-0 stroke-[2.2] text-white" />
                    <span className="text-sm font-medium text-white sm:text-base">{b}</span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========================== 6. TEAM ========================== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-14 text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-[44px]">
              {t("about.meetTheTeam", "Meet the team")}
            </h2>
            <p className="mt-3 text-slate-500">{t("about.thePeopleWhoLookAfter", "The people who look after your money")}</p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {teamMembers.map((m, i) => (
              <Reveal key={m.id} delay={i * 130}>
                <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="h-72 overflow-hidden bg-slate-100">
                    <Img
                      src={m.image}
                      alt={m.name}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-serif text-xl font-bold">{m.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#00877b]">{m.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.bio}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== 7. JOIN CTA BAND ======================== */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#00a89a] to-[#19c2b2] px-8 py-14 sm:px-14">
            <Img
              src={u('photo-1574943320219-553eb213f72d', 1400)}
              alt=""
              className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-25 [mask-image:linear-gradient(to_left,black,transparent)] md:block"
            />
            <div className="relative max-w-xl">
              <h2 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">
                {t("about.readyToBecomeAMember", "Ready to become a member?")}
              </h2>
              <p className="mt-3 text-teal-50">
                {t("about.tellUsALittleAbout", "Tell us a little about yourself and our team will get back to you.")}
              </p>
              <button
                onClick={onOpenEnquiry}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#007f74] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t("about.sendAnEnquiry", "Send an enquiry")}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ====================== 8. LOCATION + MAP ====================== */}
      <section className="grid bg-[#00a89a] lg:grid-cols-2">
        <div className="flex flex-col justify-center p-10 text-white sm:p-14 lg:p-16 xl:p-20">
          <Reveal>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">{t("about.visitOrCallUs", "Visit or call us")}</h2>
          </Reveal>

          <div className="mt-9 space-y-6">
            <Reveal delay={100}>
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold">{t("about.address", "Address")}</h3>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-teal-50">
                    {SOCIETY_INFO.address.full}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold">{t("about.phone", "Phone")}</h3>
                  <a
                    href={`tel:${SOCIETY_INFO.phoneRaw}`}
                    className="mt-1 inline-block text-base font-medium text-teal-50 hover:underline"
                  >
                    {SOCIETY_INFO.phone}
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold">{t("about.hours", "Hours")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-teal-50">
                    {SOCIETY_INFO.officeHours}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="relative min-h-[380px] w-full bg-slate-200 lg:min-h-[480px]">
          <iframe
            title={t("about.aurumfxSocietyOfficeMap", "AurumFX society office map")}
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15694.025983777508!2d76.1601007!3d10.5284852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba7ee09e487d7cb%3A0x7d018d45129b0e27!2sKunnathangadi%2C%20Kerala!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}