import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  UserPlus,
  Building,
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  QrCode,
  Receipt,
  Coins,
  ArrowRight
} from 'lucide-react';
import {
  getMemberBranches,
  registerMember,
  reapplyMember,
  getMemberRegistrationSettings,
  resolveBranchQrImageUrl,
  lookupMemberStaffCode
} from '../services/memberService';
import { validateStrongPassword } from '../utils/passwordValidation';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(val));
}

export default function MemberRegistrationModal({
  isOpen,
  onClose,
  initialMode = 'register', // 'register' or 'reapply'
  initialMemberCode = '',
  onRegistrationSuccess
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(initialMode); // 'register' | 'reapply'
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  // Form Fields State
  const [formData, setFormData] = useState({
    // Auth & Identity
    email: '',
    member_code: '', // used for reapply
    full_name: '',
    password: '',
    confirm_password: '',
    branch_id: '',
    date_of_birth: '',
    gender: '',
    mobile: '',
    agent_code: '',

    // Address
    country: 'India',
    state: 'Kerala',
    district: '',
    city: '',
    street: '',
    building_no: '',
    zip_code: '',

    // Identity & Bank
    aadhaar_number: '',
    pan_number: '',
    bank_holder_name: '',
    bank_account_number: '',
    ifsc_code: ''
  });

  // Files State
  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    pan_image: null,
    passbook_image: null,
    payment_screenshot: null
  });

  // Branch Membership Fee & QR Settings State
  const [branchSettings, setBranchSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Assisting Agent / Enroller Lookup State
  const [agentLookup, setAgentLookup] = useState({
    loading: false,
    name: null,
    error: null
  });

  // Password visibility states (initially OFF)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
   
  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(code));
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = String(code);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  useEffect(() => {
    setMode(initialMode);
    if (initialMemberCode) {
      setFormData(prev => ({ ...prev, member_code: initialMemberCode }));
    }
  }, [initialMode, initialMemberCode]);

  useEffect(() => {
    if (isOpen) {
      loadBranches();
      setErrorMessage(null);
      setErrorPopup(null);
      setSuccessResult(null);
      setSuccessPopup(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      if (initialMemberCode) {
        setFormData(prev => ({ ...prev, member_code: initialMemberCode }));
      }
    }
  }, [isOpen, initialMemberCode]);

  useEffect(() => {
    if (formData.branch_id) {
      loadBranchSettings(formData.branch_id);
    } else {
      setBranchSettings(null);
    }
  }, [formData.branch_id]);

  // Lookup Assisting Agent / Enroller code via GET /member/staff-code?branch_id=...&staff_code=...
  useEffect(() => {
    const rawCode = (formData.agent_code || '').trim().toUpperCase();
    if (!rawCode) {
      setAgentLookup({ loading: false, name: null, error: null });
      return;
    }

    if (!formData.branch_id) {
      setAgentLookup({ loading: false, name: null, error: 'Please select branch first' });
      return;
    }

    if (rawCode.length < 3) {
      setAgentLookup({ loading: false, name: null, error: null });
      return;
    }

    setAgentLookup(prev => ({ ...prev, loading: true, error: null }));
    const timer = setTimeout(async () => {
      try {
        const res = await lookupMemberStaffCode(formData.branch_id, rawCode);
        if (res && res.staff_name) {
          setAgentLookup({ loading: false, name: res.staff_name, error: null });
        } else if (res && res.notFound) {
          setAgentLookup({ loading: false, name: null, error: res.message || 'Invalid format (e.g. MAP001)' });
        } else {
          setAgentLookup({ loading: false, name: null, error: 'Staff code was not found for the selected branch' });
        }
      } catch (err) {
        setAgentLookup({ loading: false, name: null, error: err.message || 'Agent not found for this branch' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.agent_code, formData.branch_id]);

  const loadBranchSettings = async (bId) => {
    setSettingsLoading(true);
    try {
      const res = await getMemberRegistrationSettings(bId);
      setBranchSettings(res);
    } catch (err) {
      console.warn('Could not load branch settings:', err);
      setBranchSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadBranches = async () => {
    setBranchesLoading(true);
    try {
      const list = await getMemberBranches();
      setBranches(list);
    } catch (err) {
      console.warn('Could not load branches for registration:', err);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorPopup(null);

    const triggerError = (msg) => {
      setErrorMessage(msg);
      setErrorPopup(msg);
    };

    // Validation
    if (mode === 'register') {
      const strongValidation = validateStrongPassword(formData.password);
      if (!strongValidation.isValid) {
        triggerError(strongValidation.message);
        return;
      }
      if (formData.password !== formData.confirm_password) {
        triggerError('Password and Confirm Password do not match.');
        return;
      }
      if (!formData.email) {
        triggerError('Email is required for new registration.');
        return;
      }
    } else {
      if (!formData.member_code) {
        triggerError('Member Code is required to reapply.');
        return;
      }
    }

    if (!formData.branch_id) {
      triggerError('Please select a home society branch.');
      return;
    }

    if (!formData.date_of_birth) {
      triggerError('Please select your Date of Birth.');
      return;
    }

    if (!formData.gender) {
      triggerError('Please select your Gender.');
      return;
    }

    if (!files.aadhaar_front || !files.aadhaar_back || !files.passbook_image) {
      triggerError('Please upload all required verification documents (Aadhaar Front, Aadhaar Back, and Passbook/Cheque).');
      return;
    }

    if (mode === 'register' && !files.payment_screenshot) {
      triggerError('Please upload the membership fee payment confirmation screenshot / UPI receipt.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();

      // Append text fields
      Object.keys(formData).forEach((key) => {
        if (mode === 'register' && key === 'member_code') return;
        if (mode === 'reapply' && (key === 'email' || key === 'confirm_password')) return;
        if (key === 'agent_code' && (!formData[key] || !String(formData[key]).trim())) return;
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          if (key === 'gender') {
            const val = String(formData.gender).trim();
            const formattedGender = val
              ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
              : '';
            payload.append('gender', formattedGender);
          } else {
            payload.append(key, typeof formData[key] === 'string' ? formData[key].trim() : formData[key]);
          }
        }
      });

      // Append files
      payload.append('aadhaar_front', files.aadhaar_front);
      payload.append('aadhaar_back', files.aadhaar_back);
      payload.append('passbook_image', files.passbook_image);
      if (files.payment_screenshot) {
        payload.append('payment_screenshot', files.payment_screenshot);
      }
      if (files.pan_image) {
        payload.append('pan_image', files.pan_image);
      }

      let result;
      if (mode === 'register') {
        result = await registerMember(payload);
      } else {
        result = await reapplyMember(payload);
      }

      const finalResult = {
        ...result,
        password: formData.password,
        member_code: result?.member_code || formData.member_code || 'Pending'
      };
      setSuccessResult(finalResult);
      setSuccessPopup(finalResult);
    } catch (err) {
      console.error('Registration/Reapply error:', err);
      const backendError = err.message || 'Application submission failed. Please verify your details.';
      setErrorMessage(backendError);
      setErrorPopup(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    const code = successResult?.member_code;
    const pwd = successResult?.password;
    if (onRegistrationSuccess) {
      onRegistrationSuccess({ memberCode: code, password: pwd });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 sm:py-5 bg-gradient-to-r from-teal-50 via-teal-50/40 to-white border-b border-teal-100/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#008f85] to-[#005f58] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-base sm:text-lg flex-shrink-0">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-black text-slate-900 leading-tight truncate">
                  {mode === 'register' ? t("memberRegistrationModal.memberRegistration", "Member Registration") : t("memberRegistrationModal.reapplyMembership", "Reapply Membership")}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  {mode === 'register'
                    ? t("memberRegistrationModal.aurumfxMultiStateAgroCo", "AurumFX Multi State Agro Co-operative Society Limited")
                    : t("memberRegistrationModal.updateAndResubmitYourRejected", "Update and resubmit your rejected membership application")}
                </p>
              </div>
            </div>

            {/* Always Visible Top-Right Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              aria-label={t("modal.member.closeModal", "Close modal")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:p-7">
          {successResult ? (
            /* Success View */
            <div className="py-6 sm:py-8 text-center max-w-md mx-auto space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {mode === 'register' ? t("memberRegistrationModal.registrationSubmitted", "Registration Submitted!") : t("memberRegistrationModal.reapplicationSubmitted", "Reapplication Submitted!")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {successResult.message || 'Your membership form has been submitted for branch review and approval.'}
                </p>
              </div>

              {successResult.member_code && (
                <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">{t("memberRegistrationModal.yourAssignedMemberCode", "Your Assigned Member Code")}</p>
                  <p className="text-xl sm:text-2xl font-mono font-black text-teal-900 mt-1 select-all">
                    {successResult.member_code}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    {t("applyProductAccountModal.status", "Status:")} <span className="font-extrabold text-rose-600 uppercase tracking-wide">{successResult.status || 'pending'}</span>
                  </p>
                </div>
              )}

              {/* Red Notice Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-center">
                <p className="text-xs sm:text-sm font-bold text-rose-600 leading-snug">
                  {t("memberRegistrationModal.pleaseNoteMemberPortalLogin", "Please Note: Member portal login will be activated once your application is approved by the branch.")}
                </p>
              </div>

              <p className="text-xs text-slate-500">
                {t("memberRegistrationModal.pleaseSaveYourMemberCode", "Please save your Member Code. You can use it along with your password to log into your Member Portal once verified.")}
              </p>

              <button
                type="button"
                onClick={handleFinishSuccess}
                className="w-full h-12 bg-[#008579] hover:bg-[#007469] text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                {t("memberRegistrationModal.signInWithMemberCode", "Sign In with Member Code")}
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* 1. Account & Membership Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <UserPlus className="w-4 h-4 text-[#008f85] flex-shrink-0" />
                  <span>{t("memberRegistrationModal.1ApplicantHomeBranch", "1. Applicant & Home Branch")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.fullLegalName", "Full Legal Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder={t("memberRegistrationModal.eGSreejithKNair", "e.g. Sreejith K. Nair")}
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Branch Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.homeSocietyBranch", "Home Society Branch")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="branch_id"
                      required
                      value={formData.branch_id}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all cursor-pointer font-medium"
                    >
                      <option value="">
                        {branchesLoading ? t("memberRegistrationModal.loadingBranches", "Loading branches...") : t("memberRegistrationModal.pleaseSelectABranch", "Please select a branch")}
                      </option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city}, {b.state}) - #{b.branch_code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Membership Fee & UPI QR Card */}
                  {formData.branch_id && (
                    <div className="sm:col-span-2">
                      {settingsLoading ? (
                        <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-center gap-2 text-xs text-teal-700 font-semibold">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          <span>{t("memberRegistrationModal.checkingBranchMembershipFeePayment", "Checking branch membership fee & payment QR code...")}</span>
                        </div>
                      ) : branchSettings && branchSettings.configured ? (
                        <div className="bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-white rounded-2xl p-4 sm:p-5 border border-teal-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                                <QrCode className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                                  {t("memberRegistrationModal.branchMembershipEnrollmentFee", "Branch Membership Enrollment Fee")}
                                </span>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">
                                  {formatCurrency(branchSettings.membership_fee)}
                                </h4>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              <span>{t("memberRegistrationModal.mandatoryFee", "Mandatory Fee")}</span>
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-teal-100">
                            {branchSettings.qr_code_url ? (
                              <img
                                src={branchSettings.qr_code_url}
                                alt={t("memberRegistrationModal.branchUpiQrCode", "Branch UPI QR Code")}
                                className="w-32 h-32 object-contain rounded-xl border border-slate-200 p-1.5 shadow-2xs bg-white flex-shrink-0"
                                onError={async (e) => {
                                  if (!e.target.dataset.tried) {
                                    e.target.dataset.tried = 'true';
                                    const fallback = await resolveBranchQrImageUrl(null, formData.branch_id);
                                    if (fallback) e.target.src = fallback;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                <QrCode className="w-8 h-8" />
                              </div>
                            )}

                            <div className="space-y-1.5 text-xs text-slate-600 text-center sm:text-left">
                              <p className="font-bold text-slate-900">
                                {t("memberRegistrationModal.scanPayViaUpiGpay", "Scan & Pay via UPI (GPay, PhonePe, Paytm, BHIM)")}
                              </p>
                              <p className="text-[11px] leading-relaxed text-slate-500">
                                {t("memberRegistrationModal.1ScanTheQrCode", "1. Scan the QR code with any UPI app to pay the enrollment fee of")}{' '}
                                <strong className="text-teal-800 font-bold">
                                  {formatCurrency(branchSettings.membership_fee)}
                                </strong>.<br />
                                {t("memberRegistrationModal.2SaveTheTransactionReceipt", "2. Save the transaction receipt or take a screenshot.")}<br />
                                {t("memberRegistrationModal.3UploadTheScreenshotIn", "3. Upload the screenshot in")} <strong className="text-slate-800 font-bold">{t("memberRegistrationModal.section5RequiredVerificationDocuments", "Section 5 (Required Verification Documents)")}</strong> below.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            {t("memberRegistrationModal.noteThisBranchHasNot", "Note: This branch has not set a mandatory enrollment fee. You can proceed with registration.")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode specific: Email vs Member Code */}
                  {mode === 'register' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("modal.member.emailAddress", "Email Address")} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder={t("memberRegistrationModal.memberExampleCom", "member@example.com")}
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("memberRegistrationModal.existingMemberCode", "Existing Member Code")} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="member_code"
                        required
                        placeholder={t("memberRegistrationModal.eG2026Mem001", "e.g. 2026-MEM-001")}
                        value={formData.member_code}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono"
                      />
                    </div>
                  )}

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.mobileContactNumber", "Mobile Contact Number")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      placeholder={t("memberRegistrationModal.9198460Xxxxx", "+91 98460 XXXXX")}
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("modal.member.dateOfBirth", "Date of Birth")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      required
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("modal.member.gender", "Gender")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="">{t("memberRegistrationModal.selectGender", "Select Gender")}</option>
                      <option value="Male">{t("memberRegistrationModal.male", "Male")}</option>
                      <option value="Female">{t("memberRegistrationModal.female", "Female")}</option>
                      <option value="Other">{t("memberRegistrationModal.other", "Other")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Security Credentials (Eye icon initially OFF) */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Lock className="w-4 h-4 text-[#008f85] flex-shrink-0" />
                  <span>{t("memberRegistrationModal.2PortalLoginSecurity", "2. Portal Login Security")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Set Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.setPassword", "Set Password")} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showPassword ? t("login.branchAdmin.hidePassword", "Hide password") : t("login.branchAdmin.showPassword", "Show password")}
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-[#008f85]" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (only for register) */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t("branchManagerMemberPasswordUpdate.confirmPassword", "Confirm Password")} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirm_password"
                          required
                          placeholder="••••••••"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showConfirmPassword ? t("login.branchAdmin.hidePassword", "Hide password") : t("login.branchAdmin.showPassword", "Show password")}
                        >
                          {showConfirmPassword ? (
                            <Eye className="w-4 h-4 text-[#008f85]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Strong Password Live Guidance (Member Side) */}
                  {Boolean(formData.password) && (() => {
  const { t } = useTranslation();
                    const validation = validateStrongPassword(formData.password);
                    return (
                      <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">{t("dashboardModule.passwordUpdate.passwordStrength", "Password Strength:")}</span>
                          <span
                            className={`font-black uppercase tracking-wider text-[11px] ${
                              validation.score <= 2
                                ? 'text-rose-600'
                                : validation.score <= 4
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {validation.strengthLabel}
                          </span>
                        </div>

                        {/* Visual 5-segment bar */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className={`h-full flex-1 transition-all duration-200 ${
                                validation.score >= seg
                                  ? validation.score <= 2
                                    ? 'bg-rose-500'
                                    : validation.score <= 4
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                  : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Criteria Checklist */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              validation.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${
                                validation.hasMinLength ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                              }`}
                            />
                            <span>{t("memberRegistrationModal.atLeast8Chars", "At least 8 chars")}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              validation.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${
                                validation.hasUppercase ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                              }`}
                            />
                            <span>{t("dashboardModule.passwordUpdate.ruleUppercase", "Uppercase (A-Z)")}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              validation.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${
                                validation.hasLowercase ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                              }`}
                            />
                            <span>{t("dashboardModule.passwordUpdate.ruleLowercase", "Lowercase (a-z)")}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              validation.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${
                                validation.hasNumber ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                              }`}
                            />
                            <span>{t("dashboardModule.passwordUpdate.ruleNumber", "Number (0-9)")}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              validation.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Check
                              className={`w-3.5 h-3.5 ${
                                validation.hasSpecial ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                              }`}
                            />
                            <span>{t("dashboardModule.passwordUpdate.ruleSymbol", "Symbol (!@#$...)")}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 3. Address Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4 text-[#008f85] flex-shrink-0" />
                  <span>{t("memberRegistrationModal.3ResidentialAddress", "3. Residential Address")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.buildingHouseNo", "Building / House No")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="building_no"
                      required
                      placeholder="e.g. 12/450"
                      value={formData.building_no}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.streetLocality", "Street / Locality")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="street"
                      required
                      placeholder={t("memberRegistrationModal.eGTempleRoad", "e.g. Temple Road")}
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.cityVillage", "City / Village")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder={t("branchModals.eGKozhikode", "e.g. Kozhikode")}
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.district", "District")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      required
                      placeholder={t("branchModals.eGKozhikode", "e.g. Kozhikode")}
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.state", "State")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.pinCode", "PIN Code")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      required
                      placeholder="e.g. 673001"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.country", "Country")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      required
                      placeholder={t("memberRegistrationModal.eGIndia", "e.g. India")}
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Identity & Banking Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <CreditCard className="w-4 h-4 text-[#008f85] flex-shrink-0" />
                  <span>{t("memberRegistrationModal.4IdentityKycBankAccount", "4. Identity (KYC) & Bank Account")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("modal.member.aadhaarNumber", "Aadhaar Card Number")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="aadhaar_number"
                      required
                      maxLength={14}
                      placeholder={t("memberRegistrationModal.12DigitAadhaarNumber", "12 digit Aadhaar number")}
                      value={formData.aadhaar_number}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.panCardNumber", "PAN Card Number")} <span className="text-slate-400 font-normal">{t("accountantCashReconciliationView.optional", "(Optional)")}</span>
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      maxLength={10}
                      placeholder={t("memberRegistrationModal.10DigitPanOptional", "10 digit PAN (optional)")}
                      value={formData.pan_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberRegistrationModal.assistingAgentReferralCode", "Assisting Agent Referral Code")} <span className="text-slate-400 font-normal">{t("accountantCashReconciliationView.optional", "(Optional)")}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="agent_code"
                        placeholder={t("memberRegistrationModal.eGMap001IfAssisted", "e.g. MAP001 (if assisted)")}
                        value={formData.agent_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, agent_code: e.target.value.toUpperCase() }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono uppercase"
                      />
                      {agentLookup.loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                        </div>
                      )}
                    </div>
                    {agentLookup.name && (
                      <p className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                        <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                        <span>{t("memberRegistrationModal.enroller", "Enroller:")} {agentLookup.name}</span>
                      </p>
                    )}
                    {agentLookup.error && (
                      <p className="text-[11px] font-medium text-rose-500 mt-1 animate-fadeIn">
                        {agentLookup.error}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.bankAccountHolderName", "Bank Account Holder Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bank_holder_name"
                      required
                      placeholder={t("memberRegistrationModal.asPerBankPassbook", "As per bank passbook")}
                      value={formData.bank_holder_name}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("modal.member.bankAccountNumber", "Bank Account Number")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bank_account_number"
                      required
                      placeholder={t("memberRegistrationModal.enterAccountNumber", "Enter account number")}
                      value={formData.bank_account_number}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("memberProfile.bankIfscCode", "Bank IFSC Code")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ifsc_code"
                      required
                      placeholder={t("memberRegistrationModal.eGSbin0001234", "e.g. SBIN0001234")}
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Required Document Uploads & Fee Payment Screenshot */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Upload className="w-4 h-4 text-[#008f85] flex-shrink-0" />
                  <span>{t("memberRegistrationModal.5UploadVerificationDocumentsPayment", "5. Upload Verification Documents & Payment Screenshot")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    {
                      key: 'payment_screenshot',
                      label: t("memberRegistrationModal.membershipFeePaymentScreenshotUpi", "Membership Fee Payment Screenshot / UPI Receipt"),
                      desc: 'Screenshot of UPI / Bank transfer to the branch QR code',
                      required: mode === 'register',
                      highlight: true,
                    },
                    {
                      key: 'aadhaar_front',
                      label: t("memberNominee.aadhaarCardFrontSide", "Aadhaar Card (Front Side)"),
                      desc: 'Clear photo or PDF',
                      required: true,
                    },
                    {
                      key: 'aadhaar_back',
                      label: t("memberNominee.aadhaarCardBackSide", "Aadhaar Card (Back Side)"),
                      desc: 'Address side photo or PDF',
                      required: true,
                    },
                    {
                      key: 'passbook_image',
                      label: t("modal.member.docPassbook", "Bank Passbook / Cheque"),
                      desc: 'Validates bank account details',
                      required: true,
                    },
                    {
                      key: 'pan_image',
                      label: t("memberRegistrationModal.panCardCopyOptional", "PAN Card Copy (Optional)"),
                      desc: 'Front identity side',
                      required: false,
                    },
                  ].map((doc) => {
  const { t } = useTranslation();
                    const selected = files[doc.key];
                    return (
                      <div
                        key={doc.key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          doc.highlight
                            ? selected
                              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 sm:col-span-2'
                              : 'bg-teal-50/50 border-teal-300 ring-2 ring-teal-500/10 sm:col-span-2'
                            : selected
                            ? 'bg-teal-50/60 border-teal-300'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-800">
                            {doc.label} {doc.required ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal text-[10px]">{t("accountantCashReconciliationView.optional", "(Optional)")}</span>}
                          </label>
                          {selected && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {t("dashboardModule.productAccounts.selected", "Selected")}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">{doc.desc}</p>
                        
                        <label className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-white border border-slate-200 hover:border-[#008f85] rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#008f85] flex-shrink-0" />
                          <span className="truncate max-w-[240px] sm:max-w-[340px]">
                            {selected ? selected.name : t("memberRegistrationModal.chooseFile", "Choose File")}
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            required={doc.required}
                            onChange={(e) => handleFileChange(e, doc.key)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#008579] hover:bg-[#007469] disabled:opacity-70 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("memberRegistrationModal.submittingApplication", "Submitting Application...")}</span>
                    </>
                  ) : (
                    <span>
                      {mode === 'register' ? t("memberRegistrationModal.submitRegistration", "Submit Registration") : t("memberRegistrationModal.submitReapplication", "Submit Reapplication")}
                    </span>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>

      {/* Centered Backend Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {t("modal.branchAdmin.submissionError", "Submission Error")}
              </h3>
              <p className="text-xs sm:text-sm text-rose-900 mt-2.5 leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 font-medium break-words text-left">
                {errorPopup}
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

      {/* Centered Successful Submission Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {mode === 'register' ? t("memberRegistrationModal.registrationSuccessful", "Registration Successful!") : t("memberRegistrationModal.reapplicationSuccessful", "Reapplication Successful!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {successPopup.message || 'Your membership application has been submitted successfully for verification.'}
              </p>
            </div>

            {successPopup.member_code && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5">
                <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">{t("memberRegistrationModal.yourAssignedMemberCode", "Your Assigned Member Code")}</p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-teal-950 select-all tracking-tight">
                    {successPopup.member_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(successPopup.member_code)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-900 border border-teal-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 text-xs font-bold"
                    title={copiedCode ? t("memberRegistrationModal.copiedToClipboard", "Copied to clipboard!") : t("memberRegistrationModal.copyMemberCode", "Copy Member Code")}
                    aria-label={t("memberRegistrationModal.copyMemberCode", "Copy Member Code")}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span className="text-emerald-700 text-[11px]">{t("memberRegistrationModal.copied", "Copied!")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-teal-700 stroke-[2]" />
                        <span className="text-teal-800 text-[11px]">{t("memberRegistrationModal.copy", "Copy")}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 font-semibold">
                  {t("applyProductAccountModal.status", "Status:")} <span className="font-extrabold text-rose-600 uppercase tracking-wide">{successPopup.status || 'pending'}</span>
                </p>
              </div>
            )}

            {/* Notices Container */}
            <div className="space-y-2.5 text-left">
              {/* Branch Approval Requirement Notice */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  <span className="font-bold text-amber-950">{t("memberRegistrationModal.accountActivation", "Account Activation:")}</span> {t("memberRegistrationModal.memberPortalAccessWillBe", "Member portal access will be enabled once your application is formally verified and approved by the branch administration.")}
                </p>
              </div>

              {/* Registered Email Notification Notice */}
              <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-sky-900 leading-relaxed">
                  <span className="font-bold text-sky-950">{t("memberRegistrationModal.emailNotification", "Email Notification:")}</span> {t("memberRegistrationModal.youWillReceiveAnOfficial", "You will receive an official notification regarding your application status (approved or rejected) directly at your registered email address once reviewed.")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-snug">
              {t("memberRegistrationModal.pleaseSaveYourMemberCode2", "Please save your Member Code. You can use it to log into your Member Portal once verified by the society.")}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessPopup(null);
                  handleFinishSuccess();
                }}
                className="w-full h-12 bg-gradient-to-r from-[#008f85] to-[#007469] hover:from-[#007b72] hover:to-[#006057] text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all cursor-pointer"
              >
                {t("memberRegistrationModal.proceedToSignIn", "Proceed to Sign In")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
