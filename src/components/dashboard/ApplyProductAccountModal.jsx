import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  TrendingUp,
  Landmark,
  IndianRupee,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { createProductAccountRequest } from '../../services/productAccountService';
import { getMemberSavingsAccounts } from '../../services/savingsAccountService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ApplyProductAccountModal({
  isOpen,
  onClose,
  scheme,
  productType = 'fd_mis', // 'fd_mis' | 'investment'
  onSuccess,
}) {
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [requestedPrincipal, setRequestedPrincipal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const isFdMis = productType === 'fd_mis';
  const schemeName = scheme?.scheme_name || scheme?.name || (isFdMis ? 'FD / MIS Scheme' : 'Investment Scheme');
  const schemeCode = scheme?.scheme_code || scheme?.code || 'SCH-01';

  // Minimum required deposit
  const minRequiredPrincipal = isFdMis
    ? Number(scheme?.minimum_fd_mis_amount ?? scheme?.min_deposit_amount ?? scheme?.min_amount ?? 1000)
    : Number(scheme?.installment_amount ?? scheme?.minimum_investment_amount ?? 500);

  const interestRate = isFdMis
    ? (scheme?.annual_interest_rate ?? scheme?.interest_rate ?? 0)
    : (scheme?.annual_interest_rate ?? scheme?.interest_rate ?? 0);

  const tenure = isFdMis
    ? `${scheme?.tenure_value || 12} ${scheme?.tenure_unit || 'months'}`
    : `${scheme?.tenure_months || scheme?.investment_duration_months || 12} Months`;

  // Fetch member's savings accounts
  useEffect(() => {
    if (!isOpen) {
      setSuccessData(null);
      setErrorMessage(null);
      return;
    }

    // Set initial principal suggestion
    if (minRequiredPrincipal > 0) {
      setRequestedPrincipal(String(minRequiredPrincipal));
    } else {
      setRequestedPrincipal('');
    }

    async function loadSavingsAccounts() {
      setLoadingAccounts(true);
      try {
        const accounts = await getMemberSavingsAccounts({ limit: 50 });
        const list = Array.isArray(accounts) ? accounts : [];
        setSavingsAccounts(list);
        if (list.length > 0) {
          // Preselect first active account
          const active = list.find((a) => a.is_active !== false && a.status !== 'closed') || list[0];
          setSelectedAccountId(String(active.id));
        } else {
          setSelectedAccountId('');
        }
      } catch (err) {
        console.warn('Could not load member savings accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    }

    loadSavingsAccounts();
  }, [isOpen, scheme]);

  if (!isOpen || !scheme) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedAccountId) {
      setErrorMessage('Please select a linked savings account.');
      return;
    }

    let principalNum = null;
    if (isFdMis) {
      principalNum = Number(requestedPrincipal);
      if (!requestedPrincipal || isNaN(principalNum) || principalNum <= 0) {
        setErrorMessage('Please enter a valid deposit principal amount.');
        return;
      }

      if (minRequiredPrincipal > 0 && principalNum < minRequiredPrincipal) {
        setErrorMessage(
          `Principal amount cannot be less than the minimum requirement of ${formatCurrency(minRequiredPrincipal)}.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        product_type: isFdMis ? 'fd_mis' : 'investment',
        scheme_id: Number(scheme.id || scheme.scheme_id),
        savings_account_id: Number(selectedAccountId),
      };

      // Only FD/MIS accepts requested_principal; Recurring investments have amount fixed by scheme policy
      if (isFdMis && principalNum !== null) {
        payload.requested_principal = principalNum;
      }

      const result = await createProductAccountRequest(payload);
      setSuccessData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Failed to submit product account request:', err);
      setErrorMessage(err.message || 'Failed to submit scheme application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] p-5 sm:p-6 border-b border-teal-200/80 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                {isFdMis ? <Coins className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  {isFdMis ? 'Cooperative FD / MIS Scheme' : 'Cooperative Investment Scheme'}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                  Apply for Scheme
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {successData ? (
            /* Success confirmation view */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold text-slate-900">
                  Application Submitted!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your scheme application for <strong>{schemeName}</strong> has been received and forwarded to your branch administration for review.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application ID:</span>
                  <span className="font-mono font-bold text-slate-900">#{successData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheme Code:</span>
                  <span className="font-bold text-teal-700">{schemeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isFdMis ? 'Deposit Principal:' : 'Recurring Installment:'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {isFdMis
                      ? formatCurrency(requestedPrincipal)
                      : `${formatCurrency(scheme?.installment_amount || minRequiredPrincipal)} / ${scheme?.contribution_frequency || 'period'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Pending Branch Review
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Scheme Summary Card */}
              <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 rounded-2xl p-4 border border-teal-200/70 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-sm">
                      {schemeName}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-teal-700">
                      {schemeCode}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-teal-800 border border-teal-200 shadow-2xs">
                    {tenure}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-teal-200/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Annual Yield / Interest
                    </span>
                    <span className="font-bold text-teal-800 text-sm">
                      {interestRate}% p.a.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Min Requirement
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatCurrency(minRequiredPrincipal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Savings Account Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-teal-600" />
                    <span>Debit Savings Account *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Funds source &amp; payout
                  </span>
                </label>

                {loadingAccounts ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Loading your savings accounts...</span>
                  </div>
                ) : savingsAccounts.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>No Active Savings Account</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      You need an active cooperative savings deposit account to fund this scheme application. Please submit a Savings Account request first.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs cursor-pointer"
                  >
                    {savingsAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} — {acc.scheme_name || 'Savings Deposit'} (Bal:{' '}
                        {formatCurrency(acc.balance || 0)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Investment Scheme: Read-only Recurring Contribution Info */}
              {!isFdMis && (
                <div className="p-3.5 bg-gradient-to-r from-teal-50/70 to-emerald-50/60 border border-teal-200/80 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
                      <span>Recurring Contribution:</span>
                    </span>
                    <span className="font-bold text-teal-900 text-sm">
                      {formatCurrency(scheme?.installment_amount || minRequiredPrincipal)} / {scheme?.contribution_frequency || 'period'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Recurring investment amount is fixed by this scheme policy and will be automatically debited according to schedule upon branch approval.
                  </p>
                </div>
              )}

              {/* FD/MIS Scheme: Deposit Principal Amount Input */}
              {isFdMis && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
                      <span>Deposit Principal Amount (₹) *</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Min: {formatCurrency(minRequiredPrincipal)}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={minRequiredPrincipal > 0 ? minRequiredPrincipal : 1}
                      step="any"
                      required
                      value={requestedPrincipal}
                      onChange={(e) => setRequestedPrincipal(e.target.value)}
                      placeholder={String(minRequiredPrincipal || 5000)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    The selected principal amount will be deposited into this term FD/MIS folio upon approval.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (savingsAccounts.length === 0 && !loadingAccounts)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Scheme Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
