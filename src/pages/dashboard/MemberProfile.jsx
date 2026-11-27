import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import PasswordUpdateCard from '../../components/dashboard/PasswordUpdateCard';
import {
  getMemberFullProfile,
  getMemberMe,
  getMemberProfileDocument,
  downloadMemberProfileDocument
} from '../../services/memberService';
import { getMemberSecurityEvents, formatSecurityEventType } from '../../services/securityService';
import { getMemberSavingsAccounts } from '../../services/savingsSchemeService';
import { getMemberProductAccounts } from '../../services/productAccountService';
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
  Eye,
  Download,
  ExternalLink,
  FileCheck2,
  Compass,
  Wallet,
  PiggyBank,
  Coins,
  TrendingUp
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

  if (s.includes('pending') || s.includes('awaiting')) {
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
  const [productAccounts, setProductAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Document Viewer & Downloader State
  const [viewDoc, setViewDoc] = useState(null); // { url, isPdf, title, docType }
  const [docLoading, setDocLoading] = useState({});
  const [downloadingDoc, setDownloadingDoc] = useState({});

  const handleOpenDocument = async (docType, defaultTitle) => {
    setDocLoading((prev) => ({ ...prev, [docType]: true }));
    try {
      const rawUrl = profile?.[`${docType}_url`] || profile?.[docType] || docType;
      const res = await getMemberProfileDocument(rawUrl);
      if (res?.url) {
        setViewDoc({
          url: res.url,
          isPdf: res.isPdf,
          title: defaultTitle,
          docType
        });
      }
    } catch (err) {
      console.error(`Error opening document ${docType}:`, err);
      const rawUrl = profile?.[`${docType}_url`] || profile?.[docType];
      if (rawUrl && typeof rawUrl === 'string') {
        const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';
        const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${cleanPath}`;
        setViewDoc({
          url: fullUrl,
          isPdf: fullUrl.toLowerCase().includes('.pdf'),
          title: defaultTitle,
          docType
        });
      } else {
        alert(err.message || 'Could not load document preview.');
      }
    } finally {
      setDocLoading((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const handleDownloadDocument = async (docType, filename) => {
    setDownloadingDoc((prev) => ({ ...prev, [docType]: true }));
    try {
      const rawDownloadUrl = profile?.[`${docType}_download_url`] || profile?.[`${docType}_url`] || docType;
      const defaultFilename = filename || `member_${profile?.member_code || 'kyc'}_${docType}`;
      await downloadMemberProfileDocument(rawDownloadUrl, defaultFilename);
    } catch (err) {
      console.error(`Error downloading document ${docType}:`, err);
      alert(err.message || 'Could not download document.');
    } finally {
      setDownloadingDoc((prev) => ({ ...prev, [docType]: false }));
    }
  };

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

        // Cooperative Savings Accounts (from profile response or service fallback)
        if (Array.isArray(data.accounts)) {
          setSavingsAccounts(data.accounts);
        } else {
          getMemberSavingsAccounts()
            .then((accs) => {
              if (Array.isArray(accs)) setSavingsAccounts(accs);
              else if (accs && Array.isArray(accs.data)) setSavingsAccounts(accs.data);
              else if (accs && Array.isArray(accs.items)) setSavingsAccounts(accs.items);
              else setSavingsAccounts([]);
            })
            .catch((err) => console.warn('getMemberSavingsAccounts error in profile:', err));
        }

        // Cooperative Product Accounts (FD, MIS & Investments)
        if (Array.isArray(data.product_accounts)) {
          setProductAccounts(data.product_accounts);
        } else {
          getMemberProductAccounts()
            .then((prods) => {
              if (Array.isArray(prods)) setProductAccounts(prods);
              else if (prods && Array.isArray(prods.data)) setProductAccounts(prods.data);
              else if (prods && Array.isArray(prods.items)) setProductAccounts(prods.items);
              else setProductAccounts([]);
            })
            .catch((err) => console.warn('getMemberProductAccounts error in profile:', err));
        }

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
          if (Array.isArray(fallback.accounts)) setSavingsAccounts(fallback.accounts);
          if (Array.isArray(fallback.product_accounts)) setProductAccounts(fallback.product_accounts);
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

  const fdAccounts = productAccounts.filter((acc) => acc.product_type !== 'investment');
  const investmentAccounts = productAccounts.filter((acc) => acc.product_type === 'investment');

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

              {/* KYC Document Verification & Download Gallery */}
              <div className="p-5 sm:p-7 pt-0 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3.5 pt-4">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Verified Identity Documents &amp; Compliance Dossier
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    4 Statutory Records Attached
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    {
                      key: 'aadhaar_front',
                      title: 'Aadhaar Card (Front)',
                      desc: 'Official UIDAI Photo Identity Document',
                    },
                    {
                      key: 'aadhaar_back',
                      title: 'Aadhaar Card (Back)',
                      desc: 'UIDAI Address & QR Code Side',
                    },
                    {
                      key: 'pan_image',
                      title: 'PAN Card Copy',
                      desc: 'Income Tax Dept Permanent Account Number',
                    },
                    {
                      key: 'passbook_image',
                      title: 'Bank Passbook / Cheque',
                      desc: 'Verified Account Holder & IFSC Credentials',
                    },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3 shadow-2xs hover:border-teal-300 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-teal-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {doc.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenDocument(doc.key, doc.title)}
                          disabled={docLoading[doc.key]}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                          title="View Document"
                        >
                          {docLoading[doc.key] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument(
                              doc.key,
                              `member_${profile.member_code || 'kyc'}_${doc.key}`
                            )
                          }
                          disabled={downloadingDoc[doc.key]}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                          title="Download Document"
                        >
                          {downloadingDoc[doc.key] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-teal-700" />
                          )}
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
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

            {/* Cooperative Fixed Deposit & MIS Accounts Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <Coins className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Cooperative Fixed Deposit &amp; MIS Accounts
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Active term fixed deposits and monthly income schemes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{fdAccounts.length} Active {fdAccounts.length === 1 ? 'Folio' : 'Folios'}</span>
                  </span>
                  <Link
                    to="/member/fd-mis-schemes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>Manage FD &amp; MIS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {fdAccounts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Coins className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    No Fixed Deposit or MIS Accounts Opened
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You currently do not have any active term fixed deposits or MIS accounts. Explore high-yield deposit schemes to start earning guaranteed returns.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/member/fd-mis-schemes"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Explore FD &amp; MIS Schemes</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Account Number</th>
                        <th className="py-3.5 px-6">Scheme</th>
                        <th className="py-3.5 px-6">Branch</th>
                        <th className="py-3.5 px-6">Principal Amount</th>
                        <th className="py-3.5 px-6">Current Balance</th>
                        <th className="py-3.5 px-6 text-center">Status</th>
                        <th className="py-3.5 px-6">Opened On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {fdAccounts.map((acc, idx) => (
                        <tr key={acc.id || acc.account_number || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-sm whitespace-nowrap">
                            {acc.account_number || `Folio #${acc.id}`}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 capitalize">
                              {acc.scheme_name || 'Fixed Deposit Scheme'}
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
                            {acc.branch_id && (
                              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                                Branch ID #{acc.branch_id}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap font-sans font-bold text-slate-700">
                            {acc.requested_principal !== undefined && acc.requested_principal !== null && Number(acc.requested_principal) > 0
                              ? formatCurrency(acc.requested_principal)
                              : '—'}
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

            {/* Cooperative Recurring Investment Accounts Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shadow-2xs">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Cooperative Recurring Investment Accounts
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Active recurring daily, weekly, and monthly investment accounts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 font-bold text-xs rounded-full border border-purple-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>{investmentAccounts.length} Active {investmentAccounts.length === 1 ? 'Folio' : 'Folios'}</span>
                  </span>
                  <Link
                    to="/member/investment-schemes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>Manage Investments</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {investmentAccounts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    No Recurring Investment Accounts Opened
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You currently do not have any active recurring investment accounts. Subscribe to flexible wealth creation schemes designed for cooperative members.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/member/investment-schemes"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Explore Investment Schemes</span>
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
                        <th className="py-3.5 px-6">Portfolio Balance</th>
                        <th className="py-3.5 px-6 text-center">Status</th>
                        <th className="py-3.5 px-6">Opened On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {investmentAccounts.map((acc, idx) => (
                        <tr key={acc.id || acc.account_number || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-sm whitespace-nowrap">
                            {acc.account_number || `Folio #${acc.id}`}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 capitalize">
                              {acc.scheme_name || 'Investment Scheme'}
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
                            {acc.branch_id && (
                              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                                Branch ID #{acc.branch_id}
                              </span>
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
                role="member"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Document Preview Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {viewDoc.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadDocument(
                      viewDoc.docType,
                      `member_${profile?.member_code || 'kyc'}_${viewDoc.docType}`
                    )
                  }
                  disabled={downloadingDoc[viewDoc.docType]}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
                {viewDoc.url && (
                  <a
                    href={viewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100/50 min-h-[300px]">
              {viewDoc.url ? (
                viewDoc.isPdf || viewDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={viewDoc.url}
                    title={viewDoc.title}
                    className="w-full h-[500px] rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="flex flex-col items-center max-w-full">
                    <img
                      src={viewDoc.url}
                      alt={viewDoc.title}
                      className="max-h-[550px] max-w-full rounded-xl object-contain shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement?.querySelector('.doc-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                      style={{ display: 'none' }}
                      className="doc-fallback flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-2"
                    >
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-sm font-semibold">Image preview could not be displayed directly.</p>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadDocument(
                            viewDoc.docType,
                            `member_${profile?.member_code || 'kyc'}_${viewDoc.docType}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors mt-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Document</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-400">Document preview unavailable.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
