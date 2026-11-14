import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import {
  Landmark,
  CreditCard,
  Users,
  Clock,
  Building2,
  User,
  MapPin,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import modernFinanceWorkspace from '../../assets/Modern Banking Finance Workspace.png';
import {
  getBranchAdminMe,
  getBranchAdminMembers,
  getBranchAdminAnnouncements
} from '../../services/branchAdminService';
import { getMemberBranches } from '../../services/memberService';

function parseBranchInfo(obj = {}) {
  const b = obj.branch;
  const isObj = b && typeof b === 'object';

  const name =
    (isObj ? (b.name || b.branch_name) : null) ||
    (typeof obj.branch_name === 'string' ? obj.branch_name : null) ||
    (typeof b === 'string' ? b : null) ||
    'Society Branch';

  const code =
    (isObj ? b.branch_code : null) ||
    (typeof obj.branch_code === 'string' ? obj.branch_code : null) ||
    (obj.branch_id ? `BRA-${obj.branch_id}` : 'BRA-01');

  const loc =
    (isObj ? (b.city ? `${b.city}, ${b.state || 'Kerala'}` : b.state) : null) ||
    (typeof obj.location === 'string' ? obj.location : 'Kerala');

  return { name, code, loc };
}

export default function BranchManagerDashboard() {
  const navigate = useNavigate();
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const [managerUser, setManagerUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        const name = parsed.full_name || parsed.name || 'Branch Manager';
        const { name: bName, code: bCode, loc: bLoc } = parseBranchInfo(parsed);
        return {
          name,
          full_name: name,
          id: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          user_code: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          avatarText: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
          role: 'Branch Manager',
          branch: bName,
          branch_name: bName,
          branch_code: bCode,
          location: bLoc,
          cashierLimit: '₹5,00,000',
          is_active: parsed.is_active !== false,
          branch_id: parsed.branch_id || (typeof parsed.branch === 'object' ? parsed.branch?.id : null)
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      user_code: 'MGR-001',
      avatarText: 'BM',
      role: 'Branch Manager',
      branch: 'Society Branch',
      branch_name: 'Society Branch',
      branch_code: 'BRA-01',
      location: 'Kerala',
      cashierLimit: '₹5,00,000',
      is_active: true
    };
  });

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const profile = await getBranchAdminMe();
        if (profile) {
          let branchInfo = {};
          try {
            const branches = await getMemberBranches();
            if (Array.isArray(branches) && profile.branch_id) {
              const matched = branches.find(b => String(b.id) === String(profile.branch_id));
              if (matched) {
                branchInfo = {
                  branch_name: matched.branch_name,
                  branch_code: matched.branch_code,
                  location: matched.city ? `${matched.city}, ${matched.state || 'Kerala'}` : matched.state,
                };
              }
            }
          } catch (e) {
            console.warn('Could not resolve branch metadata for branch admin:', e);
          }

          const name = profile.full_name || profile.name || 'Branch Manager';
          const { name: bName, code: bCode, loc: bLoc } = parseBranchInfo(profile);

          const finalBranchName = branchInfo.branch_name || bName;
          const finalBranchCode = branchInfo.branch_code || bCode;
          const finalLocation = branchInfo.location || bLoc;

          const updatedUser = {
            ...profile,
            name,
            full_name: name,
            id: profile.user_code || (profile.id ? `MGR-${profile.id}` : 'MGR-001'),
            user_code: profile.user_code || (profile.id ? `MGR-${profile.id}` : 'MGR-001'),
            avatarText: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BM',
            role: 'Branch Manager',
            branch: finalBranchName,
            branch_name: finalBranchName,
            branch_code: finalBranchCode,
            location: finalLocation,
            cashierLimit: '₹5,00,000',
            is_active: profile.is_active !== false,
          };

          setManagerUser(updatedUser);
          localStorage.setItem('branch_user', JSON.stringify(updatedUser));
          localStorage.setItem('branch_manager_user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.warn('Failed to fetch /branch-admin/me:', err);
      }
    }

    loadAdminProfile();
  }, []);

  // Live branch members count for metrics
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function loadMembersCount() {
      try {
        const data = await getBranchAdminMembers();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Could not load member counts for dashboard:', err);
      }
    }
    loadMembersCount();
  }, []);

  const pendingMembers = members.filter(m => (m.status || '').toLowerCase() === 'pending');

  // Announcements from GET /branch-admin/announcements
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getBranchAdminAnnouncements({ limit: 5 })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch((err) => console.warn('Could not load branch admin announcements:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const branchTransactions = [
    {
      id: 'tx-bm-1',
      description: 'Gold Loan Disbursed - Sanction #GL-4491',
      refNo: 'BR-DSB-1092',
      category: 'Loan Outflow',
      date: 'Today, 11:20 AM',
      amount: '₹1,50,000',
      type: 'debit',
      status: 'Completed'
    },
    {
      id: 'tx-bm-2',
      description: 'Cash Deposit - Savings Folio AFX-MEM-8842',
      refNo: 'BR-DEP-3391',
      category: 'Member Deposit',
      date: 'Today, 10:45 AM',
      amount: '₹45,000',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'tx-bm-3',
      description: 'Fertilizer Pre-Season EMI Repayment',
      refNo: 'BR-REP-9021',
      category: 'Recovery Inflow',
      date: 'Today, 09:30 AM',
      amount: '₹12,400',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'tx-bm-4',
      description: 'Inter-Branch Clearing Transfer to Palakkad Hub',
      refNo: 'BR-CLR-7714',
      category: 'Treasury Clearing',
      date: 'Yesterday, 04:15 PM',
      amount: '₹5,00,000',
      type: 'debit',
      status: 'Approved'
    }
  ];

  const handleApprove = (id) => {
    setPendingApplications(pendingApplications.filter(app => app.id !== id));
  };

  const handleOpenAction = (type) => {
    if (type === 'new_member') {
      setModalConfig({
        isOpen: true,
        title: 'New Member Admission',
        description: 'Issue official society membership folio and allocate shares.',
        actionLabel: 'Register Member',
        fields: [
          { name: 'name', label: 'Full Applicant Name', placeholder: 'e.g. Ananthu Krishnan' },
          { name: 'aadhaar', label: 'Aadhaar / Voter ID Number', placeholder: 'xxxx-xxxx-xxxx' },
          { name: 'shareCount', label: 'Share Capital Subscription', type: 'select', options: ['100 Shares (₹10,000)', '250 Shares (₹25,000)', '500 Shares (₹50,000)'] },
          { name: 'farmingActivity', label: 'Primary Occupation', placeholder: 'e.g. Dairy Farmer / Organic Cultivator' }
        ]
      });
    } else if (type === 'disburse') {
      setModalConfig({
        isOpen: true,
        title: 'Quick Loan Disbursement',
        description: 'Authorize branch fund release to member savings folio.',
        actionLabel: 'Execute Disbursement',
        fields: [
          { name: 'loanRef', label: 'Sanction Order Number', placeholder: 'e.g. SNC-2026-8812' },
          { name: 'memberFolio', label: 'Member Folio Number', placeholder: 'e.g. AFX-MEM-8842' },
          { name: 'amount', label: 'Disbursement Amount (₹)', type: 'number', placeholder: 'e.g. 250000' }
        ]
      });
    } else if (type === 'day_end') {
      setModalConfig({
        isOpen: true,
        title: 'Day-End Vault & Cash Closure',
        description: 'Reconcile daily cash vouchers, digital UPI collections, and safe balance.',
        actionLabel: 'Sign & Lock Day Ledger',
        fields: [
          { name: 'physicalCash', label: 'Verified Physical Safe Balance (₹)', type: 'number', placeholder: 'e.g. 2480000' },
          { name: 'notes', label: 'Manager Sign-off Remarks', placeholder: 'e.g. All vouchers verified against tokens.' }
        ]
      });
    }
  };

  const branchName =
    (typeof managerUser.branch === 'string' ? managerUser.branch : null) ||
    managerUser.branch_name ||
    (managerUser.branch && typeof managerUser.branch === 'object'
      ? (managerUser.branch.name || managerUser.branch.branch_name)
      : null) ||
    'Society Branch';

  const rawBranchCode =
    managerUser.branch_code ||
    (managerUser.branch && typeof managerUser.branch === 'object' ? managerUser.branch.branch_code : null);
  const branchCodeDisplay = rawBranchCode
    ? (String(rawBranchCode).startsWith('#') ? rawBranchCode : `#${rawBranchCode}`)
    : '#Central';

  const branchLocation =
    managerUser.location ||
    (managerUser.branch && typeof managerUser.branch === 'object'
      ? (managerUser.branch.city ? `${managerUser.branch.city}, ${managerUser.branch.state || 'Kerala'}` : managerUser.branch.state)
      : '');

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="overview"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Branch Header Banner matching reference design */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e5faf5] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Branch Manager Info */}
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Top Separate Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e]">
                <Landmark className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: Branch Manager</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Branch Code: <span className="font-mono text-teal-800 font-bold">{branchCodeDisplay}</span></span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-xs text-xs font-semibold border border-emerald-200 shadow-2xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{managerUser.is_active !== false ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Welcome, Branch Manager</span>
                <span className="inline-block text-2xl sm:text-3xl">👋</span>
              </h1>
            </div>

            {/* Structured User & Branch Details separated into distinct chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Logged in as */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-500 font-medium">Logged in as:</span>
                <span className="text-slate-900 font-bold capitalize">{managerUser.full_name || managerUser.name || 'Branch Manager'}</span>
              </div>

              {/* User ID */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <span className="text-slate-500 font-medium">User ID:</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  {managerUser.user_code || managerUser.id}
                </span>
              </div>

              {/* Branch Name */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-500 font-medium">Branch Name:</span>
                <span className="text-slate-900 font-bold">{branchName}</span>
              </div>

              {/* Location */}
              {branchLocation ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-teal-200/70 shadow-2xs text-xs text-slate-700 backdrop-blur-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="text-slate-800 font-semibold capitalize">{branchLocation}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Modern Banking Finance Workspace Illustration */}
          <div className="relative z-10 my-[-10px] sm:my-[-20px] lg:my-[-30px] flex justify-end pointer-events-none">
            <img
              src={modernFinanceWorkspace}
              alt="Branch Manager Workspace"
              className="h-44 sm:h-52 lg:h-64 w-auto object-contain drop-shadow-md select-none"
            />
          </div>

          {/* Background subtle radial glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* Active Announcement Alert Banner for Branch Manager */}
        {announcements.length > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Megaphone className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    Central Society Notice
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
              onClick={() => navigate('/branch-manager/announcements')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-teal-200/70 transition-all flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shadow-2xs flex-shrink-0"
            >
              <span>View Notice Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4 Branch Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Today's Vault Cash"
            value="₹24,80,000"
            subtitle="Verified in physical safe"
            icon={Landmark}
            trend="+₹2.8L Inflow today"
            trendType="up"
          />

          <StatCard
            title="Active Branch Loans"
            value="₹4.85 Cr"
            subtitle="240 Active Member Accounts"
            icon={CreditCard}
            badge="Recovery 98.4%"
          />

          <StatCard
            title="Pending Applications"
            value={pendingMembers.length.toString()}
            subtitle="Awaiting manager sign-off"
            icon={Clock}
            badge="Urgent Queue"
          />

          <StatCard
            title="Total Members"
            value={members.length.toString()}
            subtitle={`${branchName} Jurisdiction`}
            icon={Users}
            trend="+32 this month"
            trendType="up"
          />
        </div>

        <RecentTransactionsTable
          title="Daily Branch Cash &amp; Settlement Ledger"
          subtitle={`Real-time register for ${branchName}`}
          transactions={branchTransactions}
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
    </DashboardLayout>
  );
}