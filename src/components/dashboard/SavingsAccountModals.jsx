import React, { useState, useEffect } from 'react';
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
  User,
  Building2,
  Landmark,
  ArrowRight,
  Send,
  XCircle,
  Clock,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { getMemberSavingsAccountTransactions } from '../../services/cashTransactionService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
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
}

/**
 * 1. Member Apply / Open Savings Account Modal
 */
export function ApplySavingsAccountModal({
  isOpen,
  scheme,
  memberUser,
  onClose,
  onSubmit,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <PiggyBank className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t("savingsAccountModals.openSavingsDepositAccount", "Open Savings Deposit Account")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("savingsAccountModals.submitAnAccountOpeningRequest", "Submit an account opening request to your branch")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Selected Scheme Card */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">
                  {t("savingsAccountModals.targetSavingsProduct", "Target Savings Product")}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {scheme.scheme_name || scheme.name}
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                {scheme.scheme_code || scheme.code}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-teal-200/60">
              <div>
                <span className="text-slate-500 font-medium">{t("savingsAccountModals.annualYield", "Annual Yield:")}</span>
                <p className="font-extrabold text-emerald-700 mt-0.5">
                  {scheme.annual_interest_rate ?? scheme.interest_rate ?? 0}% p.a.
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">{t("savingsAccountModals.minOpeningDeposit", "Min Opening Deposit:")}</span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(scheme.min_opening_balance ?? scheme.min_balance ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Member & Branch Dispatch Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t("savingsAccountModals.applicantSocietyContext", "Applicant Society Context")}
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
              <div>
                <span className="text-slate-400 block text-[11px]">{t("dashboardModule.productAccounts.memberName", "Member Name")}</span>
                <span className="font-bold text-slate-900">{memberUser?.name || 'Current Member'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t("modal.member.memberCode", "Member Code")}</span>
                <span className="font-mono font-bold text-slate-900">{memberUser?.member_code || memberUser?.id || '—'}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">{t("savingsAccountModals.servicingBranch", "Servicing Branch:")}</span>
                <span className="font-bold text-[#0f766e]">
                  {memberUser?.branch_name || memberUser?.branch || 'Assigned Society Branch'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2 leading-relaxed font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              {t("savingsAccountModals.onceSubmittedYourBranchManager", "Once submitted, your branch manager will review and approve the request. Upon approval, your official savings deposit folio will be activated automatically.")}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => onSubmit(scheme)}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white text-xs font-bold shadow-md shadow-teal-500/20 hover:from-[#0d9488] hover:to-[#0f766e] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("memberNominee.submitting", "Submitting...")}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t("savingsAccountModals.confirmApply", "Confirm & Apply")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Branch Admin Request Rejection Reason Modal
 */
export function RejectSavingsAccountRequestModal({
  isOpen,
  request,
  onClose,
  onConfirm,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErr('Please state the rejection reason for the member.');
      return;
    }
    onConfirm(request.id, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <XCircle className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-black text-slate-900">
              {t("savingsAccountModals.rejectSavingsAccountRequest", "Reject Savings Account Request?")}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t("branchManagerNominees.request", "Request #")}{request.id} {t("savingsAccountModals.for", "for")}{' '}
              <strong className="text-slate-800">{request.member_name || request.user_name || 'Member'}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("savingsAccountModals.reasonForRejection", "Reason for Rejection")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErr('');
                }}
                rows={3}
                placeholder={t("savingsAccountModals.eGIncompleteKycDocumentation", "e.g. Incomplete KYC documentation or duplicate active savings account")}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
              />
              {err && <p className="text-xs text-rose-600 mt-1 font-semibold">{err}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("modal.member.rejecting", "Rejecting...")}</span>
                  </>
                ) : (
                  <span>{t("modal.nominee.confirmRejection", "Confirm Rejection")}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Unified Savings Account Dossier Detail Modal (for Branch Admin, Super Admin, Member)
 */
export function SavingsAccountDetailModal({
  isOpen,
  account,
  isLoading = false,
  onClose,
  role = null
}) {
  const { t } = useTranslation();
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    const accId = account?.id || account?.account_id;
    if (isOpen && accId) {
      setLoadingTx(true);
      getMemberSavingsAccountTransactions(accId)
        .then((res) => {
          setAccountTransactions(Array.isArray(res) ? res : []);
        })
        .catch((err) => {
          console.warn('Could not load account transactions:', err);
          setAccountTransactions([]);
        })
        .finally(() => setLoadingTx(false));
    } else {
      setAccountTransactions([]);
    }
  }, [isOpen, account?.id, account?.account_id]);

  if (!isOpen || !account) return null;

  const isActive =
    account.status === 'active' ||
    account.status === 'approved' ||
    account.is_active === true ||
    account.account_status === 'active';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-3xl sm:max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 flex-shrink-0">
              <Landmark className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-teal-200">
                  {account.account_number || account.account_no || `#${account.id}`}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${
                    isActive || account.status === 'awaiting_initial_deposit'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : account.status?.includes('pending')
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive || account.status === 'awaiting_initial_deposit' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{account.status === 'awaiting_initial_deposit' || isActive ? t("branchManagerSavingsSchemes.accountOpened", "Account Opened") : String(account.status || 'Active').replace(/_/g, ' ')}</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                {t("savingsAccountModals.savingsAccountDetails", "Savings Account Details")}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7] mx-auto" />
            <p className="text-xs text-slate-500 font-medium">{t("savingsAccountModals.fetchingAccountDetailsFromLedger", "Fetching account details from ledger...")}</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {/* Balance Highlight Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">
                  {t("savingsAccountModals.currentDepositBalance", "Current Deposit Balance")}
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 font-sans">
                  {formatCurrency(account.balance ?? account.current_balance ?? 0)}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t("savingsAccountModals.depositAccountNumber", "Deposit Account Number")}
                </span>
                <p className="text-base sm:text-lg font-mono font-extrabold text-[#0f766e] mt-0.5 break-all sm:break-normal">
                  {account.account_number || `#SB-${account.id}`}
                </p>
              </div>
            </div>

            {/* Account & Member Info */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#00b4a7]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("savingsAccountModals.memberIdentification", "Member Identification")}</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.memberName", "Member Name:")}</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {account.member_name || account.user_name || account.member?.full_name || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("modal.nominee.memberCode", "Member Code:")}</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {account.member_code || account.member?.member_code || account.user_code || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.contactMobile", "Contact Mobile:")}</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {account.member_mobile || account.mobile || account.member?.mobile || account.contact_number || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.emailAddress", "Email Address:")}</span>
                  <p className="font-medium text-slate-700 mt-0.5 truncate" title={account.member_email || account.email}>
                    {account.member_email || account.email || account.member?.email || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.kycStatus", "KYC Status:")}</span>
                  <p className="font-bold text-slate-800 mt-0.5 capitalize">
                    {account.member_kyc_status ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {account.member_kyc_status}
                      </span>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.nomineeStatus", "Nominee Status:")}</span>
                  <p className="font-bold text-slate-800 mt-0.5 capitalize">
                    {account.nominee_status ? (
                      <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {account.nominee_status}
                      </span>
                    ) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scheme & Branch Info */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00b4a7]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("savingsAccountModals.schemeOperatingBranch", "Scheme & Operating Branch")}</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">{t("staffCashOperations.savingsScheme", "Savings Scheme:")}</span>
                  <p className="font-extrabold text-[#0f766e] mt-0.5 capitalize">
                    {account.scheme_name || account.scheme?.scheme_name || 'Savings Product'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("applyProductAccountModal.schemeCode", "Scheme Code:")}</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {account.scheme_code || account.scheme?.scheme_code || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("staffCashOperations.operatingBranch", "Operating Branch:")}</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {account.branch_name || account.branch?.name || 'Society Branch'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("branchManagerCashTransactions.branchCode", "Branch Code:")}</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {account.branch_code || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.branchIfsc", "Branch IFSC:")}</span>
                  <p className="font-mono font-bold text-teal-800 mt-0.5">
                    {account.ifsc_code ? (
                      <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {account.ifsc_code}
                      </span>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.branchLocation", "Branch Location:")}</span>
                  <p className="font-medium text-slate-700 mt-0.5 capitalize">
                    {[account.branch_city, account.branch_state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.branchContact", "Branch Contact:")}</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {account.branch_contact_number || '—'}
                  </p>
                </div>
                {account.branch_address && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-400 font-medium">{t("savingsAccountModals.branchAddress", "Branch Address:")}</span>
                    <p className="font-medium text-slate-700 mt-0.5 capitalize">
                      {account.branch_address}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-medium">{t("savingsAccountModals.openedOn", "Opened On:")}</span>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {formatDateTime(account.opened_at || account.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit & Verification History */}
            {(account.reviewed_by_name || account.opening_request_id) && (
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">{t("savingsAccountModals.approvalAuditTrail", "Approval Audit Trail")}</h4>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 font-medium">{t("savingsAccountModals.openingRequest", "Opening Request:")}</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                      {t("branchManagerNominees.request", "Request #")}{account.opening_request_id || account.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">{t("savingsAccountModals.reviewedByManager", "Reviewed By (Manager):")}</span>
                    <p className="font-bold text-slate-900 mt-0.5 capitalize">
                      {account.reviewed_by_name || 'Branch Manager'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">{t("savingsAccountModals.reviewedAt", "Reviewed At:")}</span>
                    <p className="font-medium text-slate-700 mt-0.5">
                      {formatDateTime(account.reviewed_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Transaction History Passbook */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#00b4a7]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {t("savingsAccountModals.accountPassbookTransactionHistory", "Account Passbook & Transaction History")}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {accountTransactions.length} {t("savingsAccountModals.recorded", "recorded")}
                </span>
              </div>

              {loadingTx ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#00b4a7] mx-auto mb-1.5" />
                  <span className="text-xs">{t("savingsAccountModals.loadingAccountTransactionsLedger", "Loading account transactions ledger...")}</span>
                </div>
              ) : accountTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Coins className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">{t("savingsAccountModals.noTransactionsRecordedForThis", "No transactions recorded for this account yet")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colReceiptNumber", "Receipt Number")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colTransactionType", "Transaction Type")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colAmount", "Amount")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colBalanceBefore", "Balance Before")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colBalanceAfter", "Balance After")}</th>
                        <th className="py-2.5 px-4">{t("savingsAccountModals.branchIfsc2", "Branch / IFSC")}</th>
                        <th className="py-2.5 px-4">{t("branchManagerCashReconciliation.cashier", "Cashier")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colDateTime", "Date & Time")}</th>
                        <th className="py-2.5 px-4">{t("dashboardModule.accountTransactions.colNotes", "Notes")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountTransactions.map((tx, idx) => {
  const { t } = useTranslation();
                        const isDeposit =
                          String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
                          String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
                        return (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                              {tx.receipt_number || tx.reference_number || `#TX-${tx.id || idx + 1}`}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                  isDeposit
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {isDeposit ? (
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                )}
                                <span>{isDeposit ? t("dashboardModule.accountTransactions.deposit", "Deposit") : t("dashboardModule.accountTransactions.withdrawal", "Withdrawal")}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-extrabold whitespace-nowrap">
                              <span className={isDeposit ? 'text-emerald-700' : 'text-slate-900'}>
                                {isDeposit ? '+' : '-'}{formatCurrency(tx.amount || 0)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                              {tx.balance_before !== undefined && tx.balance_before !== null ? formatCurrency(tx.balance_before) : '—'}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {tx.balance_after !== undefined && tx.balance_after !== null
                                ? formatCurrency(tx.balance_after)
                                : (tx.balance ? formatCurrency(tx.balance) : '—')}
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                              <div>{tx.branch_name || 'Society Branch'}</div>
                              {tx.ifsc_code && (
                                <span className="font-mono text-[10px] text-teal-700 font-semibold">{tx.ifsc_code}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                              <div className="font-medium text-slate-700">{tx.cashier_name || 'Counter Cashier'}</div>
                              {tx.cashier_code && (
                                <span className="font-mono text-[10px] text-slate-400">#{tx.cashier_code}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                              {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[150px]">
                              {tx.notes || tx.description || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("savingsAccountModals.closeDetails", "Close Details")}
          </button>
        </div>
      </div>
    </div>
  );
}
