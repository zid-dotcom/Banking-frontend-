import React from 'react';
import { Link } from 'react-router-dom';

const CARDS_DATA = [
  {
    id: 1,
    title: 'Tools to help you reach your financial goals',
    subtext: 'Find out more',
    description: 'Empowering our agricultural and rural members with tailored crop loan calculators, competitive low interest schemes, flexible repayment terms, and personalized financial advisory to accelerate your farm productivity and family prosperity.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    link: '/calculator'
  },
  {
    id: 2,
    title: 'A community of over 60 million',
    subtext: 'Find out more',
    description: 'Join a proud, growing multi-state cooperative society dedicated to grassroots prosperity. We unite farmers, rural entrepreneurs, and self-help groups through transparent collective credit, mutual savings, and community financial support.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    link: '/about'
  },
  {
    id: 3,
    title: 'In-depth articles and analysis',
    subtext: 'Find out more',
    description: 'Access regular financial market research, seasonal crop loan updates, financial literacy guides, and expert cooperative banking advisory directly from our dedicated knowledge desk to keep your agribusiness financially resilient.',
    // Professional banking and financial market analysis image
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    link: '/blog'
  }
];

export default function InteractiveCardsSection() {
  return (
    <section className="relative w-full bg-[#f8f9fa] overflow-hidden select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full">
        {CARDS_DATA.map((card) => (
          <div
            key={card.id}
            className="group h-[400px] sm:h-[440px] lg:h-[480px] [perspective:1400px] cursor-pointer"
          >
            {/* 3D Flipping Card Container */}
            <div className="relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              
              {/* =================================================================
                  FRONT FACE OF CARD (Default View before hover)
                 ================================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden">
                {/* Background Photo */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark gradient overlay for title contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />

                {/* Content anchored to lower area matching reference */}
                <div className="absolute inset-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-end text-left z-10">
                  <h3 className="text-xl sm:text-2xl lg:text-[26px] font-serif font-bold text-white leading-snug drop-shadow-md">
                    {card.title}
                  </h3>
                  <div className="mt-2 text-[#fbb034] text-xs sm:text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-1.5">
                    <span>{card.subtext}</span>
                  </div>
                </div>
              </div>


              {/* =================================================================
                  BACK FACE OF CARD (Opposite Part revealed when turned around)
                 ================================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
                {/* Same Photo as Front (un-mirrored so it matches the front photo exactly) */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center -scale-x-100"
                />

                {/* Balanced dark overlay matching screenshot so the background photo remains clearly visible */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Back Content - Vertically centered matching screenshot */}
                <div className="absolute inset-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center text-left z-10">
                  <h3 className="text-xl sm:text-2xl lg:text-[25px] font-serif font-bold text-white leading-snug drop-shadow-md">
                    {card.title}
                  </h3>
                  
                  <div className="mt-2 text-[#fbb034] text-xs sm:text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-1.5">
                    <span>{card.subtext}</span>
                  </div>

                  {/* Opposite Part Description Paragraph */}
                  <p className="text-xs sm:text-[13px] text-white/95 leading-relaxed font-normal mt-4 drop-shadow-sm">
                    {card.description}
                  </p>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
