import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, HandCoins, PanelLeftClose, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function SideActionToolbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        title={t("nav.sideToolbar.showPanel", "Show Panel")}
        className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-[#00b4a7] hover:bg-[#009d91] text-white w-7 h-12 items-center justify-center shadow-lg cursor-pointer transition-colors"
        aria-label={t("nav.sideToolbar.showToolbar", "Show Toolbar")}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 flex-col shadow-xl select-none">
      
      {/* 1. Loan services */}
      <div className="relative group">
        <button
          onClick={() => navigate('/loans')}
          className="w-14 h-14 bg-[#00b4a7] hover:bg-[#00a397] text-white flex items-center justify-center cursor-pointer border-b border-[#009085] transition-colors"
          aria-label={t("nav.sideToolbar.loanServicesLabel", "Loan Services")}
        >
          <Landmark className="w-[22px] h-[22px] stroke-[1.8] text-white" />
        </button>

        {/* Hover Flyout: "LOAN SERVICES" */}
        <div 
          onClick={() => navigate('/loans')}
          className="absolute left-full top-0 h-full bg-[#1c222e] text-white font-bold text-xs tracking-widest uppercase flex items-center px-6 whitespace-nowrap shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-pointer pointer-events-none group-hover:pointer-events-auto"
        >
          {t("nav.sideToolbar.loanServices", "LOAN SERVICES")}
        </div>
      </div>

      {/* 2. Member benefits */}
      <div className="relative group">
        <button
          onClick={() => navigate('/features')}
          className="w-14 h-14 bg-[#00b4a7] hover:bg-[#00a397] text-white flex items-center justify-center cursor-pointer border-b border-[#009085] transition-colors"
          aria-label={t("nav.sideToolbar.memberBenefitsLabel", "Member Benefits")}
        >
          <HandCoins className="w-[22px] h-[22px] stroke-[1.8] text-white" />
        </button>

        {/* Hover Flyout: "MEMBER BENEFITS" */}
        <div 
          onClick={() => navigate('/features')}
          className="absolute left-full top-0 h-full bg-[#1c222e] text-white font-bold text-xs tracking-widest uppercase flex items-center px-6 whitespace-nowrap shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-pointer pointer-events-none group-hover:pointer-events-auto"
        >
          {t("nav.sideToolbar.memberBenefits", "MEMBER BENEFITS")}
        </div>
      </div>

      {/* 3. Hide toolbar */}
      <div className="relative group">
        <button
          onClick={() => setIsHidden(true)}
          className="w-14 h-14 bg-[#00b4a7] hover:bg-[#00a397] text-white flex items-center justify-center cursor-pointer transition-colors"
          aria-label={t("nav.sideToolbar.hideToolbarLabel", "Hide Toolbar")}
        >
          <PanelLeftClose className="w-[22px] h-[22px] stroke-[1.8] text-white" />
        </button>

        {/* Hover Flyout: "HIDE TOOLBAR" */}
        <div 
          onClick={() => setIsHidden(true)}
          className="absolute left-full top-0 h-full bg-[#1c222e] text-white font-bold text-xs tracking-widest uppercase flex items-center px-6 whitespace-nowrap shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-pointer pointer-events-none group-hover:pointer-events-auto"
        >
          {t("nav.sideToolbar.hideToolbar", "HIDE TOOLBAR")}
        </div>
      </div>

    </div>
  );
}
