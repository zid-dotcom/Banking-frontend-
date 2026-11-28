import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { memberForgotPassword, memberResetPassword } from '../services/authService';
import { validateStrongPassword } from '../utils/passwordValidation';


export default function MemberForgotPasswordModal({
  isOpen,
  initialMemberCode = '',
  onClose,
  onResetSuccess,
}) {
  const { t } = useTranslation();
  // Step 1: Request OTP
  // Step 2: Verify OTP
  // Step 3: Set New Password
  // Step 4: Success confirmation
  const [step, setStep] = useState(1);
  const [memberCode, setMemberCode] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMemberCode(initialMemberCode ? String(initialMemberCode).trim().replace(/^#/, '') : '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrorMsg(null);
      setInfoMsg(null);
      setIsLoading(false);
      setIsResending(false);
    }
  }, [isOpen, initialMemberCode]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanCode = memberCode.trim().replace(/^#/, '');
    if (!cleanCode) {
      setErrorMsg(t("forgotPassword.enterMemberCode", "Please enter your Member Code."));
      return;
    }

    setIsLoading(true);
    try {
      const res = await memberForgotPassword(cleanCode);
      const msg =
        res?.message ||
        res?.detail ||
        t("forgotPassword.otpSent", "Verification OTP sent to the registered email address for Member #{memberCode}.", { memberCode: cleanCode });
      setInfoMsg(msg);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || t("forgotPassword.otpSendError", "Could not send verification OTP. Please verify your Member Code."));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setErrorMsg(null);
    setIsResending(true);
    try {
      const cleanCode = memberCode.trim().replace(/^#/, '');
      const res = await memberForgotPassword(cleanCode);
      setInfoMsg(res?.message || t("forgotPassword.otpResent", "A fresh OTP was sent to your registered email."));
    } catch (err) {
      setErrorMsg(err.message || t("forgotPassword.otpResendError", "Failed to resend OTP. Please try again."));
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Validate OTP and advance to Step 3 (Set Password)
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMsg(t("forgotPassword.enterOtp", "Please enter the verification OTP sent to your email."));
      return;
    }

    if (cleanOtp.length < 3) {
      setErrorMsg(t("forgotPassword.invalidOtp", "Please enter a valid verification OTP."));
      return;
    }

    // Advance to Step 3 to set the new password
    setStep(3);
    setInfoMsg(t("forgotPassword.otpConfirmed", "OTP code confirmed. Please set your new member account password."));
  };

  // Step 3: Set New Password & Submit to Backend
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword.trim()) {
      setErrorMsg(t("forgotPassword.enterNewPassword", "Please enter a new password."));
      return;
    }
    const strongCheck = validateStrongPassword(newPassword);
    if (!strongCheck.isValid) {
      const pwdError = !newPassword
        ? t("forgotPassword.passwordRequired", "Password is required.")
        : !strongCheck.hasMinLength
        ? t("forgotPassword.passwordMinLength", "Password must be at least 8 characters long.")
        : !strongCheck.hasUppercase
        ? t("forgotPassword.passwordUppercase", "Password must include at least one uppercase letter (A-Z).")
        : !strongCheck.hasLowercase
        ? t("forgotPassword.passwordLowercase", "Password must include at least one lowercase letter (a-z).")
        : !strongCheck.hasNumber
        ? t("forgotPassword.passwordNumber", "Password must include at least one number (0-9).")
        : !strongCheck.hasSpecial
        ? t("forgotPassword.passwordSpecial", "Password must include at least one special character (!@#$%^&*...).")
        : strongCheck.message;
      setErrorMsg(pwdError);
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrorMsg(t("forgotPassword.passwordMismatch", "New password and confirmation password do not match."));
      return;
    }

    setIsLoading(true);
    try {
      const cleanCode = memberCode.trim().replace(/^#/, '');
      await memberResetPassword({
        member_code: cleanCode,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword || newPassword,
      });

      setStep(4);
    } catch (err) {
      const msg = err.message || t("forgotPassword.resetError", "Failed to reset password. Please check your OTP and try again.");
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4 Completion: Back to Login
  const handleFinish = () => {
    if (onResetSuccess) {
      onResetSuccess({
        memberCode: memberCode.trim().replace(/^#/, ''),
        newPassword,
      });
    }
    onClose();
  };

  const isOtpError =
    errorMsg &&
    (errorMsg.toLowerCase().includes('otp') ||
      errorMsg.toLowerCase().includes('code') ||
      errorMsg.toLowerCase().includes('invalid') ||
      errorMsg.toLowerCase().includes('expired'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-[480px] w-full shadow-2xl border border-slate-100 relative my-auto max-h-[92vh] overflow-y-auto transform transition-all">
        
        {/* Close Button - elevated z-index and fixed right margin */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label={t("common.close", "Close")}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 z-20"
        >
          <X className="w-4 h-4" />
        </button>
     
        {/* ===================================================================
            STEP 1: Request OTP Form
           =================================================================== */}
        {step === 1 && (
          <div>
            <div className="flex items-start gap-3 mb-4 pr-12">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#008f85] flex items-center justify-center border border-teal-100 flex-shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                  {t("branchManagerMemberPasswordUpdate.resetMemberPassword", "Reset Member Password")}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {t("memberForgotPasswordModal.step1Of3Request", "Step 1 of 3: Request OTP")}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
              {t("memberForgotPasswordModal.enterYourOfficialSocietyMember", "Enter your official Society Member ID. A secure verification OTP will be sent to your registered email address.")}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("memberForgotPasswordModal.memberIdCode", "Member ID / Code")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t("memberForgotPasswordModal.eG100234OrMem001", "e.g. 100234 or MEM001")}
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !memberCode.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("memberForgotPasswordModal.sendingOtp", "Sending OTP...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("memberForgotPasswordModal.sendOtp", "Send OTP")}</span>
                      <KeyRound className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            STEP 2: Enter & Verify OTP ONLY
           =================================================================== */}
        {step === 2 && (
          <div>
            <div className="flex items-start gap-3 mb-4 pr-12">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMsg(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                title={t("memberForgotPasswordModal.changeMemberId", "Change Member ID")}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                  {t("memberForgotPasswordModal.verifyOtp", "Verify OTP")}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {t("memberForgotPasswordModal.step2Of3Enter", "Step 2 of 3: Enter Verification Code")}
                </span>
              </div>
            </div>

            {infoMsg && (
              <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{infoMsg}</span>
              </div>
            )}
 
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Target Member ID Card with Change option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">{t("branchManagerNominees.memberAccount", "Member Account")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg(null);
                    }}
                    className="text-[#008f85] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    {t("memberForgotPasswordModal.change", "Change")}
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {t("branchManagerMemberPasswordUpdate.member", "Member #")}{memberCode}
                </div>
              </div>

              {/* OTP Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("memberForgotPasswordModal.verificationOtp", "Verification OTP")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={t("memberForgotPasswordModal.enterOtpFromEmail", "Enter OTP from email")}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-base font-mono tracking-wider text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t("memberForgotPasswordModal.enterTheVerificationCodeSent", "Enter the verification code sent to your registered email address.")}
                </p>
              </div>

              {/* Action Buttons: Resend & Verify */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending || isLoading}
                  className="text-xs font-bold text-[#008f85] hover:text-[#00756c] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? t("memberForgotPasswordModal.resending", "Resending...") : t("memberForgotPasswordModal.resendOtp", "Resend OTP")}</span>
                </button>

                <button
                  type="submit"
                  disabled={!otp.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <span>{t("memberForgotPasswordModal.verifyOtp", "Verify OTP")}</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            STEP 3: Set New Password & Confirm Password (After OTP is Verified)
           =================================================================== */}
        {step === 3 && (
          <div>
            <div className="flex items-start gap-3 mb-4 pr-12">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setErrorMsg(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                title={t("memberForgotPasswordModal.backToOtp", "Back to OTP")}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                  {t("memberForgotPasswordModal.setNewPassword", "Set New Password")}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {t("memberForgotPasswordModal.step3Of3New", "Step 3 of 3: New Credentials")}
                </span>
              </div>
            </div>

            {/* OTP Verified Chip */}
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{t("memberForgotPasswordModal.otpEnteredFor", "OTP entered for")} <b>{t("branchManagerMemberPasswordUpdate.member", "Member #")}{memberCode}</b></span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[#008f85] font-bold hover:underline text-[11px] cursor-pointer ml-2 flex-shrink-0"
              >
                {t("memberForgotPasswordModal.changeOtp", "Change OTP")}
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">
                  <div>{errorMsg}</div>
                  {isOtpError && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-1.5 text-xs font-bold text-rose-900 underline hover:no-underline cursor-pointer block"
                    >
                      {t("memberForgotPasswordModal.clickHereToReEnter", "Click here to re-enter your OTP code")}
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {t("branchManagerMemberPasswordUpdate.newMemberPassword", "New Member Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder={t("memberForgotPasswordModal.minimum6Characters", "Minimum 6 characters")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strong Password Live Guidance */}
                {Boolean(newPassword) && (() => {
  const { t } = useTranslation();
                  const validation = validateStrongPassword(newPassword);
                  return (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
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

                      {/* 5-Segment Strength Bar */}
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

                      {/* Criteria Checklist Pills */}
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
                          <span>{t("dashboardModule.passwordUpdate.ruleMinLength8", "8+ characters")}</span>
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
   
              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {t("memberForgotPasswordModal.confirmMemberPassword", "Confirm Member Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder={t("branchManagerMemberPasswordUpdate.reEnterNewPassword", "Re-enter new password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Reset Password Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {t("memberForgotPasswordModal.backToOtp", "Back to OTP")}
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !newPassword.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("branchManagerMemberPasswordUpdate.updating", "Updating...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("branchManagerMemberPasswordUpdate.resetPassword", "Reset Password")}</span>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            STEP 4: Success View
           =================================================================== */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-[#008f85] flex items-center justify-center mx-auto border border-teal-200 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-sans">
                {t("branchManagerMembers.passwordResetSuccessful", "Password Reset Successful!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                {t("memberForgotPasswordModal.yourMemberAccountPasswordHas", "Your member account password has been updated. You can now log in using your new credentials.")}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white font-bold text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
              >
                {t("memberForgotPasswordModal.backToMemberLogin", "Back to Member Login")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
