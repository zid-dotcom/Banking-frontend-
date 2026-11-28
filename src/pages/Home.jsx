import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Award,
  ChevronRight,
  Handshake,
  CircleDollarSign
} from 'lucide-react';
import { SOCIETY_INFO, BLOG_POSTS, WHY_CHOOSE_US } from '../data/societyData';
import LoanCalculator from '../components/LoanCalculator';
import CostsOverviewSection from '../components/CostsOverviewSection';
import ExperienceBanner from '../components/ExperienceBanner';
import PersonalLoansSection from '../components/PersonalLoansSection';
import TestimonialsSection from '../components/TestimonialsSection';
import AppDownloadSection from '../components/AppDownloadSection';
import InteractiveCardsSection from '../components/InteractiveCardsSection';

import hero1 from '../assets/hero1.jpeg';
import hero2 from '../assets/hero2.jpeg';
import hero3 from '../assets/hero3.jpeg';
import hero4 from '../assets/hero4.jpeg';
import hero5 from '../assets/hero5.jpeg';


export default function Home({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlideIndex, setPrevSlideIndex] = useState(0);

  const slides = [
    {
      id: 1,
      image: hero1,
      smallText: t("hero.slide1Small", "Simple. Transparent. Secure."),
      mainHeading: t("hero.slide1Heading", "Building a brighter financial future"),
      ctaText: t("hero.slide1Cta", "Get started today!"),
      ctaLink: '/loans'
    },
    {
      id: 2,
      image: hero2,
      smallText: t("hero.slide2Small", "We support your dream"),
      mainHeading: t("hero.slide2Heading", "Need a lower monthly payment?"),
      ctaText: t("hero.slide2Cta", "Get started today!"),
      ctaLink: '/loans'
    },
    {
      id: 3,
      image: hero3,
      smallText: t("hero.slide3Small", "Empowering Rural Enterprise & MSME"),
      mainHeading: t("hero.slide3Heading", "Smart Capital Solutions for Local Commerce"),
      ctaText: t("hero.slide3Cta", "Get started today!"),
      ctaLink: '/loans'
    },
    {
      id: 4,
      image: hero4,
      smallText: t("hero.slide4Small", "Transparent Cooperative Savings"),
      mainHeading: t("hero.slide4Heading", "Secure Your Family with Systematic Savings"),
      ctaText: t("hero.slide4Cta", "Get started today!"),
      ctaLink: '/loans'
    },
    {
      id: 5,
      image: hero5,
      smallText: t("hero.slide5Small", "Direct Society Counter Processing"),
      mainHeading: t("hero.slide5Heading", "Accessible Lending Without Hidden Barriers"),
      ctaText: t("hero.slide5Cta", "Get started today!"),
      ctaLink: '/contact'
    }
  ];

  // Auto-advance carousel slowly every 8.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        setPrevSlideIndex(prev);
        return (prev + 1) % slides.length;
      });
    }, 8500);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-scroll-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="bg-white">

      {/* =========================================================================
          HERO CAROUSEL SECTION (Top of text aligned with side toolbar shopping cart icon)
         ========================================================================= */}
      <section className="relative min-h-[100dvh] w-full flex flex-col justify-between pt-24 sm:pt-28 pb-6 sm:pb-8 lg:pb-10 overflow-hidden bg-slate-100">

        {/* Crisp HTML5 Images with Direct Native Resolution & Smooth Dissolve */}
        {slides.map((s, idx) => {
  const { t } = useTranslation();
          const isActive = idx === currentSlide;
          const isPrevious = idx === prevSlideIndex;

          return (
            <div
              key={s.id}
              className={`absolute top-0 bottom-0 -left-[8%] w-[116%] h-full overflow-hidden pointer-events-none ${isActive
                  ? 'opacity-100 z-10 transition-opacity duration-1400 ease-in-out'
                  : isPrevious
                    ? 'opacity-100 z-0'
                    : 'opacity-0 -z-10'
                }`}
            >
              <img
                src={s.image}
                alt={t("home.aurumfxFinancialServices", "AurumFX Financial Services")}
                loading="eager"
                decoding="sync"
                className={`w-full h-full object-cover hero-image-clarity ${isActive ? 'animate-pan-clarity' : ''
                  }`}
              />
            </div>
          );
        })}

        {/* Authentic Dark Overlay Effect for Crisp Contrast & Clarity Across All Slides */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/66 via-slate-900/52 to-slate-900/38 z-[15] pointer-events-none" />

        {/* Hero Content Area - Aligned so the small top text matches the purchase/cart icon height */}
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full z-20 overflow-visible my-auto md:translate-y-8 lg:translate-y-10">
          <div key={slide.id} className="max-w-5xl overflow-visible">

            {/* 1. Small yellow introductory text */}
            <div className="text-[#ffba00] font-normal sm:font-medium text-xs sm:text-base lg:text-lg tracking-normal mb-1.5 sm:mb-2 animate-slide-in-right-1 drop-shadow-md">
              {slide.smallText}
            </div>

            {/* 2. Big white serif heading - Enlarge to match reference */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[72px] font-serif font-bold text-white leading-[1.05] tracking-tight mb-3.5 sm:mb-4.5 animate-slide-in-right-2 drop-shadow-lg">
              {slide.mainHeading}
            </h1>

            {/* 3. Single Yellow Button - Shifted down with clear gap from the headline */}
            <div className="animate-slide-in-right-3 mt-8 sm:mt-10 lg:mt-12">
              <Link
                to={slide.ctaLink}
                className="inline-flex items-center justify-center bg-[#fccb34] hover:bg-[#eab924] text-white font-medium sm:font-semibold w-full max-w-[280px] sm:w-[280px] h-[58px] sm:h-[66px] rounded-[3px] shadow-md hover:shadow-lg transition-all duration-200 text-[17px] sm:text-[18px] whitespace-nowrap cursor-pointer tracking-normal"
              >
                <span>{slide.ctaText}</span>
              </Link>
            </div>

          </div>
        </div>

        {/* 4 Feature Items along the bottom - Lifted upwards to reduce gap to the button */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 pb-1 sm:pb-2 border-t border-white/20 z-20 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] -translate-y-10 sm:-translate-y-14 lg:-translate-y-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8 items-center">

            {/* Item 1: Fast Online Instant Approvals */}
            <div className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-dashed border-[#ffba00] rounded-sm flex items-center justify-center text-[#ffba00] flex-shrink-0 group-hover:scale-110 transition-transform bg-black/20 backdrop-blur-2xs">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[#ffba00] fill-none stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 6 12 12 15 15" />
                </svg>
              </div>
              <div className="text-white font-serif font-bold text-[11px] sm:text-sm lg:text-[14px] leading-tight drop-shadow-sm">
                {t("hero.featureFastApproval", "Fast Online Instant Approvals")}
              </div>
            </div>

            {/* Item 2: 500,000 Customers / Member Network */}
            <div className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#ffba00] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Handshake className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.9] text-[#ffba00] drop-shadow-sm" />
              </div>
              <div className="text-white font-serif font-bold text-[11px] sm:text-sm lg:text-[14px] leading-tight drop-shadow-sm">
                {t("hero.featureCustomers", "500,000 Customers")}
              </div>
            </div>

            {/* Item 3: No Prepayment Fees */}
            <div className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#ffba00] flex-shrink-0 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.9] text-[#ffba00] drop-shadow-sm" />
              </div>
              <div className="text-white font-serif font-bold text-[11px] sm:text-sm lg:text-[14px] leading-tight drop-shadow-sm">
                {t("hero.featureNoPrepayment", "No Prepayment Fees")}
              </div>
            </div>

            {/* Item 4: Flexible payments */}
            <div className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#ffba00] flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 stroke-[#ffba00] fill-none stroke-[1.9] drop-shadow-sm" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17V5a2 2 0 0 0-2-2H4" />
                  <path d="M8 21h12a2 2 0 0 0 2-2v-2H10a2 2 0 0 0-2 2v2Z" />
                  <line x1="12" y1="9" x2="16" y2="13" />
                  <circle cx="12.5" cy="12.5" r="0.75" fill="#ffba00" />
                  <circle cx="15.5" cy="9.5" r="0.75" fill="#ffba00" />
                </svg>
              </div>
              <div className="text-white font-serif font-bold text-[11px] sm:text-sm lg:text-[14px] leading-tight drop-shadow-sm">
                {t("hero.featureFlexiblePayments", "Flexible payments")}
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          THINGS TO KNOW ABOUT OUR COSTS (QuickLoans Interactive 3-Card Carousel)
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <CostsOverviewSection />
      </div>

      {/* =========================================================================
          ABOUT SECTION PREVIEW (QuickLoans Style About with Image & Badge)
         ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#f2f2f1] border-y border-slate-200/80 scroll-reveal" data-scroll-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Image Column with Society Trust Badge */}
            <div className="lg:col-span-5 relative scroll-reveal" data-scroll-reveal style={{ '--reveal-delay': '100ms' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80"
                  alt={t("home.cooperativeMeeting", "Cooperative Meeting")}
                  className="w-full h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              </div>

              {/* Decorative Accent Box */}
              <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 bg-white p-6 rounded-xl shadow-xl border-l-4 border-[#ffba00] max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#00b4a7] text-white flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-slate-900 text-sm">
                      {t("home.aboutBadgeScope", "Multi-State Scope")}
                    </h5>
                    <p className="text-xs text-slate-600">
                      {t("home.aboutBadgeDesc", "Empowering Agricultural Prosperity")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Column */}
            <div className="lg:col-span-7 scroll-reveal" data-scroll-reveal style={{ '--reveal-delay': '220ms' }}>
              <div className="text-xs uppercase tracking-widest font-bold text-[#00b4a7] mb-2 flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#00b4a7]"></span>
                {t("home.aboutEyebrow", "About Aurumfx Society")}
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-slate-900 leading-tight mb-6">
                {t("home.aboutTitle", "Committed to Empowering Rural & Semi-Urban Growth")}
              </h2>

              <p className="text-slate-600 leading-relaxed mb-6 text-base">
                {t("home.aboutDesc1", "Aurumfx Multi State Agro Co-operative Society Limited is founded on the core principles of mutual self-help, collective strength, and financial transparency. We bridge the critical funding requirements of agricultural cultivators, dairy farmers, allied agro-industries, and rural entrepreneurs.")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{t("home.tenet2", "Direct Member Democratic Governance")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{t("costs.subtitle", "Transparent and fair costs, with no hidden fees")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{t("home.tenet1", "Multi-State Operating Jurisdiction")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{t("home.tenet3", "Priority Credit for Agricultural Cultivators")}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded text-sm transition-colors"
                >
                  <span>{t("home.readMoreAboutUs", "Read More About Us")}</span>
                  <ChevronRight className="w-4 h-4 text-[#ffba00]" />
                </Link>

                <div className="text-xs text-slate-500 border-l border-slate-300 pl-4 py-1">
                  <span className="block font-semibold text-slate-800">{t("contact.employer", "Society Employer")}:</span>
                  <span>{SOCIETY_INFO.employer}</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          PERSONAL LOANS FOR MOST PURPOSES (Matching Reference Design)
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <PersonalLoansSection />
      </div>

      {/* =========================================================================
          SIGNATURE TEAL EXPERIENCE BANNER (Matching QuickLoans Layout)
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <ExperienceBanner />
      </div>

      {/* =========================================================================
          ONLINE APPLICATION & LOAN CALCULATOR SECTION (QuickLoans Reference Layout)
         ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-200/60 overflow-hidden scroll-reveal" data-scroll-reveal>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16">
          <LoanCalculator onOpenEnquiry={onOpenEnquiry} />
        </div>
      </section>

      {/* =========================================================================
          WHY CHOOSE AURUMFX / BENEFITS SECTION (Light Background)
         ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#f8f9fa] border-y border-slate-200/80 scroll-reveal" data-scroll-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase tracking-widest font-bold text-[#00b4a7] flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#00b4a7]"></span>
                {t("home.aboutEyebrow", "About Aurumfx Society")}
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-slate-900 leading-tight">
                {t("home.whyChooseTitle", "Why Choose Our Cooperative Society?")}
              </h2>

              <p className="text-slate-600 text-base leading-relaxed">
                {t("home.whyChooseDesc", "Experience banking centered on genuine solidarity and mutual prosperity.")}
              </p>

              <div className="space-y-4 pt-2">
                {WHY_CHOOSE_US.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-[#ffba00] hover:shadow-md transition-all scroll-reveal" data-scroll-reveal style={{ '--reveal-delay': `${index * 100}ms` }}>
                    <div className="w-8 h-8 rounded-full bg-[#ffba00] text-slate-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      0{index + 1}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-slate-900 text-base mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Column - Clean banking consultation image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80"
                  alt={t("home.cooperativeBankingConsultation", "Cooperative Banking Consultation")}
                  className="w-full h-[520px] object-cover object-center"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          CUSTOMER SATISFACTION TESTIMONIALS (Signature QuickLoans Element)
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <TestimonialsSection />
      </div>

      {/* =========================================================================
          MOBILE APP PROMOTIONAL SECTION ("Use our app to see your personalised loan rates")
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <AppDownloadSection />
      </div>

      {/* =========================================================================
          INTERACTIVE 3D FEATURE CARDS ("Tools to help you reach your financial goals")
         ========================================================================= */}
      <div className="scroll-reveal" data-scroll-reveal>
        <InteractiveCardsSection />
      </div>

      {/* =========================================================================
          TEAL CALL TO ACTION BANNER ("Ready to get started? -> Apply Now")
         ========================================================================= */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden select-none scroll-reveal" data-scroll-reveal>
        {/* Matching Hero Background Photo */}
        <img
          src={hero2}
          alt={t("home.readyToGetStarted", "Ready to get started")}
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />

        {/* Signature Teal Overlay with High Visual Clarity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#009287]/90 via-[#00a89d]/85 to-[#00b4a7]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#00a89d]/75" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">
            
            {/* Left Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-sm text-center sm:text-left">
              {t("home.readyToGetStarted2", "Ready to get started?")}
            </h2>

            {/* Right Action Button */}
            <button
              onClick={() => onOpenEnquiry && onOpenEnquiry('Membership & Loan Application')}
              className="inline-flex items-center justify-center bg-[#fccb34] hover:bg-[#eab924] text-white font-medium sm:font-semibold px-9 sm:px-12 py-3.5 sm:py-4 rounded-[3px] shadow-md hover:shadow-lg transition-all duration-200 text-base sm:text-[17px] cursor-pointer tracking-normal flex-shrink-0"
            >
              {t("common.applyNow", "Apply Now")}
            </button>

          </div>
        </div>
      </section>

      {/* =========================================================================
          RECENT INSIGHTS & ARTICLES (Blog Preview)
         ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white border-t border-slate-200/60 scroll-reveal" data-scroll-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#00b4a7] block mb-2">
                {t("home.newsEyebrow", "Articles & Market Updates")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 leading-tight">
                {t("home.newsTitle", "Latest From Society Newsroom")}
              </h2>
            </div>
            <Link
              to="/blog"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#00b4a7] hover:text-[#00877c]"
            >
              <span>{t("home.viewAllNews", "View All News & Updates")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.slice(0, 3).map((post, index) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group scroll-reveal"
                data-scroll-reveal
                style={{ '--reveal-delay': `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-2">{post.date}</div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-[#00b4a7] transition-colors mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00b4a7] hover:text-[#00877c] pt-3 border-t border-slate-100"
                  >
                    <span>{t("home.readFullArticle", "Read Full Article")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
