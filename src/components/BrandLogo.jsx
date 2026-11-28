import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BrandLogo({ size = 'default', showBadge = true, light = false }) {
  const { t } = useTranslation();
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const badgeSize = isLarge ? 'w-11 h-11' : isSmall ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10';
  const iconSize = isLarge ? 'w-6 h-6' : isSmall ? 'w-4 h-4' : 'w-5 h-5 sm:w-5 sm:h-5';
  const textSize = isLarge 
    ? 'text-3xl sm:text-4xl' 
    : isSmall 
    ? 'text-xl' 
    : 'text-2xl sm:text-3xl lg:text-[32px]';

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 group select-none">
      
      {/* Brand Name with Capital 'A' */}
      <span className={`${textSize} font-black tracking-tight flex items-baseline drop-shadow-xs leading-none`}>
        <span className="text-[#ffba00]">{t("branchAdminLogin.aurum", "Aurum")}</span>
        <span className={light ? 'text-slate-900' : 'text-white'}>{t("branchAdminLogin.fx", "FX")}</span>
      </span>

      {/* Refined Classical Banking Emblem Badge */}
      {showBadge && (
        <div 
          className={`${badgeSize} rounded-lg bg-gradient-to-b from-[#ffc21a] to-[#f0a800] flex items-center justify-center text-slate-950 shadow-md border border-amber-200/50 transform group-hover:scale-105 transition-all duration-200 flex-shrink-0`}
          title={t("common.appName", "Aurumfx Multi State Agro Co-operative Society Limited")}
        >
          {/* Classical Neoclassical Bank / Treasury Architecture SVG */}
          <svg 
            viewBox="0 0 36 36" 
            className={`${iconSize} fill-slate-950`}
          >
            {/* Triangular Pediment / Roof */}
            <path d="M18 5.5L4 12.5H32L18 5.5Z" />
            
            {/* Medallion in Pediment */}
            <circle cx="18" cy="9.8" r="1.1" fill="#f0a800" />

            {/* Architrave Beam */}
            <rect x="5.5" y="13.5" width="25" height="1.8" rx="0.4" />

            {/* 4 Classical Neoclassical Bank Columns */}
            <rect x="7.5" y="16.5" width="3" height="10.5" rx="0.5" />
            <rect x="13.5" y="16.5" width="3" height="10.5" rx="0.5" />
            <rect x="19.5" y="16.5" width="3" height="10.5" rx="0.5" />
            <rect x="25.5" y="16.5" width="3" height="10.5" rx="0.5" />

            {/* Upper Foundation Step */}
            <rect x="5.5" y="27.8" width="25" height="1.8" rx="0.4" />

            {/* Base Podium Foundation */}
            <rect x="3.5" y="30.2" width="29" height="2.2" rx="0.5" />
          </svg>
        </div>
      )}

    </div>
  );
}

