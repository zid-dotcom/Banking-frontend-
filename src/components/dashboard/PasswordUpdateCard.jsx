import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  ShieldAlert
} from 'lucide-react';
import { changePassword } from '../../services/authService';

export default function PasswordUpdateCard({
  title = 'Change Account Password',
  description = 'Update your credentials to maintain security across your cooperative society records.',
  showCardHeader = true,
  className = '',
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Password rules validation
  const isMinLength = newPassword.length >= 6;
  const isDifferentFromOld = oldPassword && newPassword ? oldPassword !== newPassword : true;
  const isMatching = newPassword && confirmPassword ? newPassword === confirmPassword : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    if (!oldPassword.trim()) {
      setErrorMessage('Please enter your current (old) password.');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (oldPassword === newPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }
    if (!confirmPassword.trim()) {
      setErrorMessage('Please confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      const successTxt =
        (typeof res === 'object' && (res?.message || res?.detail)) ||
        'Your password has been updated successfully! Your account credentials have been secured.';

      setSuccessMessage(successTxt);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to update password. Please check your old password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {showCardHeader && (
        <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <KeyRound className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {description}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0f766e] font-bold text-xs rounded-full border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
            <span>256-Bit SSL Encrypted</span>
          </span>
        </div>
      )}

      <div className="p-5 sm:p-7">
        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold">Password Updated</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold">Update Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          {/* Old / Current Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter your current account password"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00b4a7]/30 focus:border-[#00b4a7] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showOldPassword ? 'Hide password' : 'Show password'}
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new secure password (min. 6 characters)"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00b4a7]/30 focus:border-[#00b4a7] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirement Chips */}
            {newPassword && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border ${
                    isMinLength
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <Check className={`w-3 h-3 ${isMinLength ? 'text-emerald-600' : 'text-slate-400'}`} />
                  At least 6 characters
                </span>
                {oldPassword && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border ${
                      isDifferentFromOld
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${isDifferentFromOld ? 'text-emerald-600' : 'text-rose-600'}`} />
                    Different from current password
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00b4a7]/30 focus:border-[#00b4a7] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Match Indicator */}
            {confirmPassword && (
              <div className="mt-2 text-[11px] font-medium">
                {isMatching ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Passwords match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || (newPassword && confirmPassword && !isMatching)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#115e59] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isLoading || (!oldPassword && !newPassword && !confirmPassword)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
