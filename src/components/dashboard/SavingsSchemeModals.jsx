import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  X,
  PiggyBank,
  Wallet,
  Coins,
  Percent,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Info,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const PAYOUT_OPTIONS = [
  { value: 'monthly', label: i18n.t("savingsSchemeModals.monthlyPayout", "Monthly Payout") },
  { value: 'quarterly', label: i18n.t("fdMisSchemeModals.quarterlyPayout", "Quarterly Payout") },
  { value: 'half_yearly', label: i18n.t("fdMisSchemeModals.halfYearlyPayout", "Half-Yearly Payout") },
  { value: 'yearly', label: i18n.t("fdMisSchemeModals.yearlyAnnualPayout", "Yearly (Annual) Payout") },
];

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: i18n.t("dashboardModule.monthlyTargets.periodMonthly", "Monthly") },
  { value: 'quarterly', label: i18n.t("savingsSchemeModals.quarterly", "Quarterly") },
  { value: 'half_yearly', label: i18n.t("savingsSchemeModals.halfYearly", "Half-Yearly") },
  { value: 'yearly', label: i18n.t("savingsSchemeModals.yearly", "Yearly") },
];

const INITIAL_FORM_STATE = {
  scheme_name: '',
  scheme_code: '',
  min_opening_balance: '',
  min_monthly_avg_balance: '',
  annual_interest_rate: '',
  senior_citizen_addon_interest_rate: '',
  interest_payout_type: '',
  lock_in_amount: '',
  min_monthly_avg_balance_charge: '',
  service_charge_frequency: '',
  service_charges: '',
  sms_charge_frequency: '',
  sms_charges: '',
  is_active: true,
};

/**
 * Modal for Creating (POST) or Updating (PUT) a Savings Scheme
 */
export function SavingsSchemeFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSubmit,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          scheme_name: initialData.scheme_name || '',
          scheme_code: initialData.scheme_code || '',
          min_opening_balance: initialData.min_opening_balance !== undefined ? String(initialData.min_opening_balance) : '',
          min_monthly_avg_balance: initialData.min_monthly_avg_balance !== undefined ? String(initialData.min_monthly_avg_balance) : '',
          annual_interest_rate: initialData.annual_interest_rate !== undefined ? String(initialData.annual_interest_rate) : '',
          senior_citizen_addon_interest_rate: initialData.senior_citizen_addon_interest_rate !== undefined && initialData.senior_citizen_addon_interest_rate !== null ? String(initialData.senior_citizen_addon_interest_rate) : '',
          interest_payout_type: initialData.interest_payout_type || '',
          lock_in_amount: initialData.lock_in_amount !== undefined && initialData.lock_in_amount !== null ? String(initialData.lock_in_amount) : '',
          min_monthly_avg_balance_charge: initialData.min_monthly_avg_balance_charge !== undefined && initialData.min_monthly_avg_balance_charge !== null ? String(initialData.min_monthly_avg_balance_charge) : '',
          service_charge_frequency: initialData.service_charge_frequency || '',
          service_charges: initialData.service_charges !== undefined && initialData.service_charges !== null ? String(initialData.service_charges) : '',
          sms_charge_frequency: initialData.sms_charge_frequency || '',
          sms_charges: initialData.sms_charges !== undefined && initialData.sms_charges !== null ? String(initialData.sms_charges) : '',
          is_active: initialData.is_active !== undefined ? Boolean(initialData.is_active) : true,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setActiveStep(1);
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.scheme_name.trim()) {
      errs.scheme_name = 'Scheme Name is required (min 2 chars).';
    } else if (formData.scheme_name.trim().length < 2) {
      errs.scheme_name = 'Scheme Name must be at least 2 characters.';
    } else if (formData.scheme_name.trim().length > 100) {
      errs.scheme_name = 'Scheme Name cannot exceed 100 characters.';
    }

    if (!formData.scheme_code.trim()) {
      errs.scheme_code = 'Scheme Code is required (min 2 chars).';
    } else if (formData.scheme_code.trim().length < 2) {
      errs.scheme_code = 'Scheme Code must be at least 2 characters.';
    } else if (formData.scheme_code.trim().length > 20) {
      errs.scheme_code = 'Scheme Code cannot exceed 20 characters.';
    }

    if (formData.min_opening_balance === '' || isNaN(formData.min_opening_balance) || Number(formData.min_opening_balance) < 0) {
      errs.min_opening_balance = 'Valid opening balance (>= 0) required.';
    }

    if (formData.min_monthly_avg_balance === '' || isNaN(formData.min_monthly_avg_balance) || Number(formData.min_monthly_avg_balance) < 0) {
      errs.min_monthly_avg_balance = 'Valid minimum monthly average balance required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    const rate = Number(formData.annual_interest_rate);
    if (formData.annual_interest_rate === '' || isNaN(rate) || rate < 0 || rate > 100) {
      errs.annual_interest_rate = 'Annual Interest Rate must be between 0% and 100%.';
    }

    if (formData.senior_citizen_addon_interest_rate !== '') {
      const seniorAddon = Number(formData.senior_citizen_addon_interest_rate);
      if (isNaN(seniorAddon) || seniorAddon < 0 || seniorAddon > 100) {
        errs.senior_citizen_addon_interest_rate = 'Senior add-on must be between 0% and 100%.';
      }
    }

    if (!formData.interest_payout_type) {
      errs.interest_payout_type = 'Please select an Interest Payout Frequency.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (formData.lock_in_amount !== '') {
      const lockIn = Number(formData.lock_in_amount);
      if (isNaN(lockIn) || lockIn < 0) {
        errs.lock_in_amount = 'Lock-in amount must be a positive number.';
      }
    }

    if (formData.min_monthly_avg_balance_charge !== '') {
      const mabCharge = Number(formData.min_monthly_avg_balance_charge);
      if (isNaN(mabCharge) || mabCharge < 0) {
        errs.min_monthly_avg_balance_charge = 'MAB non-maintenance fee must be a valid number.';
      }
    }

    if (formData.service_charges !== '') {
      const serviceCharge = Number(formData.service_charges);
      if (isNaN(serviceCharge) || serviceCharge < 0) {
        errs.service_charges = 'Service charges must be a valid number.';
      }
    }

    if (formData.sms_charges !== '') {
      const smsCharge = Number(formData.sms_charges);
      if (isNaN(smsCharge) || smsCharge < 0) {
        errs.sms_charges = 'SMS charges must be a valid number.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (validateStep1()) setActiveStep(2);
    } else if (activeStep === 2) {
      if (validateStep2()) setActiveStep(3);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!validateStep1()) {
      setActiveStep(1);
      return;
    }
    if (!validateStep2()) {
      setActiveStep(2);
      return;
    }
    if (!validateStep3()) {
      setActiveStep(3);
      return;
    }

    const payload = {
      ...formData,
      senior_citizen_addon_interest_rate: formData.senior_citizen_addon_interest_rate || '0',
      lock_in_amount: formData.lock_in_amount || '0',
      min_monthly_avg_balance_charge: formData.min_monthly_avg_balance_charge || '0',
      service_charges: formData.service_charges || '0',
      service_charge_frequency: formData.service_charge_frequency || 'monthly',
      sms_charges: formData.sms_charges || '0',
      sms_charge_frequency: formData.sms_charge_frequency || 'monthly',
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#0f766e] border border-teal-500/20 flex-shrink-0">
              <PiggyBank className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {mode === 'edit' ? t("superAdminSavingsSchemes.editSavingsScheme", "Edit Savings Scheme") : t("savingsSchemeModals.createNewSavingsScheme", "Create New Savings Scheme")}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none">
                {t("savingsSchemeModals.configureMemberSavingsDepositCaps", "Configure member savings deposit caps, interest rates, and service charges")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Tabs Navigation */}
        <div className="px-3.5 sm:px-6 pt-3 sm:pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {[
            { step: 1, fullLabel: '1. Scheme Identity & Balances', shortLabel: '1. Identity & Balances' },
            { step: 2, fullLabel: '2. Interest Rates & Payout', shortLabel: '2. Rates & Payout' },
            { step: 3, fullLabel: '3. Service Levies & SMS Charges', shortLabel: '3. Levies & SMS' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                activeStep === item.step
                  ? 'bg-[#00b4a7] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-800 border border-slate-200/80'
              }`}
            >
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.fullLabel}</span>
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if (activeStep < 3) {
                  handleNext();
                } else {
                  handleSubmit(e);
                }
              }
            }
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          
          {/* STEP 1: Scheme Identification & Minimum Balances */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#00b4a7]" />
                  {t("fdMisSchemeModals.schemeIdentification", "Scheme Identification")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scheme Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("dashboardModule.productAccounts.schemeName", "Scheme Name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_name"
                      value={formData.scheme_name}
                      onChange={handleChange}
                      placeholder={t("savingsSchemeModals.eGRegularMemberSavings", "e.g. Regular Member Savings Deposit")}
                      maxLength={100}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                        errors.scheme_name
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                          : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                      }`}
                    />
                    {errors.scheme_name && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.scheme_name}
                      </p>
                    )}
                  </div>

                  {/* Scheme Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("dashboardModule.productAccounts.schemeCode", "Scheme Code")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_code"
                      value={formData.scheme_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheme_code: e.target.value.toUpperCase() }))}
                      placeholder={t("savingsSchemeModals.eGSavReg01", "e.g. SAV-REG-01")}
                      maxLength={20}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 font-medium ${
                        errors.scheme_code
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                          : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                      }`}
                    />
                    {errors.scheme_code && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.scheme_code}
                      </p>
                    )}
                  </div>

                  {/* Operational Status */}
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-teal-200 transition-colors">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {t("fdMisSchemeModals.schemeOperationalStatusActive", "Scheme Operational Status (Active)")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Minimum Balance Requirements */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#00b4a7]" />
                  {t("savingsSchemeModals.minimumBalanceRequirements", "Minimum Balance Requirements")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Min Opening Balance */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.minOpeningBalance", "Min Opening Balance (₹)")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="min_opening_balance"
                        value={formData.min_opening_balance}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                        min={0}
                        step="any"
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                          errors.min_opening_balance
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                        }`}
                      />
                    </div>
                    {errors.min_opening_balance && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.min_opening_balance}
                      </p>
                    )}
                  </div>

                  {/* Min Monthly Average Balance */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.minMonthlyAvgBalance", "Min Monthly Avg Balance (₹)")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="min_monthly_avg_balance"
                        value={formData.min_monthly_avg_balance}
                        onChange={handleChange}
                        placeholder="e.g. 1000"
                        min={0}
                        step="any"
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                          errors.min_monthly_avg_balance
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                        }`}
                      />
                    </div>
                    {errors.min_monthly_avg_balance && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.min_monthly_avg_balance}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Annual Interest Yields & Payout Schedule */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#00b4a7]" />
                  {t("fdMisSchemeModals.annualInterestYieldFormulas", "Annual Interest Yield Formulas")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Annual Interest Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("fdMisSchemeModals.annualInterestRate", "Annual Interest Rate (%)")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="annual_interest_rate"
                        value={formData.annual_interest_rate}
                        onChange={handleChange}
                        placeholder="e.g. 4.5"
                        min={0}
                        max={100}
                        step="any"
                        className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                          errors.annual_interest_rate
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                        }`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                    </div>
                    {errors.annual_interest_rate && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.annual_interest_rate}
                      </p>
                    )}
                  </div>

                  {/* Senior Citizen Add-on Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("fdMisSchemeModals.seniorCitizenAddOnRate", "Senior Citizen Add-on Rate (%)")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="senior_citizen_addon_interest_rate"
                        value={formData.senior_citizen_addon_interest_rate}
                        onChange={handleChange}
                        placeholder="e.g. 0.5"
                        min={0}
                        max={100}
                        step="any"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{t("fdMisSchemeModals.additionalYieldCreditedToSenior", "Additional yield credited to senior members")}</p>
                  </div>

                  {/* Interest Payout Type */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("fdMisSchemeModals.interestPayoutFrequency", "Interest Payout Frequency")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="interest_payout_type"
                      value={formData.interest_payout_type}
                      onChange={handleChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                        errors.interest_payout_type
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                          : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                      }`}
                    >
                      <option value="">{t("savingsSchemeModals.selectPayoutFrequency", "Select Payout Frequency")}</option>
                      {PAYOUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.interest_payout_type && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.interest_payout_type}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Operational Recovery Charges & SMS Levies */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
                  {t("savingsSchemeModals.operationalLeviesSmsCharges", "Operational Levies & SMS Charges")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lock-in Amount */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.lockInAmount", "Lock-in Amount (₹)")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="lock_in_amount"
                        value={formData.lock_in_amount}
                        onChange={handleChange}
                        placeholder="e.g. 0"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Min Monthly Avg Balance Non-maintenance Charge */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.mabNonMaintenanceFee", "MAB Non-Maintenance Fee (₹)")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="min_monthly_avg_balance_charge"
                        value={formData.min_monthly_avg_balance_charge}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Service Charges */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.serviceMaintenanceCharge", "Service / Maintenance Charge (₹)")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="service_charges"
                        value={formData.service_charges}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Service Charge Frequency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.serviceChargeFrequency", "Service Charge Frequency")}
                    </label>
                    <select
                      name="service_charge_frequency"
                      value={formData.service_charge_frequency}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                    >
                      <option value="">{t("savingsSchemeModals.selectServiceChargeFrequency", "Select Service Charge Frequency")}</option>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SMS Charges */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.smsAlertCharges", "SMS Alert Charges (₹)")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="sms_charges"
                        value={formData.sms_charges}
                        onChange={handleChange}
                        placeholder="e.g. 25"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* SMS Charge Frequency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t("savingsSchemeModals.smsChargeFrequency", "SMS Charge Frequency")}
                    </label>
                    <select
                      name="sms_charge_frequency"
                      value={formData.sms_charge_frequency}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                    >
                      <option value="">{t("savingsSchemeModals.selectSmsChargeFrequency", "Select SMS Charge Frequency")}</option>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3.5 sm:pt-4 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 bg-white">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t("fdMisSchemeModals.back", "Back")}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("common.cancel", "Cancel")}
              </button>

              {activeStep < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    mode === 'edit'
                      ? 'bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-teal-800'
                      : 'bg-[#00b4a7] hover:bg-[#009d91] text-white shadow-md shadow-teal-500/20'
                  }`}
                >
                  <span>{t("fdMisSchemeModals.fillNext", "Fill Next")}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {(mode === 'edit' || activeStep === 3) && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 hover:from-[#00a296] hover:to-[#0c625c] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>{t("branchStaffModals.saving", "Saving...")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{mode === 'edit' ? t("memberNominee.saveChanges", "Save Changes") : t("fdMisSchemeModals.createScheme", "Create Scheme")}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Viewing Savings Scheme Details
 */
export function SavingsSchemeDetailModal({
  isOpen,
  scheme,
  onClose,
  onEditClick,
  onDeleteClick
}) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-xl flex-shrink-0">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {scheme.scheme_name}
                </h3>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {scheme.scheme_code}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  scheme.is_active !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {scheme.is_active !== false ? t("announcementModals.active", "● Active") : t("announcementModals.inactive", "○ Inactive")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t("savingsSchemeModals.savingsDepositSchemePolicyGovernance", "Savings Deposit Scheme Policy & Governance Terms")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          
          {/* Key Rates Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-teal-50/70 rounded-2xl p-3.5 border border-teal-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                {t("branchManagerInvestmentSchemes.annualInterestRate", "Annual Interest Rate")}
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-teal-950 mt-1">
                {scheme.annual_interest_rate}% <span className="text-xs font-medium text-teal-700">p.a.</span>
              </p>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                {t("fdMisSchemeModals.seniorCitizenAddOn", "Senior Citizen Add-on")}
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-amber-950 mt-1">
                +{scheme.senior_citizen_addon_interest_rate || 0}%
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t("savingsSchemeModals.minOpeningBalance2", "Min Opening Balance")}
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-slate-900 mt-1">
                {formatCurrency(scheme.min_opening_balance)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t("savingsSchemeModals.minMonthlyAvgBalance2", "Min Monthly Avg Balance")}
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-slate-900 mt-1">
                {formatCurrency(scheme.min_monthly_avg_balance)}
              </p>
            </div>
          </div>

          {/* Section 1: Minimum Balance Requirements & Account Policy */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#00b4a7]" />
              <span>{t("savingsSchemeModals.minimumBalanceRequirementsAccountPolicy", "Minimum Balance Requirements & Account Policy")}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.minimumOpeningBalance", "Minimum Opening Balance")}</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.min_opening_balance)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.initialRequiredDeposit", "Initial required deposit")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.minimumMonthlyAverageBalance", "Minimum Monthly Average Balance")}</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.min_monthly_avg_balance)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.requiredMaintainableMab", "Required maintainable MAB")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.mabNonMaintenanceCharge", "MAB Non-Maintenance Charge")}</span>
                <span className="font-bold text-rose-700 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.min_monthly_avg_balance_charge)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.feeWhenBalanceFallsBelow", "Fee when balance falls below MAB")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.lockInAmount2", "Lock-in Amount")}</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.lock_in_amount)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.mandatoryReserveDeposit", "Mandatory reserve deposit")}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Annual Interest Yield Formulas & Payout Schedule */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#00b4a7]" />
              <span>{t("savingsSchemeModals.annualInterestYieldFormulasPayout", "Annual Interest Yield Formulas & Payout Schedule")}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100/80">
                <span className="text-teal-800 block font-medium">{t("branchManagerInvestmentSchemes.annualInterestRate", "Annual Interest Rate")}</span>
                <span className="font-bold text-teal-950 text-sm sm:text-base mt-1 block font-sans">
                  {scheme.annual_interest_rate}% <span className="text-xs font-medium text-teal-700">p.a.</span>
                </span>
                <span className="text-[11px] text-teal-700/80 mt-0.5 block">{t("savingsSchemeModals.baseAnnualPercentageYield", "Base annual percentage yield")}</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/80">
                <span className="text-amber-800 block font-medium">{t("savingsSchemeModals.seniorCitizenAddOnRate", "Senior Citizen Add-on Rate")}</span>
                <span className="font-bold text-amber-950 text-sm sm:text-base mt-1 block font-sans">
                  +{scheme.senior_citizen_addon_interest_rate || 0}%
                </span>
                <span className="text-[11px] text-amber-700/80 mt-0.5 block">{t("fdMisSchemeModals.specialRateCreditedToSenior", "Special rate credited to senior members")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("fdMisSchemeModals.interestPayoutFrequency", "Interest Payout Frequency")}</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block capitalize">
                  {scheme.interest_payout_type ? scheme.interest_payout_type.replace('_', ' ') + ' Payout' : t("savingsSchemeModals.monthlyPayout", "Monthly Payout")}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.creditDistributionInterval", "Credit distribution interval")}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Operational Service Levies & SMS Notification Charges */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
              <span>{t("savingsSchemeModals.operationalServiceLeviesSmsNotification", "Operational Service Levies & SMS Notification Charges")}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.periodicServiceCharges", "Periodic Service Charges")}</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-bold text-slate-900 text-sm sm:text-base font-sans">
                    {formatCurrency(scheme.service_charges)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    / {scheme.service_charge_frequency || 'monthly'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.accountMaintenanceLevyFee", "Account maintenance & levy fee")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("savingsSchemeModals.smsNotificationCharges", "SMS Notification Charges")}</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-bold text-slate-900 text-sm sm:text-base font-sans">
                    {formatCurrency(scheme.sms_charges)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    / {scheme.sms_charge_frequency || 'monthly'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("savingsSchemeModals.transactionalAlertSubscriptionFee", "Transactional alert subscription fee")}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">{t("dashboardModule.emergency.table.createdAt", "Created At")}</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm mt-1.5 block">
                  {formatDate(scheme.created_at)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t("fdMisSchemeModals.schemeCreationTimestamp", "Scheme creation timestamp")}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3.5 sm:pt-4 flex items-center justify-between border-t border-slate-100 flex-shrink-0">
            {onDeleteClick ? (
              <button
                onClick={() => {
                  onClose();
                  if (onDeleteClick) onDeleteClick(scheme);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t("superAdminFdMisSchemes.deleteScheme", "Delete Scheme")}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 sm:gap-2.5">
              {onEditClick && (
                <button
                  onClick={() => {
                    onClose();
                    if (onEditClick) onEditClick(scheme);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t("superAdminFdMisSchemes.editScheme", "Edit Scheme")}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 sm:px-6 py-2 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white hover:from-[#00a296] hover:to-[#0c625c] rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
              >
                {t("branchManagerMemberPasswordUpdate.done", "Done")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Confirming Savings Scheme Deletion
 */
export function SavingsSchemeDeleteModal({
  isOpen,
  scheme,
  onClose,
  onConfirm,
  isDeleting = false
}) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("savingsSchemeModals.deleteSavingsScheme", "Delete Savings Scheme?")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
              {t("savingsSchemeModals.areYouSureYouWant", "Are you sure you want to permanently delete the savings scheme")}{' '}
              <strong className="text-slate-800 font-bold">"{scheme.scheme_name}"</strong> ({scheme.scheme_code})?
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-left">
            <p className="text-xs text-amber-800 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                {t("savingsSchemeModals.ifMembersHaveOpenDeposit", "If members have open deposit accounts linked to this scheme, the backend may reject the deletion until accounts are migrated or closed.")}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={() => onConfirm(scheme)}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("branchStaffModals.deleting", "Deleting...")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("branchStaffModals.yesDelete", "Yes, Delete")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

