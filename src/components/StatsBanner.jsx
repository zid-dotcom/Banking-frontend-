import React from 'react';

export default function StatsBanner({
  amount = '₹2',
  unit = 'Lakhs+',
  amountSubtext = 'Loans have been approved for members',
  count = '25,000+',
  countSubtext = 'Happy members today'
}) {
  return (
    <section className="relative py-20 lg:py-24 overflow-hidden select-none bg-[#009e90]">
      
      {/* Background Bank-Related Smiling Person - Placed on the far left edge so text content is completely outside the image */}
      <div className="absolute inset-y-0 left-0 w-64 sm:w-80 md:w-96 lg:w-[400px] overflow-hidden pointer-events-none z-0">
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&crop=faces&w=800&h=800&q=80"
          alt="Satisfied Banking Member"
          className="w-full h-full object-cover object-[center_20%] grayscale contrast-125 brightness-100 opacity-70 mix-blend-luminosity"
        />
        {/* Horizontal gradient fade into solid teal before reaching the text content */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#009e90]/40 to-[#009e90]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#009e90]/20 via-transparent to-[#009e90]/30" />
      </div>

      {/* Two Stats Columns - Offset with left padding so text is completely clear of the image */}
      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center md:pl-24 lg:pl-32">
          
          {/* Stat 1: Disbursed Loan Volume */}
          <div className="flex flex-col items-start text-left">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-5xl sm:text-6xl lg:text-[76px] font-serif font-bold text-white tracking-tight leading-none drop-shadow-sm">
                {amount}
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-white/95 leading-none">
                {unit}
              </span>
            </div>
            <p className="text-sm sm:text-[15px] lg:text-base text-[#ffc83b] font-semibold mt-3 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {amountSubtext}
            </p>
          </div>

          {/* Stat 2: Member Network Count (Positioned on the Right Side, completely clear of the face) */}
          <div className="flex flex-col items-start text-left md:pl-8 lg:pl-16">
            <div className="flex items-baseline">
              <span className="text-5xl sm:text-6xl lg:text-[76px] font-serif font-bold text-white tracking-tight leading-none drop-shadow-sm">
                {count}
              </span>
            </div>
            <p className="text-sm sm:text-[15px] lg:text-base text-[#ffc83b] font-semibold mt-3 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {countSubtext}
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}

