import React from 'react';

const FEATURES = [
  {
    text: "Checking your rates won't affect your credit score",
    isHighlighted: true
  },
  {
    text: "Our rates are often lower than the banks",
    isHighlighted: false
  },
  {
    text: "We have simple online application",
    isHighlighted: true
  },
  {
    text: "No early repayment fees, no hidden charges",
    isHighlighted: false
  }
];

export default function ExperienceBanner() {
  return (
    <section className="relative py-28 sm:py-36 lg:py-44 min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center overflow-hidden select-none">
      
      {/* Background Photographic Image with Laughing Team Members Clearly Visible */}
      <img
        src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1920&q=80"
        alt="Personalized Banking Experience"
        className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
      />

      {/* Vibrant Signature Teal Overlay - Translucent so laughing faces are clearly visible */}
      <div 
        className="absolute inset-0 bg-[#00a89d]/75 mix-blend-multiply" 
      />
      <div 
        className="absolute inset-0 bg-gradient-to-r from-[#008f85]/80 via-[#00a89d]/68 to-[#00b4a7]/65" 
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Heading & Subtitle */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[#ffd166] font-semibold text-sm sm:text-base tracking-wide block">
              Personal finance that fits you
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-serif font-bold text-white leading-[1.16] tracking-tight max-w-lg drop-shadow-xs">
              We've built a secure &amp; personalized experience
            </h2>
          </div>

          {/* Right Column: 4 Feature Rows with Alternating Shaded Highlights */}
          <div className="lg:col-span-6 space-y-2.5 sm:space-y-3">
            {FEATURES.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 transition-all duration-200 ${
                  item.isHighlighted
                    ? 'bg-[#00746b]/45 rounded-sm backdrop-blur-2xs'
                    : 'rounded-sm hover:bg-white/5'
                }`}
              >
                {/* Custom Circular Checkmark Icon matching reference */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 stroke-white fill-none stroke-[2.2] flex-shrink-0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="m8.5 12 2.5 2.5 5-5" />
                </svg>

                <span className="text-white text-sm sm:text-base font-normal tracking-wide leading-snug">
                  {item.text}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}

