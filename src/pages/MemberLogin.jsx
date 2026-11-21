import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Users, UserPlus } from 'lucide-react';
import memberIllustration from '../assets/Modern Fintech Membership Illustration.png';
import { memberLogin } from '../services/memberService';
import MemberRegistrationModal from '../components/MemberRegistrationModal';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regMode, setRegMode] = useState('register');

  useEffect(() => {
    const expiredQuery = searchParams.get('expired') === 'true';
    const expiredMsg = sessionStorage.getItem('auth_expired_message');
    const stateMsg = location.state?.error || location.state?.message;

    if (expiredQuery || expiredMsg || stateMsg) {
      setAuthStatus({
        type: 'error',
        message: stateMsg || expiredMsg || 'Token is expired. Please login again.',
      });
      sessionStorage.removeItem('auth_expired_message');
    }
  }, [location, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId.trim() || !password.trim()) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both your Member ID and password.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    try {
      await memberLogin({
        username: memberId.trim(),
        password: password,
      });

      sessionStorage.removeItem('nominee_modal_dismissed');

      setAuthStatus({
        type: 'success',
        message: 'Member credentials verified! Accessing Member Dashboard...',
      });

      setTimeout(() => {
        navigate('/member/dashboard');
      }, 700);
    } catch (err) {
      console.error('Member login error:', err);
      setAuthStatus({
        type: 'error',
        message: err.message || 'Incorrect member code or password. Please verify your credentials.',
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
      message: `Application submitted! Your Member Code is #${memberCode}. You can log in once approved.`,
    });
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoverySent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setRecoverySent(false);
      setRecoveryEmail('');
      setAuthStatus({
        type: 'info',
        message: `Member password reset instructions sent to ${recoveryEmail}`,
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans selection:bg-[#008f85] selection:text-white">
      
      {/* Desktop Floating Back to Website Arrow Button */}
      <Link
        to="/"
        aria-label="Back to Website"
        title="Back to Website"
        className="hidden lg:flex fixed top-6 left-6 z-40 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 items-center justify-center backdrop-blur-md shadow-md border border-slate-200/80 transition-all duration-200 group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* =====================================================================
          LEFT PANE: Clean White Member Login Form Section
          - Mobile: order-1 (Form appears at top)
          - Desktop: lg:order-1 (Form on left)
          - Fully responsive vertical fit so header, form, and security footer fit cleanly on all desktop displays
         ===================================================================== */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between px-6 sm:px-10 lg:px-10 xl:px-14 2xl:px-18 py-4 sm:py-6 lg:py-6 xl:py-8 relative z-10 bg-white order-1 lg:order-1 overflow-y-auto">
        
        {/* Top Section: Brand Logo Header & Mobile Back Button */}
        <div className="w-full max-w-[540px] xl:max-w-[600px] 2xl:max-w-[640px] mx-auto pt-1 sm:pt-2 flex-shrink-0">
          {/* Mobile Back Button (Cleanly positioned above the logo on mobile screens) */}
          <div className="lg:hidden mb-3 sm:mb-4">
            <Link
              to="/"
              aria-label="Back to Website"
              title="Back to Website"
              className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-700 shadow-md border border-slate-200/80 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#ffba00] flex items-center justify-center shadow-xs shadow-amber-200/80 flex-shrink-0">
              <BankTempleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-baseline leading-none">
                <span className="text-slate-900 font-sans font-extrabold text-2xl sm:text-[28px] tracking-tight">
                  Aurum
                </span>
                <span className="text-[#008f85] font-sans font-extrabold text-2xl sm:text-[28px] tracking-tight">
                  FX
                </span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-xs font-normal tracking-normal [word-spacing:0.1em] mt-1">
                Aurumfx Multi State Agro Co-operative Society Limited
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: Main Login Form Content */}
        <div className="w-full max-w-[540px] xl:max-w-[600px] 2xl:max-w-[640px] mx-auto my-auto py-3 sm:py-4 lg:py-3">
          
          {/* Member Login Pill Badge */}
          <div className="mb-2.5 sm:mb-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e6f7f6] border border-[#008f85]/30 text-[#008f85] text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
              <Users className="w-3.5 h-3.5 text-[#008f85]" />
              <span>Member Login</span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-4 sm:mb-5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
              Member Login
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm lg:text-base font-normal mt-1 sm:mt-1.5">
              Please enter your details to access your account
            </p>
          </div>

          {/* Status Feedback Toast/Message */}
          {authStatus && (
            <div
              className={`mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
                authStatus.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : authStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-teal-50 border border-teal-200 text-teal-800'
              }`}
            >
              {authStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="leading-snug flex-1">
                <div>{authStatus.message}</div>
                {isRejectedError && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-xs text-rose-600 font-medium">
                    Need to update a rejected application?{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenRegistration('reapply')}
                      className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer transition-colors"
                    >
                      Reapply Member
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            
            {/* Member ID Field */}
            <div>
              <label className="block text-slate-900 text-xs sm:text-sm font-semibold mb-1.5">
                Member ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <input
                  type="text"
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Enter your Member ID"
                  className="w-full h-11 sm:h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-900 text-xs sm:text-sm font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 sm:h-12 pl-11 pr-11 bg-white border border-slate-300 rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <Eye className="w-4.5 h-4.5 stroke-[1.8]" />
                  ) : (
                    <EyeOff className="w-4.5 h-4.5 stroke-[1.8]" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[#008f85] hover:text-[#007068] font-semibold text-xs sm:text-sm hover:underline cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 sm:h-12 px-6 rounded-xl sm:rounded-2xl bg-[#008579] hover:bg-[#007469] active:bg-[#006359] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg shadow-teal-800/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* New User Registration & Reapply Options */}
            <div className="pt-2 text-center space-y-1 border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-600">
                Are you a new user?{' '}
                <button
                  type="button"
                  onClick={() => handleOpenRegistration('register')}
                  className="font-bold text-[#008f85] hover:text-[#007068] hover:underline cursor-pointer transition-colors"
                >
                  Apply for Membership / Register Here
                </button>
              </p>

              {isRejectedError && (
                <p className="text-xs sm:text-sm text-rose-600 font-medium animate-fadeIn pt-0.5">
                  Need to update a rejected application?{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenRegistration('reapply')}
                    className="font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer transition-colors"
                  >
                    Reapply Member
                  </button>
                </p>
              )}
            </div>
          </form>

        </div>

        {/* Bottom Section: Security & Society Information Footer */}
        <div className="w-full max-w-[540px] xl:max-w-[600px] 2xl:max-w-[640px] mx-auto pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-1.5 flex-shrink-0">
          <span>&copy; {new Date().getFullYear()} Aurumfx Multi State Agro Co-operative Society Limited</span>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#008f85]" />
            <span>256-Bit SSL Encrypted &bull; Member Portal</span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          RIGHT PANE: Modern Fintech Membership 3D Illustration
          Responsive full view display:
          - Entire illustration fully visible without cropping (object-contain)
          - Generous padding and max-height constraints so all icons and cards fit perfectly
          - Seamless white background matching the form section
         ===================================================================== */}
      <div className="w-full lg:w-1/2 min-h-[300px] sm:min-h-[400px] lg:min-h-screen lg:h-screen bg-white relative flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 order-2 lg:order-2 select-none overflow-hidden">
        
        {/* Modern Fintech Membership Illustration Image */}
        <img
          src={memberIllustration}
          alt="AurumFX Member Account & Fintech Services"
          className="w-full h-full max-h-[460px] sm:max-h-[540px] lg:max-h-[85vh] xl:max-h-[88vh] object-contain object-center relative z-10 pointer-events-none"
          loading="eager"
        />
      </div>

      {/* =====================================================================
          Forgot Password Modal for Members
         ===================================================================== */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 font-sans">
              Reset Member Password
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-5">
              Enter your registered Society Member ID or Email address to receive password reset instructions.
            </p>

            {recoverySent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Password reset link sent! Please check your registered email.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Member ID or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AFX-MEM-2026-XXXX or member@gmail.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#008579] hover:bg-[#007469] text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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

