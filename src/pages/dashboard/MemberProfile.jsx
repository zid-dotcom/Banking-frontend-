import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import PasswordUpdateCard from '../../components/dashboard/PasswordUpdateCard';
import { getMemberFullProfile, getMemberMe } from '../../services/memberService';
import { getMemberSecurityEvents, formatSecurityEventType } from '../../services/securityService';
import { getMemberSavingsAccounts } from '../../services/savingsSchemeService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Landmark,
  FileText,
  HeartHandshake,
  RefreshCw,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  BadgeCheck,
  Check,
  X,
  FileCheck2,
  Compass,
  Wallet,
  PiggyBank,
  Coins
} from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
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

function renderAccountStatusBadge(status) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  const label = String(status).replace(/_/g, ' ');

  if (s === 'active' || s === 'approved' || s === 'awaiting_initial_deposit' || s === 'opened' || s === 'account_opened') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Account Opened</span>
      </span>
    );
  }

  if (s.includes('pending')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }

  if (s.includes('closed') || s.includes('rejected') || s.includes('inactive')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      <span>{label}</span>
    </span>
  );
}

function calculateAge(dobString) {
  if (!dobString) return null;
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
}

export default function MemberProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Member';
        const branchObj = typeof parsed.branch === 'object' && parsed.branch !== null ? parsed.branch : null;
        const branchName = branchObj?.name || (typeof parsed.branch === 'string' ? parsed.branch : '');
        const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
        return {
          name,
          full_name: name,
          id: parsed.member_code || (parsed.id ? `MEM-${parsed.id}` : 'AFX-MEM-8842'),
          member_code: parsed.member_code || (parsed.id ? String(parsed.id) : ''),
          email: parsed.email || '',
          mobile: parsed.mobile || '',
          branch: branchName || 'Society Branch',
          branch_name: branchName,
          branch_location: branchLocation,
          status: parsed.status || 'approved',
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
        };
      }
    } catch {}
    return {
      name: 'Member',
      full_name: 'Member',
      id: 'AFX-MEM-8842',
      member_code: '',
      email: '',
      mobile: '',
      branch: 'Society Branch',
      status: 'approved',
      avatarText: 'M'
    };
  });

  const fetchProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberFullProfile();
      if (data) {
        setProfile(data);
        localStorage.setItem('member_user', JSON.stringify(data));

        getMemberSecurityEvents({ limit: 5 })
          .then((evs) => {
            if (Array.isArray(evs)) setSecurityEvents(evs);
          })
          .catch(() => {});

        getMemberSavingsAccounts()
          .then((accs) => {
            if (Array.isArray(accs)) setSavingsAccounts(accs);
            else if (accs && Array.isArray(accs.data)) setSavingsAccounts(accs.data);
            else if (accs && Array.isArray(accs.items)) setSavingsAccounts(accs.items);
            else setSavingsAccounts([]);
          })
          .catch((err) => console.warn('getMemberSavingsAccounts error in profile:', err));

        const name = data.full_name || 'Member';
        const branchObj = typeof data.branch === 'object' && data.branch !== null ? data.branch : null;
        const branchName = branchObj?.name || (typeof data.branch === 'string' ? data.branch : '');
        const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
        const branchCode = branchObj?.branch_code || '';

        setMemberUser({
          name,
          full_name: name,
          id: data.member_code || 'AFX-MEM',
          member_code: data.member_code || '',
          email: data.email || '',
          mobile: data.mobile || '',
          branch_id: data.branch_id,
          branch_code: branchCode,
          branch: branchName || 'Society Branch',
          branch_name: branchName,
          branch_location: branchLocation,
          status: data.status || 'approved',
          avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
        });
      }
    } catch (err) {
      console.warn('getMemberFullProfile error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('member');
        return;
      }

      // If /member/profile/full returns an issue, try fallback to /member/me
      try {
        const fallback = await getMemberMe();
        if (fallback) {
          setProfile(fallback);
        } else {
          setError(err.message || 'Failed to load member profile.');
        }
      } catch {
        setError(err.message || 'Failed to load member profile.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const branchObj = typeof profile?.branch === 'object' && profile?.branch !== null ? profile.branch : null;
  const branchName = branchObj?.name || (typeof profile?.branch === 'string' ? profile?.branch : 'Society Branch');
  const branchCode = branchObj?.branch_code || (profile?.branch_code ? String(profile.branch_code) : '');
  const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');

  const kycStatus = (profile?.kyc_status || 'pending').toLowerCase();
  const isKycApproved = kycStatus === 'approved';
  const isKycRejected = kycStatus === 'rejected';
  const isKycPending = kycStatus === 'pending' || kycStatus === 'under_review';

  const memberAge = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const nominee = profile?.nominee;
  const nomineeStatus = (nominee?.status || 'not_submitted').toLowerCase();

  return (
    <DashboardLayout role="member" user={memberUser} activeTab="profile">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <BadgeCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Verified Member Dossier</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {branchName} {branchCode ? `(#${branchCode})` : ''}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Member Profile &amp; KYC Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
              Official membership registration details, verified address, statutory identity KYC records, and linked bank credentials.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-teal-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Profile</span>
              </button>

              <Link
                to="/member/nominee"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Nominee Details →</span>
              </Link>
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Membership Status"
            value={profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1).toLowerCase() : 'Approved'}
            valueClassName="text-lg sm:text-[21px] font-semibold text-emerald-600 tracking-normal font-sans"
            subtext={`Member ID: ${profile?.member_code || memberUser.member_code || '—'}`}
            icon={ShieldCheck}
            trend={profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1).toLowerCase() : 'Approved'}
            trendType="up"
          />

          <StatCard
            title="KYC Verification"
            value={
              isKycApproved
                ? 'Approved'
                : isKycRejected
                ? 'Rejected'
                : 'Pending'
            }
            valueClassName={
              isKycApproved
                ? 'text-lg sm:text-[21px] font-semibold text-emerald-600 tracking-normal font-sans'
                : isKycRejected
                ? 'text-lg sm:text-[21px] font-semibold text-rose-600 tracking-normal font-sans'
                : 'text-lg sm:text-[21px] font-semibold text-amber-600 tracking-normal font-sans'
            }
            subtext={
              isKycApproved
                ? 'Identity Verified'
                : isKycRejected
                ? 'Action Required'
                : 'Branch Review'
            }
            icon={isKycApproved ? ShieldCheck : isKycRejected ? AlertCircle : Clock}
            trend={
              isKycApproved
                ? 'Approved'
                : isKycRejected
                ? 'Rejected'
                : 'Pending'
            }
            trendType={isKycApproved ? 'up' : isKycRejected ? 'down' : 'neutral'}
          />

          <StatCard
            title="Home Branch"
            value={branchName}
            valueClassName="text-base sm:text-lg font-medium text-slate-800 tracking-normal font-sans line-clamp-2"
            subtext={branchCode ? `Branch Code: #${branchCode}` : (branchLocation || 'Society Branch')}
            icon={Building2}
          />

          <StatCard
            title="Member Since"
            value={profile?.member_created_at ? formatDate(profile.member_created_at) : 'Active Member'}
            valueClassName="text-base sm:text-lg font-medium text-slate-800 tracking-normal font-sans"
            subtext="Cooperative Membership"
            icon={Calendar}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchProfile(true)}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* KYC Rejection Notice Banner in RED if rejected */}
        {profile && isKycRejected && (
          <div className="p-5 sm:p-6 rounded-3xl bg-red-50/90 border-2 border-red-300 shadow-sm space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-red-700 font-black text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>KYC Verification Status: Rejected</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              Your member identity documents were reviewed by branch administration and rejected. Please review the reason below and contact your branch officer to re-submit valid proofs.
            </p>
            {/* Rejection Reason in RED */}
            <div className="p-4 rounded-2xl bg-white border-2 border-red-300 text-red-700 shadow-2xs space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-red-500">
                Reason for KYC Rejection:
              </p>
              <p className="text-sm sm:text-base font-extrabold text-red-600 leading-relaxed">
                {profile.kyc_rejection_reason || 'Incomplete, blurred or mismatching identity verification records.'}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading full member profile dossier...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Personal & Contact Information Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <User className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Personal &amp; Contact Details
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Primary member identification and contact folios
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Member Record</span>
                </span>
              </div>

              <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Full Legal Name
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.full_name || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Member Code
                  </p>
                  <p className="text-sm font-extrabold text-teal-700">
                    {profile.member_code || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 truncate" title={profile.email}>
                    {profile.email || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Registered Mobile
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.mobile || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Date of Birth &amp; Age
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatDate(profile.date_of_birth)}{' '}
                    {memberAge !== null && (
                      <span className="text-xs font-semibold text-slate-500">
                        ({memberAge} yrs)
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Gender
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 capitalize">
                    {profile.gender || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Residential Address Information */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <MapPin className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Residential &amp; Postal Address
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Registered residential address mapped with society branch
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {profile.city || profile.district || 'India'}
                </span>
              </div>

              <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Building / House No
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.building_no || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Street / Landmark
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.street || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    City / Town
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.city || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    District
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.district || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    State
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.state || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Country
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.country || 'India'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Postal / Zip Code
                  </p>
                  <p className="text-sm font-extrabold text-teal-700">
                    {profile.zip_code || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Branch
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {branchName}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Statutory KYC & Identity Compliance Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <FileText className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Identity &amp; Statutory KYC Verification
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      UIDAI Aadhaar and Income Tax PAN document compliance
                    </p>
                  </div>
                </div>

                {isKycApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>KYC Verified</span>
                  </span>
                ) : isKycRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-black text-xs rounded-full border border-red-300">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>KYC Rejected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>KYC Under Review</span>
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Aadhaar Card (Masked)
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">
                    {profile.aadhaar_masked || 'XXXX-XXXX-XXXX'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    PAN Card (Masked)
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">
                    {profile.pan_masked || 'XXXXX0000X'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    KYC Review Date
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatDateTime(profile.kyc_reviewed_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Banking & Settlement Accounts Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <Landmark className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Settlement Bank Account Records
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Registered bank account used for society dividend &amp; maturity disbursements
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Masked for Privacy</span>
                </span>
              </div>

              <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bank Account Holder Name
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {profile.bank_holder_name || profile.full_name || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bank Account Number (Masked)
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">
                    {profile.bank_account_masked || '•••• •••• ••••'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bank IFSC Code
                  </p>
                  <p className="text-sm font-extrabold text-teal-700 font-mono">
                    {profile.ifsc_code || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cooperative Savings Accounts Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <Wallet className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Cooperative Savings Deposit Accounts
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Active member savings accounts registered with society branches
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{savingsAccounts.length} Active {savingsAccounts.length === 1 ? 'Folio' : 'Folios'}</span>
                  </span>
                  <Link
                    to="/member/savings-schemes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>Manage Savings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {savingsAccounts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    No Cooperative Savings Accounts Opened
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You currently have no active savings deposit folios in this branch. Apply for an approved savings scheme to start saving.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/member/savings-schemes"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Explore Savings Schemes</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Account Number</th>
                        <th className="py-3.5 px-6">Scheme</th>
                        <th className="py-3.5 px-6">Branch</th>
                        <th className="py-3.5 px-6">IFSC Code</th>
                        <th className="py-3.5 px-6">Balance</th>
                        <th className="py-3.5 px-6 text-center">Status</th>
                        <th className="py-3.5 px-6">Opened On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {savingsAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-sm whitespace-nowrap">
                            {acc.account_number || `#SB-${acc.id}`}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 capitalize">
                              {acc.scheme_name || 'Savings Scheme'}
                            </div>
                            {acc.scheme_code && (
                              <span className="font-mono text-[11px] text-slate-400 block font-normal mt-0.5">
                                Code: {acc.scheme_code}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 text-xs">
                              {acc.branch_name || 'Society Branch'}
                            </div>
                            {acc.branch_code && (
                              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                                Code: {acc.branch_code}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            {acc.ifsc_code ? (
                              <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-xs">
                                {acc.ifsc_code}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-black font-sans text-base text-slate-900 whitespace-nowrap">
                            {formatCurrency(acc.balance ?? 0)}
                          </td>
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {renderAccountStatusBadge(acc.status)}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                            {formatDateTime(acc.opened_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Linked Nominee Dossier Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <HeartHandshake className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Linked Beneficiary &amp; Nominee
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Designated nominee for savings deposits and member insurance settlements
                    </p>
                  </div>
                </div>

                <Link
                  to="/member/nominee"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-colors shadow-2xs"
                >
                  <span>Manage Nominee</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {nominee && nominee.nominee_name ? (
                <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Nominee Name
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {nominee.nominee_name}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Relationship
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {nominee.relationship_type || '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Nominee DOB
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatDate(nominee.date_of_birth)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Nominee Status
                    </p>
                    <p className="text-sm font-extrabold">
                      {nomineeStatus === 'approved' ? (
                        <span className="text-emerald-700">● Approved</span>
                      ) : nomineeStatus === 'rejected' ? (
                        <span className="text-red-600">● Rejected</span>
                      ) : (
                        <span className="text-amber-700">● Pending Verification</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">
                    No Nominee Registered Yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You have not registered a nominee yet. Secure your deposits and cooperative holdings by adding your beneficiary.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/member/nominee"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Register Nominee Now</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Security & Account Access Information */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Security &amp; Recent Sign-in Activity
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Recent authentication events and access audits on your account
                    </p>
                  </div>
                </div>

                <Link
                  to="/member/security"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-colors shadow-2xs"
                >
                  <span>View Full Security Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {securityEvents.length > 0 ? (
                <div className="p-5 sm:p-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {securityEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {formatSecurityEventType(ev.event_type)}
                          </span>
                          {ev.succeeded ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Success
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Failed
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {formatDateTime(ev.created_at)}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          IP: {ev.ip_address || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  <span>Sign-in activity log is recorded and protected by AurumFX Apex Security.</span>
                </div>
              )}
            </div>

            {/* 7. Change Password Section */}
            <div id="password-update">
              <PasswordUpdateCard
                title="Update Member Password"
                description="Change your login credentials to protect your cooperative accounts and membership assets."
              />
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
