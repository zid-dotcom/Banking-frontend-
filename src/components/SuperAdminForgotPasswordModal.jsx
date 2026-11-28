import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Mail,
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
import { superAdminForgotPassword, superAdminResetPassword } from '../services/authService';

export default function SuperAdminForgotPasswordModal({
  isOpen,
  initialEmail = '',
  onClose,
  onResetSuccess,
}) {
  const { t } = useTranslation();
  // Step 1: Request OTP
  // Step 2: Verify OTP
  // Step 3: Set New Password
  // Step 4: Success confirmation
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
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
      setEmail(initialEmail ? String(initialEmail).trim().toLowerCase() : '');
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
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your administrative email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await superAdminForgotPassword(cleanEmail);
      const msg =
        res?.message ||
        res?.detail ||
        `Administrative verification OTP dispatched to ${cleanEmail}.`;
      setInfoMsg(msg);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset OTP. Please verify your admin email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setErrorMsg(null);
    setIsResending(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await superAdminForgotPassword(cleanEmail);
      setInfoMsg(res?.message || `A fresh authorization OTP was sent to ${cleanEmail}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP. Please try again.');
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
      setErrorMsg('Please enter the authorization OTP sent to your email.');
      return;
    }

    if (cleanOtp.length < 3) {
      setErrorMsg('Please enter a valid authorization OTP.');
      return;
    }

    // Advance to Step 3 to set the new password
    setStep(3);
    setInfoMsg('OTP code confirmed. Please set your new administrator password.');
  };

  // Step 3: Set New Password & Submit to Backend
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await superAdminResetPassword({
        email: cleanEmail,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword || newPassword,
      });

      setStep(4);
    } catch (err) {
      const msg = err.message || 'Failed to reset admin password. Please check your OTP and try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4 Completion: Back to Login
  const handleFinish = () => {
    if (onResetSuccess) {
      onResetSuccess({
        email: email.trim().toLowerCase(),
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
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6f46ed] flex items-center justify-center border border-purple-100 flex-shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                  {t("superAdminForgotPasswordModal.resetAdminPassword", "Reset Admin Password")}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {t("memberForgotPasswordModal.step1Of3Request", "Step 1 of 3: Request OTP")}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
              {t("superAdminForgotPasswordModal.enterYourRegisteredAdministratorEmail", "Enter your registered administrator email address to receive an authorization code.")}
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
                  {t("superAdminForgotPasswordModal.adminEmailAddress", "Admin Email Address")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder={t("superAdminForgotPasswordModal.adminAurumfxCom", "admin@aurumfx.com")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#6f46ed] focus:ring-4 focus:ring-purple-100 transition-all font-medium disabled:opacity-50"
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
                  disabled={isLoading || !email.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6f46ed] to-[#5c35cc] hover:from-[#5c35cc] hover:to-[#4e2bb5] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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
                title={t("superAdminForgotPasswordModal.changeEmail", "Change Email")}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
                  {t("memberForgotPasswordModal.verifyOtp", "Verify OTP")}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {t("superAdminForgotPasswordModal.step2Of3Enter", "Step 2 of 3: Enter Authorization Code")}
                </span>
              </div>
            </div>

            {infoMsg && (
              <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
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
              {/* Target Email Card with Change option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">{t("superAdminForgotPasswordModal.authorizedEmail", "Authorized Email")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg(null);
                    }}
                    className="text-[#6f46ed] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    {t("memberForgotPasswordModal.change", "Change")}
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {email}
                </div>
              </div>

              {/* OTP Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("superAdminForgotPasswordModal.authorizationOtp", "Authorization OTP")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={t("superAdminForgotPasswordModal.enterAuthorizationOtp", "Enter authorization OTP")}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-base font-mono tracking-wider text-slate-900 focus:outline-none focus:border-[#6f46ed] focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t("superAdminForgotPasswordModal.enterTheOneTimeCode", "Enter the one-time code sent to your registered email.")}
                </p>
              </div>

              {/* Action Buttons: Resend & Verify */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending || isLoading}
                  className="text-xs font-bold text-[#6f46ed] hover:text-[#5c35cc] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? t("memberForgotPasswordModal.resending", "Resending...") : t("memberForgotPasswordModal.resendOtp", "Resend OTP")}</span>
                </button>

                <button
                  type="submit"
                  disabled={!otp.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6f46ed] to-[#5c35cc] hover:from-[#5c35cc] hover:to-[#4e2bb5] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {t("memberForgotPasswordModal.step3Of3New", "Step 3 of 3: New Credentials")}
                </span>
              </div>
            </div>

            {/* OTP Verified Chip */}
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{t("memberForgotPasswordModal.otpEnteredFor", "OTP entered for")} <b>{email}</b></span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[#6f46ed] font-bold hover:underline text-[11px] cursor-pointer ml-2 flex-shrink-0"
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
                  {t("superAdminForgotPasswordModal.newAdminPassword", "New Admin Password")} <span className="text-rose-500">*</span>
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#6f46ed] focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {t("superAdminForgotPasswordModal.confirmAdminPassword", "Confirm Admin Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder={t("superAdminForgotPasswordModal.reEnterNewAdminPassword", "Re-enter new admin password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#6f46ed] focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6f46ed] to-[#5c35cc] hover:from-[#5c35cc] hover:to-[#4e2bb5] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-sans">
                {t("superAdminForgotPasswordModal.adminPasswordUpdated", "Admin Password Updated!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                {t("superAdminForgotPasswordModal.yourSuperAdministratorPasswordHas", "Your super administrator password has been updated. You can now log in using your new password.")}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-gradient-to-r from-[#6f46ed] to-[#5c35cc] hover:from-[#5c35cc] hover:to-[#4e2bb5] text-white font-bold text-sm rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
              >
                {t("superAdminForgotPasswordModal.logInToApexConsole", "Log In to Apex Console")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
