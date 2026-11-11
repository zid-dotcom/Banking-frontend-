import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import {
  Wallet,
  CreditCard,
  Calendar,
  Award,
  Send,
  Download,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Printer,
  HelpCircle,
  PiggyBank
} from 'lucide-react';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [transactionFilter, setTransactionFilter] = useState('all');

  const demoUser = {
    name: 'Sidharth P.',
    id: 'Folio #AFX-MEM-8842',
    avatarText: 'SP',
    branch: 'Thrissur Central Branch',
    joined: '14 Jan 2024',
    category: 'Class A Agrarian Member',
  };

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
    },
    {
      id: 'tx-4',
      description: 'Kisan Tractor Loan Subsidy Credit',
      refNo: 'AFX-GOV-554199',
      category: 'Agro Subsidy',
      date: '15 Oct 2026',
      amount: '₹35,000',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'tx-5',
      description: 'Branch Counter Cash Withdrawal',
      refNo: 'AFX-CSH-110022',
      category: 'Counter Cash',
      date: '05 Oct 2026',
      amount: '₹8,000',
      type: 'debit',
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
    } else if (type === 'loan') {
      setModalConfig({
        isOpen: true,
        title: 'Apply for Member Loan',
        description: 'Submit an instant digital application to your branch manager.',
        actionLabel: 'Submit Loan Request',
        fields: [
          { name: 'loanType', label: 'Loan Scheme', type: 'select', options: ['Agricultural Equipment Loan', 'Dairy & Cattle Care Line', 'Gold Loan Advance', 'Member MSME Business Loan'] },
          { name: 'reqAmount', label: 'Requested Amount (₹)', type: 'number', placeholder: 'e.g. 150000' },
          { name: 'tenure', label: 'Tenure (Months)', type: 'select', options: ['12 Months', '24 Months', '36 Months', '48 Months'] }
        ]
      });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'credits') return t.type === 'credit';
    if (transactionFilter === 'debits') return t.type === 'debit';
    return true;
  });

  return (
    <DashboardLayout
      role="member"
      user={demoUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6 sm:space-y-8">
        
        {/* Top Banner Card: WARM & LIGHT LUMINOUS TEAL THEME */}
        <div className="bg-gradient-to-r from-[#14b8a6] via-[#2dd4bf] to-[#5eead4] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: Member &bull; Multi-State Folio Status: Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>Welcome, {demoUser.name.split(' ')[0]}</span>
              <span className="inline-block text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-white/95 text-xs sm:text-sm mt-1 max-w-xl">
              Logged in as <strong className="text-white">{demoUser.name}</strong> &bull; Folio: <strong className="text-white">{demoUser.id}</strong> &bull; Branch: <strong className="text-white">{demoUser.branch}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => handleOpenAction('deposit')}
              className="px-5 py-2.5 bg-white text-[#0f766e] hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>Add Deposit</span>
            </button>
            <button
              onClick={() => handleOpenAction('loan')}
              className="px-5 py-2.5 bg-white text-[#0f766e] hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Apply Loan</span>
            </button>
          </div>

          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        </div>

        {/* ==============================================================
            TAB 1: OVERVIEW
           ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* 4 Primary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Savings Balance"
                value="₹1,48,250"
                subtitle="Acc. #4401-8842-10"
                icon={Wallet}
                trend="+5.4% this month"
                trendType="up"
              />

              <StatCard
                title="Active Loan Principal"
                value="₹3,20,000"
                subtitle="Agro Dairy Equipment Loan"
                icon={CreditCard}
                badge="Repaying"
              />

              <StatCard
                title="Next Installment Due"
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
                      onClick={() => setActiveTab('shares')}
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
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-[#0d9488] flex-shrink-0" />
                  <span>Regulated under Multi-State Cooperative Society rules</span>
                </div>
              </div>
            </div>

            <RecentTransactionsTable
              title="Recent Member Transactions"
              subtitle="Your verified deposit and loan ledger transactions"
              transactions={transactions}
              onViewAll={() => setActiveTab('transactions')}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 2: SAVINGS & DEPOSITS
           ============================================================== */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Savings &amp; Term Deposit Accounts</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your active member folios, thrift funds, and term certificates</p>
              </div>
              <button
                onClick={() => handleOpenAction('deposit')}
                className="px-5 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <PiggyBank className="w-4 h-4" />
                <span>Open New Deposit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Primary Member Savings */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Primary Member Savings Account</h4>
                      <p className="text-xs text-slate-400 font-mono">Acc #4401-8842-10 &bull; Thrissur Central</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Active</span>
                </div>

                <div className="my-5">
                  <p className="text-xs text-slate-400">Available Balance</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">₹1,48,250.00</h3>
                  <p className="text-xs text-slate-500 mt-1">Cooperative Savings Interest: <strong>5.50% p.a.</strong> (Credited Quarterly)</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nominee Registered: <strong>Anitha P. (Spouse)</strong></span>
                  <button onClick={() => handleOpenAction('deposit')} className="font-bold text-[#0d9488] hover:underline cursor-pointer">
                    Deposit Money &rarr;
                  </button>
                </div>
              </div>

              {/* Card 2: Recurring Agrarian Thrift Deposit */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Monthly Agrarian Thrift Scheme</h4>
                      <p className="text-xs text-slate-400 font-mono">Plan: ₹5,000 / month &bull; 24-Month Lock</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0f766e] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50">Maturity 2027</span>
                </div>

                <div className="my-5">
                  <p className="text-xs text-slate-400">Accumulated Thrift Value</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">₹60,000.00</h3>
                  <p className="text-xs text-slate-500 mt-1">Thrift Yield: <strong>7.80% p.a.</strong> &bull; Total Target: ₹1,20,000</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Next Auto-Debit: <strong>05 Dec 2026</strong></span>
                  <button onClick={() => alert('Thrift certificate details downloaded')} className="font-bold text-[#0d9488] hover:underline cursor-pointer">
                    View Statement &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: MY LOANS & EMIs
           ============================================================== */}
        {activeTab === 'loans' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Loans &amp; Sanctioned Facilities</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Track active borrowings, installments, subsidies and amortization schedules</p>
              </div>
              <button
                onClick={() => handleOpenAction('loan')}
                className="px-5 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <CreditCard className="w-4 h-4" />
                <span>Apply for New Loan</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                    Loan Account #LN-AGR-2025-081
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Dairy Cattle &amp; Farm Automation Credit Scheme
                  </h3>
                  <p className="text-xs text-slate-500">Sanctioned Date: 12 Feb 2025 &bull; 36 Months Tenure &bull; Monthly EMI ₹12,450</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400">Current Outstanding Balance</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹3,20,000</h3>
                </div>
              </div>

              {/* Installment Repayment Schedule Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Installment #</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Principal + Interest</th>
                      <th className="py-3 px-4">Remaining Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">EMI #9 (Upcoming)</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">18 Nov 2026</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹12,450</td>
                      <td className="py-3.5 px-4 text-slate-600">₹3,07,550</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">Due in 7 Days</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button onClick={() => handleOpenAction('deposit')} className="px-3 py-1 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs">
                          Pay Now
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">EMI #8 (Paid)</td>
                      <td className="py-3.5 px-4 text-slate-500">18 Oct 2026</td>
                      <td className="py-3.5 px-4 text-slate-600">₹12,450</td>
                      <td className="py-3.5 px-4 text-slate-600">₹3,20,000</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">Voucher #9921</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">EMI #7 (Paid)</td>
                      <td className="py-3.5 px-4 text-slate-500">18 Sep 2026</td>
                      <td className="py-3.5 px-4 text-slate-600">₹12,450</td>
                      <td className="py-3.5 px-4 text-slate-600">₹3,32,450</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">Voucher #8814</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 4: PASSBOOK & HISTORY
           ============================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Member Passbook Ledger</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Official authenticated entry records for your society folio</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Printing official digital passbook...')}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#0d9488]" />
                  <span>Print Passbook</span>
                </button>
                <button
                  onClick={() => alert('Exporting signed PDF statement...')}
                  className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setTransactionFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  transactionFilter === 'all'
                    ? 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Entries ({transactions.length})
              </button>
              <button
                onClick={() => setTransactionFilter('credits')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  transactionFilter === 'credits'
                    ? 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Credits &amp; Deposits
              </button>
              <button
                onClick={() => setTransactionFilter('debits')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  transactionFilter === 'debits'
                    ? 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Withdrawals &amp; EMIs
              </button>
            </div>

            <RecentTransactionsTable
              title="Full Historical Passbook Ledger"
              subtitle="Showing verified audited entries for Folio #AFX-MEM-8842"
              transactions={filteredTransactions}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 5: SOCIETY SHARES & DIVIDEND
           ============================================================== */}
        {activeTab === 'shares' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Society Share Capital &amp; Voting Rights</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Your registered co-operative equity holding and dividend earnings record</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wider">Shareholder Folio</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">250 Shares</h3>
                <p className="text-xs text-slate-500 mt-1">Face Value: ₹100 per share</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Capital</span>
                  <span className="font-extrabold text-slate-900">₹25,000</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wider">Latest Dividend Rate</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">8.5% p.a.</h3>
                <p className="text-xs text-slate-500 mt-1">Approved at Annual General Body</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">FY 25-26 Payout</span>
                  <span className="font-extrabold text-emerald-600">+₹2,125 (Credited)</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wider">Member Class &amp; Voting</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Class A Member</h3>
                <p className="text-xs text-slate-500 mt-1">Full statutory voting franchise</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">AGM Status</span>
                  <span className="font-bold text-teal-800">Eligible to Vote</span>
                </div>
              </div>
            </div>

            {/* Share certificate details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Official Society Shareholding Certificate</h4>
                  <p className="text-xs text-slate-500">Certificate #CERT-AFX-2024-8842 &bull; Issued under society seal</p>
                </div>
              </div>
              <button
                onClick={() => alert('Downloading official stamped certificate...')}
                className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Download Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 6: TAX & STATEMENTS
           ============================================================== */}
        {activeTab === 'statements' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Tax &amp; Annual Financial Statements</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Official certificates for income tax e-filing and audited reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'Annual Account Statement (FY 2025-26)', desc: 'Complete breakdown of all savings deposits, withdrawals and interest accrued.', size: '420 KB PDF' },
                { title: 'Interest Certificate for IT Filing (FY 2025-26)', desc: 'Official certificate detailing 80TTA eligible cooperative savings interest.', size: '180 KB PDF' },
                { title: 'Loan Repayment & Principal Certificate', desc: 'Proof of principal and interest repayment for agricultural credit subsidy.', size: '240 KB PDF' },
                { title: 'Share Dividend Tax Deduction Certificate (Form 16A)', desc: 'Statutory dividend distribution statement certified by society auditor.', size: '195 KB PDF' }
              ].map((doc, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between gap-4 hover:border-[#2dd4bf] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.desc}</p>
                      <span className="text-[11px] text-slate-400 mt-2 block font-mono">{doc.size}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${doc.title}...`)}
                    className="p-2.5 bg-slate-50 hover:bg-teal-50 text-[#0d9488] rounded-xl border border-slate-200 transition-colors cursor-pointer flex-shrink-0"
                    title="Download Statement"
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
