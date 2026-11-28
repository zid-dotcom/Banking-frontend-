import React, { useState, useEffect } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import {
  X,
  TrendingUp,
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
  Calculator,
  AlertTriangle,
  Landmark,
  PiggyBank,
  PlusCircle
} from 'lucide-react';

export const CONTRIBUTION_FREQUENCY_OPTIONS = [
  { value: 'daily', label: i18n.t("branchManagerInvestmentSchemes.daily", "Daily"), unit: 'Days' },
  { value: 'weekly', label: i18n.t("branchManagerInvestmentSchemes.weekly", "Weekly"), unit: 'Weeks' },
  { value: 'monthly', label: i18n.t("dashboardModule.monthlyTargets.periodMonthly", "Monthly"), unit: 'Months' },
];

const INITIAL_FORM_STATE = {
  scheme_name: '',
  scheme_code: '',
  contribution_frequency: 'daily',
  installment_amount: '',
  tenure_installments: '',
  annual_interest_rate: '',
  description: '',
  is_active: true,
};

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatInterestRate(val) {
  if (val === undefined || val === null || val === '') return '0%';
  const num = Number(val);
  if (isNaN(num)) return `${val}%`;
  return `${num.toFixed(2)}%`;
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Modal for Creating and Editing Investment Schemes
 */
export function InvestmentSchemeFormModal({
  isOpen,
  mode = 'create',
  initialData = null,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          scheme_name: initialData.scheme_name || '',
          scheme_code: initialData.scheme_code || '',
          contribution_frequency: String(initialData.contribution_frequency || 'daily').toLowerCase(),
          installment_amount:
            initialData.installment_amount !== undefined && initialData.installment_amount !== null
              ? String(initialData.installment_amount)
              : '',
          tenure_installments:
            initialData.tenure_installments !== undefined && initialData.tenure_installments !== null
              ? String(initialData.tenure_installments)
              : '',
          annual_interest_rate:
            initialData.annual_interest_rate !== undefined && initialData.annual_interest_rate !== null
              ? String(initialData.annual_interest_rate)
              : '',
          description: initialData.description || '',
          is_active: initialData.is_active !== undefined ? Boolean(initialData.is_active) : true,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.scheme_name.trim()) {
      errs.scheme_name = 'Scheme Name is required.';
    }
    if (!formData.scheme_code.trim()) {
      errs.scheme_code = 'Scheme Code is required.';
    }
    if (!['daily', 'weekly', 'monthly'].includes(formData.contribution_frequency)) {
      errs.contribution_frequency = 'Contribution frequency must be Daily, Weekly, or Monthly.';
    }
    if (!formData.installment_amount || Number(formData.installment_amount) <= 0) {
      errs.installment_amount = 'Installment amount must be greater than 0.';
    }
    if (!formData.tenure_installments || parseInt(formData.tenure_installments, 10) <= 0) {
      errs.tenure_installments = 'Tenure installments must be at least 1.';
    }
    if (
      formData.annual_interest_rate === '' ||
      isNaN(formData.annual_interest_rate) ||
      Number(formData.annual_interest_rate) < 0 ||
      Number(formData.annual_interest_rate) > 100
    ) {
      errs.annual_interest_rate = 'Interest rate must be between 0% and 100%.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      scheme_name: formData.scheme_name.trim(),
      scheme_code: formData.scheme_code.trim().toUpperCase(),
      contribution_frequency: formData.contribution_frequency,
      installment_amount: Number(formData.installment_amount),
      tenure_installments: parseInt(formData.tenure_installments, 10),
      annual_interest_rate: Number(formData.annual_interest_rate),
      description: formData.description.trim(),
      is_active: Boolean(formData.is_active),
    });
  };

  const totalBaseContribution =
    (Number(formData.installment_amount) || 0) * (parseInt(formData.tenure_installments, 10) || 0);

  const selectedFreqObj = CONTRIBUTION_FREQUENCY_OPTIONS.find(
    (o) => o.value === formData.contribution_frequency
  ) || CONTRIBUTION_FREQUENCY_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden my-8 animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-slate-900">
                {mode === 'create' ? t("superAdminInvestmentSchemes.createInvestmentScheme", "Create Investment Scheme") : t("investmentSchemeModals.editInvestmentScheme", "Edit Investment Scheme")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'create'
                  ? t("investmentSchemeModals.configureARecurringDepositInvestment", "Configure a recurring deposit investment scheme with installment parameters")
                  : `Update terms for ${initialData?.scheme_name || 'Scheme'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Row 1: Scheme Name & Scheme Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("dashboardModule.productAccounts.schemeName", "Scheme Name")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="scheme_name"
                value={formData.scheme_name}
                onChange={handleChange}
                placeholder={t("investmentSchemeModals.eGDailyKisanMicro", "e.g. Daily Kisan Micro-Investment")}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all outline-none ${
                  errors.scheme_name
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
              {errors.scheme_name && (
                <p className="text-xs text-rose-500 font-semibold mt-1">{errors.scheme_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("dashboardModule.productAccounts.schemeCode", "Scheme Code")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="scheme_code"
                value={formData.scheme_code}
                onChange={handleChange}
                placeholder={t("investmentSchemeModals.eGInvDly01", "e.g. INV-DLY-01")}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold uppercase transition-all outline-none ${
                  errors.scheme_code
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
              {errors.scheme_code && (
                <p className="text-xs text-rose-500 font-semibold mt-1">{errors.scheme_code}</p>
              )}
            </div>
          </div>

          {/* Row 2: Contribution Frequency (Dropdown: Monthly, Weekly, Daily ONLY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("investmentSchemeModals.contributionFrequency", "Contribution Frequency")} <span className="text-rose-500">*</span>
              </label>
              <select
                name="contribution_frequency"
                value={formData.contribution_frequency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all cursor-pointer"
              >
                {CONTRIBUTION_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.unit})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {t("investmentSchemeModals.installmentDepositCycleForParticipating", "Installment deposit cycle for participating members")}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("investmentSchemeModals.installmentAmount", "Installment Amount (₹)")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  name="installment_amount"
                  min="1"
                  step="any"
                  value={formData.installment_amount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none ${
                    errors.installment_amount
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.installment_amount ? (
                <p className="text-xs text-rose-500 font-semibold mt-1">{errors.installment_amount}</p>
              ) : (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t("investmentSchemeModals.amountPer", "Amount per")} {selectedFreqObj.label.toLowerCase()} {t("investmentSchemeModals.installment", "installment")}
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Investment Duration & Annual Interest Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("investmentSchemeModals.investmentDuration", "Investment Duration (")}{selectedFreqObj.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="tenure_installments"
                min="1"
                step="1"
                value={formData.tenure_installments}
                onChange={handleChange}
                placeholder="e.g. 180"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none ${
                  errors.tenure_installments
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
              {errors.tenure_installments ? (
                <p className="text-xs text-rose-500 font-semibold mt-1">{errors.tenure_installments}</p>
              ) : (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t("investmentSchemeModals.totalDurationIn", "Total duration in")} {selectedFreqObj.unit.toLowerCase()} {t("investmentSchemeModals.forThisInvestmentPlan", "for this investment plan")}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("fdMisSchemeModals.annualInterestRate", "Annual Interest Rate (%)")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="annual_interest_rate"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.annual_interest_rate}
                  onChange={handleChange}
                  placeholder="e.g. 7.50"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none ${
                    errors.annual_interest_rate
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  % p.a.
                </span>
              </div>
              {errors.annual_interest_rate ? (
                <p className="text-xs text-rose-500 font-semibold mt-1">{errors.annual_interest_rate}</p>
              ) : (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t("investmentSchemeModals.annualYieldPercentageOnMaturity", "Annual yield percentage on maturity")}
                </span>
              )}
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                {t("investmentSchemeModals.schemeContributionProjection", "Scheme Contribution Projection")}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 font-bold uppercase tracking-wider">
                {selectedFreqObj.label} {t("investmentSchemeModals.cycle", "Cycle")}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">{t("investmentSchemeModals.perInstallment", "Per Installment")}</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(formData.installment_amount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">{t("branchManagerInvestmentSchemes.investmentDuration", "Investment Duration")}</span>
                <span className="text-sm font-black text-slate-900">
                  {formData.tenure_installments || 0} {selectedFreqObj.unit}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">{t("investmentSchemeModals.expectedPrincipalBase", "Expected Principal Base")}</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(totalBaseContribution)}
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("investmentSchemeModals.descriptionTermsNote", "Description / Terms Note")}
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder={t("investmentSchemeModals.eGSpeciallyDesignedDaily", "e.g. Specially designed daily recurring scheme for local vendors and daily wage members with guaranteed annual bonus yield.")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>

          {/* Row 5: Active Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">{t("investmentSchemeModals.schemeActiveStatus", "Scheme Active Status")}</span>
                <span className="text-[11px] text-slate-500">
                  {t("investmentSchemeModals.activeSchemesAreImmediatelyVisible", "Active schemes are immediately visible to Branch Admins and Members")}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'create' ? t("superAdminInvestmentSchemes.createInvestmentScheme", "Create Investment Scheme") : t("memberNominee.saveChanges", "Save Changes")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Viewing Investment Scheme Details
 */
export function InvestmentSchemeDetailModal({ isOpen, scheme, onClose, onApplyClick }) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  const freq = String(scheme.contribution_frequency || 'daily').toLowerCase();
  const freqObj = CONTRIBUTION_FREQUENCY_OPTIONS.find((o) => o.value === freq) || {
    label: freq.toUpperCase(),
    unit: 'Installments',
  };

  const totalBaseContribution =
    (Number(scheme.installment_amount) || 0) * (parseInt(scheme.tenure_installments, 10) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden my-8 animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-slate-900">
                  {scheme.scheme_name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    scheme.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {scheme.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                {t("applyProductAccountModal.schemeCode", "Scheme Code:")} {scheme.scheme_code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("branchManagerInvestmentSchemes.frequency2", "Frequency")}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold capitalize">
                {freqObj.label} ({freqObj.unit})
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("investmentSchemeModals.installmentAmount2", "Installment Amount")}
              </span>
              <span className="text-sm font-black text-slate-900">
                {formatCurrency(scheme.installment_amount)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("branchManagerInvestmentSchemes.investmentDuration", "Investment Duration")}
              </span>
              <span className="text-sm font-black text-slate-900">
                {scheme.tenure_installments} {freqObj.unit}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("branchManagerInvestmentSchemes.annualInterestRate", "Annual Interest Rate")}
              </span>
              <span className="text-sm font-black text-emerald-600">
                {formatInterestRate(scheme.annual_interest_rate)} p.a.
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                {t("investmentSchemeModals.expectedTotalPrincipal", "Expected Total Principal")}
              </span>
              <span className="text-sm font-black text-emerald-900">
                {formatCurrency(totalBaseContribution)}
              </span>
            </div>
          </div>

          {/* Description */}
          {scheme.description && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("investmentSchemeModals.schemeDescriptionHighlights", "Scheme Description & Highlights")}
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                {scheme.description}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{t("investmentSchemeModals.schemeId", "Scheme ID: #")}{scheme.id || scheme.scheme_id}</span>
            {scheme.created_at && <span>{t("investmentSchemeModals.created", "Created:")} {formatDate(scheme.created_at)}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
          {onApplyClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onApplyClick(scheme);
              }}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("fdMisSchemeModals.applyScheme", "Apply Scheme")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Soft-Deleting an Investment Scheme
 */
export function InvestmentSchemeDeleteModal({
  isOpen,
  scheme,
  isDeleting = false,
  onClose,
  onConfirm,
}) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 animate-scaleUp">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-serif font-black text-slate-900 mb-1">
          {t("investmentSchemeModals.deleteInvestmentScheme", "Delete Investment Scheme?")}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {t("investmentSchemeModals.areYouSureYouWant", "Are you sure you want to soft-delete the scheme")}{' '}
          <strong className="text-slate-900">{scheme.scheme_name}</strong> (
          <span className="font-mono">{scheme.scheme_code}</span>{t("investmentSchemeModals.itWillNoLongerBe", ")? It will no longer be available for new subscriptions.")}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t("superAdminFdMisSchemes.deleteScheme", "Delete Scheme")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
