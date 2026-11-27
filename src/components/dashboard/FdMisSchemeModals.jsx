import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Receipt,
  AlertTriangle,
  Landmark,
  PlusCircle
} from 'lucide-react';

const PAYOUT_OPTIONS = [
  { value: 'cumulative_yearly', label: 'Cumulative Yearly (Reinvestment / Compounding)' },
  { value: 'monthly', label: 'Monthly Income Scheme (MIS Payout)' },
  { value: 'quarterly', label: 'Quarterly Payout' },
  { value: 'half_yearly', label: 'Half-Yearly Payout' },
  { value: 'yearly', label: 'Yearly (Annual) Payout' },
  { value: 'on_maturity', label: 'On Maturity (Simple / Cumulative)' },
];

const TENURE_UNIT_OPTIONS = [
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
  { value: 'days', label: 'Days' },
];

const CHARGE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed (₹)' },
  { value: 'percent', label: 'Percentage (%)' },
];

const INITIAL_FORM_STATE = {
  scheme_name: '',
  scheme_code: '',
  minimum_fd_mis_amount: '',
  fd_mis_lock_in_period_months: '',
  annual_interest_rate: '',
  senior_citizen_addon_interest_rate: '',
  interest_lock_in_period_months: '',
  tenure_value: '',
  tenure_unit: 'months',
  bonus_rate: '',
  bonus_rate_type: 'percent',
  cancellation_charges: '',
  cancellation_charges_type: 'fixed',
  penal_charges_percent: '',
  stationary_charges: '',
  interest_payout_type: '',
  is_active: true,
};

/**
 * Modal for Creating and Editing FD/MIS Schemes
 */
export function FdMisSchemeFormModal({
  isOpen,
  mode = 'create',
  initialData = null,
  isSubmitting = false,
  onClose,
  onSubmit
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          scheme_name: initialData.scheme_name || '',
          scheme_code: initialData.scheme_code || '',
          minimum_fd_mis_amount: initialData.minimum_fd_mis_amount !== undefined && initialData.minimum_fd_mis_amount !== null ? String(initialData.minimum_fd_mis_amount) : '',
          fd_mis_lock_in_period_months: initialData.fd_mis_lock_in_period_months !== undefined && initialData.fd_mis_lock_in_period_months !== null ? String(initialData.fd_mis_lock_in_period_months) : '',
          annual_interest_rate: initialData.annual_interest_rate !== undefined && initialData.annual_interest_rate !== null ? String(initialData.annual_interest_rate) : '',
          senior_citizen_addon_interest_rate: initialData.senior_citizen_addon_interest_rate !== undefined && initialData.senior_citizen_addon_interest_rate !== null ? String(initialData.senior_citizen_addon_interest_rate) : '',
          interest_lock_in_period_months: initialData.interest_lock_in_period_months !== undefined && initialData.interest_lock_in_period_months !== null ? String(initialData.interest_lock_in_period_months) : '',
          tenure_value: initialData.tenure_value !== undefined && initialData.tenure_value !== null ? String(initialData.tenure_value) : '',
          tenure_unit: initialData.tenure_unit || 'months',
          bonus_rate: initialData.bonus_rate !== undefined && initialData.bonus_rate !== null ? String(initialData.bonus_rate) : '',
          bonus_rate_type: initialData.bonus_rate_type || 'percent',
          cancellation_charges: initialData.cancellation_charges !== undefined && initialData.cancellation_charges !== null ? String(initialData.cancellation_charges) : '',
          cancellation_charges_type: initialData.cancellation_charges_type || 'fixed',
          penal_charges_percent: initialData.penal_charges_percent !== undefined && initialData.penal_charges_percent !== null ? String(initialData.penal_charges_percent) : '',
          stationary_charges: initialData.stationary_charges !== undefined && initialData.stationary_charges !== null ? String(initialData.stationary_charges) : '',
          interest_payout_type: initialData.interest_payout_type || '',
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

    if (formData.minimum_fd_mis_amount === '' || isNaN(formData.minimum_fd_mis_amount) || Number(formData.minimum_fd_mis_amount) <= 0) {
      errs.minimum_fd_mis_amount = 'Minimum deposit amount must be greater than zero.';
    }

    if (formData.tenure_value === '' || isNaN(formData.tenure_value) || Number(formData.tenure_value) <= 0) {
      errs.tenure_value = 'Duration must be at least 1.';
    }

    if (formData.fd_mis_lock_in_period_months !== '') {
      const lockIn = Number(formData.fd_mis_lock_in_period_months);
      if (isNaN(lockIn) || lockIn < 0 || lockIn > 1200) {
        errs.fd_mis_lock_in_period_months = 'Minimum deposit period must be between 0 and 1200 months.';
      }
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
      const srRate = Number(formData.senior_citizen_addon_interest_rate);
      if (isNaN(srRate) || srRate < 0 || srRate > 100) {
        errs.senior_citizen_addon_interest_rate = 'Senior add-on rate must be between 0% and 100%.';
      }
    }

    if (formData.interest_lock_in_period_months !== '') {
      const lockIn = Number(formData.interest_lock_in_period_months);
      if (isNaN(lockIn) || lockIn < 0 || lockIn > 1200) {
        errs.interest_lock_in_period_months = 'Interest lock-in must be between 0 and 1200 months.';
      }
    }

    if (!formData.interest_payout_type) {
      errs.interest_payout_type = 'Please select an interest payout frequency.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};

    if (formData.bonus_rate !== '') {
      const bonus = Number(formData.bonus_rate);
      if (isNaN(bonus) || bonus < 0) {
        errs.bonus_rate = 'Bonus rate must be a valid non-negative number.';
      }
    }

    if (formData.cancellation_charges !== '') {
      const charge = Number(formData.cancellation_charges);
      if (isNaN(charge) || charge < 0) {
        errs.cancellation_charges = 'Cancellation charges must be a valid non-negative number.';
      }
    }

    if (formData.penal_charges_percent !== '') {
      const penal = Number(formData.penal_charges_percent);
      if (isNaN(penal) || penal < 0 || penal > 100) {
        errs.penal_charges_percent = 'Penal charges percent must be between 0% and 100%.';
      }
    }

    if (formData.stationary_charges !== '') {
      const stationary = Number(formData.stationary_charges);
      if (isNaN(stationary) || stationary < 0) {
        errs.stationary_charges = 'Stationary charges must be a valid non-negative number.';
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
      minimum_fd_mis_amount: Number(formData.minimum_fd_mis_amount) || 0,
      fd_mis_lock_in_period_months: Number(formData.fd_mis_lock_in_period_months) || 0,
      annual_interest_rate: Number(formData.annual_interest_rate) || 0,
      senior_citizen_addon_interest_rate: Number(formData.senior_citizen_addon_interest_rate) || 0,
      interest_lock_in_period_months: Number(formData.interest_lock_in_period_months) || 0,
      tenure_value: Number(formData.tenure_value) || 1,
      tenure_unit: formData.tenure_unit || 'months',
      bonus_rate: Number(formData.bonus_rate) || 0,
      bonus_rate_type: formData.bonus_rate_type || 'percent',
      cancellation_charges: Number(formData.cancellation_charges) || 0,
      cancellation_charges_type: formData.cancellation_charges_type || 'fixed',
      penal_charges_percent: Number(formData.penal_charges_percent) || 0,
      stationary_charges: Number(formData.stationary_charges) || 0,
      interest_payout_type: formData.interest_payout_type || 'cumulative_yearly',
      is_active: Boolean(formData.is_active),
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#0f766e] border border-teal-500/20 flex-shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-[#00b4a7]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {mode === 'edit' ? 'Edit FD / MIS Scheme' : 'Create New FD / MIS Scheme'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none">
                Configure term deposit tenure, yield formula, payout schedules, and pre-closure terms
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
            { step: 1, fullLabel: '1. Deposit Terms & Duration', shortLabel: '1. Terms & Duration' },
            { step: 2, fullLabel: '2. Interest Rates & Payout', shortLabel: '2. Rates & Payout' },
            { step: 3, fullLabel: '3. Levies, Bonus & Penalties', shortLabel: '3. Levies & Penalties' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
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
          
          {/* STEP 1: Deposit Terms, Identity & Tenure */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#00b4a7]" />
                  Scheme Identification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scheme Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Scheme Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_name"
                      value={formData.scheme_name}
                      onChange={handleChange}
                      placeholder="e.g. Senior Citizen Fixed Deposit - 3 Years"
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
                      Scheme Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_code"
                      value={formData.scheme_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheme_code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. FD-MIS-01"
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
                        Scheme Operational Status (Active)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Deposit Caps & Duration */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#00b4a7]" />
                  Deposit Caps &amp; Duration
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Minimum Deposit Amount */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Minimum Deposit Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="minimum_fd_mis_amount"
                        value={formData.minimum_fd_mis_amount}
                        onChange={handleChange}
                        placeholder="e.g. 10000"
                        min={1}
                        step="any"
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                          errors.minimum_fd_mis_amount
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                        }`}
                      />
                    </div>
                    {errors.minimum_fd_mis_amount && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.minimum_fd_mis_amount}
                      </p>
                    )}
                  </div>

                  {/* Duration & Unit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Duration &amp; Unit <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="tenure_value"
                        value={formData.tenure_value}
                        onChange={handleChange}
                        placeholder="e.g. 12"
                        min={1}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-medium ${
                          errors.tenure_value
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white'
                        }`}
                      />
                      <select
                        name="tenure_unit"
                        value={formData.tenure_unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium capitalize"
                      >
                        {TENURE_UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.tenure_value && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.tenure_value}
                      </p>
                    )}
                  </div>

                  {/* Minimum Deposit Period (Months) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Minimum Deposit Period (Months)
                    </label>
                    <input
                      type="number"
                      name="fd_mis_lock_in_period_months"
                      value={formData.fd_mis_lock_in_period_months}
                      onChange={handleChange}
                      placeholder="e.g. 12 (0 for none)"
                      min={0}
                      max={1200}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Minimum duration before deposit principal can be withdrawn or pre-closed (default: 0)
                    </p>
                    {errors.fd_mis_lock_in_period_months && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.fd_mis_lock_in_period_months}
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
                  Annual Interest Yield Formulas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Annual Interest Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Annual Interest Rate (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="annual_interest_rate"
                        value={formData.annual_interest_rate}
                        onChange={handleChange}
                        placeholder="e.g. 7.5"
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
                      Senior Citizen Add-on Rate (%)
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
                    <p className="text-[11px] text-slate-400 mt-1">Additional yield credited to senior members</p>
                  </div>

                  {/* Interest Lock-in Period (Months) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Interest Lock-in Period (Months)
                    </label>
                    <input
                      type="number"
                      name="interest_lock_in_period_months"
                      value={formData.interest_lock_in_period_months}
                      onChange={handleChange}
                      placeholder="e.g. 6 (0 for none)"
                      min={0}
                      max={1200}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Lock-in on accrued interest payout</p>
                  </div>

                  {/* Interest Payout Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Interest Payout Frequency <span className="text-red-500">*</span>
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
                      <option value="">Select Interest Payout Frequency</option>
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

          {/* STEP 3: Levies, Bonus & Penalties */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
                  Maturity Bonus, Penalties &amp; Cancellation Levies
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bonus Rate & Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Maturity Bonus Rate
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="bonus_rate"
                        value={formData.bonus_rate}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        min={0}
                        step="any"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                      <select
                        name="bonus_rate_type"
                        value={formData.bonus_rate_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      >
                        {CHARGE_TYPE_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pre-closure / Cancellation Charges */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pre-closure Cancellation Fee
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="cancellation_charges"
                        value={formData.cancellation_charges}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                        min={0}
                        step="any"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                      <select
                        name="cancellation_charges_type"
                        value={formData.cancellation_charges_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      >
                        {CHARGE_TYPE_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Penal Charges Percent */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Penal Charges on Premature Liquidation (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="penal_charges_percent"
                        value={formData.penal_charges_percent}
                        onChange={handleChange}
                        placeholder="e.g. 1.0"
                        min={0}
                        max={100}
                        step="any"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Interest reduction penalty on early redemption</p>
                  </div>

                  {/* Stationary Charges */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Stationery &amp; Certificate Charges (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        name="stationary_charges"
                        value={formData.stationary_charges}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        min={0}
                        step="any"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-teal-100 bg-white text-sm transition-all focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Certificate issuing fee</p>
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
                  <span>Back</span>
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
                Cancel
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
                  <span>Fill Next</span>
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{mode === 'edit' ? 'Save Changes' : 'Create Scheme'}</span>
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
 * Modal for Viewing FD/MIS Scheme Details
 */
export function FdMisSchemeDetailModal({
  isOpen,
  scheme,
  onClose,
  onEditClick,
  onDeleteClick,
  onApplyClick
}) {
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
              <Coins className="w-6 h-6" />
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
                  {scheme.is_active !== false ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Fixed &amp; Monthly Income Scheme Product Policy &amp; Terms
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
                Annual Interest Rate
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-teal-950 mt-1">
                {scheme.annual_interest_rate}% <span className="text-xs font-medium text-teal-700">p.a.</span>
              </p>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Senior Citizen Add-on
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-amber-950 mt-1">
                +{scheme.senior_citizen_addon_interest_rate || 0}%
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Min Deposit Amount
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-slate-900 mt-1">
                {formatCurrency(scheme.minimum_fd_mis_amount)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Duration
              </span>
              <p className="text-base sm:text-lg font-bold font-sans text-slate-900 mt-1 capitalize">
                {scheme.tenure_value} {scheme.tenure_unit || 'months'}
              </p>
            </div>
          </div>

          {/* Section 1: Deposit Terms, Lock-in & Payout */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#00b4a7]" />
              <span>Deposit Terms &amp; Lock-in Governance</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Minimum Deposit Amount</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.minimum_fd_mis_amount)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Principal opening threshold</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Deposit Duration</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block capitalize">
                  {scheme.tenure_value} {scheme.tenure_unit || 'months'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Maturity commitment window</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Minimum Deposit Period</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block">
                  {scheme.fd_mis_lock_in_period_months || 0} Months
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Minimum commitment interval</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Interest Lock-in Period</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block">
                  {scheme.interest_lock_in_period_months || 0} Months
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Yield distribution hold</span>
              </div>
            </div>
          </div>

          {/* Section 2: Interest Yield Formulas & Payout Schedule */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#00b4a7]" />
              <span>Interest Yield Formulas &amp; Payout Schedule</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100/80">
                <span className="text-teal-800 block font-medium">Annual Interest Rate</span>
                <span className="font-bold text-teal-950 text-sm sm:text-base mt-1 block font-sans">
                  {scheme.annual_interest_rate}% <span className="text-xs font-medium text-teal-700">p.a.</span>
                </span>
                <span className="text-[11px] text-teal-700/80 mt-0.5 block">Contracted annual rate</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/80">
                <span className="text-amber-800 block font-medium">Senior Citizen Add-on</span>
                <span className="font-bold text-amber-950 text-sm sm:text-base mt-1 block font-sans">
                  +{scheme.senior_citizen_addon_interest_rate || 0}%
                </span>
                <span className="text-[11px] text-amber-700/80 mt-0.5 block">Special rate credited to senior members</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Interest Payout Frequency</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block capitalize">
                  {scheme.interest_payout_type ? scheme.interest_payout_type.replace(/_/g, ' ') : 'Cumulative Yearly'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Credited or compounded distribution</span>
              </div>
            </div>
          </div>

          {/* Section 3: Maturity Bonus, Pre-closure & Penal Levies */}
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
              <span>Maturity Bonus, Pre-closure &amp; Administrative Levies</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Maturity Bonus</span>
                <span className="font-bold text-emerald-700 text-sm sm:text-base mt-1 block font-sans">
                  {scheme.bonus_rate_type === 'percent' ? `${scheme.bonus_rate || 0}%` : formatCurrency(scheme.bonus_rate)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Rewarded at full maturity</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Cancellation Fee</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {scheme.cancellation_charges_type === 'percent' ? `${scheme.cancellation_charges || 0}%` : formatCurrency(scheme.cancellation_charges)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Pre-closure processing deduction</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Penal Rate on Early Break</span>
                <span className="font-bold text-rose-700 text-sm sm:text-base mt-1 block font-sans">
                  {scheme.penal_charges_percent || 0}%
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Interest haircut penalty</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-slate-500 block font-medium">Stationery Charges</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base mt-1 block font-sans">
                  {formatCurrency(scheme.stationary_charges)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Deposit certificate fee</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80 sm:col-span-2">
                <span className="text-slate-500 block font-medium">Created At</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm mt-1 block">
                  {formatDate(scheme.created_at)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Scheme creation timestamp</span>
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
                <span>Delete Scheme</span>
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
                  <span>Edit Scheme</span>
                </button>
              )}
              {onApplyClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApplyClick(scheme);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-[#00b4a7] to-[#0f766e] text-white hover:from-[#00a296] hover:to-[#0c625c] rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Apply Scheme</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 sm:px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for Confirming FD/MIS Scheme Deletion
 */
export function FdMisSchemeDeleteModal({
  isOpen,
  scheme,
  isDeleting = false,
  onClose,
  onConfirm
}) {
  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 sm:p-7 text-center space-y-4 animate-scaleUp">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Delete FD / MIS Scheme</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Are you sure you want to delete scheme{' '}
            <strong className="text-slate-800 font-bold">{scheme.scheme_name}</strong>{' '}
            (<span className="font-mono text-teal-700">{scheme.scheme_code}</span>)?
          </p>
          <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl p-2.5 border border-amber-100 mt-3 font-medium">
            This deposit product policy will be permanently removed. Existing active member term deposits will remain intact.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(scheme)}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default {
  FdMisSchemeFormModal,
  FdMisSchemeDetailModal,
  FdMisSchemeDeleteModal,
};

