import React from 'react';
import { useTranslation } from 'react-i18next';


export default function AppDownloadSection() {
  const { t } = useTranslation();
  return (
    <section className="relative py-20 lg:py-28 bg-[#f5f7fa] overflow-hidden select-none">
      
      {/* =========================================================================
          BACKGROUND FLOATING WATERMARK ICONS (Matching reference design)
         ========================================================================= */}
      
      {/* Top Left Money Sack Watermark */}
      <svg className="absolute left-[7%] top-[12%] w-14 h-14 text-slate-300/60 pointer-events-none stroke-current fill-none stroke-[1.4]" viewBox="0 0 24 24">
        <path d="M12 2a4 4 0 0 0-4 4v1H6a3 3 0 0 0-3 3v8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-8a3 3 0 0 0-3-3h-2V6a4 4 0 0 0-4-4z" />
        <path d="M12 11v6m-2-4.5h4" />
      </svg>

      {/* Top Center Dollar Watermark */}
      <div className="absolute left-[47%] top-[7%] text-slate-300/70 pointer-events-none text-5xl font-serif font-light select-none">
        $
      </div>

      {/* Mid Left Sparkle Star */}
      <div className="absolute left-[48%] bottom-[20%] text-slate-300/70 pointer-events-none text-3xl select-none">
        ✦
      </div>

      {/* Bottom Left Money Sack Watermark */}
      <svg className="absolute left-[50%] top-[38%] w-12 h-12 text-slate-300/60 pointer-events-none stroke-current fill-none stroke-[1.4]" viewBox="0 0 24 24">
        <path d="M12 2a4 4 0 0 0-4 4v1H6a3 3 0 0 0-3 3v8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-8a3 3 0 0 0-3-3h-2V6a4 4 0 0 0-4-4z" />
        <path d="M12 11v6m-2-4.5h4" />
      </svg>

      {/* Top Right Dollar Circle Watermark */}
      <div className="absolute right-[11%] top-[8%] w-16 h-16 rounded-full border border-slate-300/60 flex items-center justify-center text-slate-300/75 font-serif text-3xl pointer-events-none">
        $
      </div>

      {/* Mid Right Money Sack Watermark */}
      <svg className="absolute right-[14%] top-[32%] w-12 h-12 text-slate-300/60 pointer-events-none stroke-current fill-none stroke-[1.4]" viewBox="0 0 24 24">
        <path d="M12 2a4 4 0 0 0-4 4v1H6a3 3 0 0 0-3 3v8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-8a3 3 0 0 0-3-3h-2V6a4 4 0 0 0-4-4z" />
        <path d="M12 11v6m-2-4.5h4" />
      </svg>

      {/* Far Right Ring & Euro Watermark */}
      <div className="absolute right-[12%] bottom-[14%] w-14 h-14 rounded-full border border-slate-300/60 flex items-center justify-center text-slate-300/75 font-serif text-2xl pointer-events-none">
        €
      </div>

      {/* Small Ring Outline */}
      <div className="absolute right-[21%] top-[50%] w-4 h-4 rounded-full border border-slate-300/60 pointer-events-none" />

      {/* Far Right Sparkle */}
      <div className="absolute right-[6%] bottom-[30%] text-slate-300/70 pointer-events-none text-2xl select-none">
        ✦
      </div>


      {/* =========================================================================
          MAIN CONTAINER: 2 COLUMNS (Text + App Badges | 2 Phone Mockups)
         ========================================================================= */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: Typography & Store Download Buttons
             --------------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            
            {/* Sub-label matching reference */}
            <span className="text-sm sm:text-base text-slate-400 font-normal tracking-wide block mb-3">
              {t("appDownload.subtitle", "Download our mobile app to track passbooks, make payments, and view schemes.")}
            </span>

            {/* Main Bold Serif Heading - Guaranteed exact 3 lines */}
            <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[45px] xl:text-[52px] font-serif font-bold text-slate-800 leading-[1.12] tracking-tight mb-8 sm:mb-10 max-w-xl">
              {t("appDownload.title", "Manage your cooperative finances anywhere")}
            </h2>

            {/* Download Buttons matching exact yellow theme & layout */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              
              {/* Apple Store Button */}
              <a
                href="#apple-store"
                className="bg-[#fbb034] hover:bg-[#e99f24] text-white px-5 sm:px-6 py-3.5 rounded-[3px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3.5 group min-w-[170px] sm:min-w-[180px]"
              >
                {/* Apple Logo SVG */}
                <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.85.94-2.93-.93.04-2.09.63-2.73 1.4-.56.65-.99 1.74-.86 2.8.99.08 2.02-.49 2.65-1.27z" />
                </svg>
                <div className="text-left flex flex-col">
                  <span className="text-[10px] text-white/90 font-medium uppercase tracking-wider leading-none">
                    {t("appDownloadSection.downloadOnThe", "Download on the")}
                  </span>
                  <span className="text-[15px] sm:text-[16px] text-white font-bold tracking-tight leading-tight mt-1">
                    {t("appDownloadSection.appleStore", "Apple Store")}
                  </span>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="#google-play"
                className="bg-[#fbb034] hover:bg-[#e99f24] text-white px-5 sm:px-6 py-3.5 rounded-[3px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3.5 group min-w-[170px] sm:min-w-[180px]"
              >
                {/* Google Play Triangle SVG */}
                <svg className="w-5 h-5 fill-current text-white shrink-0 ml-0.5" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-.95L3 21.2v-18.4l.001-.036c.07-.404.288-.767.608-.95zM15.207 13.414l2.585 2.586-12.753 7.362 10.168-9.948zM19.42 10.598c.78.45.78 1.187 0 1.637l-2.628 1.517-2.793-2.793 2.793-2.793 2.628 1.517zM5.039.638l12.753 7.362-2.585 2.586L5.039.638z" />
                </svg>
                <div className="text-left flex flex-col">
                  <span className="text-[10px] text-white/90 font-medium uppercase tracking-wider leading-none">
                    {t("appDownloadSection.downloadOnThe", "Download on the")}
                  </span>
                  <span className="text-[15px] sm:text-[16px] text-white font-bold tracking-tight leading-tight mt-1">
                    {t("appDownloadSection.googlePlay", "Google Play")}
                  </span>
                </div>
              </a>

            </div>

          </div>


          {/* ---------------------------------------------------------------------
              RIGHT COLUMN: Exact 2 Mobile Phone Mockups + Floating Gold Coins
             --------------------------------------------------------------------- */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end mt-8 lg:mt-0">
            
            <div className="relative w-full max-w-[520px] h-[550px] sm:h-[600px]">
              
              {/* =================================================================
                  FLOATING GOLD COIN 1 (Top Right of Back Phone)
                 ================================================================= */}
              <div className="absolute right-[0%] sm:right-[3%] top-[24%] z-20 w-14 h-14 rounded-full bg-[#fbb034] shadow-[0_8px_20px_rgba(251,176,52,0.45)] border-2 border-[#fef08a] flex items-center justify-center transform rotate-12 pointer-events-none">
                <div className="w-10 h-10 rounded-full border border-dashed border-[#b45309]/35 flex items-center justify-center">
                  <span className="text-white font-serif font-bold text-xl drop-shadow-xs">$</span>
                </div>
              </div>

              {/* =================================================================
                  FLOATING GOLD COIN 2 (Bottom Left of Front Phone)
                 ================================================================= */}
              <div className="absolute left-[0%] sm:left-[2%] bottom-[26%] z-20 w-13 h-13 rounded-full bg-[#fbb034] shadow-[0_8px_20px_rgba(251,176,52,0.45)] border-2 border-[#fef08a] flex items-center justify-center transform -rotate-12 pointer-events-none">
                <div className="w-9 h-9 rounded-full border border-dashed border-[#b45309]/35 flex items-center justify-center">
                  <span className="text-white font-serif font-bold text-lg drop-shadow-xs">$</span>
                </div>
              </div>


              {/* =================================================================
                  PHONE 2 (Back / Right Phone - Login Screen Mockup)
                 ================================================================= */}
              <div className="absolute right-[6%] sm:right-[10%] top-[0%] w-[260px] sm:w-[280px] h-[500px] sm:h-[540px] bg-white rounded-[36px] border-[4px] border-[#a5e8e1] shadow-xl overflow-hidden flex flex-col z-0">
                
                {/* Speaker slit & camera dot */}
                <div className="h-6 flex items-center justify-center pt-2.5">
                  <div className="w-11 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Screen Content */}
                <div className="flex-1 px-4 py-2 flex flex-col justify-between bg-white text-slate-700">
                  
                  {/* Top Doodles & Avatar Banner */}
                  <div className="relative h-28 bg-[#f0faf8] rounded-xl p-3 overflow-hidden border border-teal-100/60">
                    
                    {/* Finance Doodles Pattern Background matching screenshot */}
                    <svg className="absolute inset-0 w-full h-full opacity-30 text-[#00b4a7] stroke-current fill-none pointer-events-none" viewBox="0 0 200 100">
                      {/* Grad cap */}
                      <path d="M20 25 L40 18 L60 25 L40 32 Z M40 32 V40 C40 43 55 43 55 40 V30" strokeWidth="1.4" />
                      {/* Lightbulb */}
                      <path d="M90 20 C85 20 82 24 82 28 C82 32 85 34 87 36 V40 H93 V36 C95 34 98 32 98 28 C98 24 95 20 90 20 Z" strokeWidth="1.3" />
                      {/* Calculator / Credit card */}
                      <rect x="120" y="20" width="22" height="15" rx="2" strokeWidth="1.3" />
                      <line x1="120" y1="24" x2="142" y2="24" strokeWidth="1.5" />
                      {/* Book */}
                      <path d="M155 22 C160 20 165 22 170 20 V35 C165 37 160 35 155 37 Z" strokeWidth="1.3" />
                      {/* Coin */}
                      <circle cx="35" cy="65" r="7" strokeWidth="1.3" />
                      <path d="M35 62 V68" strokeWidth="1.2" />
                      {/* Envelope */}
                      <rect x="70" y="58" width="20" height="13" rx="1.5" strokeWidth="1.3" />
                      <path d="M70 58 L80 66 L90 58" strokeWidth="1.2" />
                      {/* Pencil */}
                      <line x1="125" y1="58" x2="138" y2="71" strokeWidth="1.5" strokeLinecap="round" />
                      {/* Star */}
                      <path d="M165 60 L167 65 L172 65 L168 68 L170 73 L165 70 L160 73 L162 68 L158 65 L163 65 Z" strokeWidth="1" />
                    </svg>

                    {/* Teal Circular User Badge with shadow */}
                    <div className="absolute right-3 top-3 w-7 h-7 rounded-full bg-[#00b4a7] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                        {t("appDownloadSection.inputEmailAddress", "Input Email Address")}
                      </label>
                      <div className="text-[11px] text-slate-600 bg-white border border-slate-200/80 rounded px-2.5 py-1.5 font-normal">
                        {t("appDownloadSection.nameAurumfxCom", "name@aurumfx.com")}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                          {t("login.branchAdmin.passwordLabel", "Password")}
                        </span>
                        <span className="text-[9px] text-[#00b4a7] font-semibold cursor-pointer">
                          {t("login.branchAdmin.passwordLabel", "Password")}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 bg-white border border-slate-200/80 rounded px-2.5 py-1.5 font-normal">
                        ••••••••
                      </div>
                    </div>

                    {/* Sign In Button */}
                    <button className="w-full bg-[#00b4a7] text-white py-2.5 rounded font-semibold text-xs shadow-xs hover:bg-[#009c90] transition-colors mt-2">
                      {t("common.signIn", "Sign In")}
                    </button>

                    <p className="text-[9px] text-slate-400 text-center mt-2 font-normal">
                      {t("appDownloadSection.donTHaveAnAurumfx", "Don't have an AurumFX Account?")}
                    </p>
                  </div>

                  {/* Bottom Chin Home Button */}
                  <div className="h-10 flex items-center justify-center pb-1">
                    <div className="w-7 h-7 rounded-full border border-teal-200/80 flex items-center justify-center bg-teal-50/50">
                      <div className="w-3 h-3 rounded-full bg-[#a5e8e1]" />
                    </div>
                  </div>

                </div>

              </div>


              {/* =================================================================
                  PHONE 1 (Front / Left Phone - Loan Dashboard Mockup)
                 ================================================================= */}
              <div className="absolute left-[4%] sm:left-[8%] top-[8%] sm:top-[6%] w-[260px] sm:w-[280px] h-[500px] sm:h-[540px] bg-white rounded-[36px] border-[4px] border-slate-200/90 shadow-[0_20px_45px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col z-10">
                
                {/* Top Speaker slit */}
                <div className="h-6 flex items-center justify-center pt-2.5 bg-[#00b4a7]">
                  <div className="w-11 h-1 bg-white/40 rounded-full" />
                </div>

                {/* Screen Content */}
                <div className="flex-1 flex flex-col bg-white">
                  
                  {/* Teal Header Card */}
                  <div className="bg-[#00b4a7] text-white px-4 pt-1.5 pb-4 text-center rounded-b-2xl shadow-xs">
                    
                    {/* Status bar */}
                    <div className="flex justify-between items-center text-[9px] text-white/85 font-medium mb-2 px-1">
                      <span>{t("appDownloadSection.netcom", "●●● Netcom")}</span>
                      <span>{t("appDownloadSection.941Am", "9:41 AM")}</span>
                      <span>100% 🔋</span>
                    </div>

                    <h4 className="text-sm font-semibold tracking-wide text-white">
                      {t("appDownloadSection.studentLoan", "Student loan")}
                    </h4>
                    <span className="text-[10px] text-white/80 font-normal block mt-0.5">
                      {t("appDownloadSection.currentBalance", "current balance")}
                    </span>
                    <div className="text-2xl sm:text-[28px] font-serif font-bold text-white tracking-tight my-1.5">
                      $125,000
                    </div>

                    {/* Bottom Split Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 mt-2 text-[10px]">
                      <div>
                        <span className="text-white/70 block text-[9px]">{t("appDownloadSection.loanAmount", "loan amount")}</span>
                        <span className="font-semibold text-white">$125,000</span>
                      </div>
                      <div>
                        <span className="text-white/70 block text-[9px]">{t("appDownloadSection.remainingTerms", "remaining terms")}</span>
                        <span className="font-semibold text-white">{t("appDownloadSection.12Yr", "12 yr.")}</span>
                      </div>
                    </div>

                  </div>

                  {/* Body Content */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between text-slate-700">
                    
                    <div>
                      {/* Tabs */}
                      <div className="flex gap-4 border-b border-slate-100 pb-1.5 text-xs">
                        <span className="text-[#00b4a7] font-semibold border-b-2 border-[#00b4a7] pb-1 cursor-pointer">
                          {t("appDownloadSection.upcoming", "upcoming")}
                        </span>
                        <span className="text-slate-400 font-normal cursor-pointer">
                          {t("appDownloadSection.history", "history")}
                        </span>
                      </div>

                      {/* Transaction Rows */}
                      <div className="space-y-2.5 mt-3">
                        <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                          <div>
                            <span className="font-semibold text-slate-800 block text-[11px]">
                              {t("appDownloadSection.autoPayment", "Auto payment")}
                            </span>
                            <span className="text-[9px] text-slate-400">10/12/2026</span>
                          </div>
                          <span className="font-bold text-slate-700 text-xs">$460</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                          <div>
                            <span className="font-semibold text-slate-800 block text-[11px]">
                              {t("appDownloadSection.autoPayment", "Auto payment")}
                            </span>
                            <span className="text-[9px] text-slate-400">10/12/2026</span>
                          </div>
                          <span className="font-bold text-slate-700 text-xs">$460</span>
                        </div>
                      </div>
                    </div>

                    {/* Teal Button */}
                    <button className="w-full bg-[#00b4a7] hover:bg-[#009c90] text-white py-2.5 rounded font-semibold text-xs shadow-xs transition-colors mt-2">
                      {t("appDownloadSection.paymentOptions", "Payment options")}
                    </button>

                  </div>

                  {/* Bottom Chin Home Button */}
                  <div className="h-9 flex items-center justify-center pb-1">
                    <div className="w-7 h-7 rounded-full border border-teal-200/80 flex items-center justify-center bg-teal-50/50">
                      <div className="w-3 h-3 rounded-full bg-[#00b4a7]" />
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

    </section>
  );
}
