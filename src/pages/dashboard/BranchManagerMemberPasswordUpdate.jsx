import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  KeyRound,
  Users,
  Search,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  ShieldCheck,
  UserCheck,
  UserX,
  User,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import {
  getBranchAdminMembers,
  resetBranchAdminMemberPassword,
  getBranchAdminMe
} from '../../services/branchAdminService';
import { validateStrongPassword } from '../../utils/passwordValidation';

export default function BranchManagerMemberPasswordUpdate({ embedded = false }) {
  const { t } = useTranslation();
  const [managerUser, setManagerUser] = useState(() => {
    try {
      const cached = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      role: 'Branch Manager',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01',
    };
  });

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // Quick Reset Modal for direct table row action
  const [quickModalMember, setQuickModalMember] = useState(null);
  const [quickNewPassword, setQuickNewPassword] = useState('');
  const [quickConfirmPassword, setQuickConfirmPassword] = useState('');
  const [showQuickNewPassword, setShowQuickNewPassword] = useState(false);
  const [showQuickConfirmPassword, setShowQuickConfirmPassword] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState(null);

  // Load Manager Details
  useEffect(() => {
    getBranchAdminMe()
      .then((profile) => {
        if (profile) {
          const updated = {
            ...profile,
            name: profile.full_name || profile.name || 'Branch Manager',
            full_name: profile.full_name || profile.name || 'Branch Manager',
            role: 'Branch Manager',
            branch_name:
              profile.branch?.branch_name ||
              profile.branch?.name ||
              profile.branch_name ||
              'Society Branch',
            branch_code: profile.branch?.branch_code || profile.branch_code || 'BRA-01',
          };
          setManagerUser(updated);
          localStorage.setItem('branch_user', JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Members
  const loadMembers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getBranchAdminMembers({ limit: 200 });
      const list = Array.isArray(data) ? data : (data?.members || []);
      setMembers(list);

      // Pre-select first member if none selected
      if (!selectedMember && list.length > 0) {
        setSelectedMember(list[0]);
      } else if (selectedMember) {
        const found = list.find((m) => m.id === selectedMember.id);
        if (found) setSelectedMember(found);
      }
    } catch (err) {
      console.error('Failed to load branch members for password reset:', err);
      setErrorMessage(err.message || 'Could not load branch members.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Filtered members list for search & table
  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(m.id || '').toLowerCase().includes(q) ||
      String(m.member_code || '').toLowerCase().includes(q) ||
      String(m.full_name || '').toLowerCase().includes(q) ||
      String(m.email || '').toLowerCase().includes(q) ||
      String(m.mobile || '').toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalCount = members.length;
  const approvedCount = members.filter((m) => (m.status || '').toLowerCase() === 'approved').length;
  const activeCount = members.filter((m) => m.is_active !== false).length;

  // Handle Main Form Submit
  const handleMainFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedMember) {
      setErrorMessage('Please select a member to reset password.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    // Strong password validation for members
    const strongCheck = validateStrongPassword(newPassword);
    if (!strongCheck.isValid) {
      setErrorMessage(strongCheck.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const memberId = selectedMember.id || selectedMember.member_id;
      await resetBranchAdminMemberPassword(memberId, newPassword);

      setSuccessModal({
        member: selectedMember,
        newPassword: newPassword,
        message: `Password successfully updated for Member #${selectedMember.member_code || selectedMember.id} (${selectedMember.full_name || 'Member'})`
      });

      setNewPassword('');
      setConfirmPassword('');
      setToastMessage(`Password updated for #${selectedMember.member_code || selectedMember.id}!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error resetting member password:', err);
      setErrorMessage(err.message || 'Failed to update member password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Modal Submit
  const handleQuickModalSubmit = async (e) => {
    e.preventDefault();
    setQuickError(null);

    if (!quickModalMember) return;

    if (!quickNewPassword.trim()) {
      setQuickError('Please enter a new password.');
      return;
    }

    const strongCheck = validateStrongPassword(quickNewPassword);
    if (!strongCheck.isValid) {
      setQuickError(strongCheck.message);
      return;
    }

    if (quickNewPassword !== quickConfirmPassword) {
      setQuickError('Passwords do not match.');
      return;
    }

    setQuickSubmitting(true);
    try {
      const memberId = quickModalMember.id || quickModalMember.member_id;
      await resetBranchAdminMemberPassword(memberId, quickNewPassword);

      setSuccessModal({
        member: quickModalMember,
        newPassword: quickNewPassword,
        message: `Password successfully updated for Member #${quickModalMember.member_code || quickModalMember.id} (${quickModalMember.full_name || 'Member'})`
      });

      setQuickModalMember(null);
      setQuickNewPassword('');
      setQuickConfirmPassword('');
    } catch (err) {
      console.error('Error in quick reset password:', err);
      setQuickError(err.message || 'Failed to update member password.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const mainValidation = validateStrongPassword(newPassword);
  const quickValidation = validateStrongPassword(quickNewPassword);

  const content = (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner (Aurumfx Standard Styling) */}
      <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 flex-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
              <KeyRound className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>{t("branchManagerMemberPasswordUpdate.branchMemberSecurityDesk", "Branch Member Security Desk")}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {t("sidebar.memberPasswordUpdate", "Member Password Update")}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
            {t("branchManagerMemberPasswordUpdate.directlyUpdateAndReassignOfficial", "Directly update and reassign official credentials for registered branch members. Assigned passwords must fulfill standard cooperative security compliance.")}
          </p>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => loadMembers(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-teal-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title={t("branchManagerMemberPasswordUpdate.refreshMembers", "Refresh Members")}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t("dashboardModule.branchOverview.refreshing", "Refreshing...") : t("branchManagerMemberPasswordUpdate.refreshList", "Refresh List")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatCard
          title={t("branchManagerMemberPasswordUpdate.totalBranchMembers", "Total Branch Members")}
          value={totalCount}
          subtitle={t("branchManagerMemberPasswordUpdate.enrolledUnderThisBranch", "Enrolled under this branch")}
          icon={Users}
          color="teal"
        />
        <StatCard
          title={t("branchManagerMemberPasswordUpdate.kycVerified", "KYC Verified")}
          value={approvedCount}
          subtitle={t("branchManagerMemberPasswordUpdate.admittedMembersWithVerifiedDossiers", "Admitted members with verified dossiers")}
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            {t("branchManagerMemberPasswordUpdate.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {/* Main Grid: Left Member Selector & Reset Form, Right Member Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Form: Select Member & New Password (8 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <KeyRound className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {t("branchManagerMemberPasswordUpdate.updatePasswordForm", "Update Password Form")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("branchManagerMemberPasswordUpdate.selectAMemberAndDefine", "Select a member and define their updated portal login password.")}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleMainFormSubmit} className="space-y-4 sm:space-y-5">
            {/* 1. Member Selector Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("branchManagerMemberPasswordUpdate.selectBranchMember", "Select Branch Member")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedMember ? String(selectedMember.id) : ''}
                  onChange={(e) => {
                    const mId = Number(e.target.value);
                    const found = members.find((m) => m.id === mId);
                    setSelectedMember(found || null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all cursor-pointer"
                >
                  {members.length === 0 ? (
                    <option value="">{loading ? t("branchManagerMemberPasswordUpdate.loadingMembers", "Loading members...") : t("branchManagerMemberPasswordUpdate.noMembersFound", "No members found")}</option>
                  ) : (
                    members.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.member_code || m.id} — {m.full_name || 'Member'} ({m.mobile || m.email || 'No contact'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* 2. New Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("branchManagerMemberPasswordUpdate.newMemberPassword", "New Member Password")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder={t("branchManagerMemberPasswordUpdate.enterStrongPasswordEG", "Enter strong password (e.g. Pass@1234)")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all font-medium disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Strong Password Guidance */}
              {Boolean(newPassword) && (
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{t("dashboardModule.passwordUpdate.passwordStrength", "Password Strength:")}</span>
                    <span
                      className={`font-black uppercase tracking-wider text-[11px] ${
                        mainValidation.score <= 2
                          ? 'text-rose-600'
                          : mainValidation.score <= 4
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {mainValidation.strengthLabel}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((seg) => (
                      <div
                        key={seg}
                        className={`h-full flex-1 transition-all duration-200 ${
                          mainValidation.score >= seg
                            ? mainValidation.score <= 2
                              ? 'bg-rose-500'
                              : mainValidation.score <= 4
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        mainValidation.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          mainValidation.hasMinLength ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                        }`}
                      />
                      <span>{t("dashboardModule.passwordUpdate.ruleMinLength8", "8+ characters")}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        mainValidation.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          mainValidation.hasUppercase ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                        }`}
                      />
                      <span>{t("dashboardModule.passwordUpdate.ruleUppercase", "Uppercase (A-Z)")}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        mainValidation.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          mainValidation.hasLowercase ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                        }`}
                      />
                      <span>{t("dashboardModule.passwordUpdate.ruleLowercase", "Lowercase (a-z)")}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        mainValidation.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          mainValidation.hasNumber ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                        }`}
                      />
                      <span>{t("dashboardModule.passwordUpdate.ruleNumber", "Number (0-9)")}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        mainValidation.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          mainValidation.hasSpecial ? 'text-emerald-600 stroke-[3]' : 'opacity-30'
                        }`}
                      />
                      <span>{t("dashboardModule.passwordUpdate.ruleSymbol", "Symbol (!@#$...)")}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("dashboardModule.passwordUpdate.confirmNewPasswordLabel", "Confirm New Password")} <span className="text-rose-500">*</span>
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
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100 transition-all font-medium disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {Boolean(confirmPassword) && (
                <div className="mt-2 text-xs">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {t("dashboardModule.passwordUpdate.passwordsMatch", "Passwords match")}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      {t("validation.passwordMismatch", "Passwords do not match")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !selectedMember || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("branchManagerMemberPasswordUpdate.updatingMemberPassword", "Updating Member Password...")}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{t("branchManagerMemberPasswordUpdate.resetMemberPassword", "Reset Member Password")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("dashboardModule.emergency.clear", "Clear")}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info: Selected Member Dossier Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-[#00b4a7]" />
                <span>{t("branchManagerMemberPasswordUpdate.selectedMemberProfile", "Selected Member Profile")}</span>
              </div>
              {selectedMember && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#008f85] border border-teal-200">
                  #{selectedMember.member_code || selectedMember.id}
                </span>
              )}
            </div>

            {selectedMember ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100/70 text-teal-800 font-black text-base flex items-center justify-center flex-shrink-0">
                    {(selectedMember.full_name || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      {selectedMember.full_name || 'Member'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {t("branchManagerMemberPasswordUpdate.memberId", "Member ID: #")}{selectedMember.member_code || selectedMember.id}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium truncate">{selectedMember.email || 'No email attached'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium truncate">{selectedMember.mobile || 'No contact phone'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("common.status", "Status")}</span>
                    <span className="font-extrabold text-teal-700 capitalize mt-0.5 block">
                      {selectedMember.status || 'Active'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("modal.member.accountPrefix", "Account")}</span>
                    <span className={`font-extrabold capitalize mt-0.5 block ${selectedMember.is_active !== false ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedMember.is_active !== false ? t("common.active", "Active") : t("branchManagerMemberPasswordUpdate.locked", "Locked")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <span>{t("branchManagerMemberPasswordUpdate.pleaseSelectAMemberFrom", "Please select a member from the dropdown or registry table below.")}</span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-5 rounded-3xl bg-teal-50/70 border border-teal-200/70 text-teal-950 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-teal-900">
              <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0" />
              <span>{t("branchManagerMemberPasswordUpdate.administrativePasswordPolicy", "Administrative Password Policy")}</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed font-medium">
              {t("branchManagerMemberPasswordUpdate.updatingAMemberPasswordImmediately", "Updating a member password immediately invalidates previous sessions. The member can log in using their Member Code and this newly designated password.")}
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Table: Branch Member Registry Table with Quick Password Reset Button */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <Users className="w-5 h-5 text-[#00b4a7]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {t("branchManagerMemberPasswordUpdate.branchMemberRegistry", "Branch Member Registry")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("branchManagerMemberPasswordUpdate.clickResetPasswordOnAny", "Click \"Reset Password\" on any member row to quickly reassign their credentials.")}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("branchManagerMemberPasswordUpdate.searchByCodeNameEmail", "Search by code, name, email...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#008f85] transition-all font-medium"
            />
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 sm:px-6">{t("modal.member.memberCode", "Member Code")}</th>
                <th className="py-3 px-4 sm:px-6">{t("branchManagerMemberPasswordUpdate.fullNameContact", "Full Name & Contact")}</th>
                <th className="py-3 px-4 sm:px-6">{t("common.status", "Status")}</th>
                <th className="py-3 px-4 sm:px-6">{t("modal.member.accountPrefix", "Account")}</th>
                <th className="py-3 px-4 sm:px-6 text-right">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    <span>{t("branchManagerMemberPasswordUpdate.loadingBranchMembers", "Loading branch members...")}</span>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {t("branchManagerMemberPasswordUpdate.noMatchingMembersFound", "No matching members found.")}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
  const { t } = useTranslation();
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-teal-800">
                        #{member.member_code || member.id}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {member.full_name || 'Member'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {member.email || member.mobile || 'No contact specified'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 capitalize">
                          {member.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            member.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {member.is_active !== false ? t("common.active", "Active") : t("branchManagerMemberPasswordUpdate.locked", "Locked")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          {t("branchManagerMemberPasswordUpdate.select", "Select")}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickModalMember(member);
                            setQuickNewPassword('');
                            setQuickConfirmPassword('');
                            setQuickError(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#008f85] font-bold text-xs border border-teal-200/80 shadow-2xs transition-colors cursor-pointer active:scale-95"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{t("branchManagerMemberPasswordUpdate.resetPassword", "Reset Password")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reset Password Modal */}
      {quickModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#008f85] flex items-center justify-center border border-teal-100">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {t("branchManagerMemberPasswordUpdate.quickResetPassword", "Quick Reset Password")}
                  </h3>
                  <span className="text-[11px] text-teal-700 font-bold">
                    {t("branchManagerMemberPasswordUpdate.member", "Member #")}{quickModalMember.member_code || quickModalMember.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickModalMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
              <div className="font-bold text-slate-900">{quickModalMember.full_name}</div>
              <div className="text-[11px] text-slate-500">{quickModalMember.email || quickModalMember.mobile}</div>
            </div>

            {quickError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium flex-1">{quickError}</span>
              </div>
            )}

            <form onSubmit={handleQuickModalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t("dashboardModule.passwordUpdate.newPasswordLabel", "New Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showQuickNewPassword ? 'text' : 'password'}
                    required
                    placeholder={t("branchManagerMemberPasswordUpdate.enterStrongPassword", "Enter strong password")}
                    value={quickNewPassword}
                    onChange={(e) => setQuickNewPassword(e.target.value)}
                    disabled={quickSubmitting}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickNewPassword(!showQuickNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showQuickNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t("branchManagerMemberPasswordUpdate.confirmPassword", "Confirm Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showQuickConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder={t("branchManagerMemberPasswordUpdate.confirmPassword2", "Confirm password")}
                    value={quickConfirmPassword}
                    onChange={(e) => setQuickConfirmPassword(e.target.value)}
                    disabled={quickSubmitting}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#008f85] focus:ring-4 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickConfirmPassword(!showQuickConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showQuickConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuickModalMember(null)}
                  disabled={quickSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting || !quickNewPassword || quickNewPassword !== quickConfirmPassword}
                  className="px-5 py-2.5 bg-[#008f85] hover:bg-[#00756c] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {quickSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("branchManagerMemberPasswordUpdate.updating", "Updating...")}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{t("branchManagerMemberPasswordUpdate.confirmReset", "Confirm Reset")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-sans">
                {t("branchManagerMemberPasswordUpdate.memberPasswordUpdated", "Member Password Updated!")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                {successModal.message}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-1 text-xs">
              <div className="text-slate-500 font-medium">{t("branchManagerMemberPasswordUpdate.newDesignatedPassword", "New Designated Password:")}</div>
              <div className="font-mono font-bold text-slate-900 select-all bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                {successModal.newPassword}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessModal(null)}
                className="w-full py-3 bg-gradient-to-r from-[#008f85] to-[#00756c] hover:from-[#00756c] hover:to-[#005e57] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                {t("branchManagerMemberPasswordUpdate.done", "Done")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="member_password_update"
    >
      {content}
    </DashboardLayout>
  );
}
