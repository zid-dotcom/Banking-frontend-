import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import * as branchService from '../../services/branchService';
import {
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Landmark,
  Crown,
  FileSpreadsheet
} from 'lucide-react';
import { SOCIETY_INFO } from '../../data/societyData';
import bankTechScene from '../../assets/AurumFX Cooperative Bank Technology Scene.png';

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
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

export default function SuperAdminDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab');

  // Handle legacy query param redirects to separate dedicated pages
  if (tab === 'branches') {
    return <Navigate to="/super-admin/branches" replace />;
  }
  if (tab === 'branch_admins' || tab === 'branch_admin') {
    return <Navigate to="/super-admin/branch-admins" replace />;
  }
  if (tab === 'staff_roles' || tab === 'staff-roles' || tab === 'roles' || tab === 'staff_role') {
    return <Navigate to="/super-admin/staff-roles" replace />;
  }
  if (tab === 'savings_schemes' || tab === 'savings-schemes' || tab === 'savings' || tab === 'savings_scheme') {
    return <Navigate to="/super-admin/savings-schemes" replace />;
  }
  if (tab === 'member_base' || tab === 'members') {
    return <Navigate to="/super-admin/members" replace />;
  }

  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const data = await branchService.getBranches();
        if (Array.isArray(data)) {
          setBranches(data);
        }
      } catch (err) {
        console.warn('API getBranches error in SuperAdminDashboard:', err.message);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('superadmin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = {
    name: storedUser?.name || storedUser?.full_name || 'Super Admin',
    id: storedUser?.id ? `SUPER-ADMIN-${storedUser.id}` : 'SUPER-ADMIN',
    avatarText: 'SA',
    role: 'Super Admin',
    roleTitle: 'Super Admin',
    office: storedUser?.office || 'Head Office - Apex Central Administration',
  };

  const societyLedger = [
    {
      id: 'sl-1',
      description: 'Central Statutory Reserve Transfer (25% Net Surplus)',
      refNo: 'APX-RES-202601',
      category: 'Statutory Allocation',
      date: 'Today, 08:30 AM',
      amount: '₹18,50,000',
      type: 'credit',
      status: 'Completed'
    },
    {
      id: 'sl-2',
      description: 'Apex Liquidity Injection to Wayanad High-Range Branch',
      refNo: 'APX-LIQ-99120',
      category: 'Branch Refinance',
      date: 'Yesterday',
      amount: '₹25,00,000',
      type: 'debit',
      status: 'Approved'
    },
    {
      id: 'sl-3',
      description: 'NABARD Agro Allied Refinance Facility Tranche #3',
      refNo: 'APX-NAB-44102',
      category: 'Institutional Credit',
      date: '08 Nov 2026',
      amount: '₹1,50,00,000',
      type: 'credit',
      status: 'Completed'
    }
  ];

  const handleOpenAction = (type) => {
    if (type === 'audit_report') {
      setModalConfig({
        isOpen: true,
        title: 'Generate Statutory Audit Pack',
        description: 'Export cooperative department compliance data and auditor ledger files.',
        actionLabel: 'Generate & Sign Report',
        fields: [
          { name: 'financialYear', label: 'Financial Period', type: 'select', options: ['FY 2026-27 (Q3 Ongoing)', 'FY 2025-26 (Audited Annual)', 'FY 2024-25 (Historical Archive)'] },
          { name: 'auditStandard', label: 'Filing Framework', type: 'select', options: ['Multi-State Co-Operative Societies Act 2002', 'State Registrar Statutory Returns', 'Internal Chartered Committee Audit'] }
        ]
      });
    }
  };

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab="overview"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Apex Super Admin Banner */}
        <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
              <Crown className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>Role: Super Admin &bull; Multi-State Apex Central Authority</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Welcome, Super Admin</span>
                <span className="inline-block text-2xl sm:text-3xl">👋</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              You are managing the Aurumfx Multi State Agro Co-operative Society Limited<br className="hidden sm:inline" />
              (Head Office &ndash; Antony Master Square, Thrissur)
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/80 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Central Oversight</p>
                  <p className="text-[10px] text-slate-500 leading-tight">All Branches</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Apex Administration</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Board &amp; Society Level</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Statutory Compliant</p>
                  <p className="text-[10px] text-slate-500 leading-tight">MSCS Act 2002</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <img
              src={bankTechScene}
              alt="AurumFX Apex Central Authority"
              className="h-44 sm:h-52 md:h-56 lg:h-60 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
            />
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
        </div>

        {/* 4 Apex Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Active Capital"
            value="₹142.85 Cr"
            change="+14.2% YoY growth"
            isPositive={true}
            icon={Landmark}
            description="Consolidated member equity and central statutory reserve pool"
          />
          <StatCard
            title="Statutory Reserve Ratio"
            value="28.4%"
            change="+2.1% buffer"
            isPositive={true}
            icon={ShieldCheck}
            description="Exceeds MSCS Act 25% statutory liquid asset requirement"
          />
          <StatCard
            title="Operating Branches"
            value={isLoadingBranches ? '...' : `${branches.length} Hubs`}
            change="100% Operational"
            isPositive={true}
            icon={Building2}
            description="Active branches across Kerala, Tamil Nadu, and Karnataka"
          />
          <StatCard
            title="Registered Member Base"
            value="14,280"
            change="+420 this month"
            isPositive={true}
            icon={Users}
            description="Active shareholding members across all branches"
          />
        </div>

        {/* Central Society Quick Actions Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Apex Administrative Commands</h3>
            <p className="text-xs text-slate-500">Perform central statutory filings and manage branch administrative access</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/super-admin/branches')}
              className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Branches</span>
            </button>
            <button
              onClick={() => navigate('/super-admin/branch-admins')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Users className="w-4 h-4 text-[#00b4a7]" />
              <span>Branch Admins</span>
            </button>
            <button
              onClick={() => handleOpenAction('audit_report')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Statutory Audit Pack</span>
            </button>
          </div>
        </div>

        {/* Central Society Ledger & Recent Transactions */}
        <RecentTransactionsTable
          title="Apex Central Society Ledger &amp; Inter-Branch Clearing"
          subtitle="Statutory allocations, apex refinance facilities, and reserve balances"
          transactions={societyLedger}
          onViewAll={() => {}}
        />

        {/* Operating Branches Quick Table Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch Network Snapshot</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live operating status across multi-state jurisdiction</p>
            </div>
            <button
              onClick={() => navigate('/super-admin/branches')}
              className="text-xs font-bold text-[#00b4a7] hover:underline flex items-center gap-1"
            >
              <span>View All Branches</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Branch Name</th>
                  <th className="py-3.5 px-5">City &amp; State</th>
                  <th className="py-3.5 px-5">Contact</th>
                  <th className="py-3.5 px-5">Created At</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                {branches.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">{b.name}</td>
                    <td className="py-4 px-5 text-slate-600">{b.city ? `${b.city}, ${b.state}` : b.state || 'N/A'}</td>
                    <td className="py-4 px-5 font-mono text-slate-600">{b.contact_number || 'N/A'}</td>
                    <td className="py-4 px-5 text-slate-600">{formatDateTime(b.created_at || b.opening_date)}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        b.is_active !== false ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {b.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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