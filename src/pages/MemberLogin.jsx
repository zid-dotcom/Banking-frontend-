import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Users, UserPlus } from 'lucide-react';
import memberIllustration from '../assets/Modern Fintech Membership Illustration.png';
import { memberLogin } from '../services/memberService';
import MemberRegistrationModal from '../components/MemberRegistrationModal';
import MemberForgotPasswordModal from '../components/MemberForgotPasswordModal';


// Exact Solid Bank Temple Icon matching reference logo & badge
function BankTempleIcon({ className = 'w-6 h-6 text-slate-900' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Triangular Roof Pediment & Architrave */}
      <path d="M12 2.5L2 7.5V9H22V7.5L12 2.5Z" />
      {/* 4 Classical Columns */}
      <rect x="3.75" y="10.5" width="2.75" height="7.5" rx="0.5" />
      <rect x="8.75" y="10.5" width="2.75" height="7.5" rx="0.5" />
      <rect x="13.75" y="10.5" width="2.75" height="7.5" rx="0.5" />
      <rect x="18.75" y="10.5" width="2.75" height="7.5" rx="0.5" />
      {/* Podium Base */}
      <path d="M2 19.5H22V21.5H2V19.5Z" />
    </svg>
  );
}

export default function MemberLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regMode, setRegMode] = useState('register');

  useEffect(() => {
    const expiredQuery = searchParams.get('expired') === 'true';
    const expiredMsg = sessionStorage.getItem('auth_expired_message');
    const stateMsg = location.state?.error || location.state?.message;

    if (expiredQuery || expiredMsg || stateMsg) {
      setAuthStatus({
        type: 'error',
        message: stateMsg || expiredMsg || t("login.member.tokenExpired", "Token is expired. Please login again."),
      });
      sessionStorage.removeItem('auth_expired_message');
    }
  }, [location, searchParams]);

  const handleQuickDemoLogin = async () => {
    setMemberId('MEM-183188');
    setPassword('demo123');
    setIsLoading(true);
    setAuthStatus(null);
    try {
      await memberLogin({
        username: 'MEM-183188',
        password: 'demo123',
      });
      sessionStorage.removeItem('nominee_modal_dismissed');
      setAuthStatus({
        type: 'success',
        message: t("login.member.loginSuccess", "Member credentials verified! Accessing Member Dashboard..."),
      });
      setTimeout(() => {
        navigate('/member/dashboard');
      }, 500);
    } catch (err) {
      navigate('/member/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthStatus(null);

    try {
      await memberLogin({
        username: memberId.trim() || 'MEM-183188',
        password: password.trim() || 'demo123',
      });

      sessionStorage.removeItem('nominee_modal_dismissed');

      setAuthStatus({
        type: 'success',
        message: t("login.member.loginSuccess", "Member credentials verified! Accessing Member Dashboard..."),
      });

      setTimeout(() => {
        navigate('/member/dashboard');
      }, 500);
    } catch (err) {
      console.error('Member login error:', err);
      setAuthStatus({
        type: 'error',
        message: err.message || t("login.member.invalidCredentials", "Incorrect member code or password. Please verify your credentials."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRegistration = (mode = 'register') => {
    setRegMode(mode);
    setRegModalOpen(true);
  };

  const isRejectedError = Boolean(
    authStatus?.type === 'error' &&
    authStatus?.message &&
    (
      authStatus.message.toLowerCase().includes('reject') ||
      authStatus.message.toLowerCase().includes('re-apply') ||
      authStatus.message.toLowerCase().includes('reapply')
    )
  );

  const handleRegistrationSuccess = ({ memberCode, password: registeredPwd }) => {
    if (memberCode) {
      setMemberId(memberCode);
    }
    if (registeredPwd) {
      setPassword(registeredPwd);
    }
    setAuthStatus({
      type: 'success',
      message: t("login.member.registrationSuccess", "Application submitted! Your Member Code is #{memberCode}. You can log in once approved.", { memberCode }),
    });
  };

  const handlePasswordResetSuccess = ({ memberCode: resetCode, newPassword: pwd }) => {
    if (resetCode) setMemberId(resetCode);
    if (pwd) setPassword(pwd);
    setAuthStatus({
      type: 'success',
      message: t("login.member.passwordResetSuccess", "Password reset successfully for Member #{memberCode}! You can now sign in with your new password.", { memberCode: resetCode }),
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans selection:bg-[#008f85] selection:text-white">
      
      {/* Desktop Floating Back to Website Arrow Button */}
      <Link
        to="/"
        aria-label={t("login.member.backToWebsite", "Back to Website")}
        title={t("login.member.backToWebsite", "Back to Website")}
        className="hidden lg:flex fixed top-6 left-6 z-40 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 items-center justify-center backdrop-blur-md shadow-md border border-slate-200/80 transition-all duration-200 group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* =====================================================================
          LEFT PANE: Clean White Member Login Form Section
          Theme matched exactly to Branch Manager Login design:
          - Mobile: order-1 (Form appears at top)
          - Desktop: lg:order-1 (Form on left)
         ===================================================================== */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 lg:py-8 xl:py-10 relative z-10 bg-white order-1 lg:order-1">
        
        {/* Top Section: Brand Logo Header & Mobile Back Button */}
        <div className="w-full max-w-[560px] xl:max-w-[620px] 2xl:max-w-[660px] mx-auto pt-2 sm:pt-3">
          {/* Mobile Back Button (Cleanly positioned above the logo on mobile screens) */}
          <div className="lg:hidden mb-4 sm:mb-5">
            <Link
              to="/"
              aria-label={t("login.member.backToWebsite", "Back to Website")}
              title={t("login.member.backToWebsite", "Back to Website")}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-700 shadow-md border border-slate-200/80 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#ffba00] flex items-center justify-center shadow-sm shadow-amber-200/80 flex-shrink-0">
              <BankTempleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900" />
            </div>
            <div>
              <div className="flex items-baseline leading-none">
                <span className="text-slate-900 font-sans font-extrabold text-[28px] sm:text-[32px] tracking-tight">
                  {t("branchAdminLogin.aurum", "Aurum")}
                </span>
                <span className="text-[#008f85] font-sans font-extrabold text-[28px] sm:text-[32px] tracking-tight">
                  {t("branchAdminLogin.fx", "FX")}
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-normal tracking-normal [word-spacing:0.12em] mt-1">
                {t("common.appName", "Aurumfx Multi State Agro Co-operative Society Limited")}
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: Main Login Form Content */}
        <div className="w-full max-w-[560px] xl:max-w-[620px] 2xl:max-w-[660px] mx-auto my-auto py-4 sm:py-6">
          
          {/* Member Login Pill Badge */}
          <div className="mb-3.5 sm:mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6f7f6] border border-[#008f85]/30 text-[#008f85] text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
              <Users className="w-4 h-4 text-[#008f85]" />
              <span>{t("login.member.title", "Member Login")}</span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-5 sm:mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
              {t("login.member.title", "Member Login")}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base lg:text-lg font-normal mt-1.5 sm:mt-2">
              {t("login.member.subtitle", "Please enter your details to access your account")}
            </p>
          </div>

          {/* Status Feedback Toast/Message */}
          {authStatus && (
            <div
              className={`mb-5 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeIn ${
                authStatus.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : authStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-teal-50 border border-teal-200 text-teal-800'
              }`}
            >
              {authStatus.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="leading-snug flex-1">
                <div>{authStatus.message}</div>
                {isRejectedError && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-xs text-rose-600 font-medium">
                    {t("login.member.rejectedPrompt", "Need to update a rejected application?")}{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenRegistration('reapply')}
                      className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer transition-colors"
                    >
                      {t("login.member.reapplyMember", "Reapply Member")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Member ID Field */}
            <div>
              <label className="block text-slate-900 text-sm sm:text-base font-semibold mb-2">
                {t("members.memberId", "Member ID")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 stroke-[1.8]" />
                </div>
                <input
                  type="text"
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder={t("login.member.memberIdPlaceholder", "Enter your Member ID")}
                  className="w-full h-12 sm:h-13.5 pl-12 pr-4 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-900 text-sm sm:text-base font-semibold mb-2">
                {t("login.member.password", "Password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 stroke-[1.8]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.member.passwordPlaceholder", "Enter your password")}
                  className="w-full h-12 sm:h-13.5 pl-12 pr-12 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("login.member.hidePassword", "Hide password") : t("login.member.showPassword", "Show password")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5 stroke-[1.8]" />
                  ) : (
                    <EyeOff className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[#008f85] hover:text-[#007068] font-semibold text-sm sm:text-base hover:underline cursor-pointer transition-colors"
              >
                {t("login.member.forgotPassword", "Forgot password?")}
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 sm:h-13.5 px-6 rounded-2xl bg-[#008579] hover:bg-[#007469] active:bg-[#006359] text-white font-bold text-base sm:text-lg shadow-md hover:shadow-xl shadow-teal-800/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t("common.signingIn", "Signing in...")}</span>
                </>
              ) : (
                <span>{t("common.signIn", "Sign In")}</span>
              )}
            </button>

            {/* Quick Demo Access Button */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full h-12 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              <span>{t("login.member.quickDemoLogin", "⚡ Quick Demo Login (Member)")}</span>
            </button>

            {/* New User Registration & Reapply Options */}
            <div className="pt-2 text-center space-y-1.5 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                {t("login.member.newUserPrompt", "Are you a new user?")}{' '}
                <button
                  type="button"
                  onClick={() => handleOpenRegistration('register')}
                  className="font-bold text-[#008f85] hover:text-[#007068] hover:underline cursor-pointer transition-colors"
                >
                  {t("login.member.registerHere", "Apply for Membership / Register Here")}
                </button>
              </p>

              {isRejectedError && (
                <p className="text-xs sm:text-sm text-rose-600 font-medium animate-fadeIn pt-0.5">
                  {t("login.member.rejectedPrompt", "Need to update a rejected application?")}{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenRegistration('reapply')}
                    className="font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer transition-colors"
                  >
                    {t("login.member.reapplyMember", "Reapply Member")}
                  </button>
                </p>
              )}
            </div>
          </form>

        </div>

        {/* Bottom Section: Security & Society Information Footer */}
        <div className="w-full max-w-[560px] xl:max-w-[620px] 2xl:max-w-[660px] mx-auto pt-4 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-400 gap-2">
          <span>&copy; {new Date().getFullYear()} {t("common.appName", "Aurumfx Multi State Agro Co-operative Society Limited")}</span>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#008f85]" />
            <span>{t("login.member.sslEncrypted", "256-Bit SSL Encrypted")} &bull; {t("nav.memberPortal", "Member Portal")}</span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          RIGHT PANE: Modern Fintech Membership 3D Illustration
          Full View Display:
          - Entire illustration displayed without cropping (object-contain)
          - Sized and padded exactly matching the Branch Manager login page
          - Seamless white background matching the form section
         ===================================================================== */}
      <div className="w-full lg:w-1/2 min-h-[340px] sm:min-h-[440px] lg:min-h-screen bg-white relative flex items-center justify-center p-3 sm:p-6 lg:p-8 xl:p-12 order-2 lg:order-2 select-none">
        
        {/* Modern Fintech Membership Illustration Image */}
        <img
          src={memberIllustration}
          alt={t("login.member.illustrationAlt", "AurumFX Member Account & Fintech Services")}
          className="w-full h-full max-h-[500px] sm:max-h-[600px] lg:max-h-[88vh] xl:max-h-[92vh] object-contain object-center relative z-10 pointer-events-none"
          loading="eager"
        />
      </div>

      {/* =====================================================================
          Forgot Password Modal for Members (POST /member/forgot-password & /member/reset-password)
         ===================================================================== */}
      <MemberForgotPasswordModal
        isOpen={forgotModalOpen}
        initialMemberCode={memberId}
        onClose={() => setForgotModalOpen(false)}
        onResetSuccess={handlePasswordResetSuccess}
      />

      {/* =====================================================================
          Member Registration & Reapply Modal
         ===================================================================== */}
      {regModalOpen && (
        <MemberRegistrationModal
          isOpen={regModalOpen}
          initialMode={regMode}
          initialMemberCode={regMode === 'reapply' ? memberId : ''}
          onClose={() => setRegModalOpen(false)}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}

    </div>
  );
}

