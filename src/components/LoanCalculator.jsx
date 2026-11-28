import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';


export default function LoanCalculator({ onOpenEnquiry }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(18000);
  const [tenureMonths, setTenureMonths] = useState(6);

  // Math exactly matching ThemeForest reference design:
  // At $18,000 and 6 months: Total = $21,240, Monthly Borrowing = $3,540
  const totalPayable = useMemo(() => {
    const interestFactor = 0.03 * tenureMonths;
    return Math.round(amount * (1 + interestFactor));
  }, [amount, tenureMonths]);

  const monthlyPayment = useMemo(() => {
    return Math.round(totalPayable / tenureMonths);
  }, [totalPayable, tenureMonths]);

  const amountPercent = ((amount - 1000) / (35000 - 1000)) * 100;
  const tenurePercent = ((tenureMonths - 1) / (12 - 1)) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
      
      {/* ---------------------------------------------------------------------
          LEFT COLUMN: Sub-label, Serif Headline, 3-Step Numbered Process
         --------------------------------------------------------------------- */}
      <div className="lg:col-span-6 flex flex-col items-start text-left">
        
        {/* Subtle Eyebrow Label */}
        <span className="text-sm sm:text-base text-slate-400 font-normal tracking-wide block mb-3 sm:mb-4">
          {t("loans.eyebrow", "A quick & transparent process")}
        </span>

        {/* Signature Bold Serif Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-serif font-bold text-slate-900 leading-[1.08] tracking-tight mb-10 sm:mb-12">
          {t("loans.heading", "We have a simple online application:")}
        </h2>

        {/* 3 Numbered Steps with Golden Circular Badges */}
        <div className="space-y-8 sm:space-y-9 max-w-lg">
          
          {/* Step 1 */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#fccb34] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[#fccb34] font-bold text-base sm:text-lg">1</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-[19px] mb-1.5 leading-snug">
                {t("loans.step1Title", "Apply online in minutes")}
              </h3>
              <p className="text-slate-500 text-sm sm:text-[14.5px] leading-relaxed">
                {t("loans.step1Desc", "Complete our simple online application and find out if you're approved instantly.")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#fccb34] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[#fccb34] font-bold text-base sm:text-lg">2</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-[19px] mb-1.5 leading-snug">
                {t("loans.step2Title", "Select loan amount & term")}
              </h3>
              <p className="text-slate-500 text-sm sm:text-[14.5px] leading-relaxed">
                {t("loans.step2Desc", "Choose your loan amount and repayment period that fits your budget.")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#fccb34] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[#fccb34] font-bold text-base sm:text-lg">3</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-[19px] mb-1.5 leading-snug">
                {t("loans.step3Title", "Funds as soon as tomorrow")}
              </h3>
              <p className="text-slate-500 text-sm sm:text-[14.5px] leading-relaxed">
                {t("loans.step3Desc", "Money can be directly deposited into your bank account as soon as the next business day.")}
              </p>
            </div>
          </div>

        </div>

      </div>


      {/* ---------------------------------------------------------------------
          RIGHT COLUMN: Vibrant Teal Loan Rate Calculator Card
         --------------------------------------------------------------------- */}
      <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
        
        <div className="bg-[#00a699] rounded-[2px] p-8 sm:p-10 lg:p-12 xl:p-14 w-full max-w-[530px] shadow-sm text-white select-none">
          
          {/* Card Title */}
          <h3 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-white text-center mb-10 sm:mb-12 tracking-tight">
            {t("loans.calculatorTitle", "Calculate Your Rate")}
          </h3>

          <div className="space-y-8">
            
            {/* Slider 1: Amount */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm sm:text-base font-medium text-white">$1000</span>
                <span className="text-base sm:text-lg font-bold text-[#fccb34] tracking-tight">
                  ${amount.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base font-medium text-white">$35000</span>
              </div>
              
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="1000"
                  max="35000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #00d2c0 0%, #00d2c0 ${amountPercent}%, #fccb34 ${amountPercent}%, #fccb34 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-2.5 
                    [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:bg-white 
                    [&::-webkit-slider-thumb]:rounded-[1px] 
                    [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-2.5 
                    [&::-moz-range-thumb]:h-6 
                    [&::-moz-range-thumb]:bg-white 
                    [&::-moz-range-thumb]:rounded-[1px] 
                    [&::-moz-range-thumb]:border-0 
                    [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Slider 2: Months */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm sm:text-base font-medium text-white">{t("loanCalculator.1Months", "1 months")}</span>
                <span className="text-base sm:text-lg font-bold text-[#fccb34] tracking-tight">
                  {tenureMonths} {t("loanCalculator.months", "months")}
                </span>
                <span className="text-sm sm:text-base font-medium text-white">{t("loanCalculator.12Months", "12 months")}</span>
              </div>
              
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #00d2c0 0%, #00d2c0 ${tenurePercent}%, #fccb34 ${tenurePercent}%, #fccb34 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-2.5 
                    [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:bg-white 
                    [&::-webkit-slider-thumb]:rounded-[1px] 
                    [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-2.5 
                    [&::-moz-range-thumb]:h-6 
                    [&::-moz-range-thumb]:bg-white 
                    [&::-moz-range-thumb]:rounded-[1px] 
                    [&::-moz-range-thumb]:border-0 
                    [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Repayment Summary Breakdown */}
          <div className="mt-10 sm:mt-12 space-y-4 pt-2">
            <div className="flex justify-between items-center text-white">
              <span className="text-base sm:text-[17px] font-normal tracking-wide">{t("loans.monthlyPayment", "Monthly Payment")}:</span>
              <span className="text-base sm:text-[18px] font-bold tracking-tight">${monthlyPayment.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-base sm:text-[17px] font-normal text-white tracking-wide">{t("loans.totalPayable", "Total Payable")}:</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#fccb34] tracking-tight">${totalPayable.toLocaleString()}</span>
            </div>
          </div>

          {/* Apply Now Action Button */}
          <button
            type="button"
            onClick={() => onOpenEnquiry && onOpenEnquiry(`Loan Estimate: $${amount.toLocaleString()} for ${tenureMonths} Months`)}
            className="w-full mt-8 bg-[#0cbeab] hover:bg-[#0aa896] text-white py-4 px-6 text-sm sm:text-[15px] font-semibold tracking-wider text-center transition-all duration-200 cursor-pointer rounded-[2px] shadow-xs hover:shadow-md"
          >
            {t("common.applyNow", "Apply Now")}
          </button>

        </div>

      </div>

    </div>
  );
}
