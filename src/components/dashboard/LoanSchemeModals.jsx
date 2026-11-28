import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  X,
  Landmark,
  Percent,
  Coins,
  ShieldCheck,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  Building,
  Tag,
  HelpCircle,
  Receipt
} from 'lucide-react';

const DEFAULT_SCHEME_FORM = {
  scheme_name: '',
  scheme_code: '',
  max_loan_amount: '',
  max_tenure_months: '',
  annual_interest_rate: '',
  overdue_interest_rate: '',
  processing_fee: '',
  processing_fee_type: 'percent',
  stamp_duty_charge: '',
  stamp_duty_charge_type: 'percent',
  insurance_fee: '',
  insurance_fee_type: 'percent',
  documentation_fee: '',
  documentation_fee_type: 'percent',
  foreclosure_charges: '',
  foreclosure_charges_type: 'percent',
  credit_period_days: '',
  penalty_charges: '',
  penalty_charges_type: 'percent',
  interest_type: 'reducing_emi',
  is_active: true,
  sms_charges: '',
  sms_charges_type: 'fixed',
  fuel_charges: '',
  fuel_charges_type: 'fixed',
  stationary_charges: '',
  stationary_charges_type: 'fixed',
  maintenance_charges: '',
  maintenance_charges_type: 'fixed',
  collection_charges: '',
  collection_charges_type: 'fixed',
  per_emi_charge_type: 'on_emi'
};

/**
 * Modal for Creating (POST) or Updating (PUT) a Loan Scheme
 */
export function LoanSchemeFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSubmit,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(DEFAULT_SCHEME_FORM);
  const [activeSection, setActiveSection] = useState('general'); // 'general' | 'fees' | 'operations'
  const [errorPopup, setErrorPopup] = useState(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        scheme_name: initialData.scheme_name || initialData.name || '',
        scheme_code: initialData.scheme_code || initialData.code || '',
        max_loan_amount: initialData.max_loan_amount ?? '',
        max_tenure_months: initialData.max_tenure_months ?? '',
        annual_interest_rate: initialData.annual_interest_rate ?? '',
        overdue_interest_rate: initialData.overdue_interest_rate ?? '',
        processing_fee: initialData.processing_fee ?? '',
        processing_fee_type: initialData.processing_fee_type || 'percent',
        stamp_duty_charge: initialData.stamp_duty_charge ?? '',
        stamp_duty_charge_type: initialData.stamp_duty_charge_type || 'percent',
        insurance_fee: initialData.insurance_fee ?? '',
        insurance_fee_type: initialData.insurance_fee_type || 'percent',
        documentation_fee: initialData.documentation_fee ?? '',
        documentation_fee_type: 'percent',
        foreclosure_charges: initialData.foreclosure_charges ?? '',
        foreclosure_charges_type: initialData.foreclosure_charges_type || 'percent',
        credit_period_days: initialData.credit_period_days ?? '',
        penalty_charges: initialData.penalty_charges ?? '',
        penalty_charges_type: initialData.penalty_charges_type || 'percent',
        interest_type: 'reducing_emi',
        is_active: initialData.is_active !== false,
        sms_charges: initialData.sms_charges ?? '',
        sms_charges_type: initialData.sms_charges_type || 'fixed',
        fuel_charges: initialData.fuel_charges ?? '',
        fuel_charges_type: initialData.fuel_charges_type || 'fixed',
        stationary_charges: initialData.stationary_charges ?? '',
        stationary_charges_type: initialData.stationary_charges_type || 'fixed',
        maintenance_charges: initialData.maintenance_charges ?? '',
        maintenance_charges_type: initialData.maintenance_charges_type || 'fixed',
        collection_charges: initialData.collection_charges ?? '',
        collection_charges_type: initialData.collection_charges_type || 'fixed',
        per_emi_charge_type: initialData.per_emi_charge_type || 'on_emi'
      });
    } else {
      setFormData(DEFAULT_SCHEME_FORM);
    }
    setErrorPopup(null);
    setActiveSection('general');
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextSection = () => {
    setErrorPopup(null);
    if (activeSection === 'general') {
      if (!formData.scheme_name.trim()) {
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: 'Scheme name is required.'
        });
        return;
      }
      if (!formData.scheme_code.trim()) {
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: 'Scheme code is required (e.g. SCH-AGRO-01).'
        });
        return;
      }
      if (!formData.max_loan_amount || Number(formData.max_loan_amount) <= 0) {
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: 'Maximum loan amount must be greater than zero.'
        });
        return;
      }
      if (!formData.max_tenure_months || Number(formData.max_tenure_months) <= 0) {
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: 'Maximum tenure must be at least 1 month.'
        });
        return;
      }
      if (formData.annual_interest_rate === '' || Number(formData.annual_interest_rate) < 0) {
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: 'Annual interest rate is required.'
        });
        return;
      }
      setActiveSection('fees');
    } else if (activeSection === 'fees') {
      const percentFields = [
        { key: 'processing_fee', label: i18n.t("branchManagerLoanSchemes.processingFee", "Processing Fee") },
        { key: 'stamp_duty_charge', label: i18n.t("loanSchemeModals.stampDutyCharge", "Stamp Duty Charge") },
        { key: 'insurance_fee', label: i18n.t("branchManagerLoanSchemes.insuranceFee", "Insurance Fee") },
        { key: 'documentation_fee', label: i18n.t("loanSchemeModals.documentationFee", "Documentation Fee") },
        { key: 'foreclosure_charges', label: i18n.t("loanSchemeModals.foreclosureCharges", "Foreclosure Charges") },
        { key: 'penalty_charges', label: i18n.t("loanSchemeModals.penaltyCharges", "Penalty Charges") }
      ];

      for (const field of percentFields) {
        const val = Number(formData[field.key]) || 0;
        if (val > 100) {
          setErrorPopup({
            title: i18n.t("loanSchemeModals.percentageLimit0100", "Percentage Limit (0% - 100%)"),
            message: `${field.label} cannot exceed 100% since its type is fixed to percentage (% of loan). Please enter a percentage value between 0 and 100 (e.g. 1 for 1%, 2.5 for 2.5%). Current entered value is ${val}%.`
          });
          return;
        }
        if (val < 0) {
          setErrorPopup({
            title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
            message: `${field.label} cannot be negative.`
          });
          return;
        }
      }
      setActiveSection('operations');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorPopup(null);

    if (!formData.scheme_name.trim()) {
      setActiveSection('general');
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Scheme name is required.'
      });
      return;
    }

    if (!formData.scheme_code.trim()) {
      setActiveSection('general');
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Scheme code is required (e.g. SCH-AGRO-01).'
      });
      return;
    }

    if (Number(formData.max_loan_amount) <= 0) {
      setActiveSection('general');
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Maximum loan amount must be greater than zero.'
      });
      return;
    }

    if (Number(formData.max_tenure_months) <= 0) {
      setActiveSection('general');
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Maximum tenure in months must be at least 1 month.'
      });
      return;
    }

    if (Number(formData.annual_interest_rate) < 0) {
      setActiveSection('general');
      setErrorPopup({
        title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
        message: 'Annual interest rate cannot be negative.'
      });
      return;
    }

    const percentFields = [
      { key: 'processing_fee', label: i18n.t("branchManagerLoanSchemes.processingFee", "Processing Fee") },
      { key: 'stamp_duty_charge', label: i18n.t("loanSchemeModals.stampDutyCharge", "Stamp Duty Charge") },
      { key: 'insurance_fee', label: i18n.t("branchManagerLoanSchemes.insuranceFee", "Insurance Fee") },
      { key: 'documentation_fee', label: i18n.t("loanSchemeModals.documentationFee", "Documentation Fee") },
      { key: 'foreclosure_charges', label: i18n.t("loanSchemeModals.foreclosureCharges", "Foreclosure Charges") },
      { key: 'penalty_charges', label: i18n.t("loanSchemeModals.penaltyCharges", "Penalty Charges") }
    ];

    for (const field of percentFields) {
      const val = Number(formData[field.key]) || 0;
      if (val > 100) {
        setActiveSection('fees');
        setErrorPopup({
          title: i18n.t("loanSchemeModals.percentageLimit0100", "Percentage Limit (0% - 100%)"),
          message: `${field.label} cannot exceed 100% since its type is fixed to percentage (% of loan). Please enter a percentage value between 0 and 100 (e.g. 1 for 1%, 2.5 for 2.5%). Current entered value is ${val}%.`
        });
        return;
      }
      if (val < 0) {
        setActiveSection('fees');
        setErrorPopup({
          title: i18n.t("modal.branchAdmin.validationError", "Validation Error"),
          message: `${field.label} cannot be negative.`
        });
        return;
      }
    }

    const payload = {
      scheme_name: formData.scheme_name.trim(),
      scheme_code: formData.scheme_code.trim().toUpperCase(),
      max_loan_amount: Number(formData.max_loan_amount) || 0,
      max_tenure_months: Number(formData.max_tenure_months) || 1,
      annual_interest_rate: Number(formData.annual_interest_rate) || 0,
      overdue_interest_rate: Number(formData.overdue_interest_rate) || 0,
      processing_fee: Number(formData.processing_fee) || 0,
      processing_fee_type: 'percent',
      stamp_duty_charge: Number(formData.stamp_duty_charge) || 0,
      stamp_duty_charge_type: 'percent',
      insurance_fee: Number(formData.insurance_fee) || 0,
      insurance_fee_type: 'percent',
      documentation_fee: Number(formData.documentation_fee) || 0,
      documentation_fee_type: 'percent',
      foreclosure_charges: Number(formData.foreclosure_charges) || 0,
      foreclosure_charges_type: 'percent',
      credit_period_days: Number(formData.credit_period_days) || 0,
      penalty_charges: Number(formData.penalty_charges) || 0,
      penalty_charges_type: 'percent',
      interest_type: 'reducing_emi',
      is_active: formData.is_active !== undefined ? Boolean(formData.is_active) : true,
      sms_charges: Number(formData.sms_charges) || 0,
      sms_charges_type: 'fixed',
      fuel_charges: Number(formData.fuel_charges) || 0,
      fuel_charges_type: 'fixed',
      stationary_charges: Number(formData.stationary_charges) || 0,
      stationary_charges_type: 'fixed',
      maintenance_charges: Number(formData.maintenance_charges) || 0,
      maintenance_charges_type: 'fixed',
      collection_charges: Number(formData.collection_charges) || 0,
      collection_charges_type: 'fixed',
      per_emi_charge_type: 'on_emi'
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setErrorPopup({
        title: mode === 'create' ? 'Scheme Creation Failed' : 'Scheme Update Failed',
        message: err.message || 'Operation failed. Please verify API response.'
      });
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={!isSubmitting ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[92vh] flex flex-col my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#008f85] flex items-center justify-center flex-shrink-0 shadow-inner">
              <Landmark className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {isEdit ? t("loanSchemeModals.updateLoanScheme", "Update Loan Scheme") : t("loanSchemeModals.createNewLoanScheme", "Create New Loan Scheme")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? `Modifying scheme "${initialData?.scheme_name || initialData?.scheme_code || 'Product'}"`
                  : t("loanSchemeModals.defineLendingRatesTenuresProcessing", "Define lending rates, tenures, processing fees, and per-EMI charges")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100 overflow-x-auto text-xs font-bold flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'general'
                ? 'bg-[#008f85] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{t("loanSchemeModals.1IdentityLendingTerms", "1. Identity & Lending Terms")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('fees')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'fees'
                ? 'bg-[#008f85] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t("loanSchemeModals.2UpfrontDefaultFees", "2. Upfront & Default Fees")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('operations')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'operations'
                ? 'bg-[#008f85] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{t("loanSchemeModals.3PerEmiOperationalLevies", "3. Per-EMI & Operational Levies")}</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (activeSection !== 'operations') {
                handleNextSection();
              }
            }
          }}
          className="flex-1 overflow-y-auto py-4 px-1 space-y-5"
        >
          
          {/* SECTION 1: Identity & Limits */}
          {activeSection === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-teal-600" />
                  <span>{t("fdMisSchemeModals.schemeIdentification", "Scheme Identification")}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("dashboardModule.productAccounts.schemeName", "Scheme Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_name"
                      required
                      value={formData.scheme_name}
                      onChange={handleChange}
                      placeholder={t("loanSchemeModals.eGAgroGoldHarvest", "e.g. Agro Gold Harvest Credit")}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("dashboardModule.productAccounts.schemeCode", "Scheme Code")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_code"
                      required
                      value={formData.scheme_code}
                      onChange={handleChange}
                      placeholder={t("loanSchemeModals.eGSchAgro01", "e.g. SCH-AGRO-01")}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                  </div>
                </div>
              </div>

              {/* Limits and Interest Terms */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-600" />
                  <span>{t("loanSchemeModals.loanCapsAnnualInterestRates", "Loan Caps & Annual Interest Rates")}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("loanSchemeModals.maxLoanAmount", "Max Loan Amount (₹)")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_loan_amount"
                      min={1}
                      required
                      value={formData.max_loan_amount}
                      onChange={handleChange}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("loanSchemeModals.maxTenureMonths", "Max Tenure (Months)")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_tenure_months"
                      min={1}
                      required
                      value={formData.max_tenure_months}
                      onChange={handleChange}
                      placeholder="e.g. 36"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("fdMisSchemeModals.annualInterestRate", "Annual Interest Rate (%)")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      name="annual_interest_rate"
                      required
                      value={formData.annual_interest_rate}
                      onChange={handleChange}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("loanSchemeModals.overdueInterestRate", "Overdue Interest Rate (%)")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      name="overdue_interest_rate"
                      value={formData.overdue_interest_rate}
                      onChange={handleChange}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">{t("loanSchemeModals.penalInterestOnLateEmi", "Penal interest on late EMI amounts")}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("loanSchemeModals.creditPeriodGraceDays", "Credit Period Grace (Days)")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      name="credit_period_days"
                      value={formData.credit_period_days}
                      onChange={handleChange}
                      placeholder="e.g. 7"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#008f85]"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">{t("loanSchemeModals.gracePeriodBeforeDefaultPenalty", "Grace period before default penalty triggers")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Upfront Fees & Default Charges */}
          {activeSection === 'fees' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-600" />
                    <span>{t("loanSchemeModals.sanctionLoanDocumentationFees", "Sanction & Loan Documentation Fees")}</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/70 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                    {t("loanSchemeModals.percentageValues0100", "Percentage values: 0% – 100%")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Processing Fee */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("branchManagerLoanSchemes.processingFee", "Processing Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="processing_fee"
                        value={formData.processing_fee}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Stamp Duty */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.stampDutyCharge", "Stamp Duty Charge")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="stamp_duty_charge"
                        value={formData.stamp_duty_charge}
                        onChange={handleChange}
                        placeholder="e.g. 0.5"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Insurance Fee */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("branchManagerLoanSchemes.insuranceFee", "Insurance Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="insurance_fee"
                        value={formData.insurance_fee}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Documentation Fee */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.documentationFee", "Documentation Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="documentation_fee"
                        value={formData.documentation_fee}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penalty and Foreclosure */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>{t("loanSchemeModals.penaltyEarlyForeclosureCharges", "Penalty & Early Foreclosure Charges")}</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200/80 px-2.5 py-0.5 rounded-full">
                    {t("loanSchemeModals.percentageValues0100", "Percentage values: 0% – 100%")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foreclosure Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.foreclosureCharges", "Foreclosure Charges")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="foreclosure_charges"
                        value={formData.foreclosure_charges}
                        onChange={handleChange}
                        placeholder="e.g. 2"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Penalty Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.penaltyCharges", "Penalty Charges")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        name="penalty_charges"
                        value={formData.penalty_charges}
                        onChange={handleChange}
                        placeholder="e.g. 2"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-12 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Per-EMI and Operational Levies */}
          {activeSection === 'operations' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-teal-600" />
                    <span>{t("loanSchemeModals.recurringPerEmiOperationalLevies", "Recurring Per-EMI Operational Levies")}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* SMS Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.smsNotificationFee", "SMS Notification Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        name="sms_charges"
                        value={formData.sms_charges}
                        onChange={handleChange}
                        placeholder="e.g. 25"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-10 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Stationary Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.stationeryAdministrativeFee", "Stationery & Administrative Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        name="stationary_charges"
                        value={formData.stationary_charges}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-10 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Fuel Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.fieldVisitTravelFee", "Field Visit & Travel Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        name="fuel_charges"
                        value={formData.fuel_charges}
                        onChange={handleChange}
                        placeholder="e.g. 0"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-10 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Maintenance Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("memberLoanSchemes.maintenanceFee", "Maintenance Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        name="maintenance_charges"
                        value={formData.maintenance_charges}
                        onChange={handleChange}
                        placeholder="e.g. 0"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-10 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Collection Charges */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">{t("loanSchemeModals.doorstepCollectionFee", "Doorstep Collection Fee")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        name="collection_charges"
                        value={formData.collection_charges}
                        onChange={handleChange}
                        placeholder="e.g. 0"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#008f85]"
                      />
                      <span className="w-10 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 flex items-center justify-center select-none shadow-2xs">
                        ₹
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 flex-shrink-0">
            <div>
              {activeSection !== 'general' && (
                <button
                  type="button"
                  onClick={() => setActiveSection(activeSection === 'operations' ? i18n.t("loanSchemeModals.fees", "fees") : i18n.t("loanSchemeModals.general", "general"))}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {t("loanSchemeModals.back", "← Back")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>

              {activeSection !== 'operations' && (
                <button
                  type="button"
                  onClick={handleNextSection}
                  className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isEdit
                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80'
                      : 'bg-gradient-to-r from-[#008f85] to-[#00a89c] hover:from-[#00786f] hover:to-[#008f85] text-white shadow-md'
                  }`}
                >
                  <span>{t("loanSchemeModals.fillNext", "Fill Next →")}</span>
                </button>
              )}

              {(isEdit || activeSection === 'operations') && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2 bg-gradient-to-r from-[#008f85] to-[#00a89c] hover:from-[#00786f] hover:to-[#008f85] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span>{isEdit ? t("memberNominee.saveChanges", "Save Changes") : t("fdMisSchemeModals.createScheme", "Create Scheme")}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Centered Red Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {typeof errorPopup === 'object' ? (errorPopup.title || 'Validation Error') : t("modal.branchAdmin.submissionError", "Submission Error")}
              </h3>
              <p className="text-xs sm:text-sm text-rose-900 mt-2.5 leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 font-medium break-words text-left">
                {typeof errorPopup === 'object' ? (errorPopup.message || JSON.stringify(errorPopup)) : String(errorPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t("modal.branchAdmin.okayGotIt", "Okay, Got It")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Modal for Viewing Complete Loan Scheme Details
 */
export function LoanSchemeDetailModal({
  isOpen,
  onClose,
  scheme = null,
  onEdit = null
}) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatCharge = (amount, type) => {
    if (amount === undefined || amount === null) return '0';
    return type === 'percent' ? `${amount}%` : `₹${amount}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[92vh] flex flex-col my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008f85] to-[#005f58] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-xl flex-shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {scheme.scheme_name || scheme.name}
                </h3>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  {scheme.scheme_code || scheme.code}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  scheme.is_active !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {scheme.is_active !== false ? t("announcementModals.active", "● Active") : t("announcementModals.inactive", "○ Inactive")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t("loanSchemeModals.interestMethod", "Interest Method:")} <strong className="text-slate-800 capitalize">{(scheme.interest_type || 'reducing_emi').replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t("loanSchemeModals.maxAmount", "Max Amount")}</span>
              <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(scheme.max_loan_amount)}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t("loanSchemeModals.maxTenure", "Max Tenure")}</span>
              <p className="text-lg font-black text-slate-900 mt-1">{scheme.max_tenure_months || 0} {t("branchManagerInvestmentSchemes.months", "Months")}</p>
            </div>
            <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl">
              <span className="text-[11px] text-teal-700 uppercase font-bold tracking-wider">{t("loanSchemeModals.annualInterest", "Annual Interest")}</span>
              <p className="text-lg font-black text-teal-900 mt-1">{scheme.annual_interest_rate ?? 0}% p.a.</p>
            </div>
            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl">
              <span className="text-[11px] text-amber-700 uppercase font-bold tracking-wider">{t("branchManagerLoanSchemes.overdueRate", "Overdue Rate")}</span>
              <p className="text-lg font-black text-amber-900 mt-1">{scheme.overdue_interest_rate ?? 0}% p.a.</p>
            </div>
          </div>

          {/* Upfront Fees Table */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>{t("loanSchemeModals.upfrontApplicationDocumentationCharges", "Upfront Application & Documentation Charges")}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("branchManagerLoanSchemes.processingFee", "Processing Fee")}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatCharge(scheme.processing_fee, scheme.processing_fee_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("loanSchemeModals.stampDutyCharge", "Stamp Duty Charge")}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatCharge(scheme.stamp_duty_charge, scheme.stamp_duty_charge_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("branchManagerLoanSchemes.insuranceFee", "Insurance Fee")}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatCharge(scheme.insurance_fee, scheme.insurance_fee_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("loanSchemeModals.documentationFee", "Documentation Fee")}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatCharge(scheme.documentation_fee, scheme.documentation_fee_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("loanSchemeModals.foreclosureCharges", "Foreclosure Charges")}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatCharge(scheme.foreclosure_charges, scheme.foreclosure_charges_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">{t("loanSchemeModals.penaltyCharges", "Penalty Charges")}</span>
                <span className="font-bold text-rose-700 text-sm mt-0.5 block">
                  {formatCharge(scheme.penalty_charges, scheme.penalty_charges_type)}
                </span>
              </div>
            </div>
          </div>

          {/* Per-EMI Operations Levies */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-teal-600" />
              <span>{t("loanSchemeModals.perEmiOperationalCharges", "Per-EMI Operational Charges")}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">{t("loanSchemeModals.smsNotificationFee", "SMS Notification Fee")}</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {formatCharge(scheme.sms_charges, scheme.sms_charges_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">{t("loanSchemeModals.stationeryAdmin", "Stationery & Admin")}</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {formatCharge(scheme.stationary_charges, scheme.stationary_charges_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">{t("loanSchemeModals.fieldTravelFee", "Field & Travel Fee")}</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {formatCharge(scheme.fuel_charges, scheme.fuel_charges_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">{t("memberLoanSchemes.maintenanceFee", "Maintenance Fee")}</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {formatCharge(scheme.maintenance_charges, scheme.maintenance_charges_type)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">{t("loanSchemeModals.doorstepCollectionFee", "Doorstep Collection Fee")}</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {formatCharge(scheme.collection_charges, scheme.collection_charges_type)}
                </span>
              </div>
            </div>
          </div>

          {/* Audit & Additional Policy Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t("loanSchemeModals.creditGracePeriod", "Credit Grace Period")}</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{scheme.credit_period_days || 0} {t("branchManagerInvestmentSchemes.days", "Days")}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t("dashboardModule.emergency.table.createdAt", "Created At")}</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{formatDateTime(scheme.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100 flex-shrink-0">
          <div className="text-[11px] text-slate-400">
            {t("investmentSchemeModals.created", "Created:")} <strong className="text-slate-700">{formatDateTime(scheme.created_at)}</strong>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(scheme);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t("superAdminFdMisSchemes.editScheme", "Edit Scheme")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#008f85] hover:bg-[#00786f] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t("branchManagerMemberPasswordUpdate.done", "Done")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

