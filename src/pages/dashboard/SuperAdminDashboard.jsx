import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactionsTable from '../../components/dashboard/RecentTransactionsTable';
import QuickActionModal from '../../components/dashboard/QuickActionModal';
import { BranchFormModal, BranchDetailModal } from '../../components/dashboard/BranchModals';
import * as branchService from '../../services/branchService';
import {
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Landmark,
  Search,
  Filter,
  Download,
  Settings,
  History,
  Key,
  Database,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  Crown,
  Store,
  Radio,
  Layers,
  User,
  BarChart3,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Power,
  Eye,
  AlertCircle
} from 'lucide-react';
import { SOCIETY_INFO } from '../../data/societyData';
import bankTechScene from '../../assets/AurumFX Cooperative Bank Technology Scene.png';
import branchMapScene from '../../assets/AurumFX Branch and Map Pin.png';
import adminOrgScene from '../../assets/Connected Organization Map Illustration.png';
import memberRegistryScene from '../../assets/Membership Registry Illustration.png';

const DEFAULT_BRANCHES = [
  {
    id: 1,
    name: 'Thrissur Central (Head Branch)',
    code: 'BR-KL-001',
    state: 'Kerala',
    manager: 'Ramesh K. Pillai',
    phone: '+91 751 010 4000',
    email: 'thrissur@aurumfx.coop',
    address: 'Antony Master Square, Arimpoor, Thrissur',
    deposits: '₹14.20 Cr',
    loans: '₹12.10 Cr',
    members: '3,840',
    recoveryRate: '99.2%',
    isActive: true,
  },
  {
    id: 2,
    name: 'Palakkad Agro Valley Branch',
    code: 'BR-KL-002',
    state: 'Kerala',
    manager: 'Sunitha M. Nair',
    phone: '+91 94471 88012',
    email: 'palakkad@aurumfx.coop',
    address: 'Near Agrarian Market, Chittur, Palakkad',
    deposits: '₹8.40 Cr',
    loans: '₹7.65 Cr',
    members: '2,650',
    recoveryRate: '98.5%',
    isActive: true,
  },
  {
    id: 3,
    name: 'Ernakulam Coastal Co-op Center',
    code: 'BR-KL-003',
    state: 'Kerala',
    manager: 'George Varghese',
    phone: '+91 98470 55120',
    email: 'ernakulam@aurumfx.coop',
    address: 'Vyttila Hub Road, Kochi, Ernakulam',
    deposits: '₹9.80 Cr',
    loans: '₹8.20 Cr',
    members: '3,110',
    recoveryRate: '98.8%',
    isActive: true,
  },
  {
    id: 4,
    name: 'Wayanad High-Range Spices Unit',
    code: 'BR-KL-004',
    state: 'Kerala',
    manager: 'Haridas K.',
    phone: '+91 94950 33110',
    email: 'wayanad@aurumfx.coop',
    address: 'Kalpetta Main Junction, Wayanad',
    deposits: '₹5.50 Cr',
    loans: '₹4.90 Cr',
    members: '2,420',
    recoveryRate: '97.9%',
    isActive: true,
  },
  {
    id: 5,
    name: 'Coimbatore Inter-State Agro Desk',
    code: 'BR-TN-001',
    state: 'Tamil Nadu',
    manager: 'Murugan S.',
    phone: '+91 98421 99014',
    email: 'coimbatore@aurumfx.coop',
    address: 'Pollachi Road, Coimbatore',
    deposits: '₹4.90 Cr',
    loans: '₹3.65 Cr',
    members: '2,260',
    recoveryRate: '99.0%',
    isActive: true,
  }
];

function normalizeBranch(b) {
  const rawId = b.branch_id ?? b.id;
  const isActive = b.is_active !== undefined
    ? Boolean(b.is_active)
    : (b.isActive !== undefined ? Boolean(b.isActive) : true);

  return {
    id: rawId ? `br-${rawId}` : `br-${Math.random()}`,
    rawId: rawId,
    name: b.name || b.branch_name || 'Unnamed Branch',
    city: b.city || '',
    state: b.state || 'Kerala',
    code: b.code || b.branch_code || (rawId ? `BR-00${rawId}` : 'BR-NEW'),
    manager: b.manager_name || b.manager || (b.city ? `${b.city} Branch Head` : 'Branch Head'),
    phone: b.contact_number || b.phone || 'N/A',
    contact_number: b.contact_number || b.phone || '',
    email: b.email || '',
    address: b.address || (b.city ? `${b.city}, ${b.state}` : 'Address not specified'),
    deposits: b.deposits || (b.total_deposits ? `₹${b.total_deposits} Cr` : '₹2.50 Cr'),
    loans: b.loans || (b.disbursed_loans ? `₹${b.disbursed_loans} Cr` : '₹1.80 Cr'),
    members: b.members ? String(b.members) : (b.total_members ? String(b.total_members) : '1,200'),
    recoveryRate: b.recovery_rate ? `${b.recovery_rate}%` : (b.recoveryRate || '99.0%'),
    isActive: isActive,
    status: isActive ? 'Optimal' : 'Offline'
  };
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [branchSearch, setBranchSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Live branches state connected to API
  const [branches, setBranches] = useState(() => DEFAULT_BRANCHES.map(normalizeBranch));
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Branch CRUD Modals state
  const [branchModal, setBranchModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
    isSubmitting: false,
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    branch: null,
    isLoading: false,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBranches = async () => {
    setIsLoadingBranches(true);
    setBranchError(null);
    try {
      const data = await branchService.getBranches();
      if (Array.isArray(data) && data.length > 0) {
        setBranches(data.map(normalizeBranch));
      }
    } catch (err) {
      console.warn('API getBranches notice:', err.message);
      // Keep existing branches if network fails
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenCreateBranch = () => {
    setBranchModal({
      isOpen: true,
      mode: 'create',
      data: null,
      isSubmitting: false
    });
  };

  const handleOpenEditBranch = (br) => {
    setBranchModal({
      isOpen: true,
      mode: 'edit',
      data: br,
      isSubmitting: false
    });
  };

  const handleSaveBranch = async (formData) => {
    setBranchModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        contact_number: formData.contact_number,
      };

      if (branchModal.mode === 'create') {
        await branchService.createBranch(payload);
        showToast(`Branch "${formData.name}" chartered successfully!`);
        await fetchBranches();
      } else {
        const branchId = branchModal.data.rawId || branchModal.data.id;
        await branchService.updateBranch(branchId, payload);
        showToast(`Branch "${formData.name}" updated successfully!`);
        await fetchBranches();
      }
      setBranchModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
    } catch (err) {
      console.error('Save branch error:', err);
      // Optimistic fallback for frontend testing when backend is offline
      if (branchModal.mode === 'create') {
        const newBranch = normalizeBranch({
          id: Date.now(),
          name: formData.name,
          city: formData.city,
          state: formData.state,
          address: formData.address,
          contact_number: formData.contact_number,
          phone: formData.contact_number,
          is_active: true
        });
        setBranches(prev => [newBranch, ...prev]);
        showToast(`Branch "${formData.name}" chartered.`);
      } else {
        setBranches(prev => prev.map(b => (b.id === branchModal.data.id ? { ...b, ...formData, phone: formData.contact_number } : b)));
        showToast(`Branch "${formData.name}" updated.`);
      }
      setBranchModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false });
    }
  };

  const handleToggleStatus = async (br) => {
    const newStatus = !br.isActive;
    setBranches(prev =>
      prev.map(item =>
        item.id === br.id
          ? { ...item, isActive: newStatus, status: newStatus ? 'Optimal' : 'Offline' }
          : item
      )
    );

    try {
      const branchId = br.rawId || br.id;
      await branchService.changeBranchStatus(branchId, newStatus);
      showToast(`Branch "${br.name}" is now ${newStatus ? 'Online' : 'Offline'}`);
    } catch (err) {
      console.warn('Status patch notice:', err.message);
      showToast(`Branch "${br.name}" status updated to ${newStatus ? 'Online' : 'Offline'}`);
    }
  };

  const handleDeleteBranch = async (br) => {
    if (!window.confirm(`Are you sure you want to decommission and delete "${br.name}"?`)) return;

    setBranches(prev => prev.filter(item => item.id !== br.id));
    try {
      const branchId = br.rawId || br.id;
      await branchService.deleteBranch(branchId);
      showToast(`Branch "${br.name}" deleted.`);
    } catch (err) {
      console.warn('Delete notice:', err.message);
      showToast(`Branch "${br.name}" deleted.`);
    }
  };

  const handleViewBranchDetails = async (br) => {
    setDetailModal({ isOpen: true, branch: br, isLoading: true });
    try {
      const branchId = br.rawId || br.id;
      const liveData = await branchService.getBranch(branchId);
      setDetailModal({ isOpen: true, branch: normalizeBranch(liveData), isLoading: false });
    } catch (err) {
      console.warn('Get branch detail notice:', err.message);
      setDetailModal({ isOpen: true, branch: br, isLoading: false });
    }
  };

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('superadmin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = {
    name: storedUser?.name || storedUser?.full_name || storedUser?.username || 'Ramjith Vazayil',
    id: storedUser?.id ? `SUPER-ADMIN-${storedUser.id}` : 'SUPER-ADMIN-APEX',
    avatarText: (storedUser?.name || storedUser?.username || 'RV').substring(0, 2).toUpperCase(),
    role: storedUser?.role || 'Apex Society Authority / Managing Director',
    office: storedUser?.office || 'Head Office - Antony Master Square, Thrissur',
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

  const branchAdmins = [
    {
      id: 'ADM-KL-001',
      name: 'Ramesh K. Pillai',
      branch: 'Thrissur Central (Head Branch)',
      role: 'Branch Manager / Admin',
      email: 'ramesh.pillai@aurumfx.coop',
      phone: '+91 751 010 4000',
      status: 'Active',
      lastLogin: 'Today, 09:15 AM',
      sanctionLimit: '₹5,00,000'
    },
    {
      id: 'ADM-KL-002',
      name: 'Sunitha M. Nair',
      branch: 'Palakkad Agro Valley Branch',
      role: 'Branch Manager / Admin',
      email: 'sunitha.nair@aurumfx.coop',
      phone: '+91 94471 88012',
      status: 'Active',
      lastLogin: 'Today, 08:45 AM',
      sanctionLimit: '₹3,50,000'
    },
    {
      id: 'ADM-KL-003',
      name: 'George Varghese',
      branch: 'Ernakulam Coastal Co-op Center',
      role: 'Branch Manager / Admin',
      email: 'george.v@aurumfx.coop',
      phone: '+91 98470 55120',
      status: 'Active',
      lastLogin: 'Yesterday, 05:10 PM',
      sanctionLimit: '₹5,00,000'
    },
    {
      id: 'ADM-KL-004',
      name: 'Haridas K.',
      branch: 'Wayanad High-Range Spices Unit',
      role: 'Branch Manager / Admin',
      email: 'haridas.k@aurumfx.coop',
      phone: '+91 94950 33110',
      status: 'Active',
      lastLogin: 'Today, 10:02 AM',
      sanctionLimit: '₹2,50,000'
    },
    {
      id: 'ADM-TN-001',
      name: 'Murugan S.',
      branch: 'Coimbatore Inter-State Agro Desk',
      role: 'Branch Manager / Admin',
      email: 'murugan.s@aurumfx.coop',
      phone: '+91 98421 99014',
      status: 'Active',
      lastLogin: 'Yesterday, 04:30 PM',
      sanctionLimit: '₹3,00,000'
    }
  ];

  const masterMembers = [
    { folio: 'AFX-MEM-8842', name: 'Sidharth P.', branch: 'Thrissur Central', shares: '250 Shares', balance: '₹1,48,250', village: 'Arimpoor, Thrissur', phone: '+91 98460 11234', kyc: 'Verified', status: 'Active' },
    { folio: 'AFX-MEM-8843', name: 'Lakshmi Narayanan', branch: 'Thrissur Central', shares: '100 Shares', balance: '₹42,500', village: 'Anthikad, Thrissur', phone: '+91 98472 99881', kyc: 'Verified', status: 'Active' },
    { folio: 'AFX-MEM-8844', name: 'Muhammed Basheer', branch: 'Palakkad Agro Valley', shares: '500 Shares', balance: '₹3,80,000', village: 'Chittur, Palakkad', phone: '+91 94471 22334', kyc: 'Verified', status: 'Active' },
    { folio: 'AFX-MEM-8845', name: 'Kavitha R.', branch: 'Ernakulam Coastal', shares: '200 Shares', balance: '₹95,000', village: 'Vyttila, Kochi', phone: '+91 97450 88123', kyc: 'Verified', status: 'Active' },
    { folio: 'AFX-MEM-8846', name: 'Devan Namboodiri', branch: 'Wayanad High-Range', shares: '300 Shares', balance: '₹2,10,000', village: 'Kalpetta, Wayanad', phone: '+91 94950 44556', kyc: 'Verified', status: 'Active' },
    { folio: 'AFX-MEM-8847', name: 'Subramanian V.', branch: 'Coimbatore Agro Desk', shares: '150 Shares', balance: '₹68,400', village: 'Pollachi, Coimbatore', phone: '+91 98421 77889', kyc: 'Verified', status: 'Active' }
  ];

  const handleOpenAction = (type) => {
    if (type === 'new_branch') {
      setModalConfig({
        isOpen: true,
        title: 'Charter New Society Branch',
        description: 'Provision a new multi-state cooperative branch unit and assign branch manager.',
        actionLabel: 'Charter Branch',
        fields: [
          { name: 'branchName', label: 'Branch Name', placeholder: 'e.g. Kozhikode North Agro Hub' },
          { name: 'state', label: 'State Jurisdiction', type: 'select', options: ['Kerala', 'Tamil Nadu', 'Karnataka'] },
          { name: 'managerName', label: 'Designated Branch Manager', placeholder: 'e.g. Vinod Rajan' },
          { name: 'initialReserve', label: 'Initial Reserve Allocation (₹)', type: 'number', placeholder: 'e.g. 5000000' }
        ]
      });
    } else if (type === 'new_admin') {
      setModalConfig({
        isOpen: true,
        title: 'Provision Branch Admin / Manager',
        description: 'Assign branch admin credentials and configure credit sanction limits.',
        actionLabel: 'Create Branch Admin',
        fields: [
          { name: 'name', label: 'Full Admin Name', placeholder: 'e.g. Anand Sharma' },
          { name: 'email', label: 'Official Society Email', placeholder: 'e.g. anand.s@aurumfx.coop' },
          { name: 'branch', label: 'Assigned Branch', type: 'select', options: ['Thrissur Central', 'Palakkad Agro Valley', 'Ernakulam Coastal', 'Wayanad High-Range', 'Coimbatore Agro Desk'] },
          { name: 'sanctionLimit', label: 'Loan Approval Authority Limit (₹)', type: 'number', placeholder: 'e.g. 500000' }
        ]
      });
    } else if (type === 'audit_report') {
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

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.manager.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.state.toLowerCase().includes(branchSearch.toLowerCase()) ||
    (b.code && b.code.toLowerCase().includes(branchSearch.toLowerCase()))
  );

  const filteredAdmins = branchAdmins.filter(a =>
    a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.branch.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.id.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const filteredMembers = masterMembers.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.folio.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.branch.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.village.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <DashboardLayout
      role="super_admin"
      user={currentUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6 sm:space-y-8">

        {/* ==============================================================
            TAB 1: OVERVIEW (DASHBOARD)
           ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Top Apex Super Admin Banner: Custom 3D Tech Scene Layout */}
            <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
              
              {/* Left Column: Role badge, Headline with accent bar, Subtitle, 3 Micro-pills */}
              <div className="relative z-10 flex-1 max-w-2xl">
                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
                  <Crown className="w-3.5 h-3.5 text-[#00b4a7]" />
                  <span>Role: Super Admin &bull; Multi-State Apex Central Authority</span>
                </div>

                {/* Headline with Vertical Teal Accent Bar */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <span>Welcome, Super Admin</span>
                    <span className="inline-block text-2xl sm:text-3xl">👋</span>
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
                  You are managing the Aurumfx Multi State Agro Co-operative Society Limited<br className="hidden sm:inline" />
                  (Head Office &ndash; Antony Master Square, Thrissur)
                </p>

                {/* 3 Feature Pills at the bottom */}
                <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/80 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
                  {/* Feature 1 */}
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

                  {/* Feature 2 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Consolidated Control</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Deposits &bull; Loans &bull; Members</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 3 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Statutory &amp; Compliance</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Audit &bull; Reports &bull; Governance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: 3D Technology Scene */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src={bankTechScene}
                  alt="AurumFX Technology Scene"
                  className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
                />
              </div>

              {/* Soft background light decorative glow on the right corner */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
            </div>
            {/* 4 Multi-State Consolidated Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Consolidated Deposits"
                value="₹42.8 Cr"
                subtitle="Across all member folios"
                icon={Landmark}
                trend="+14.2% YoY Growth"
                trendType="up"
              />

              <StatCard
                title="Total Loan Portfolio"
                value="₹36.5 Cr"
                subtitle="Agrarian, MSME &amp; Gold Credit"
                icon={TrendingUp}
                badge="98.8% Performing"
              />

              <StatCard
                title="Total Active Members"
                value="14,280"
                subtitle="Registered cooperative members"
                icon={Users}
                trend="+410 this month"
                trendType="up"
              />

              <StatCard
                title="Operating Branches"
                value="8 Branches"
                subtitle="Kerala, Tamil Nadu &amp; Karnataka"
                icon={Building2}
                badge="100% Operational"
              />
            </div>

            {/* Branch Operations & Performance Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Multi-State Branch Network Performance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Central real-time monitoring of deposits, lending ratios, and recovery metrics
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateBranch}
                  className="text-xs font-bold text-[#0d9488] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  + Add Operating Branch
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-5">Branch Name &amp; Hub</th>
                      <th className="py-3.5 px-5">Branch Manager</th>
                      <th className="py-3.5 px-5">Deposits</th>
                      <th className="py-3.5 px-5">Disbursed Loans</th>
                      <th className="py-3.5 px-5">Members</th>
                      <th className="py-3.5 px-5">Recovery Rate</th>
                      <th className="py-3.5 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold flex-shrink-0">
                              <Building2 className="w-4 h-4 stroke-[2]" />
                            </div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{branch.name}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-xs font-medium text-slate-600">
                          {branch.manager}
                        </td>

                        <td className="py-4 px-5 text-xs font-extrabold text-slate-900">
                          {branch.deposits}
                        </td>

                        <td className="py-4 px-5 text-xs font-extrabold text-[#0d9488]">
                          {branch.loans}
                        </td>

                        <td className="py-4 px-5 text-xs text-slate-600 font-medium">
                          {branch.members}
                        </td>

                        <td className="py-4 px-5 text-xs">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {branch.recoveryRate}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0f766e] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d9488]" />
                            {branch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <RecentTransactionsTable
              title="Apex Central Society Ledger &amp; Inter-Branch Clearing"
              subtitle="Statutory allocations, apex refinance facilities, and reserve balances"
              transactions={societyLedger}
              onViewAll={() => setActiveTab('audit_logs')}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 2: MULTI-STATE BRANCHES
           ============================================================== */}
        {activeTab === 'branches' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Branches Banner: Custom Matching Banner with 3D Branch Scene */}
            <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
              
              <div className="relative z-10 flex-1 max-w-2xl">
                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
                  <Store className="w-3.5 h-3.5 text-[#00b4a7]" />
                  <span>Role: Super Admin &bull; Multi-State Branch Network Control</span>
                </div>

                {/* Headline with Vertical Teal Accent Bar */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <span>Multi-State Branch Network</span>
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#00b4a7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
                  Central real-time oversight of operating branches across Kerala, Tamil Nadu, and regional expansion hubs with unified performance control.
                </p>

                {/* 3 Feature Pills */}
                <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
                  {/* Feature 1 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{branches.length} Operating Branches</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Kerala &bull; TN &bull; Karnataka</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 2 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <Radio className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {branches.filter(b => b.isActive).length === branches.length
                          ? '100% Operational'
                          : `${Math.round((branches.filter(b => b.isActive).length / (branches.length || 1)) * 100)}% Operational`}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">Active &amp; Reconciled</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 3 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <Layers className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">₹42.8 Cr Reserves</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Branch Liquidity Pool</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: 3D Branch Scene with Folded Map & Map Pins */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src={branchMapScene}
                  alt="AurumFX Multi-State Branch Network and Map Pin"
                  className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
                />
              </div>

              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
            </div>

            {/* Search Filter Header with Charter Action & API Sync */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Branch Network Directory</h3>
                  <p className="text-xs text-slate-500">Filter operational branches by name, location or jurisdiction</p>
                </div>
                <button
                  onClick={fetchBranches}
                  disabled={isLoadingBranches}
                  title="Sync branches from API"
                  className="p-2 text-slate-400 hover:text-[#00b4a7] hover:bg-teal-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBranches ? 'animate-spin text-[#00b4a7]' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
                  />
                </div>
                <button
                  onClick={handleOpenCreateBranch}
                  className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Branch</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((br) => (
                <div key={br.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-[#2dd4bf] transition-all group">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                        {br.state} Jurisdiction
                      </span>
                      {/* Status Toggle Button (PATCH /superadmin/branches/{id}/status) */}
                      <button
                        onClick={() => handleToggleStatus(br)}
                        title="Click to toggle Online / Offline status"
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                          br.isActive
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{br.isActive ? 'Online' : 'Offline'}</span>
                      </button>
                    </div>

                    <div className="flex items-start justify-between mt-3 gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0f766e] transition-colors">{br.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{br.address}</span>
                        </p>
                      </div>

                      {/* Edit (PUT) & Delete (DELETE) actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenEditBranch(br)}
                          title="Edit Branch (PUT)"
                          className="p-1.5 text-slate-400 hover:text-[#00b4a7] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(br)}
                          title="Delete Branch (DELETE)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Branch Manager:</span>
                        <span className="font-bold text-slate-800">{br.manager}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total Deposits:</span>
                        <span className="font-extrabold text-slate-900">{br.deposits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Disbursed Credit:</span>
                        <span className="font-extrabold text-[#0d9488]">{br.loans}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Recovery Rate:</span>
                        <span className="font-bold text-emerald-700">{br.recoveryRate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{br.phone}</span>
                    {/* View Details (GET /superadmin/branches/{id}) */}
                    <button
                      onClick={() => handleViewBranchDetails(br)}
                      className="font-bold text-[#0d9488] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Audit View</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: BRANCH ADMIN
           ============================================================== */}
        {activeTab === 'branch_admins' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Branch Admins Banner: Custom Matching Banner with Connected Org Scene */}
            <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
              
              <div className="relative z-10 flex-1 max-w-2xl">
                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
                  <UserCheck className="w-3.5 h-3.5 text-[#00b4a7]" />
                  <span>Role: Super Admin &bull; Branch Management &amp; Administration</span>
                </div>

                {/* Headline with Vertical Teal Accent Bar */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Branch Administrators &amp; Managers
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
                  Manage branch administrators, assign access, roles, monitor branch operations, and ensure secure compliance across all operating regions.
                </p>

                {/* 3 Feature Pills */}
                <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
                  {/* Feature 1 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Branch Admins</p>
                      <p className="text-[10px] text-slate-500 leading-tight">User Access &amp; Roles</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 2 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Performance</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Branch-wise Monitoring</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 3 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Secure Control</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Permissions &amp; Compliance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: 3D Connected Org Scene Illustration */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src={adminOrgScene}
                  alt="AurumFX Branch Management and Administration"
                  className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
                />
              </div>

              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
            </div>

            {/* Search Filter Header with Add Branch Admin Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Branch Administrative Officers</h3>
                <p className="text-xs text-slate-500">Filter appointed managers by name, branch unit, or staff ID</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search admin by name, ID, or branch..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
                  />
                </div>
                <button
                  onClick={() => handleOpenAction('new_admin')}
                  className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Branch Admin</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase">Active Branch Admins</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{branchAdmins.length} Appointed</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">100% Branch Coverage</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-emerald-600 uppercase">2FA &amp; Security Status</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">100% Enforced</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Biometric + IP-Lock active</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-purple-600 uppercase">Highest Sanction Limit</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹5,00,000</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Head Branch Thrissur</p>
              </div>
            </div>

            {/* Branch Admins Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-5">Admin ID &amp; Name</th>
                      <th className="py-3.5 px-5">Assigned Branch</th>
                      <th className="py-3.5 px-5">Official Email &amp; Contact</th>
                      <th className="py-3.5 px-5">Sanction Limit</th>
                      <th className="py-3.5 px-5">Last Active</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                    {filteredAdmins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold flex-shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{adm.name}</p>
                              <span className="text-xs text-slate-400 font-mono">{adm.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-medium text-slate-800">
                          {adm.branch}
                        </td>

                        <td className="py-4 px-5">
                          <p className="text-slate-800 font-medium">{adm.email}</p>
                          <span className="text-slate-400 font-mono text-xs">{adm.phone}</span>
                        </td>

                        <td className="py-4 px-5 font-extrabold text-slate-900">
                          {adm.sanctionLimit}
                        </td>

                        <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                          {adm.lastLogin}
                        </td>

                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {adm.status}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <button
                            onClick={() => alert(`Configuring role privileges for ${adm.name} (${adm.id})`)}
                            className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-[#0d9488] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Permissions
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
            TAB 4: VIEW MEMBERS (MASTER MEMBER BASE)
           ============================================================== */}
        {activeTab === 'member_base' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* View Members Banner: Custom Matching Banner with 3D Membership Scene */}
            <div className="bg-gradient-to-r from-[#e3faf5] via-[#ecfcf8] to-[#d4f6ef] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/60 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
              
              <div className="relative z-10 flex-1 max-w-2xl">
                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold mb-3 border border-teal-200/60 shadow-2xs text-[#0f766e]">
                  <Users className="w-3.5 h-3.5 text-[#00b4a7]" />
                  <span>Role: Super Admin &bull; Member Management &amp; Registration</span>
                </div>

                {/* Headline with Vertical Teal Accent Bar */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <span>Society Registered Members</span>
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#6366f1] stroke-[2.2]" />
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
                  Oversee all registered society members, verify documentation, manage member status, and monitor overall membership growth and engagement.
                </p>

                {/* 3 Feature Pills */}
                <div className="mt-5 inline-flex flex-wrap items-center gap-3 sm:gap-6 bg-white/95 backdrop-blur-xs border border-teal-100/90 rounded-2xl p-2.5 px-4 shadow-2xs">
                  {/* Feature 1 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">14,280 Members</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Total Registered</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 2 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">98.9% Verified</p>
                      <p className="text-[10px] text-slate-500 leading-tight">KYC &amp; Documentation</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Feature 3 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00b4a7] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#00b4a7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="14" x="3" y="5" rx="2" />
                        <circle cx="8" cy="11" r="2" />
                        <path d="M14 9h3" />
                        <path d="M14 13h3" />
                        <path d="M6 16c0-1.1.9-2 2-2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Active Membership</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Ongoing &amp; Up to Date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: 3D Membership Registry Scene Illustration */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src={memberRegistryScene}
                  alt="AurumFX Member Management and Registration"
                  className="h-40 sm:h-48 md:h-52 lg:h-56 w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300"
                />
              </div>

              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-200/20 blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase">Kerala Jurisdiction</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">10,850</h3>
                <p className="text-xs text-slate-500 mt-1">76% of total membership &bull; 6 Branches</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase">Tamil Nadu Jurisdiction</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">2,890</h3>
                <p className="text-xs text-slate-500 mt-1">20% of total membership &bull; Coimbatore Hub</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-[#0f766e] uppercase">Karnataka Jurisdiction</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">540</h3>
                <p className="text-xs text-slate-500 mt-1">4% of total membership &bull; Frontier Desk</p>
              </div>
            </div>

            {/* View Members Search & Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">All Society Registered Members</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Central folio records across Kerala, Tamil Nadu &amp; Karnataka</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, folio, or branch..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2dd4bf] shadow-xs"
                    />
                  </div>
                  <button
                    onClick={() => alert('Downloading master certified member roll...')}
                    className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Roll</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-5">Member Folio</th>
                      <th className="py-3.5 px-5">Full Name</th>
                      <th className="py-3.5 px-5">Assigned Branch</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Shareholding</th>
                      <th className="py-3.5 px-5">Savings Balance</th>
                      <th className="py-3.5 px-5">KYC Status</th>
                      <th className="py-3.5 px-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                    {filteredMembers.map((m) => (
                      <tr key={m.folio} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-[#0d9488]">{m.folio}</td>
                        <td className="py-4 px-5 font-bold text-slate-900">{m.name}</td>
                        <td className="py-4 px-5 font-medium text-slate-700">{m.branch}</td>
                        <td className="py-4 px-5 text-slate-500">{m.village}</td>
                        <td className="py-4 px-5 text-slate-800 font-medium">{m.shares}</td>
                        <td className="py-4 px-5 font-extrabold text-slate-900">{m.balance}</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {m.kyc}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <button
                            onClick={() => alert(`Inspecting central folio record for ${m.name} (${m.folio})`)}
                            className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-[#0d9488] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Inspect
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
            TAB 5: CONSOLIDATED PORTFOLIO
           ============================================================== */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Consolidated Credit &amp; Deposit Portfolio</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Apex risk surveillance across ₹36.5 Cr active credit portfolio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Gross Performing Assets (Standard)</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">98.8%</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">₹36.06 Cr under regular amortization</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Gross NPA Ratio (Overdue &gt;90d)</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">1.2%</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Well within statutory benchmark of 3.0%</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase">Statutory Reserve Fund Balance</p>
                <h3 className="text-3xl font-black text-[#0d9488] mt-1">₹8.45 Cr</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Invested in approved cooperative gilt banks</p>
              </div>
            </div>

            {/* Product Breakdown Grid */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Lending Category Allocation</h3>
              <div className="space-y-4">
                {[
                  { name: 'Agricultural Crop, Machinery & Cattle Loans', share: '46%', amount: '₹16.79 Cr', color: 'bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf]' },
                  { name: 'Rural Enterprise & MSME Working Capital', share: '28%', amount: '₹10.22 Cr', color: 'bg-emerald-500' },
                  { name: 'Secured Member Gold Credit Facilities', share: '18%', amount: '₹6.57 Cr', color: 'bg-amber-400' },
                  { name: 'Member Thrift & Emergency Micro-Credits', share: '8%', amount: '₹2.92 Cr', color: 'bg-purple-500' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-800">{item.name}</span>
                      <span className="text-slate-600">{item.amount} ({item.share})</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.share }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 5: STATUTORY & COMPLIANCE
           ============================================================== */}
        {activeTab === 'statutory' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Statutory Regulatory Compliance &amp; Bye-Laws</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Multi-State Co-Operative Societies Act 2002 audit &amp; registrar submissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { title: 'Annual Statutory Audit Filing (Form I-V)', status: 'Approved & Filed', desc: 'Certified by statutory panel chartered accountants without qualification.' },
                { title: 'Central Registrar of Co-operative Societies (CRCS) Return', status: 'Submitted', desc: 'Annual multi-state return filed with Ministry of Cooperation, New Delhi.' },
                { title: '25% Net Surplus Statutory Reserve Allocation', status: 'Compliant', desc: 'Transferred ₹18,50,000 into locked society reserve securities.' },
                { title: 'Annual General Body Meeting (AGM) Resolution Roll', status: 'Adopted', desc: 'Dividend of 8.5% passed unanimously by voting member delegates.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {item.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2.5">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 6: CENTRAL AUDIT TRAILS
           ============================================================== */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Apex Immutable Audit Trails</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time security event tracking across all multi-state branches</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Event Timestamp</th>
                      <th className="py-3 px-4">Actor / Role</th>
                      <th className="py-3 px-4">Branch Hub</th>
                      <th className="py-3 px-4">Action Taken</th>
                      <th className="py-3 px-4">IP / Terminal</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">Today, 11:32:04</td>
                      <td className="py-3 px-4 font-bold text-slate-900">Ramesh K. Pillai (Branch Manager)</td>
                      <td className="py-3 px-4 text-slate-600">Thrissur Central</td>
                      <td className="py-3 px-4">Sanctioned Dairy Loan #SNC-8812 (₹3,50,000)</td>
                      <td className="py-3 px-4 font-mono text-slate-400">192.168.10.4</td>
                      <td className="py-3 px-4"><span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Authorized</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">Today, 10:14:19</td>
                      <td className="py-3 px-4 font-bold text-slate-900">S. Manjunath (Teller Counter)</td>
                      <td className="py-3 px-4 text-slate-600">Thrissur Central</td>
                      <td className="py-3 px-4">Cash Deposit Voucher Accepted (₹45,000)</td>
                      <td className="py-3 px-4 font-mono text-slate-400">192.168.10.8</td>
                      <td className="py-3 px-4"><span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Logged</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">Yesterday, 17:02:11</td>
                      <td className="py-3 px-4 font-bold text-slate-900">Sunitha M. Nair (Branch Manager)</td>
                      <td className="py-3 px-4 text-slate-600">Palakkad Hub</td>
                      <td className="py-3 px-4">Day-End Safe Balance Reconciliation Transmitted</td>
                      <td className="py-3 px-4 font-mono text-slate-400">192.168.12.2</td>
                      <td className="py-3 px-4"><span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Reconciled</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 7: SYSTEM SETTINGS
           ============================================================== */}
        {activeTab === 'system_settings' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Apex System Security &amp; Access Controls</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure role privileges, 2FA enforcement, and society core parameters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#0d9488]" />
                  <span>Administrative Security Policies</span>
                </h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Mandatory Biometric / 2FA for Branch Managers</span>
                    <span className="font-bold text-emerald-600">Enforced</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Single-Session IP Binding for Teller Terminals</span>
                    <span className="font-bold text-emerald-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Maximum Cash Voucher Limit Without Manager OTP</span>
                    <span className="font-bold text-slate-900">₹50,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#0d9488]" />
                  <span>Central Society Backup &amp; Health</span>
                </h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Continuous Geo-Redundant Replication</span>
                    <span className="font-bold text-emerald-600">Healthy (0 ms lag)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Last Cryptographic Snapshot</span>
                    <span className="font-bold text-slate-900">Today, 10:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Multi-State Core Network Uptime</span>
                    <span className="font-bold text-emerald-600">99.98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Interactive Quick Action Modal (Admins / Audit Reports) */}
      <QuickActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false })}
        title={modalConfig.title}
        description={modalConfig.description}
        fields={modalConfig.fields}
        actionLabel={modalConfig.actionLabel}
        onSuccess={() => {}}
      />

      {/* Branch Create (POST) & Edit (PUT) Modal */}
      <BranchFormModal
        isOpen={branchModal.isOpen}
        onClose={() => setBranchModal({ isOpen: false, mode: 'create', data: null, isSubmitting: false })}
        mode={branchModal.mode}
        initialData={branchModal.data}
        onSubmit={handleSaveBranch}
        isSubmitting={branchModal.isSubmitting}
      />

      {/* Branch Detail View (GET /superadmin/branches/{id}) Modal */}
      <BranchDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, branch: null, isLoading: false })}
        branch={detailModal.branch}
        isLoading={detailModal.isLoading}
        onEdit={handleOpenEditBranch}
        onDelete={handleDeleteBranch}
        onToggleStatus={handleToggleStatus}
      />

      {/* Floating API Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp backdrop-blur-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </DashboardLayout>
  );
}
