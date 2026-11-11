import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import {
  Landmark,
  CreditCard,
  Users,
  Clock,
  UserPlus,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Lock,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';

export default function BranchManagerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [memberSearch, setMemberSearch] = useState('');

  const [pendingApplications, setPendingApplications] = useState([
    {
      id: 'app-1',
      applicant: 'Kavitha R. Menon',
      folio: 'AFX-MEM-8902',
      type: 'Dairy Farm Infrastructure Loan',
      amount: '₹3,50,000',
      submitted: 'Today, 09:15 AM',
      riskScore: 'Low (Credit 780)',
      coSigner: 'Gopalakrishnan M.',
      village: 'Arimpoor'
    },
    {
      id: 'app-2',
      applicant: 'Praveen Narayanan',
      folio: 'AFX-MEM-7441',
      type: 'Agricultural Tractor Advance',
      amount: '₹6,00,000',
      submitted: 'Yesterday',
      riskScore: 'Normal (Co-sign ok)',
      coSigner: 'Sukumaran P.',
      village: 'Veluthur'
    },
    {
      id: 'app-3',
      applicant: 'Deepa V. Chandran',
      folio: 'NEW-APPL-1092',
      type: 'New Member Admission & Shareholder',
      amount: '₹10,000 Share',
      submitted: '09 Nov 2026',
      riskScore: 'KYC Verified',
      coSigner: 'Self / Farmer ID',
      village: 'Kunnathangadi'
    }
  ]);

  const demoMembers = [
    { folio: 'AFX-MEM-8842', name: 'Sidharth P.', village: 'Arimpoor', phone: '+91 94471 23451', shares: '250 Shares (₹25k)', status: 'Active', balance: '₹1,48,250' },
    { folio: 'AFX-MEM-8902', name: 'Kavitha R. Menon', village: 'Veluthur', phone: '+91 98462 88123', shares: '100 Shares (₹10k)', status: 'Active', balance: '₹84,100' },
    { folio: 'AFX-MEM-7441', name: 'Praveen Narayanan', village: 'Kunnathangadi', phone: '+91 97451 90212', shares: '500 Shares (₹50k)', status: 'Active', balance: '₹3,12,000' },
    { folio: 'AFX-MEM-6612', name: 'Suresh Babu K.', village: 'Arimpoor', phone: '+91 94951 11094', shares: '100 Shares (₹10k)', status: 'Active', balance: '₹42,500' },
    { folio: 'AFX-MEM-5510', name: 'Lakshmi Viswanathan', village: 'Thrissur Town', phone: '+91 94460 77312', shares: '250 Shares (₹25k)', status: 'Active', balance: '₹2,05,400' },
  ];

  const demoUser = {
    name: 'Ramesh K. Pillai',
    id: 'MGR-THRISSUR-01',
    avatarText: 'RP',
    branch: 'Thrissur Central Branch',
    location: 'Antony Master Square, Arimpoor',
  };

  const branchTransactions = [
    {
      id: 'btx-1',
      description: 'Member Daily Collection - Arimpoor Route #2',
      refNo: 'BTR-COL-88190',
      category: 'Field Deposit',
      date: 'Today, 11:30 AM',
      amount: '₹1,45,000',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'btx-2',
      description: 'Loan Disbursement: Kisan Equipment #9901',
      refNo: 'BTR-DIS-33011',
      category: 'Loan Disbursement',
      date: 'Today, 10:15 AM',
      amount: '₹4,00,000',
      type: 'debit',
      status: 'Approved'
    },
    {
      id: 'btx-3',
      description: 'Member Thrift Deposit Counter Cashier #1',
      refNo: 'BTR-CSH-44910',
      category: 'Counter Cash',
      date: 'Today, 09:45 AM',
      amount: '₹38,500',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'btx-4',
      description: 'Inter-Branch Settlement from Apex Society',
      refNo: 'BTR-SET-10023',
      category: 'Apex Transfer',
      date: 'Yesterday',
      amount: '₹12,00,000',
      type: 'credit',
      status: 'Completed'
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

  const filteredMembers = demoMembers.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.folio.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.village.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <DashboardLayout
      role="branch_manager"
      user={demoUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6 sm:space-y-8">
        
        {/* Top Branch Header Banner: WARM & LIGHT LUMINOUS THEME */}
        <div className="bg-gradient-to-r from-[#14b8a6] via-[#2dd4bf] to-[#5eead4] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/30">
              <Landmark className="w-3.5 h-3.5" />
              <span>Role: Branch Manager &bull; Branch Code: #BRA-KL-001 &bull; Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>Welcome, Branch Manager</span>
              <span className="inline-block text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-white/95 text-xs sm:text-sm mt-1 max-w-xl">
              Logged in as <strong className="text-white">{demoUser.name}</strong> ({demoUser.id}) &bull; {demoUser.branch}, {demoUser.location}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => handleOpenAction('new_member')}
              className="px-5 py-2.5 bg-white text-[#0f766e] hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Member</span>
            </button>
            <button
              onClick={() => handleOpenAction('disburse')}
              className="px-5 py-2.5 bg-white text-[#0f766e] hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Disburse Loan</span>
            </button>
            <button
              onClick={() => handleOpenAction('day_end')}
              className="px-5 py-2.5 bg-white text-[#0f766e] hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Day-End Close</span>
            </button>
          </div>

          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        </div>

        {/* ==============================================================
            TAB 1: OVERVIEW
           ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
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
                title="Pending Appraisals"
                value={pendingApplications.length.toString()}
                subtitle="Awaiting manager sign-off"
                icon={Clock}
                badge="Urgent Queue"
              />

              <StatCard
                title="Total Registered Members"
                value="1,840"
                subtitle="Thrissur Central Jurisdiction"
                icon={Users}
                trend="+32 this month"
                trendType="up"
              />
            </div>

            {/* Pending Loan Appraisals Review Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Member Applications &amp; Loan Appraisals Queue
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review KYC, co-signers, and authorize branch committee sanction
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0f766e] bg-teal-50 px-3 py-1 rounded-full border border-teal-200/50">
                  {pendingApplications.length} Awaiting Verification
                </span>
              </div>

              {pendingApplications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  All branch member applications have been reviewed!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingApplications.map((app) => (
                    <div key={app.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">{app.applicant}</span>
                          <span className="text-xs text-slate-400 font-mono">({app.folio})</span>
                          <span className="text-[11px] font-bold text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">{app.riskScore}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{app.type}</p>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Co-Signer: {app.coSigner} &bull; Village: {app.village} &bull; Submitted: {app.submitted}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Sanction Value</p>
                          <p className="text-base sm:text-lg font-black text-slate-900">{app.amount}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-3.5 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <RecentTransactionsTable
              title="Daily Branch Cash &amp; Settlement Ledger"
              subtitle="Real-time register for Thrissur Central Branch"
              transactions={branchTransactions}
              onViewAll={() => setActiveTab('cash_counter')}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 2: MEMBER REGISTRY
           ============================================================== */}
        {activeTab === 'members' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Member Registry</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Total 1,840 admitted shareholders under Thrissur Central jurisdiction</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, folio, or village..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
                  />
                </div>
                <button
                  onClick={() => handleOpenAction('new_member')}
                  className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll Member</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Member Folio</th>
                      <th className="py-3.5 px-5">Full Name</th>
                      <th className="py-3.5 px-5">Locality / Village</th>
                      <th className="py-3.5 px-5">Phone Contact</th>
                      <th className="py-3.5 px-5">Share Capital</th>
                      <th className="py-3.5 px-5">Savings Balance</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                    {filteredMembers.map((m) => (
                      <tr key={m.folio} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-[#0d9488]">{m.folio}</td>
                        <td className="py-4 px-5 font-bold text-slate-900">{m.name}</td>
                        <td className="py-4 px-5 text-slate-500">{m.village}</td>
                        <td className="py-4 px-5 text-slate-600 font-mono">{m.phone}</td>
                        <td className="py-4 px-5 text-slate-700 font-medium">{m.shares}</td>
                        <td className="py-4 px-5 font-extrabold text-slate-900">{m.balance}</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <button
                            onClick={() => alert(`Opening complete ledger dossier for ${m.name} (${m.folio})`)}
                            className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-[#0d9488] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            View Folio
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: LOAN APPRAISALS
           ============================================================== */}
        {activeTab === 'loan_appraisals' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Credit Committee &amp; Appraisals</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Review agricultural credit risk, hypothecation status, and disburse sanctioned funds</p>
              </div>
              <button
                onClick={() => handleOpenAction('disburse')}
                className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <CreditCard className="w-4 h-4" />
                <span>Quick Disburse</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Appraisals Completed</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">48 Loans</h3>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">₹1.85 Cr Sanctioned this quarter</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Average Approval Time</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">24 Hours</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Doorstep inspection verified</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Branch NPA Ratio</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">0.8%</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Exemplary recovery track record</p>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900">Live Appraisal Queue</h4>
                <span className="text-xs font-bold text-[#0f766e] bg-teal-50 px-3 py-1 rounded-full border border-teal-200/50">{pendingApplications.length} Applications</span>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{app.applicant}</span>
                        <span className="text-xs font-mono text-slate-400">({app.folio})</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{app.type}</p>
                      <p className="text-xs text-slate-400 mt-1">Guarantor: {app.coSigner} &bull; Village: {app.village} &bull; Score: {app.riskScore}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Requested Amount</p>
                        <p className="text-lg font-black text-slate-900">{app.amount}</p>
                      </div>
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white text-xs font-bold rounded-xl hover:from-[#0d9488] hover:to-[#14b8a6] transition-all cursor-pointer shadow-xs"
                      >
                        Sanction Loan
                      </button>
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 4: CASH & DAILY LEDGER
           ============================================================== */}
        {activeTab === 'cash_counter' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Cash Counters &amp; Daily Ledger</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Live physical vault tally, counter cashier balances, and daily vouchers</p>
              </div>
              <button
                onClick={() => handleOpenAction('day_end')}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Day-End Settlement</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Main Vault Reserve</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">₹24,80,000</h3>
                <p className="text-xs text-slate-500 mt-1">Physically counted &bull; Dual custody locked</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cashier &amp; Manager Verified
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Counter Cashier #1 (Savings)</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">₹1,85,400</h3>
                <p className="text-xs text-slate-500 mt-1">Operator: S. Manjunath &bull; 42 Vouchers</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Last voucher: 11:42 AM (Deposit)
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Counter Cashier #2 (Disbursement)</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">₹3,20,000</h3>
                <p className="text-xs text-slate-500 mt-1">Operator: Preethi K. &bull; 14 Loans Disbursed</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Ready for day-end reconciliation
                </div>
              </div>
            </div>

            <RecentTransactionsTable
              title="Today's Counter Cash &amp; Digital Voucher Entries"
              subtitle="Real-time chronological log of all cash movements at branch counters"
              transactions={branchTransactions}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 5: DAY-END RECONCILIATION
           ============================================================== */}
        {activeTab === 'day_end' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Day-End Closing &amp; Vault Reconciliation</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Statutory verification required before locking branch operations at 5:00 PM</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Mandatory Closing Checklist</h3>

              <div className="space-y-3">
                {[
                  { title: 'Physical Currency Safe Balance Verification', status: 'Completed', note: '₹24,80,000 counted across 500, 200, and 100 denominations.' },
                  { title: 'Field Agent Mobile Collection Sync', status: 'Completed', note: 'All 4 field collection machines synchronized to central core server.' },
                  { title: 'UPI & Payment Gateway Inward Clearing', status: 'Completed', note: '₹1,45,000 net settled to society clearing account.' },
                  { title: 'Day-Book Cashier Voucher Ledger Signed', status: 'Pending Manager Signature', note: 'Awaiting Ramesh K. Pillai (Branch Manager) biometric token.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                      item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleOpenAction('day_end')}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Execute Day-End Lock &amp; Transmit to Apex</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 6: BRANCH AUDIT REPORTS
           ============================================================== */}
        {activeTab === 'branch_reports' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Audit Packs &amp; Returns</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Periodic inspection sheets, Demand-Collection-Balance (DCB) and recovery audits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'Monthly DCB (Demand Collection Balance) Register', desc: 'Detailed member-wise recovery and installment collection efficiency record.', date: 'October 2026' },
                { title: 'Quarterly Physical Vault & Gold Packet Audit', desc: 'Joint verification certified by Branch Manager and internal inspection auditor.', date: 'Q2 FY 25-26' },
                { title: 'Member Admission & KYC Compliance Roll', desc: 'Full register of new agricultural shareholders admitted in Thrissur Central.', date: 'YTD 2026' },
                { title: 'Statutory Branch Balance Sheet & P&L Statement', desc: 'Unaudited quarterly trial balance submitted to Apex Head Office.', date: 'Ending Sept 2026' }
              ].map((rep, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between gap-4 hover:border-[#2dd4bf] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
                      <span className="text-[11px] text-[#0f766e] font-semibold mt-2 block">{rep.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Exporting ${rep.title}...`)}
                    className="p-2.5 bg-slate-50 hover:bg-teal-50 text-[#0d9488] rounded-xl border border-slate-200 transition-colors cursor-pointer flex-shrink-0"
                    title="Export Audit Pack"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Interactive Modal */}
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
