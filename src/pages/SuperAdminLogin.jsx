import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import dashboardIllustration from '../assets/AurumFX Secure Digital Banking Dashboard.png';
import SuperAdminForgotPasswordModal from '../components/SuperAdminForgotPasswordModal';

// Exact Solid Bank Temple Icon matching reference badge
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



export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

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
    if (!username.trim() || !password.trim()) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both username/email and password.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

      // Swagger API: POST /auth/superadmin/login with application/x-www-form-urlencoded
      const formBody = new URLSearchParams();
      formBody.append('username', username.trim());
      formBody.append('password', password);
      formBody.append('grant_type', 'password');

      const response = await fetch(`${BASE_URL}/auth/superadmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: formBody.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Login failed (${response.status})`);
      }

      // Store tokens and admin data
      const token = data.access_token || data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);
        localStorage.setItem('superadmin_token', token);
      }
      if (data.user || data.superadmin) {
        localStorage.setItem('superadmin_user', JSON.stringify(data.user || data.superadmin));
      }

      setAuthStatus({
        type: 'success',
        message: 'Super Admin credentials verified! Directing to Core Dashboard...',
      });

      setTimeout(() => {
        navigate('/super-admin/dashboard');
      }, 800);
    } catch (err) {
      console.error('Superadmin login error:', err);
      setAuthStatus({
        type: 'error',
        message: err.message || 'Login failed. Please verify credentials or server status.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSuccess = ({ email: resetEmail, newPassword: pwd }) => {
    if (resetEmail) setUsername(resetEmail);
    if (pwd) setPassword(pwd);
    setAuthStatus({
      type: 'success',
      message: `Super Admin password reset successfully for ${resetEmail}! You can now log in with your new credentials.`,
    });
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center pt-14 pb-8 px-3 sm:pt-16 sm:pb-10 sm:px-6 lg:p-10 bg-white font-sans overflow-x-hidden selection:bg-[#ffba00] selection:text-slate-900">
      
      {/* =====================================================================
          EXACT WHITE BACKGROUND WITH CORNER-ANCHORED FLUID RIBBON WAVES
          Positioned strictly in the corners so they NEVER overlap the card
         ===================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-white">
        
        {/* Top-Right Soft Purple Fluid Waves (Tucked strictly into the far top-right corner) */}
        <div className="absolute top-0 right-0 w-[20vw] min-w-[170px] max-w-[280px] h-[18vh] min-h-[120px] max-h-[180px] pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 350 220"
            fill="none"
            preserveAspectRatio="xMaxYMin meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer soft sweeping crest */}
            <path
              d="M 120 0 C 200 60, 270 110, 350 160 L 350 0 Z"
              fill="url(#topRightRibbon)"
              opacity="0.85"
            />
            {/* Inner fluid curve */}
            <path
              d="M 210 0 C 265 45, 310 75, 350 100 L 350 0 Z"
              fill="url(#topRightRibbonInner)"
              opacity="0.7"
            />
            <defs>
              <linearGradient id="topRightRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d1c6fe" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#ded8fe" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="topRightRibbonInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cbbdfc" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#f3f0ff" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>
 
        {/* Bottom-Left Soft Purple Fluid Waves (Tucked strictly into bottom-left corner) */}
        <div className="absolute bottom-0 left-0 w-[24vw] min-w-[200px] max-w-[340px] h-[32vh] min-h-[180px] max-h-[300px] pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 380 320"
            fill="none"
            preserveAspectRatio="xMinYMax meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer sweeping fluid band */}
            <path
              d="M 0 80 C 140 140, 220 220, 140 320 L 0 320 Z"
              fill="url(#bottomLeftRibbonOuter)"
              opacity="0.65"
            />
            {/* Mid fluid crest */}
            <path
              d="M 0 160 C 110 200, 170 260, 70 320 L 0 320 Z"
              fill="url(#bottomLeftRibbonInner)"
              opacity="0.9"
            />
            {/* Deep corner core */}
            <path
              d="M 0 230 C 70 250, 100 280, 25 320 L 0 320 Z"
              fill="url(#bottomLeftRibbonCore)"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="bottomLeftRibbonOuter" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ede7fe" stopOpacity="0.1" />
                <stop offset="60%" stopColor="#dbd4ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#d5cbfd" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="bottomLeftRibbonInner" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f3efff" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#dad1fe" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#d5cbfd" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="bottomLeftRibbonCore" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d8cffe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d4cafe" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      </div>

      {/* Desktop Floating Back to Website Arrow Button */}
      <Link
        to="/"
        aria-label="Back to Website"
        title="Back to Website"
        className="hidden lg:flex absolute top-6 left-6 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 items-center justify-center backdrop-blur-md shadow-sm border border-slate-200/80 transition-all duration-200 group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      </Link>
    
      {/* =====================================================================
          MAIN CARD CONTAINER
          - Desktop: expanded width (max-w-[1480px] - 1640px) & tall height (min-h-[700px])
          - Mobile: fully responsive vertical layout without awkward height clipping
         ===================================================================== */}
      <div className="relative z-10 w-full max-w-[1480px] xl:max-w-[1560px] 2xl:max-w-[1640px] min-h-0 lg:min-h-[700px] xl:min-h-[720px] bg-white rounded-2xl sm:rounded-3xl lg:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.18),0_10px_30px_-5px_rgba(30,27,75,0.06)] overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        
        {/* ===================================================================
            LEFT HALF (Desktop) / BOTTOM HALF (Mobile): Dark Blue to Purple Illustration
            - Desktop: lg:order-1 (Left panel)
            - Mobile: order-2 (Bottom section below form)
           =================================================================== */}
        <div className="w-full lg:w-[50%] min-h-0 lg:min-h-[700px] xl:min-h-[720px] relative bg-gradient-to-b from-[#182356] via-[#212671] to-[#6a50c8] p-6 sm:p-8 lg:p-12 xl:p-14 flex flex-col justify-between overflow-hidden text-white select-none order-2 lg:order-1">
          
          {/* Subtle curved background rings for extra visual polish */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#6366f1]/25 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-[#8b5cf6]/25 blur-3xl pointer-events-none" />
          
          {/* Background vector arcs matching design */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="480" cy="190" r="300" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.3" />
            <circle cx="480" cy="190" r="410" stroke="white" strokeWidth="1" opacity="0.2" />
          </svg>
 
          {/* Top Brand Content */}
          <div className="relative z-10">
            {/* Logo Row */}
            <div className="flex items-center gap-2">
              <span className="text-[#ffba00] font-sans font-extrabold text-xl sm:text-2xl lg:text-[27px] tracking-tight">
                AurumFX
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-[32px] lg:h-[32px] rounded-lg bg-[#ffba00] flex items-center justify-center shadow-xs">
                <BankTempleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
              </div>
            </div>

            {/* Sub-label */}
            <p className="text-slate-300/85 text-[10px] sm:text-[11px] lg:text-xs font-normal tracking-normal [word-spacing:0.12em] mt-1">
              Aurumfx Multi State Agro Co-operative Society Limited
            </p>

            {/* Large Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-[42px] xl:text-[45px] font-sans font-bold text-white tracking-tight leading-[1.14] mt-5 sm:mt-8 lg:mt-12">
              Super Admin<br className="hidden sm:inline" /> Portal
            </h1>

            {/* Description */}
            <p className="text-slate-200/85 text-xs sm:text-[13px] lg:text-sm font-normal leading-relaxed mt-2.5 sm:mt-4 max-w-[360px]">
              Manage branches, staff, customers, loans and overall operations from a single, secure dashboard.
            </p>
          </div>

          {/* Bottom Illustration Container */}
          <div className="relative z-10 flex-1 flex items-end justify-center -mb-6 -mx-6 sm:-mb-8 sm:-mx-8 lg:-mb-12 lg:-mx-12 xl:-mb-14 xl:-mx-14 mt-4 sm:mt-6 pointer-events-none">
            <img
              src={dashboardIllustration}
              alt="AurumFX Digital Banking Dashboard"
              className="w-full max-w-[280px] sm:max-w-[420px] lg:max-w-[660px] xl:max-w-[740px] max-h-[190px] sm:max-h-[280px] lg:max-h-[440px] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)]"
              loading="eager"
            />
          </div>
        </div>

        {/* ===================================================================
            RIGHT HALF (Desktop) / TOP HALF (Mobile): Clean White Form Panel
            - Desktop: lg:order-2 (Right panel)
            - Mobile: order-1 (Top section above illustration)
           =================================================================== */}
        <div className="w-full lg:w-[50%] min-h-0 lg:min-h-[700px] xl:min-h-[720px] bg-white p-7 sm:p-12 lg:p-14 xl:p-16 flex flex-col justify-center relative z-10 order-1 lg:order-2">
          
          <div className="w-full max-w-[420px] sm:max-w-[450px] mx-auto py-4 sm:py-6 flex flex-col justify-center">
            {/* Mobile Back Button (Cleanly positioned on mobile screens) */}
            <div className="lg:hidden mb-4 self-start">
              <Link
                to="/"
                aria-label="Back to Website"
                title="Back to Website"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 active:bg-slate-200 text-slate-700 shadow-xs border border-slate-200/80 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            {/* Centered Bank Golden Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-[#ffba00] flex items-center justify-center mx-auto mb-3.5 sm:mb-4 shadow-sm shadow-amber-200/80">
              <BankTempleIcon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-900" />
            </div>

            {/* Portal Title & Subtitle with Welcome Back & Super Admin Login designation */}
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-block px-3 py-0.5 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-2">
                Super Admin Login
              </span>
              <h2 className="text-2xl sm:text-[29px] lg:text-[31px] font-sans font-bold text-slate-900 tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 font-normal">
                Sign in to access the AurumFX Banking System
              </p>
            </div>

            {/* Status Feedback Toast/Message */}
            {authStatus && (
              <div
                className={`mb-6 p-3.5 rounded-xl text-xs sm:text-[13px] flex items-start gap-2.5 animate-fadeIn ${
                  authStatus.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : authStatus.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                }`}
              >
                {authStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="leading-snug">{authStatus.message}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              
              {/* Username or Email Input Field */}
              <div>
                <label className="block text-xs sm:text-[13px] font-semibold text-slate-700 mb-2 text-left">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username or email"
                    required
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 transition-all duration-150"
                  />
                </div>
              </div>

              {/* Password Input Field with Eye Toggle */}
              <div>
                <label className="block text-xs sm:text-[13px] font-semibold text-slate-700 mb-2 text-left">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs sm:text-sm font-semibold text-[#6f46ed] hover:text-[#5c35cc] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button with Exact Gradient from Reference (#6f46ed to #5c35cc) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-4 bg-gradient-to-b from-[#6f46ed] to-[#5c35cc] hover:from-[#653edd] hover:to-[#542ebc] text-white font-semibold text-sm sm:text-base rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-[0.99] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Bottom Subtle Security Trust Badge to gracefully fill vertical height */}
            <div className="mt-8 sm:mt-10 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400 stroke-[1.8]" />
              <span>256-Bit SSL Encrypted &bull; Authorized Personnel Only</span>
            </div>

          </div>
        </div>

      </div>

      {/* =====================================================================
          Forgot Password Modal (POST /auth/superadmin/forgot-password & /auth/superadmin/reset-password)
         ===================================================================== */}
      <SuperAdminForgotPasswordModal
        isOpen={forgotModalOpen}
        initialEmail={username.includes('@') ? username : ''}
        onClose={() => setForgotModalOpen(false)}
        onResetSuccess={handlePasswordResetSuccess}
      />

    </div>
  );
}
