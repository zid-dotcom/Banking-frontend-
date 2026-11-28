import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';


export default function PageBanner({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  image = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=80' 
}) {
  const { t } = useTranslation();
  return (
    <section className="relative pt-36 pb-20 md:pt-40 md:pb-24 bg-slate-800 overflow-hidden select-none">
      
      {/* Bright, high-clarity Unsplash photo in full natural color */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
      />

      {/* Light subtle gradient overlay: readable text on the left, bright sunny natural photo on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-serif font-bold text-white tracking-tight leading-tight mb-3 drop-shadow-md">
          {title}
        </h1>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-white/90 drop-shadow-sm font-medium">
          <Link to="/" className="hover:text-white transition-colors">
            {t("nav.home", "Home")}
          </Link>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-white transition-colors">
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-[#ffc107] font-semibold">{crumb.name}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Optional Subtitle */}
        {subtitle && (
          <p className="mt-3.5 text-sm sm:text-base text-white/90 max-w-2xl font-normal drop-shadow-sm leading-relaxed">
            {subtitle}
          </p>
        )}

      </div>
    </section>
  );
}
