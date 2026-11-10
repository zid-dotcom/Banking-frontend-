import React from 'react';
import { Link } from 'react-router-dom';

const LOAN_PURPOSES = [
  {
    id: 1,
    title: 'Home Improvement',
    description: 'Home is an important part of life, get a home improvement loan.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
    buttonText: 'Find out more'
  },
  {
    id: 2,
    title: 'Student Loans',
    description: 'A student loan can help students pay for post-secondary education.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    buttonText: 'Find out more'
  },
  {
    id: 3,
    title: 'Personal Loans',
    description: 'Take control of your financial life with AurumFX personal loan.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
    buttonText: 'Find out more'
  }
];

export default function PersonalLoansSection() {
  return (
    <section className="py-20 lg:py-28 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Left-aligned starting from the left edge */}
        <div className="text-left mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-slate-900 leading-[1.15]">
            Personal loans for most purposes
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2.5 font-normal">
            Building a brighter financial future
          </p>
        </div>

        {/* 3 Purpose Cards matching reference layout and alignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {LOAN_PURPOSES.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-[#f3f5f7] overflow-hidden shadow-none transition-all duration-300 group"
            >
              {/* Image Thumbnail */}
              <div className="h-64 sm:h-72 w-full overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card Body: Left-aligned, matching reference sizing */}
              <div className="bg-[#f3f5f7] p-8 sm:p-10 text-left flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-serif font-bold text-2xl lg:text-[26px] text-slate-800 mb-3 sm:mb-4 text-left leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed mb-8 font-normal text-left">
                    {item.description}
                  </p>
                </div>

                {/* Left-Aligned Signature Teal Action Button */}
                <div className="pt-2 text-left">
                  <Link
                    to="/loans"
                    className="inline-flex items-center justify-center bg-[#00b4a7] hover:bg-[#009e93] text-white font-medium text-sm sm:text-[15px] px-6 sm:px-7 py-3 rounded-[3px] transition-colors cursor-pointer tracking-normal shadow-xs hover:shadow-md"
                  >
                    {item.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
