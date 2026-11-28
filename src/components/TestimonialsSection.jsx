import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';


const TESTIMONIALS = [
  {
    id: 1,
    name: 'James Barnes, NY',
    quote: '“I think that Aurumfx has been of great help in my case and I think as a new client it was fast approved and professionally handled. It was fast and easy.”',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    name: 'Miranda Kerr, LA',
    quote: '“I used Aurumfx to help me pay for travel expenses. The service was great – fast but still friendly. Fantastic and Painless Experience. Thank you.”',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    name: 'Chris Roll, SF',
    quote: '“Their application process was quick and simple. In a short time I had the funds I needed to complete some much needed improvements around the house.”',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 4,
    name: 'Priya Raman, Thrissur',
    quote: '“The cooperative financial society provided the exact working capital support our farm enterprise required. Transparent terms and genuine member-first care.”',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  }
];

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel smoothly every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Modulo index helper to display 3 consecutive testimonials
  const getTestimonialAtOffset = (offset) => {
    const idx = (activeDot + offset) % TESTIMONIALS.length;
    return TESTIMONIALS[idx];
  };

  return (
    <section 
      className="py-20 lg:py-28 bg-[#f2f2f1] select-none relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching reference */}
        <div className="text-center mb-18 sm:mb-22">
          <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-serif font-bold text-slate-900 leading-[1.12] tracking-tight">
            {t("testimonials.title", "What our members say about us")}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mt-2 sm:mt-3 font-normal">
            {t("testimonials.subtitle", "Real feedback from our agricultural, business and thrift members across branches.")}
          </p>
        </div>

        {/* Desktop & Tablet: 3 Side-by-Side Testimonial Cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-7 lg:gap-8 items-stretch pt-6">
          {[0, 1, 2].map((offset) => {
            const item = getTestimonialAtOffset(offset);
            return (
              <div
                key={`${item.id}-${activeDot}-${offset}`}
                className="bg-white px-7 sm:px-8 py-10 sm:py-12 pt-16 sm:pt-18 text-center flex flex-col items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-none relative transition-all duration-300 min-h-[260px]"
              >
                {/* Circular Overlapping Avatar at Top Edge */}
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-4 border-white shadow-sm absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quote Text - Fills the card nicely with larger text size */}
                <p className="text-base sm:text-[17px] text-slate-500 leading-relaxed font-normal mb-6 sm:mb-8 w-full">
                  {item.quote}
                </p>

                {/* Author Name & Location */}
                <div className="font-serif font-bold text-slate-900 text-base sm:text-[17px] mt-auto">
                  {item.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: 1 Card View */}
        <div className="md:hidden pt-8">
          {(() => {
            const item = TESTIMONIALS[activeDot];
            return (
              <div
                key={`mobile-${item.id}-${activeDot}`}
                className="bg-white px-6 py-10 pt-16 text-center flex flex-col items-center justify-between shadow-sm rounded-none relative min-h-[260px]"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm absolute -top-10 left-1/2 -translate-x-1/2">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-base text-slate-500 leading-relaxed font-normal mb-6 w-full">
                  {item.quote}
                </p>

                <div className="font-serif font-bold text-slate-900 text-base">
                  {item.name}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 4 Pagination Dots matching reference */}
        <div className="flex items-center justify-center gap-2.5 mt-12 sm:mt-14">
          {TESTIMONIALS.map((_, dotIndex) => (
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

