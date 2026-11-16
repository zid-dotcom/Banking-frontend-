import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import { SavingsSchemeDetailModal } from '../../components/dashboard/SavingsSchemeModals';
import {
  getMemberMe,
  getMemberSavingsSchemes,
  getMemberAnnouncements,
  getMemberNominee,
  getMemberFullProfile
} from '../../services/memberService';
import {
  Wallet,
  CreditCard,
  Award,
  Send,
  Download,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  PiggyBank,
  Mail,
  Phone,
  Building2,
  MapPin,
  User,
  Landmark,
  Eye,
  Percent,
  ArrowRight,
  Megaphone,
  LifeBuoy,
  Bell,
  HeartHandshake,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import cooperativeSupportSticker from '../../assets/Cooperative Banking Support Sticker.png';
import completeNomineeIllustration from '../../assets/Complete Your Nominee Details.png';

export default function MemberDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab');

  // Handle legacy query param redirects
  if (tab) return <Navigate to="/member/dashboard" replace />;

  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Member';
        const branchObj = typeof parsed.branch === 'object' && parsed.branch !== null ? parsed.branch : null;
        const branchName = branchObj?.name || (typeof parsed.branch === 'string' ? parsed.branch : '');
        const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
        const branchCode = branchObj?.branch_code || (parsed.branch_code ? String(parsed.branch_code) : '');
        return {
          name,
          full_name: name,
          id: parsed.member_code || (parsed.id ? `MEM-${parsed.id}` : 'AFX-MEM-8842'),
          member_code: parsed.member_code || (parsed.id ? String(parsed.id) : ''),
          email: parsed.email || '',
          mobile: parsed.mobile || '',
          branch_id: parsed.branch_id || null,
          branch_code: branchCode,
          branchName: branchName || '',
          branchLocation: branchLocation || '',
          status: parsed.status || 'approved',
          avatarText: name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'M',
          branch: branchName || 'Society Main Branch',
          joined: '14 Jan 2024'
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
      branch_id: null,
      branch_code: '',
      branchName: '',
      branchLocation: '',
      status: 'approved',
      avatarText: 'M',
      branch: 'Society Main Branch',
      joined: '14 Jan 2024'
    };
  });

  // Fetch fresh profile from GET /member/profile/full (with fallback to /member/me)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data = null;
        try {
          data = await getMemberFullProfile();
        } catch {
          data = await getMemberMe();
        }
        if (data) {
          localStorage.setItem('member_user', JSON.stringify(data));
          const name = data.full_name || data.name || 'Member';
          const branchObj = typeof data.branch === 'object' && data.branch !== null ? data.branch : null;
          const branchName = branchObj?.name || (typeof data.branch === 'string' ? data.branch : '');
          const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
          const branchCode = branchObj?.branch_code || (data.branch_code ? String(data.branch_code) : '');
          setMemberUser({
            name,
            full_name: name,
            id: data.member_code || (data.id ? `MEM-${data.id}` : 'AFX-MEM-8842'),
            member_code: data.member_code || (data.id ? String(data.id) : ''),
            email: data.email || '',
            mobile: data.mobile || '',
            branch_id: data.branch_id || null,
            branch_code: branchCode,
            branchName: branchName || '',
            branchLocation: branchLocation || '',
            status: data.status || 'approved',
            avatarText: name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'M',
            branch: branchName || 'Society Main Branch',
            joined: data.member_created_at ? new Date(data.member_created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Jan 2024'
          });
        }
      } catch (err) {
        console.warn('Could not load fresh profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const [savingsSchemes, setSavingsSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Fetch announcements for member
  useEffect(() => {
    let isMounted = true;
    getMemberAnnouncements({ limit: 5 })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch((err) => console.warn('Could not load member announcements:', err))
      .finally(() => {
        if (isMounted) setLoadingAnnouncements(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if member has submitted nominee details; if not, prompt with complete nominee modal
  const [nomineeModalOpen, setNomineeModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMemberNominee()
      .then((data) => {
        if (!isMounted) return;
        const hasNominee = Boolean(
          data &&
          (data.id || data.nominee_name || data.name || data.full_name)
        );
        if (!hasNominee) {
          setNomineeModalOpen(true);
        } else {
          setNomineeModalOpen(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setNomineeModalOpen(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch available savings schemes from GET /member/savings-schemes
  useEffect(() => {
    let isMounted = true;
    getMemberSavingsSchemes({ limit: 6 })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setSavingsSchemes(data);
        }
      })
      .catch((err) => console.warn('Could not load member savings schemes:', err))
      .finally(() => {
        if (isMounted) setLoadingSchemes(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const transactions = [
    {
      id: 'tx-1',
      description: 'Dairy Loan EMI Installment #8',
      refNo: 'AFX-EMI-992144',
      category: 'Loan Repayment',
      date: 'Today, 10:24 AM',
      amount: '₹12,450',
      type: 'debit',
      status: 'Completed'
    },
    {
      id: 'tx-2',
      description: 'Monthly Thrift Deposit Credit',
      refNo: 'AFX-THRF-331002',
      category: 'Savings Thrift',
      date: '02 Nov 2026',
      amount: '₹5,000',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'tx-3',
      description: 'Annual Society Share Dividend (FY 25-26)',
      refNo: 'AFX-DIV-884201',
      category: 'Share Capital',
      date: '28 Oct 2026',
      amount: '₹2,125',
      type: 'credit',
      status: 'Completed'
    }
  ];

  const handleOpenAction = (type) => {
    if (type === 'deposit') {
      setModalConfig({
        isOpen: true,
        title: 'Quick Deposit / Thrift Payment',
        description: 'Transfer funds into your savings or recurring deposit folio.',
        actionLabel: 'Confirm Deposit',
        fields: [
          { name: 'accountType', label: 'Target Account', type: 'select', options: ['Primary Savings (₹1,48,250)', 'Recurring Thrift Deposit', 'Share Capital Increment'] },
          { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: 'e.g. 5000' },
          { name: 'upiId', label: 'Payment Method', type: 'select', options: ['UPI / GooglePay / PhonePe', 'Net Banking Transfer', 'Society Branch Counter Token'] }
        ]
      });
    }
  };

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="dashboard"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Member Header Banner matching reference design */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Member Info */}
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Top Separate Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: Cooperative Member</span>
              </div>

              {memberUser.branch_code && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Branch Code: <span className="font-mono text-teal-800 font-bold">#{memberUser.branch_code}</span></span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="capitalize">{memberUser.status === 'approved' ? 'Active' : (memberUser.status || 'Active')}</span>
              </div>
            </div>

            {/* Title with teal vertical bar */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Welcome, {memberUser.full_name || memberUser.name || 'Member'}</span>
                <span className="inline-block text-2xl sm:text-3xl">👋</span>
              </h1>
            </div>

            {/* Structured User & Branch Details separated into distinct chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Logged in as */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-500 font-medium">Logged in as:</span>
                <span className="text-slate-900 font-bold capitalize">{memberUser.full_name || memberUser.name || 'Member'}</span>
              </div>

              {/* Member Code */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <span className="text-slate-500 font-medium">Member Code:</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  {memberUser.member_code || memberUser.id}
                </span>
              </div>

              {/* Email */}
              {memberUser.email && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-slate-900 font-semibold">{memberUser.email}</span>
                </div>
              )}

              {/* Mobile */}
              {memberUser.mobile && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-slate-500 font-medium">Mobile:</span>
                  <span className="text-slate-900 font-semibold">{memberUser.mobile}</span>
                </div>
              )}

              {/* Branch Name */}
              {memberUser.branchName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-slate-500 font-medium">Branch Name:</span>
                  <span className="text-slate-900 font-bold">{memberUser.branchName}</span>
                </div>
              )}

              {/* Location */}
              {memberUser.branchLocation && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="text-slate-800 font-semibold capitalize">{memberUser.branchLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cooperative Banking Support Sticker Illustration */}
          <div className="relative z-10 my-[-10px] sm:my-[-20px] lg:my-[-30px] flex justify-end pointer-events-none">
            <img
              src={cooperativeSupportSticker}
              alt="Cooperative Banking Support"
              className="h-44 sm:h-52 lg:h-64 w-auto object-contain drop-shadow-md select-none"
            />
          </div>

          {/* Background subtle radial glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* Active Announcement Alert Banner */}
        {announcements.length > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Megaphone className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    Society Notice
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                    {announcements[0]?.title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                  {announcements[0]?.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/member/announcements')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-teal-200/70 transition-all flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shadow-2xs flex-shrink-0"
            >
              <span>View Notice Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4 Member Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Savings Deposit"
            value="₹1,48,250"
            subtitle="Acc #4401-8842-10"
            icon={Wallet}
            trend="+5.5% Annual Interest"
            trendType="up"
          />

          <StatCard
            title="Active Borrowing Outstanding"
            value="₹3,20,000"
            subtitle="Agro Dairy Term Loan"
            icon={CreditCard}
            badge="Subsidized 7.25%"
          />

          <StatCard
            title="Next Repayment Due"
            value="₹12,450"
            subtitle="Due on 18 Nov 2026"
            icon={Calendar}
            badge="Due in 7 Days"
          />

          <StatCard
            title="Society Shareholding"
            value="₹25,000"
            subtitle="250 Class A Shares"
            icon={Award}
            trend="8.5% Dividend"
            trendType="up"
          />
        </div>
 
 
        {/* Middle Section: Active Loan Details & Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                  Sanctioned Facility
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Agricultural Dairy &amp; Cold Storage Facility
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Regular Payer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div>
                <p className="text-xs text-slate-400">Total Sanctioned</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">₹4,50,000</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Paid So Far</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">₹1,30,000</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Subsidized Rate</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">7.25% p.a.</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tenure Completed</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">8 of 36 Months</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-500">Repayment Progress</span>
                <span className="text-[#0d9488]">28.8% Completed</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] rounded-full" style={{ width: '28.8%' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Member Shortcuts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Society documents &amp; tools</p>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={() => alert('Downloading official stamped passbook statement...')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-100 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-[#0d9488]" />
                    <span>Download Stamped Passbook</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => alert('Viewing official stamped Society Share Certificate...')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-100 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-[#0d9488]" />
                    <span>View Share Certificate</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleOpenAction('deposit')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-100 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-[#0d9488]" />
                    <span>Pay Next Installment (UPI)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/member/profile')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50/60 hover:bg-teal-50 border border-teal-100/80 transition-colors text-xs font-bold text-teal-900 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#0d9488]" />
                    <span>My Full Profile &amp; KYC Records</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/member/helpdesk')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-100 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <LifeBuoy className="w-4 h-4 text-[#0d9488]" />
                    <span>Society Helpdesk &amp; Tickets</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#0d9488] flex-shrink-0" />
              <span>Regulated under Multi-State Cooperative Society rules</span>
            </div>
          </div>
        </div>

        {/* Available Savings Schemes Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0d9488] flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Available Society Savings Schemes</h3>
                {savingsSchemes.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0f766e] border border-teal-200/60">
                    {savingsSchemes.length} Available
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">High-yield cooperative savings and thrift plans designed for members</p>
            </div>

            <button
              onClick={() => navigate('/member/savings-schemes')}
              className="text-xs font-bold text-[#0d9488] hover:text-[#0f766e] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore All Schemes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingSchemes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : savingsSchemes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No active savings schemes are currently published. Check back soon or contact society helpdesk.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsSchemes.slice(0, 3).map((scheme) => (
                <div
                  key={scheme.id || scheme.scheme_code}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition-all bg-gradient-to-b from-white to-slate-50/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        {scheme.scheme_code || `SAV-${scheme.id}`}
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {scheme.interest_rate}% p.a.
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {scheme.scheme_name || scheme.name || 'Savings Scheme'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {scheme.description || 'Verified society member savings scheme with steady returns.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>Min: <strong className="text-slate-800">₹{scheme.min_balance || 500}</strong></span>
                      <span className="capitalize text-slate-500 font-medium">{scheme.interest_calculation_frequency || 'quarterly'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedScheme(scheme);
                        setSchemeModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#0f766e] text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleOpenAction('deposit')}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white text-xs font-bold shadow-2xs hover:from-[#0d9488] hover:to-[#14b8a6] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RecentTransactionsTable
          title="Recent Member Transactions"
          subtitle="Your verified deposit and loan ledger transactions"
          transactions={transactions}
        />
      </div>

      <QuickActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false })}
        title={modalConfig.title}
        description={modalConfig.description}
        fields={modalConfig.fields}
        actionLabel={modalConfig.actionLabel}
        onSuccess={() => {}}
      />

      {/* View Scheme Details Modal */}
      <SavingsSchemeDetailModal
        isOpen={schemeModalOpen}
        scheme={selectedScheme}
        onClose={() => {
          setSchemeModalOpen(false);
          setSelectedScheme(null);
        }}
      />

      {/* Complete Your Nominee Details Modal (Exact match to reference design) */}
      {nomineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[42px] max-w-[480px] w-full shadow-2xl border-[4px] border-[#c4f4ed] overflow-hidden relative p-7 sm:p-9 pt-6 pb-9 animate-scaleUp text-center">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setNomineeModalOpen(false)}
              className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Illustration */}
            <div className="w-full flex items-center justify-center pt-1 pb-3 px-2">
              <img
                src={completeNomineeIllustration}
                alt="Complete Your Nominee Details"
                className="w-full max-w-[360px] h-auto object-contain select-none pointer-events-none drop-shadow-xs"
              />
            </div>

            {/* Action Required Badge */}
            <div className="flex justify-center mt-1">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fef3c7] text-[#b45309] font-black text-xs sm:text-[13px] tracking-wide select-none">
                <AlertTriangle className="w-4 h-4 fill-[#d97706] text-[#fef3c7] flex-shrink-0" />
                <span>Action Required</span>
              </span>
            </div>

            {/* Heading */}
            <h3 className="text-2xl sm:text-[28px] font-black text-[#0f172a] tracking-tight mt-3.5 sm:mt-4 leading-tight">
              Complete Your Nominee Details
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed max-w-[390px] mx-auto mt-2.5 sm:mt-3">
              You haven’t registered a nominee yet. Please add your nominee details to help secure your savings, deposits, and other cooperative benefits.
            </p>

            {/* Pill Action Button */}
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setNomineeModalOpen(false);
                  navigate('/member/nominee');
                }}
                className="px-9 py-3.5 sm:py-4 rounded-full bg-[#009b8d] hover:bg-[#00867a] active:scale-95 text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Register Nominee Now</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}