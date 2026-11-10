import React, { useState, useEffect } from 'react';

const COST_CARDS = [
  {
    id: 1,
    title: 'Flexible with your repayments',
    description: 'Reschedule payments up to five days for free and within your loan term, we just need 24 hours notice.',
    type: 'phone'
  },
  {
    id: 2,
    title: 'No early payment fees for your loan',
    description: "So you can pay your loan off sooner and you'll save on interest.",
    type: 'clipboard'
  },
  {
    id: 3,
    title: 'Good credit history is rewarded',
    description: 'Loans are cheaper when you have a good credit profile and you have built your history with us.',
    type: 'coin'
  },
  {
    id: 4,
    title: 'Fast online instant approvals',
    description: 'We provide online instant cash loans with quick approval that suit you.',
    type: 'clipboard'
  }
];

export default function CostsOverviewSection() {
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel smoothly every 5.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % COST_CARDS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Modulo index helper to display 3 consecutive cards in circular fashion
  const getCardAtOffset = (offset) => {
    const idx = (activeDot + offset) % COST_CARDS.length;
    return COST_CARDS[idx];
  };

  const renderCardIllustration = (type) => {
    if (type === 'phone') {
      return (
        <svg viewBox="0 0 100 120" className="w-24 h-24 mx-auto drop-shadow-sm select-none">
          {/* Phone Outer Body */}
          <rect x="22" y="8" width="56" height="102" rx="12" fill="#8e9aa8" />
          {/* Speaker slit & camera */}
          <rect x="42" y="14" width="16" height="3" rx="1.5" fill="#64748b" />
          <circle cx="36" cy="15.5" r="1.5" fill="#64748b" />
          {/* Phone Screen */}
          <rect x="26" y="22" width="48" height="74" rx="3" fill="#ffffff" />
          {/* Green Cash / Dollar Bill Graphic */}
          <g transform="translate(14, 32)">
            <rect x="0" y="0" width="72" height="42" rx="4" fill="#00b4a7" />
            <rect x="3" y="3" width="66" height="36" rx="3" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="36" cy="21" r="11" fill="#ffffff" opacity="0.25" />
            <text x="36" y="27" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
          </g>
          {/* Home Button */}
          <circle cx="50" cy="103" r="3.5" fill="#64748b" />
        </svg>
      );
    }

    if (type === 'clipboard') {
      return (
        <svg viewBox="0 0 100 120" className="w-24 h-24 mx-auto drop-shadow-sm select-none">
          {/* Clipboard Board Body */}
          <rect x="18" y="16" width="64" height="94" rx="6" fill="#8e9aa8" />
          {/* Top Clip Tab */}
          <path d="M38 10 H62 V20 H38 Z" rx="3" fill="#00b4a7" />
          <circle cx="50" cy="15" r="2.5" fill="#ffffff" />
          {/* White Document */}
          <rect x="24" y="24" width="52" height="80" rx="3" fill="#ffffff" />
          {/* Document Lines */}
          <rect x="30" y="34" width="40" height="3" rx="1.5" fill="#1e293b" />
          <rect x="30" y="42" width="40" height="3" rx="1.5" fill="#1e293b" />
          <rect x="30" y="50" width="40" height="3" rx="1.5" fill="#1e293b" />
          <rect x="30" y="58" width="40" height="3" rx="1.5" fill="#1e293b" />
          {/* Yellow Growth Graph with Upward Arrow */}
          <polyline points="30,88 44,78 56,82 70,68" fill="none" stroke="#ffba00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="66,66 73,66 72,73" fill="#ffba00" />
        </svg>
      );
    }

    // type === 'coin'
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto drop-shadow-sm select-none">
        {/* Sparkles around Coin */}
        <path d="M78 20 L80 13 L82 20 L89 22 L82 24 L80 31 L78 24 L71 22 Z" fill="#cbd5e1" />
        <path d="M42 34 L43 29 L44 34 L49 35 L44 36 L43 41 L42 36 L37 35 Z" fill="#cbd5e1" />
        {/* Gleaming Gold Coin */}
        <circle cx="65" cy="40" r="21" fill="#ffba00" />
        <circle cx="65" cy="40" r="17" fill="none" stroke="#e6a700" strokeWidth="2" strokeDasharray="3 2" />
        <text x="65" y="47" fill="#ffffff" fontSize="21" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
        {/* Suit Sleeve */}
        <rect x="12" y="68" width="18" height="22" rx="2" fill="#64748b" />
        {/* Hand / Palm supporting coin */}
        <path d="M30 72 H55 C65 72 74 66 82 58 L85 62 C77 72 66 80 52 80 H30 Z" fill="#e2e8f0" />
        <path d="M52 80 C65 80 78 72 88 60 L85 58 C75 68 65 75 52 75 Z" fill="#cbd5e1" opacity="0.6" />
      </svg>
    );
  };

  return (
    <section 
      className="relative py-20 lg:py-28 bg-[#f8f9fa] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* =========================================================================
          PROMINENT WATERMARK FINANCIAL ICONS (Positioned on outer margins to avoid overlapping text)
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden text-[#9aa9bc]/70" aria-hidden="true">
        
        {/* --- LEFT SIDE ICONS (Only visible on wide viewports far from center text) --- */}
        {/* 1. Top-Left Dollar Coin (Shifted far to outer margin on 2xl only, never colliding with header text) */}
        <div className="hidden 2xl:block absolute top-8 left-8 transition-transform">
          <svg viewBox="0 0 100 100" className="w-20 h-20 xl:w-24 xl:h-24 opacity-60">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <text x="50" y="65" fill="currentColor" fontSize="44" fontFamily="serif" fontWeight="bold" textAnchor="middle">$</text>
          </svg>
        </div>

        {/* 2. Mid-Left Money Bag */}
        <div className="hidden lg:block absolute top-[38%] left-4 xl:left-12 2xl:left-16">
          <svg viewBox="0 0 80 90" className="w-14 h-16 sm:w-16 sm:h-18 opacity-70">
            <path d="M30 12 C30 8 35 4 40 4 C45 4 50 8 50 12 L52 18 H28 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M26 18 H54" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M27 19 C14 30 10 52 10 66 C10 80 24 86 40 86 C56 86 70 80 70 66 C70 52 66 30 53 19 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <text x="40" y="62" fill="currentColor" fontSize="22" fontFamily="serif" fontWeight="bold" textAnchor="middle">$</text>
          </svg>
        </div>

        {/* 3. Mid-Left Bank Note */}
        <div className="hidden md:block absolute top-[58%] left-2 xl:left-6 2xl:left-10">
          <svg viewBox="0 0 110 65" className="w-20 h-12 sm:w-24 sm:h-14 opacity-70">
            <rect x="3" y="3" width="104" height="59" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <rect x="10" y="10" width="90" height="45" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="55" cy="32.5" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="20" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="92" cy="20" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="92" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 4. Lower-Left Sparkle / Star Burst */}
        <div className="hidden md:block absolute top-[76%] left-6 xl:left-14 2xl:left-20">
          <svg viewBox="0 0 60 60" className="w-9 h-9 sm:w-11 sm:h-11 opacity-60">
            <line x1="30" y1="4" x2="30" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="4" y1="30" x2="56" y2="30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="12" y1="12" x2="48" y2="48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="48" x2="48" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* 5. Bottom-Left Euro Coin */}
        <div className="hidden lg:block absolute bottom-6 left-6 xl:left-14 2xl:left-20">
          <svg viewBox="0 0 100 100" className="w-18 h-18 sm:w-22 sm:h-22 opacity-60">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <text x="50" y="66" fill="currentColor" fontSize="44" fontFamily="serif" fontWeight="bold" textAnchor="middle">€</text>
          </svg>
        </div>

        {/* --- RIGHT SIDE ICONS (Outer margins only) --- */}
        {/* 6. Top-Right Dollar Coin (Shifted far to outer margin on 2xl only) */}
        <div className="hidden 2xl:block absolute top-8 right-8">
          <svg viewBox="0 0 100 100" className="w-20 h-20 xl:w-24 xl:h-24 opacity-60">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <text x="50" y="65" fill="currentColor" fontSize="44" fontFamily="serif" fontWeight="bold" textAnchor="middle">$</text>
          </svg>
        </div>

        {/* 7. Mid-Right Money Bag */}
        <div className="hidden lg:block absolute top-[38%] right-4 xl:right-12 2xl:right-16">
          <svg viewBox="0 0 80 90" className="w-14 h-16 sm:w-16 sm:h-18 opacity-70">
            <path d="M30 12 C30 8 35 4 40 4 C45 4 50 8 50 12 L52 18 H28 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M26 18 H54" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M27 19 C14 30 10 52 10 66 C10 80 24 86 40 86 C56 86 70 80 70 66 C70 52 66 30 53 19 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <text x="40" y="62" fill="currentColor" fontSize="22" fontFamily="serif" fontWeight="bold" textAnchor="middle">$</text>
          </svg>
        </div>

        {/* 8. Mid-Right Bank Note */}
        <div className="hidden md:block absolute top-[58%] right-2 xl:right-6 2xl:right-10">
          <svg viewBox="0 0 110 65" className="w-20 h-12 sm:w-24 sm:h-14 opacity-70">
            <rect x="3" y="3" width="104" height="59" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <rect x="10" y="10" width="90" height="45" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="55" cy="32.5" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="20" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="92" cy="20" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="92" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 9. Lower-Right Sparkle */}
        <div className="hidden md:block absolute top-[76%] right-6 xl:right-14 2xl:right-20">
          <svg viewBox="0 0 60 60" className="w-9 h-9 sm:w-11 sm:h-11 opacity-60">
            <line x1="30" y1="4" x2="30" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="4" y1="30" x2="56" y2="30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="12" y1="12" x2="48" y2="48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="48" x2="48" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* 10. Bottom-Right Euro Coin */}
        <div className="hidden lg:block absolute bottom-6 right-6 xl:right-14 2xl:right-20">
          <svg viewBox="0 0 100 100" className="w-18 h-18 sm:w-22 sm:h-22 opacity-60">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <text x="50" y="66" fill="currentColor" fontSize="44" fontFamily="serif" fontWeight="bold" textAnchor="middle">€</text>
          </svg>
        </div>

        {/* Ambient Lower Dots on large screens away from all text */}
        <div className="hidden xl:block absolute bottom-24 left-1/4 w-2.5 h-2.5 rounded-full bg-current opacity-40" />
        <div className="hidden xl:block absolute bottom-20 right-1/4 w-2.5 h-2.5 rounded-full bg-current opacity-40" />
      </div>

      {/* =========================================================================
          SECTION HEADER (With clear z-index and spacing so watermarks never overlap)
         ========================================================================= */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 sm:mb-16 z-20">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-slate-900 leading-tight">
          Things to know about our costs
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-3 font-normal">
          Transparent and fair costs, with no hidden fees
        </p>
      </div>

      {/* =========================================================================
          3-CARD CAROUSEL (Rotates smoothly across the 4 features)
         ========================================================================= */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Desktop & Tablet: 3 Side-by-Side Cards matching reference */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {[0, 1, 2].map((offset) => {
            const card = getCardAtOffset(offset);
            return (
              <div
                key={`${card.id}-${activeDot}-${offset}`}
                className="bg-white rounded-none p-8 sm:p-10 lg:p-12 text-center flex flex-col items-center justify-start shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all duration-300 min-h-[380px]"
              >
                {/* Illustration */}
                <div className="h-28 flex items-center justify-center mb-6">
                  {renderCardIllustration(card.type)}
                </div>

                {/* Card Title */}
                <h3 className="font-serif font-bold text-slate-900 text-xl lg:text-[22px] leading-snug mb-4">
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className="text-slate-500 text-sm leading-relaxed mt-auto font-normal max-w-xs">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile: 1 Card Carousel view */}
        <div className="md:hidden">
          {(() => {
            const card = COST_CARDS[activeDot];
            return (
              <div
                key={`mobile-${card.id}-${activeDot}`}
                className="bg-white rounded-none p-8 text-center flex flex-col items-center justify-start shadow-md border border-slate-100 min-h-[360px]"
              >
                <div className="h-28 flex items-center justify-center mb-6">
                  {renderCardIllustration(card.type)}
                </div>

                <h3 className="font-serif font-bold text-slate-900 text-xl leading-snug mb-4">
                  {card.title}
                </h3>

                <p className="text-slate-500 text-sm leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>
            );
          })()}
        </div>

        {/* =====================================================================
            PAGINATION DOTS (4 Dots matching reference screenshots)
           ===================================================================== */}
        <div className="flex items-center justify-center gap-2.5 mt-10 sm:mt-12">
          {COST_CARDS.map((_, dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => setActiveDot(dotIndex)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeDot === dotIndex
                  ? 'w-2.5 h-2.5 bg-[#00b4a7] scale-110'
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>

      </div>

    </section>
  );
}

