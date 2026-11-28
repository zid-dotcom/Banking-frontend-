import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Target,
  Award,
  Percent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Coins,
  ChevronRight,
  Info,
  Building2,
  Users
} from 'lucide-react';
import {
  getSuperAdminBranchAdmins,
  getBranchAdminStaffList,
} from '../../services/monthlyTargetService';
import { getBranches } from '../../services/branchService';

export function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatMonthDisplay(targetMonthStr) {
  if (!targetMonthStr) return 'N/A';
  try {
    const parts = String(targetMonthStr).split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    return targetMonthStr;
  } catch {
    return targetMonthStr;
  }
}

export function getCurrentMonthTargetString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function formatPercentValue(val) {
  if (val === undefined || val === null || val === '') return '0%';
  const num = Number(val);
  if (isNaN(num)) return `${val}%`;
  return `${parseFloat(num.toFixed(2))}%`;
}

/**
 * Modal for Super Admin to create a branch target for Branch Admins
 * Calls GET /superadmin/branch-admins and POST /superadmin/monthly-targets
 */
export function CreateMonthlyTargetModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialMonth = '',
}) {
  const { t } = useTranslation();
  const [branchAdmins, setBranchAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(''); // Default to empty string: "Select a Branch Manager"

  const [formData, setFormData] = useState({
    target_month: initialMonth || getCurrentMonthTargetString(),
    target_period: 'monthly',
    target_amount: '',
    partial_threshold_percent: '80',
    below_target_incentive_percent: '',
    partially_achieved_incentive_percent: '',
    target_achieved_incentive_percent: '',
    exceeded_target_incentive_percent: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLoadingAdmins(true);
      Promise.allSettled([getSuperAdminBranchAdmins(), getBranches()])
        .then(([adminsRes, branchesRes]) => {
          let list = [];
          if (adminsRes.status === 'fulfilled' && Array.isArray(adminsRes.value)) {
            list = adminsRes.value;
          }
          setBranchAdmins(list);

          let bList = [];
          if (branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value)) {
            bList = branchesRes.value;
          }
          setBranches(bList);
          setSelectedAdminId(''); // Initially "Select a Branch Manager"
        })
        .catch((err) => {
          console.error('Failed to load branch admins or branches:', err);
        })
        .finally(() => {
          setLoadingAdmins(false);
        });

      setFormData((prev) => ({
        ...prev,
        target_month: initialMonth || getCurrentMonthTargetString(),
      }));
      setErrors({});
    }
  }, [isOpen, initialMonth]);

  const getBranchLabel = (branchId) => {
    if (!branchId && branchId !== 0) return 'Not Assigned';
    const found = branches.find((b) => String(b.rawId ?? b.id) === String(branchId));
    if (found) {
      const bName = found.branch_name || found.name || `Branch #${branchId}`;
      return found.city && !bName.toLowerCase().includes(found.city.toLowerCase())
        ? `${bName} (${found.city})`
        : bName;
    }
    return `Branch #${branchId}`;
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleMonthInputChange = (e) => {
    const val = e.target.value; // "YYYY-MM"
    if (val) {
      setFormData((prev) => ({ ...prev, target_month: `${val}-01` }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!selectedAdminId) {
      errs.admin = 'Please select a branch manager.';
    }
    if (!formData.target_month) {
      errs.target_month = 'Target month is required.';
    }
    if (!formData.target_amount || Number(formData.target_amount) <= 0) {
      errs.target_amount = 'Target amount must be greater than 0.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let adminIds = [Number(selectedAdminId)];

    if (adminIds.length === 0 || isNaN(adminIds[0])) {
      setErrors({ admin: 'Please select a valid branch manager to assign target.' });
      return;
    }

    onSubmit({
      branch_admin_user_ids: adminIds,
      target_month: formData.target_month,
      target_period: 'monthly',
      target_amount: Number(formData.target_amount),
      partial_threshold_percent: 80,
      below_target_incentive_percent: Number(formData.below_target_incentive_percent || 0),
      partially_achieved_incentive_percent: Number(formData.partially_achieved_incentive_percent || 0),
      target_achieved_incentive_percent: Number(formData.target_achieved_incentive_percent || 0),
      exceeded_target_incentive_percent: Number(formData.exceeded_target_incentive_percent || 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden my-8 animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-slate-900">
                {t("monthlyTargetModals.setBranchTargetDirective", "Set Branch Target Directive")}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("monthlyTargetModals.selectBranchManagersFromRegistry", "Select Branch Managers from registry and define their monthly target quota & tiered incentive rates.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Branch Manager Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("monthlyTargetModals.targetBranchManager", "Target Branch Manager *")}</span>
            </label>
            {loadingAdmins ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>{t("monthlyTargetModals.loadingBranchManagersBranches", "Loading branch managers & branches...")}</span>
              </div>
            ) : (
              <select
                value={selectedAdminId}
                onChange={(e) => {
                  setSelectedAdminId(e.target.value);
                  if (errors.admin) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.admin;
                      return copy;
                    });
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.admin ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer`}
              >
                <option value="">{t("monthlyTargetModals.selectABranchManager", "Select a Branch Manager")}</option>
                {branchAdmins.map((admin) => {
                  const branchName = getBranchLabel(admin.branch_id);
                  const code = admin.user_code || `BM-${admin.id}`;
                  return (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name} — {branchName} ({code})
                    </option>
                  );
                })}
              </select>
            )}
            {errors.admin && <p className="text-[11px] font-semibold text-rose-600">{errors.admin}</p>}
          </div>

          {/* Month & Target Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("monthlyTargetModals.targetMonth", "Target Month *")}</span>
              </label>
              <input
                type="month"
                value={formData.target_month.substring(0, 7)}
                onChange={handleMonthInputChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.target_month ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer`}
              />
              <span className="text-[10px] text-slate-400 font-medium">
                {t("monthlyTargetModals.directiveMonth", "Directive month:")} {formatMonthDisplay(formData.target_month)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("monthlyTargetModals.targetAmount", "Target Amount (₹) *")}</span>
              </label>
              <input
                type="number"
                name="target_amount"
                value={formData.target_amount}
                onChange={handleChange}
                placeholder="e.g. 1000000"
                min="1"
                step="any"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.target_amount ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all`}
              />
              {formData.target_amount && !isNaN(formData.target_amount) && (
                <span className="text-[10px] text-teal-700 font-bold">
                  {formatCurrency(formData.target_amount)}
                </span>
              )}
              {errors.target_amount && (
                <p className="text-[11px] font-semibold text-rose-600">{errors.target_amount}</p>
              )}
            </div>
          </div>

          {/* Partial Threshold (Stable 80% Benchmark) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {t("monthlyTargetModals.standardEligibilityBenchmarkForPartial", "Standard eligibility benchmark for partial incentive qualification")}
                </span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-teal-100/90 text-teal-900 font-black text-xs border border-teal-200 shadow-2xs">
              {t("monthlyTargetModals.80Target", "80% Target")}
            </span>
          </div>

          {/* Tiered Incentive Rates Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" />
                <span>{t("monthlyTargetModals.tieredIncentiveRates", "Tiered Incentive Rates (%)")}</span>
              </label>
            </div>

            {/* 2-Column Wide Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tier 1: Below Target Incentive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {t("monthlyTargetModals.belowTargetIncentive", "Below Target Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.80Target2", "<80% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="below_target_incentive_percent"
                    value={formData.below_target_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 2: Partially Achieved Incentive */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950">
                    {t("monthlyTargetModals.partiallyAchievedIncentive", "Partially Achieved Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.8099Target", "80%–99% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="partially_achieved_incentive_percent"
                    value={formData.partially_achieved_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 1.5"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-amber-900 placeholder:text-amber-400/80 focus:outline-none focus:border-amber-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 3: Target Achieved Incentive */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-950">
                    {t("monthlyTargetModals.targetAchievedIncentive", "Target Achieved Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.100Target", "100% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="target_achieved_incentive_percent"
                    value={formData.target_achieved_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-emerald-900 placeholder:text-emerald-400/80 focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 4: Exceeded Target Incentive */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-950">
                    {t("monthlyTargetModals.exceededTargetIncentive", "Exceeded Target Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.100Target2", "> 100% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="exceeded_target_incentive_percent"
                    value={formData.exceeded_target_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 3.0"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-900 placeholder:text-purple-400/80 focus:outline-none focus:border-purple-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t("monthlyTargetModals.saveAssignBranchTarget", "Save & Assign Branch Target")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Branch Admin to assign an individual staff target
 * Calls GET /branch-admin/staff and POST /branch-admin/monthly-targets/staff
 */
export function CreateBranchStaffTargetModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialMonth = '',
}) {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [formData, setFormData] = useState({
    target_month: initialMonth || getCurrentMonthTargetString(),
    target_period: 'monthly',
    target_amount: '',
    partial_threshold_percent: '80',
    below_target_incentive_percent: '',
    partially_achieved_incentive_percent: '',
    target_achieved_incentive_percent: '',
    exceeded_target_incentive_percent: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLoadingStaff(true);
      getBranchAdminStaffList()
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setStaffList(list);
          setSelectedStaffId('');
        })
        .catch((err) => {
          console.error('Failed to load branch staff:', err);
        })
        .finally(() => {
          setLoadingStaff(false);
        });

      setFormData((prev) => ({
        ...prev,
        target_month: initialMonth || getCurrentMonthTargetString(),
      }));
      setErrors({});
    }
  }, [isOpen, initialMonth]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleMonthInputChange = (e) => {
    const val = e.target.value;
    if (val) {
      setFormData((prev) => ({ ...prev, target_month: `${val}-01` }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!selectedStaffId) {
      errs.staff = 'Please select a staff member.';
    }
    if (!formData.target_month) {
      errs.target_month = 'Target month is required.';
    }
    if (!formData.target_amount || Number(formData.target_amount) <= 0) {
      errs.target_amount = 'Target amount must be greater than 0.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      staff_id: Number(selectedStaffId),
      target_month: formData.target_month,
      target_period: 'monthly',
      target_amount: Number(formData.target_amount),
      partial_threshold_percent: 80,
      below_target_incentive_percent: Number(formData.below_target_incentive_percent || 0),
      partially_achieved_incentive_percent: Number(formData.partially_achieved_incentive_percent || 0),
      target_achieved_incentive_percent: Number(formData.target_achieved_incentive_percent || 0),
      exceeded_target_incentive_percent: Number(formData.exceeded_target_incentive_percent || 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden my-8 animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-slate-900">
                {t("monthlyTargetModals.assignStaffMonthlyTarget", "Assign Staff Monthly Target")}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("monthlyTargetModals.selectACollectionAgentOr", "Select a collection agent or field staff member and assign their personal monthly target quota.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Staff Member Selector (GET /branch-admin/staff) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("monthlyTargetModals.selectStaffMemberCollectionAgent", "Select Staff Member (Collection Agent) *")}</span>
            </label>
            {loadingStaff ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>{t("monthlyTargetModals.loadingBranchStaffList", "Loading branch staff list...")}</span>
              </div>
            ) : (
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  if (errors.staff) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.staff;
                      return copy;
                    });
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.staff ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer`}
              >
                <option value="">{t("monthlyTargetModals.selectAStaffMember", "Select a Staff Member")}</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.staff_code || `ID #${staff.id}`} — {staff.staff_role_name || 'Staff'})
                  </option>
                ))}
              </select>
            )}
            {errors.staff && <p className="text-[11px] font-semibold text-rose-600">{errors.staff}</p>}
          </div>

          {/* Month & Target Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("monthlyTargetModals.targetMonth", "Target Month *")}</span>
              </label>
              <input
                type="month"
                value={formData.target_month.substring(0, 7)}
                onChange={handleMonthInputChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.target_month ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer`}
              />
              <span className="text-[10px] text-slate-400 font-medium">
                {t("monthlyTargetModals.directiveMonth", "Directive month:")} {formatMonthDisplay(formData.target_month)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("monthlyTargetModals.targetAmount", "Target Amount (₹) *")}</span>
              </label>
              <input
                type="number"
                name="target_amount"
                value={formData.target_amount}
                onChange={handleChange}
                placeholder="e.g. 100000"
                min="1"
                step="any"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.target_amount ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all`}
              />
              {formData.target_amount && !isNaN(formData.target_amount) && (
                <span className="text-[10px] text-teal-700 font-bold">
                  {formatCurrency(formData.target_amount)}
                </span>
              )}
              {errors.target_amount && (
                <p className="text-[11px] font-semibold text-rose-600">{errors.target_amount}</p>
              )}
            </div>
          </div>

          {/* Partial Threshold (Stable 80% Benchmark) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {t("monthlyTargetModals.standardEligibilityBenchmarkForPartial", "Standard eligibility benchmark for partial incentive qualification")}
                </span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-teal-100/90 text-teal-900 font-black text-xs border border-teal-200 shadow-2xs">
              {t("monthlyTargetModals.80Target", "80% Target")}
            </span>
          </div>

          {/* Tiered Incentive Rates Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" />
                <span>{t("monthlyTargetModals.tieredIncentiveRates", "Tiered Incentive Rates (%)")}</span>
              </label>
            </div>

            {/* 2-Column Wide Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tier 1: Below Target Incentive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {t("monthlyTargetModals.belowTargetIncentive", "Below Target Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.80Target2", "<80% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="below_target_incentive_percent"
                    value={formData.below_target_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 2: Partially Achieved Incentive */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950">
                    {t("monthlyTargetModals.partiallyAchievedIncentive", "Partially Achieved Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.8099Target", "80%–99% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="partially_achieved_incentive_percent"
                    value={formData.partially_achieved_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 1.5"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-amber-900 placeholder:text-amber-400/80 focus:outline-none focus:border-amber-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 3: Target Achieved Incentive */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-950">
                    {t("monthlyTargetModals.targetAchievedIncentive", "Target Achieved Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.100Target", "100% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="target_achieved_incentive_percent"
                    value={formData.target_achieved_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-emerald-900 placeholder:text-emerald-400/80 focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Tier 4: Exceeded Target Incentive */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-950">
                    {t("monthlyTargetModals.exceededTargetIncentive", "Exceeded Target Incentive (%)")}
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    {t("monthlyTargetModals.100Target2", "> 100% Target")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="exceeded_target_incentive_percent"
                    value={formData.exceeded_target_incentive_percent}
                    onChange={handleChange}
                    placeholder="e.g. 3.0"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-900 placeholder:text-purple-400/80 focus:outline-none focus:border-purple-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 font-bold pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t("monthlyTargetModals.saveAssignStaffTarget", "Save & Assign Staff Target")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for Viewing Monthly Target Details
 */
export function MonthlyTargetDetailModal({ isOpen, target, onClose }) {
  const { t } = useTranslation();
  if (!isOpen || !target) return null;

  const targetTitle =
    target.target_user_name ||
    target.role_name ||
    (target.target_role_type === 'branch_manager' ? 'Branch Manager' : 'Staff Target');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden my-8 animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-slate-900">
                  {targetTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                  {target.target_scope || target.target_period || 'Monthly'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {target.branch_name ? `Branch: ${target.branch_name} • ` : ''}
                {t("monthlyTargetModals.targetPeriod", "Target Period:")} {formatMonthDisplay(target.target_month)}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("dashboardModule.monthlyTargets.colTargetAmount", "Target Amount")}
              </span>
              <span className="text-base font-black text-slate-900">
                {formatCurrency(target.target_amount)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t("dashboardModule.monthlyTargets.partialThreshold", "Partial Threshold")}
              </span>
              <span className="text-base font-black text-teal-700">
                {target.partial_threshold_percent || 80}%
              </span>
            </div>
          </div>

          {/* Incentive Ladder */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              {t("monthlyTargetModals.performanceIncentiveLadder", "Performance Incentive Ladder")}
            </span>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{t("staffMonthlyTargets.belowTarget", "Below Target (<")}{target.partial_threshold_percent || 80}%)</span>
                <span className="font-bold text-slate-900">{formatPercentValue(target.below_target_incentive_percent)}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between text-xs">
                <span className="text-amber-800 font-medium">{t("staffMonthlyTargets.partiallyAchieved", "Partially Achieved (")}{target.partial_threshold_percent || 80}% - 99%)</span>
                <span className="font-bold text-amber-900">{formatPercentValue(target.partially_achieved_incentive_percent)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-bold">{t("staffMonthlyTargets.targetAchieved100", "Target Achieved (100%)")}</span>
                <span className="font-black text-emerald-900">{formatPercentValue(target.target_achieved_incentive_percent)}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
                <span className="text-purple-800 font-bold">{t("staffMonthlyTargets.exceededTarget100", "Exceeded Target (>100%)")}</span>
                <span className="font-black text-purple-900">{formatPercentValue(target.exceeded_target_incentive_percent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
