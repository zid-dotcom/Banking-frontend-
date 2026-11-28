import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  Eye,
  Loader2,
  Landmark,
  Wallet,
  Coins,
  TrendingUp,
  PiggyBank
} from 'lucide-react';
import {
  getSuperadminBranchMember,
  getSuperadminMemberDocument,
  getSuperadminMemberNomineeDocument
} from '../../services/memberService';
import {
  getBranchAdminMember,
  getBranchAdminMemberDocument,
  getBranchAdminNomineeDocument,
  reviewBranchAdminMember
} from '../../services/branchAdminService';
import {
  getAccountantMember,
  getAccountantMemberDocument
} from '../../services/accountantMemberService';


function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(val));
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

export default function MemberDetailModal({
  isOpen,
  onClose,
  branchId,
  memberId,
  initialMember = null,
  branchName = '',
  isBranchAdmin = false,
  portal = null, // 'accountant' | 'branch_admin' | 'super_admin'
  onStatusUpdated = null
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [member, setMember] = useState(initialMember);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docLoading, setDocLoading] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberDetails();
    } else if (initialMember) {
      setMember(initialMember);
    }
  }, [isOpen, branchId, memberId]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = portal === 'accountant'
        ? await getAccountantMember(memberId)
        : isBranchAdmin
        ? await getBranchAdminMember(memberId)
        : await getSuperadminBranchMember(branchId, memberId);
      setMember(data);
    } catch (err) {
      console.error('Failed to fetch member details:', err);
      setError(err.message || t("modal.member.loadError", "Could not load complete member details."));
      // Keep initialMember fallback if available
      if (initialMember) setMember(initialMember);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = async (docType, isNominee = false) => {
    const key = `${isNominee ? 'nominee_' : ''}${docType}`;
    setDocLoading(prev => ({ ...prev, [key]: true }));

    try {
      let docUrl = null;
      if (portal === 'accountant') {
        const directPath = isNominee
          ? member?.nominee?.[`${docType}_url`]
          : member?.[`${docType}_url`];
        const nomineeId = member?.nominee?.id || member?.nominee_id || memberId;
        docUrl = await getAccountantMemberDocument(memberId, docType, isNominee, nomineeId, directPath);
      } else if (isBranchAdmin) {
        if (isNominee) {
          const nomineeId = member?.nominee?.id || member?.nominee_id || memberId;
          docUrl = await getBranchAdminNomineeDocument(nomineeId, docType).catch(() =>
            getBranchAdminMemberDocument(memberId, docType)
          );
        } else {
          docUrl = await getBranchAdminMemberDocument(memberId, docType);
        }
      } else {
        if (isNominee) {
          docUrl = await getSuperadminMemberNomineeDocument(branchId, memberId, docType);
        } else {
          docUrl = await getSuperadminMemberDocument(branchId, memberId, docType);
        }
      }

      if (typeof docUrl === 'string') {
        setPreviewDoc({ url: docUrl, title: `${docType.replace(/_/g, ' ').toUpperCase()}` });
      }
    } catch (err) {
      console.error(`Error opening document ${docType}:`, err);
      // Fallback: check if member object has direct URL
      const directUrl = isNominee
        ? member?.nominee?.[`${docType}_url`]
        : member?.[`${docType}_url`];
      if (directUrl) {
        window.open(directUrl, '_blank', 'noopener,noreferrer');
      } else {
        setErrorPopup({
          title: t("modal.member.documentUnavailable", "Document Unavailable"),
          message: err.message || t("modal.member.documentRetrieveError", "Could not retrieve the requested document.")
        });
      }
    } finally {
      setDocLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReviewAction = async (newStatus) => {
    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      setErrorPopup({
        title: t("modal.member.rejectionReasonRequired", "Rejection Reason Required"),
        message: t("modal.member.rejectionReasonMessage", "Please provide a clear reason for rejecting this member application.")
      });
      return;
    }

    setActionLoading(true);
    try {
      const updated = await reviewBranchAdminMember(memberId, {
        status: newStatus,
        rejection_reason: newStatus === 'rejected' ? rejectionReason.trim() : null
      });

      setMember(prev => ({ ...prev, ...updated, status: newStatus }));
      setShowRejectInput(false);
      setRejectionReason('');
      setSuccessPopup({
        title: newStatus === 'approved' ? t("modal.member.applicationApproved", "Application Approved!") : t("modal.member.applicationRejected", "Application Rejected"),
        message: newStatus === 'approved'
          ? t("modal.member.approvedMessage", "Member application has been APPROVED successfully.")
          : t("modal.member.rejectedMessage", "Member application has been REJECTED successfully.")
      });
      if (onStatusUpdated) {
        onStatusUpdated(memberId, newStatus, updated);
      }
    } catch (err) {
      setErrorPopup({
        title: t("modal.member.reviewActionFailed", "Review Action Failed"),
        message: err.message || t("modal.member.reviewStatusUpdateError", "Failed to update member status.")
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentMember = member || initialMember || {};
  const statusUpper = (currentMember.status || 'PENDING').toUpperCase();
  const isActive = currentMember.is_active !== false;

  const allProductAccounts = Array.isArray(currentMember.product_accounts) ? currentMember.product_accounts : [];
  const fdAccounts = allProductAccounts.filter((acc) => acc.product_type !== 'investment');
  const investmentAccounts = allProductAccounts.filter((acc) => acc.product_type === 'investment');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:px-6 sm:py-5 bg-gradient-to-r from-teal-50 via-teal-50/50 to-white border-b border-teal-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-base sm:text-lg flex-shrink-0">
                {currentMember.full_name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-tight truncate">
                    {currentMember.full_name || t("modal.member.title", "Member Details")}
                  </h3>
                  <span className="font-mono text-[11px] sm:text-xs font-bold text-teal-700 bg-teal-100/80 px-1.5 sm:px-2 py-0.5 rounded-md flex-shrink-0">
                    {currentMember.member_code || currentMember.id || 'MEM'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  {branchName ? `${t("dashboard.branch", "Branch")}: ${branchName} • ` : ''}{t("modal.member.centralFolioRegistry", "Central Folio Registry")}
                </p>
              </div>
            </div>

            {/* Mobile-only Close button */}
            <button
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title={t("modal.member.closeModal", "Close modal")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Status Pills */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                  statusUpper === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : statusUpper === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {statusUpper === 'APPROVED' ? (
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : statusUpper === 'REJECTED' ? (
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : (
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
                {statusUpper === 'APPROVED'
                  ? t("common.approved", "Approved").toUpperCase()
                  : statusUpper === 'REJECTED'
                  ? t("common.rejected", "Rejected").toUpperCase()
                  : statusUpper === 'PENDING'
                  ? t("common.pending", "Pending").toUpperCase()
                  : statusUpper}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                  isActive ? 'bg-teal-50 text-[#0f766e] border border-teal-200/50' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#00b4a7]' : 'bg-slate-400'}`} />
                {isActive ? t("common.active", "Active") : t("common.inactive", "Inactive")}
              </span>
            </div>

            {/* Desktop Close button */}
            <button
              onClick={onClose}
              className="hidden sm:flex w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title={t("modal.member.closeModal", "Close modal")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          className="flex border-b border-slate-100 px-2 sm:px-6 bg-slate-50/70 overflow-x-auto scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'profile', label: t("modal.member.tabProfile", "Personal & KYC"), icon: User },
            { id: 'address', label: t("modal.member.tabAddress", "Address & Location"), icon: MapPin },
            {
              id: 'savings',
              label: `${t("modal.member.tabSavings", "Savings Accounts")} (${currentMember.accounts?.length || 0})`,
              icon: Landmark
            },
            {
              id: 'fd_accounts',
              label: `${t("modal.member.tabFdAccounts", "FD Accounts")} (${fdAccounts.length})`,
              icon: Coins
            },
            {
              id: 'investment_accounts',
              label: `${t("modal.member.tabInvestmentAccounts", "Investment Accounts")} (${investmentAccounts.length})`,
              icon: TrendingUp
            },
            { id: 'banking', label: t("modal.member.tabBanking", "Bank Account Details"), icon: CreditCard },
            { id: 'nominee', label: t("modal.member.tabNominee", "Nominee Information"), icon: ShieldCheck },
            { id: 'documents', label: t("modal.member.tabDocuments", "Uploaded Documents"), icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-4 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  isTabActive
                    ? 'border-[#00b4a7] text-[#0f766e] bg-white shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTabActive ? 'text-[#00b4a7]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00b4a7]" />
              <p className="text-xs font-semibold">{t("modal.member.loadingFolio", "Loading certified member folio...")}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tab 1: Personal & KYC */}
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.fullName", "Full Name")}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">{currentMember.full_name || '—'}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.memberCode", "Member Code")}</p>
                      <p className="text-sm font-mono font-bold text-teal-700 mt-1 truncate">{currentMember.member_code || currentMember.id || '—'}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.mobileNumber", "Mobile Number")}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{currentMember.mobile || '—'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.emailAddress", "Email Address")}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 break-all">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{currentMember.email || '—'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.dateOfBirth", "Date of Birth")}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{currentMember.date_of_birth || '—'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-100 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("modal.member.gender", "Gender")}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 capitalize truncate">{currentMember.gender || '—'}</p>
                    </div>
                  </div>

                  {/* KYC Numbers */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">{t("modal.member.identityTaxDocs", "Identity & Tax Documents")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">{t("modal.member.aadhaarNumber", "Aadhaar Card Number")}</p>
                        <p className="text-sm sm:text-base font-mono font-black text-slate-900 mt-1 tracking-wider break-all">
                          {currentMember.aadhaar_number || '—'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {t("modal.member.uidaiCertified", "UIDAI Certified Record")}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">{t("modal.member.panNumber", "Income Tax PAN Number")}</p>
                        <p className="text-sm sm:text-base font-mono font-black text-slate-900 mt-1">
                          {currentMember.pan_number || '—'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {t("modal.member.nsdlVerified", "NSDL / Tax Verified")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Address & Location */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs sm:text-sm">
                      <MapPin className="w-4 h-4 text-[#00b4a7] flex-shrink-0" />
                      <span>{t("modal.member.permanentAddress", "Permanent Residential Address")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.buildingNo", "Building / House No:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.building_no || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.street", "Street / Lane:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.street || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.city", "City / Town:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.city || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.district", "District:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.district || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.state", "State:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.state || t("modal.member.defaultState", "Kerala")}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.postalPinCode", "Postal PIN Code:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.zip_code || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.country", "Country:")}</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.country || t("modal.member.defaultCountry", "India")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Savings Account Details */}
              {activeTab === 'savings' && (
                <div className="space-y-4">
                  {currentMember.accounts && currentMember.accounts.length > 0 ? (
                    <div className="space-y-4">
                      {currentMember.accounts.map((acc, idx) => {
                        const accStatusUpper = (acc.status || 'ACTIVE').toUpperCase();
                        const isAccActive = accStatusUpper === 'ACTIVE';

                        return (
                          <div
                            key={acc.id || acc.account_number || idx}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                          >
                            {/* Card Visual Header Banner */}
                            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden">
                              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                                      <Landmark className="w-3.5 h-3.5" /> {t("modal.member.societySavingsAccount", "Society Savings Account")}
                                    </span>
                                    {acc.scheme_code && (
                                      <span className="font-mono text-xs font-bold bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded border border-teal-400/30">
                                        {acc.scheme_code}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-lg sm:text-xl font-black text-white capitalize tracking-tight">
                                    {acc.scheme_name || t("modal.member.regularSavingsDeposit", "Regular Member Savings Deposit")}
                                  </h3>
                                </div>

                                <span
                                  className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                    isAccActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isAccActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                  {accStatusUpper === 'ACTIVE'
                                    ? t("common.active", "Active").toUpperCase()
                                    : accStatusUpper === 'INACTIVE'
                                    ? t("common.inactive", "Inactive").toUpperCase()
                                    : accStatusUpper}
                                </span>
                              </div>

                              {/* Balance & Account Number Prominent Display */}
                              <div className="mt-5 pt-4 border-t border-teal-800/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold">
                                    {t("modal.member.currentSavingsBalance", "Current Savings Balance")}
                                  </p>
                                  <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-sans tracking-tight">
                                    {formatCurrency(acc.balance)}
                                  </p>
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                    {t("dashboard.accountNumber", "Account Number")}
                                  </p>
                                  <p className="font-mono text-base sm:text-lg font-bold text-teal-200 tracking-wider mt-0.5">
                                    {acc.account_number || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Metadata Grid */}
                            <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.scheme", "Scheme")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 capitalize truncate" title={acc.scheme_name}>
                                    {acc.scheme_name || '—'}
                                  </p>
                                  <p className="font-mono text-[10px] text-teal-700 font-semibold mt-0.5">
                                    {acc.scheme_code || '—'}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.branchOffice", "Branch Office")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={acc.branch_name}>
                                    {acc.branch_name || '—'}
                                  </p>
                                  {acc.branch_code && (
                                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                                      {t("dashboard.branch", "Branch")} #{acc.branch_code}
                                    </p>
                                  )}
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.ifscCode", "IFSC Code")}</span>
                                  <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                                    {acc.ifsc_code || '—'}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                    {t("modal.member.branchIfsc", "Branch IFSC")}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.openedDate", "Opened Date")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1">
                                    {formatDateTime(acc.opened_at)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {t("modal.member.registrationDate", "Registration Date")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                        <Landmark className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{t("modal.member.noSavingsTitle", "No Savings Account Found")}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t("modal.member.noSavingsDesc", "This member does not have any active cooperative society savings accounts registered under this folio.")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: FD Accounts */}
              {activeTab === 'fd_accounts' && (
                <div className="space-y-4">
                  {fdAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {fdAccounts.map((acc, idx) => {
                        const accStatus = (acc.status || 'ACTIVE').toLowerCase();
                        const isPending = accStatus.includes('pending') || accStatus.includes('awaiting');
                        const isApproved = accStatus === 'active' || accStatus === 'approved';

                        return (
                          <div
                            key={acc.id || acc.account_number || idx}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                          >
                            {/* Card Visual Header Banner */}
                            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden">
                              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                                      <Coins className="w-3.5 h-3.5" /> {t("modal.member.fdMisScheme", "Fixed Deposit / MIS Scheme")}
                                    </span>
                                    {acc.scheme_code && (
                                      <span className="font-mono text-xs font-bold bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded border border-teal-400/30">
                                        {acc.scheme_code}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-lg sm:text-xl font-black text-white capitalize tracking-tight">
                                    {acc.scheme_name || t("modal.member.fdAccount", "Fixed Deposit Account")}
                                  </h3>
                                </div>

                                <span
                                  className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                    isApproved
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                      : isPending
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  {isPending ? (
                                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                  ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                  )}
                                  {acc.status
                                    ? accStatus === 'active'
                                      ? t("common.active", "Active")
                                      : accStatus === 'approved'
                                      ? t("common.approved", "Approved")
                                      : accStatus === 'pending'
                                      ? t("common.pending", "Pending")
                                      : accStatus === 'rejected'
                                      ? t("common.rejected", "Rejected")
                                      : String(acc.status).replace(/_/g, ' ')
                                    : t("common.active", "Active")}
                                </span>
                              </div>

                              {/* Balance & Account Number Prominent Display */}
                              <div className="mt-5 pt-4 border-t border-teal-800/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="flex flex-wrap items-baseline gap-6">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold">
                                      {t("modal.member.portfolioBalance", "Portfolio Balance")}
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-sans tracking-tight">
                                      {formatCurrency(acc.balance)}
                                    </p>
                                  </div>
                                  {acc.requested_principal !== undefined && acc.requested_principal !== null && (
                                    <div className="pl-6 border-l border-teal-800/60">
                                      <p className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold">
                                        {t("modal.member.principalDeposit", "Principal / Deposit")}
                                      </p>
                                      <p className="text-xl sm:text-2xl font-black text-teal-100 mt-1 font-sans tracking-tight">
                                        {formatCurrency(acc.requested_principal)}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                    {t("dashboard.accountNumber", "Account Number")}
                                  </p>
                                  <p className="font-mono text-base sm:text-lg font-bold text-teal-200 tracking-wider mt-0.5">
                                    {acc.account_number || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Metadata Grid */}
                            <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.schemeCategory", "Scheme Category")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 capitalize truncate" title={acc.scheme_name}>
                                    {acc.scheme_name || '—'}
                                  </p>
                                  <p className="font-mono text-[10px] text-teal-700 font-semibold mt-0.5">
                                    {t("modal.member.termFdMis", "Term Fixed Deposit / MIS")}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.branchOffice", "Branch Office")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={acc.branch_name}>
                                    {acc.branch_name || '—'}
                                  </p>
                                  {acc.branch_id && (
                                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                                      {t("modal.member.branchId", "Branch ID")} #{acc.branch_id}
                                    </p>
                                  )}
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.linkedSavingsAc", "Linked Savings A/C")}</span>
                                  <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                                    {acc.savings_account_id ? `${t("modal.member.accountPrefix", "Account")} #${acc.savings_account_id}` : '—'}
                                  </p>
                                  <p className="text-[10px] text-teal-600 font-semibold mt-0.5">
                                    {acc.opening_request_id ? `${t("modal.member.applicationPrefix", "Application")} #${acc.opening_request_id}` : t("modal.member.directFolio", "Direct Folio")}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.openedDateTime", "Opened Date & Time")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1">
                                    {formatDateTime(acc.opened_at)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {t("modal.member.activationTimestamp", "Activation Timestamp")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                        <Coins className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{t("modal.member.noFdTitle", "No FD Accounts Found")}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t("modal.member.noFdDesc", "This member does not have any active Fixed Deposit or MIS accounts opened under this folio.")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Investment Accounts */}
              {activeTab === 'investment_accounts' && (
                <div className="space-y-4">
                  {investmentAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {investmentAccounts.map((acc, idx) => {
                        const accStatus = (acc.status || 'ACTIVE').toLowerCase();
                        const isPending = accStatus.includes('pending') || accStatus.includes('awaiting');
                        const isApproved = accStatus === 'active' || accStatus === 'approved';

                        return (
                          <div
                            key={acc.id || acc.account_number || idx}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                          >
                            {/* Card Visual Header Banner */}
                            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden">
                              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5" /> {t("modal.member.recurringInvestmentScheme", "Recurring Investment Scheme")}
                                    </span>
                                    {acc.scheme_code && (
                                      <span className="font-mono text-xs font-bold bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded border border-teal-400/30">
                                        {acc.scheme_code}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-lg sm:text-xl font-black text-white capitalize tracking-tight">
                                    {acc.scheme_name || t("modal.member.recurringInvestmentFolio", "Recurring Investment Folio")}
                                  </h3>
                                </div>

                                <span
                                  className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                    isApproved
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                      : isPending
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  {isPending ? (
                                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                  ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                  )}
                                  {acc.status
                                    ? accStatus === 'active'
                                      ? t("common.active", "Active")
                                      : accStatus === 'approved'
                                      ? t("common.approved", "Approved")
                                      : accStatus === 'pending'
                                      ? t("common.pending", "Pending")
                                      : accStatus === 'rejected'
                                      ? t("common.rejected", "Rejected")
                                      : String(acc.status).replace(/_/g, ' ')
                                    : t("common.active", "Active")}
                                </span>
                              </div>

                              {/* Balance & Account Number Prominent Display */}
                              <div className="mt-5 pt-4 border-t border-teal-800/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="flex flex-wrap items-baseline gap-6">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold">
                                      {t("modal.member.investmentBalance", "Investment Balance")}
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-sans tracking-tight">
                                      {formatCurrency(acc.balance)}
                                    </p>
                                  </div>
                                  {acc.requested_principal !== undefined && acc.requested_principal !== null && Number(acc.requested_principal) > 0 && (
                                    <div className="pl-6 border-l border-teal-800/60">
                                      <p className="text-[11px] uppercase tracking-wider text-teal-200/80 font-bold">
                                        {t("modal.member.installmentPrincipal", "Installment / Principal")}
                                      </p>
                                      <p className="text-xl sm:text-2xl font-black text-teal-100 mt-1 font-sans tracking-tight">
                                        {formatCurrency(acc.requested_principal)}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                    {t("dashboard.accountNumber", "Account Number")}
                                  </p>
                                  <p className="font-mono text-base sm:text-lg font-bold text-teal-200 tracking-wider mt-0.5">
                                    {acc.account_number || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Metadata Grid */}
                            <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.schemeCategory", "Scheme Category")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 capitalize truncate" title={acc.scheme_name}>
                                    {acc.scheme_name || '—'}
                                  </p>
                                  <p className="font-mono text-[10px] text-teal-700 font-semibold mt-0.5">
                                    {t("modal.member.recurringInvestment", "Recurring Investment")}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.branchOffice", "Branch Office")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={acc.branch_name}>
                                    {acc.branch_name || '—'}
                                  </p>
                                  {acc.branch_id && (
                                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                                      {t("modal.member.branchId", "Branch ID")} #{acc.branch_id}
                                    </p>
                                  )}
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.linkedSavingsAc", "Linked Savings A/C")}</span>
                                  <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                                    {acc.savings_account_id ? `${t("modal.member.accountPrefix", "Account")} #${acc.savings_account_id}` : '—'}
                                  </p>
                                  <p className="text-[10px] text-teal-600 font-semibold mt-0.5">
                                    {acc.opening_request_id ? `${t("modal.member.applicationPrefix", "Application")} #${acc.opening_request_id}` : t("modal.member.directFolio", "Direct Folio")}
                                  </p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">{t("modal.member.openedDateTime", "Opened Date & Time")}</span>
                                  <p className="text-xs font-bold text-slate-900 mt-1">
                                    {formatDateTime(acc.opened_at)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {t("modal.member.activationTimestamp", "Activation Timestamp")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{t("modal.member.noInvestmentTitle", "No Investment Accounts Found")}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t("modal.member.noInvestmentDesc", "This member does not have any active Recurring Investment accounts opened under this folio.")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Bank Account Details */}
              {activeTab === 'banking' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal-300">{t("modal.member.commercialBankAccount", "Commercial Bank Account (Payouts & Transfers)")}</span>
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-teal-300 flex-shrink-0" />
                    </div>
                    <div className="mt-4 sm:mt-6">
                      <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t("modal.member.accountHolder", "Account Holder")}</p>
                      <p className="text-base sm:text-lg font-bold tracking-wide mt-0.5 truncate">{currentMember.bank_holder_name || currentMember.full_name || '—'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t("modal.member.bankAccountNumber", "Bank Account Number")}</p>
                        <p className="font-mono text-sm sm:text-base font-bold text-teal-200 tracking-wider break-all mt-0.5">
                          {currentMember.bank_account_number || '—'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t("modal.member.ifscCode", "IFSC Code")}</p>
                        <p className="font-mono text-sm sm:text-base font-bold text-white tracking-wider break-all mt-0.5">
                          {currentMember.ifsc_code || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Nominee Information */}
              {activeTab === 'nominee' && (
                <div className="space-y-4">
                  {currentMember.nominee ? (
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-teal-800 font-bold text-xs sm:text-sm">
                          <ShieldCheck className="w-4 h-4 text-[#00b4a7] flex-shrink-0" />
                          <span>{t("modal.member.registeredNomineeRecord", "Registered Nominee Record")}</span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {currentMember.nominee.status || t("common.active", "Active")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.nomineeName", "Nominee Name:")}</span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 break-words">{currentMember.nominee.nominee_name || '—'}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.relationship", "Relationship:")}</span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.nominee.relationship_type || '—'}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.nomineeDob", "Date of Birth:")}</span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.nominee.date_of_birth || '—'}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-xs">{t("modal.member.nomineeReview", "Nominee Review:")}</span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">{currentMember.nominee.reviewed_at || t("modal.member.pendingVerification", "Pending Verification")}</p>
                        </div>
                      </div>

                      {/* Nominee Documents */}
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase mb-2">{t("modal.member.nomineeIdDocs", "Nominee ID Documents")}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleOpenDocument('aadhaar_front', true)}
                            disabled={docLoading['nominee_aadhaar_front']}
                            className="flex-1 sm:flex-initial justify-center px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {docLoading['nominee_aadhaar_front'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />}
                            <span>{t("modal.member.aadhaarFront", "Aadhaar Front")}</span>
                          </button>
                          <button
                            onClick={() => handleOpenDocument('aadhaar_back', true)}
                            disabled={docLoading['nominee_aadhaar_back']}
                            className="flex-1 sm:flex-initial justify-center px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {docLoading['nominee_aadhaar_back'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-[#00b4a7]" />}
                            <span>{t("modal.member.aadhaarBack", "Aadhaar Back")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      {t("modal.member.noNominee", "No nominee information registered for this member folio yet.")}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Uploaded Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { id: 'aadhaar_front', label: t("modal.member.docAadhaarFront", "Aadhaar Card (Front)"), desc: t("modal.member.docAadhaarFrontDesc", "Official Photo ID"), isNominee: false },
                      { id: 'aadhaar_back', label: t("modal.member.docAadhaarBack", "Aadhaar Card (Back)"), desc: t("modal.member.docAadhaarBackDesc", "Address verification side"), isNominee: false },
                      { id: 'pan_image', label: t("modal.member.docPan", "PAN Card Copy"), desc: t("modal.member.docPanDesc", "Income tax identity verification"), isNominee: false },
                      { id: 'passbook_image', label: t("modal.member.docPassbook", "Bank Passbook / Cheque"), desc: t("modal.member.docPassbookDesc", "Bank account validation"), isNominee: false },
                      { id: 'aadhaar_front', label: t("modal.member.docNomineeAadhaarFront", "Nominee Aadhaar (Front)"), desc: t("modal.member.docNomineeAadhaarFrontDesc", "Nominee proof of ID"), isNominee: true },
                      { id: 'aadhaar_back', label: t("modal.member.docNomineeAadhaarBack", "Nominee Aadhaar (Back)"), desc: t("modal.member.docNomineeAadhaarBackDesc", "Nominee proof of address"), isNominee: true },
                    ].map((doc) => {
                      const docKey = `${doc.isNominee ? 'nominee_' : ''}${doc.id}`;
                      const isFetching = !!docLoading[docKey];

                      return (
                        <div key={docKey} className="p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{doc.label}</p>
                              <p className="text-[10px] text-slate-500 truncate">{doc.desc}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenDocument(doc.id, doc.isNominee)}
                            disabled={isFetching}
                            className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-[#0f766e] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            {isFetching ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{t("common.view", "View")}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5 sm:gap-4">
          <div className="text-center sm:text-left text-[11px] sm:text-xs">
            {t("modal.member.registeredOn", "Registered On:")} {currentMember.created_at ? new Date(currentMember.created_at).toLocaleString() : '—'}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {isBranchAdmin && currentMember.status?.toLowerCase() === 'pending' && (
              <>
                {showRejectInput ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder={t("modal.member.rejectionPlaceholder", "Reason for rejection...")}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                    <button
                      onClick={() => handleReviewAction('rejected')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      {actionLoading ? t("modal.member.rejecting", "Rejecting...") : t("modal.member.confirm", "Confirm")}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-2 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                    >
                      {t("common.cancel", "Cancel")}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      {t("modal.member.rejectMember", "Reject Member")}
                    </button>
                    <button
                      onClick={() => handleReviewAction('approved')}
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                    >
                      {actionLoading ? t("modal.member.approving", "Approving...") : t("modal.member.approveMember", "Approve Member")}
                    </button>
                  </>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </div>

      </div>

      {/* Document In-App Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 truncate">{previewDoc.title}</h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4 flex items-center justify-center min-h-[300px]">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xs"
                onError={(e) => {
                  console.warn('Document preview image failed to render:', previewDoc.url);
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('preview-doc-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                id="preview-doc-fallback"
                style={{ display: 'none' }}
                className="flex-col items-center justify-center text-center p-6 space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">{t("modal.member.inlinePreviewUnavailable", "Inline Preview Unavailable")}</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {t("modal.member.inlinePreviewDesc", "This file could not be displayed as an inline image. Please click Open in Fullscreen below.")}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <a
                href={previewDoc.url}
                download
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto justify-center px-4 py-2 bg-[#00b4a7] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{t("modal.member.openFullscreen", "Open in Fullscreen")}</span>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Centered Backend Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {typeof errorPopup === 'object' ? (errorPopup.title || t("modal.member.actionError", "Action Error")) : t("modal.member.notice", "Notice")}
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
                {t("modal.member.okayGotIt", "Okay, Got It")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Successful Action Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {typeof successPopup === 'object' ? (successPopup.title || t("modal.member.actionSuccessful", "Action Successful!")) : t("modal.member.success", "Success!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {typeof successPopup === 'object' ? successPopup.message : String(successPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t("modal.member.okayGotIt", "Okay, Got It")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

