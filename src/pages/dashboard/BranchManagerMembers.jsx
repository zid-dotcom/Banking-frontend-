import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import MemberDetailModal from '../../components/dashboard/MemberDetailModal';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  KeyRound,
  Unlock,
  Building2,
  User,
  MapPin,
  XCircle,
  Check,
  Filter,
  ShieldCheck
} from 'lucide-react';
import branchMemberRegistryIllustration from '../../assets/Branch Member Registry Illustration.png';
import {
  getBranchAdminMe,
  getBranchAdminMembers,
  reviewBranchAdminMember,
  changeBranchAdminMemberActive,
  resetBranchAdminMemberPassword,
  unlockBranchAdminMember
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

export default function BranchManagerMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  // Filters
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, member: null, reason: '' });
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, member: null, newPassword: '' });

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
      is_active: true
    };
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load branch admin profile
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

  // Fetch branch members
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranchAdminMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load branch members:', err);
      setError(err.message || 'Failed to load branch members.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  // Review (Approve / Reject) Member
  const handleReview = async (memberId, status, rejectionReason = null) => {
    setActionLoadingId(memberId);
    try {
      const updated = await reviewBranchAdminMember(memberId, {
        status,
        rejection_reason: rejectionReason
      });
      setSuccessPopup({
        title: status === 'approved' ? 'Application Approved!' : 'Application Rejected',
        message: `Member application #${memberId} was marked as ${status.toUpperCase()} successfully.`
      });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updated, status } : m));
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(prev => ({ ...prev, ...updated, status }));
      }
      setRejectModal({ isOpen: false, member: null, reason: '' });
    } catch (err) {
      setErrorPopup({
        title: 'Review Action Failed',
        message: err.message || 'Failed to update member status.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (member) => {
    setActionLoadingId(member.id);
    const targetState = !member.is_active;
    try {
      await changeBranchAdminMemberActive(member.id, targetState);
      setSuccessPopup({
        title: 'Status Updated',
        message: `Member ${member.full_name} is now ${targetState ? 'Active' : 'Inactive'}.`
      });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: targetState } : m));
    } catch (err) {
      setErrorPopup({
        title: 'Status Update Failed',
        message: err.message || 'Failed to update member status.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unlock Member
  const handleUnlock = async (member) => {
    setActionLoadingId(member.id);
    try {
      await unlockBranchAdminMember(member.id);
      setSuccessPopup({
        title: 'Account Unlocked!',
        message: `Member account ${member.full_name} (${member.member_code || member.id}) has been unlocked successfully.`
      });
    } catch (err) {
      setErrorPopup({
        title: 'Unlock Failed',
        message: err.message || 'Failed to unlock member account.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordModal.member) return;
    if (!passwordModal.newPassword || passwordModal.newPassword.length < 8) {
      setErrorPopup({
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters long.'
      });
      return;
    }

    setActionLoadingId(passwordModal.member.id);
    try {
      await resetBranchAdminMemberPassword(passwordModal.member.id, passwordModal.newPassword);
      const memberName = passwordModal.member.full_name;
      setPasswordModal({ isOpen: false, member: null, newPassword: '' });
      setSuccessPopup({
        title: 'Password Reset Successful!',
        message: `Password for ${memberName} has been reset successfully.`
      });
    } catch (err) {
      setErrorPopup({
        title: 'Password Reset Failed',
        message: err.message || 'Failed to reset member password.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // View Details
  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setInspectModalOpen(true);
  };

  // Computed stats
  const totalCount = members.length;
  const activeCount = members.filter(m => m.is_active === true).length;
  const pendingMembers = members.filter(m => (m.status || '').toLowerCase() === 'pending');
  const approvedMembers = members.filter(m => (m.status || '').toLowerCase() === 'approved');
  const rejectedMembers = members.filter(m => (m.status || '').toLowerCase() === 'rejected');

  // Filtered members list
  const filteredMembers = members.filter(m => {
    // Status tab
    if (statusTab === 'pending' && (m.status || '').toLowerCase() !== 'pending') return false;
    if (statusTab === 'approved' && (m.status || '').toLowerCase() !== 'approved') return false;
    if (statusTab === 'rejected' && (m.status || '').toLowerCase() !== 'rejected') return false;

    // Active status filter
    if (activeFilter === 'active' && m.is_active !== true) return false;
    if (activeFilter === 'inactive' && m.is_active === true) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (m.full_name || '').toLowerCase().includes(q);
      const matchCode = (m.member_code || '').toLowerCase().includes(q);
      const matchMobile = (m.mobile || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchCity = (m.city || '').toLowerCase().includes(q);
      return matchName || matchCode || matchMobile || matchEmail || matchCity;
    }

    return true;
  });

  const branchName =
    (typeof managerUser.branch === 'string' ? managerUser.branch : null) ||
    managerUser.branch_name ||
    'Society Branch';

  const rawBranchCode = managerUser.branch_code;
  const branchCodeDisplay = rawBranchCode
    ? (String(rawBranchCode).startsWith('#') ? rawBranchCode : `#${rawBranchCode}`)
    : '#Central';

  return (
    <DashboardLayout
      role="branch_manager"
      user={managerUser}
      activeTab="members"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#e6faf5] to-[#cbf2ea] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/70 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Role & Branch Code Single Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3.5">
              <Building2 className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>Role: <strong className="font-bold text-teal-900">Branch Manager</strong></span>
              <span className="text-teal-300">•</span>
              <span>Branch Code: <strong className="font-mono font-bold text-teal-900">{branchCodeDisplay}</strong></span>
              <span className="text-teal-300">•</span>
              <span className="font-bold text-emerald-700">
                {managerUser.is_active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Branch Members Registry
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed">
              Manage and view all <strong className="font-bold text-slate-900">branch members</strong> with ease, keeping your branch organized and up to date.
            </p>
          </div>

          <div className="relative z-10 flex justify-end pointer-events-none -my-3 sm:-my-5">
            <img
              src={branchMemberRegistryIllustration}
              alt="Branch Members Registry"
              className="h-36 sm:h-44 lg:h-52 w-auto object-contain drop-shadow-md select-none"
            />
          </div>

          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Members"
            value={totalCount.toString()}
            subtitle={`${branchName} Folio`}
            icon={Users}
          />

          <StatCard
            title="Approved Members"
            value={approvedMembers.length.toString()}
            subtitle="KYC Verified & Admitted"
            icon={CheckCircle2}
            badge={`${totalCount > 0 ? Math.round((approvedMembers.length / totalCount) * 100) : 0}% Approved`}
          />

          <StatCard
            title="Pending Approvals"
            value={pendingMembers.length.toString()}
            subtitle="Awaiting manager sign-off"
            icon={Clock}
            badge={pendingMembers.length > 0 ? 'Urgent Queue' : 'Clear'}
            trendType={pendingMembers.length > 0 ? 'up' : 'down'}
          />

          <StatCard
            title="Rejected"
            value={rejectedMembers.length.toString()}
            subtitle="Declined applications"
            icon={AlertCircle}
          />
        </div>

        {/* Table & Filtering Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Filter Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>All Branch Members</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredMembers.length} of {totalCount} registered members
              </p>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setStatusTab('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setStatusTab('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  <span>Pending</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {pendingMembers.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusTab('approved')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Approved ({approvedMembers.length})
                </button>
                <button
                  onClick={() => setStatusTab('rejected')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Rejected ({rejectedMembers.length})
                </button>
              </div>

              {/* Active Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative sm:w-56 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, code, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2.5 border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Refresh Member Data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Proper Table Format */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Member Code</th>
                  <th className="py-3.5 px-5">Member Name</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">City / Location</th>
                  <th className="py-3.5 px-5">KYC Status</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-4 text-center">Unlock</th>
                  <th className="py-3.5 px-4 text-center">Password</th>
                  <th className="py-3.5 px-5">Registered At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        <span>Loading branch members from registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Members Found</p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusTab !== 'all' || activeFilter !== 'all'
                            ? 'Try clearing your search or status filters.'
                            : 'No members are currently enrolled under this branch.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isPending = (member.status || '').toLowerCase() === 'pending';
                    const isApproved = (member.status || '').toLowerCase() === 'approved';
                    const isRejected = (member.status || '').toLowerCase() === 'rejected';
                    const isLoadingThis = actionLoadingId === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Code */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-xs bg-teal-50 text-[#0f766e] px-2.5 py-1 rounded-lg border border-teal-200/60 inline-block shadow-2xs">
                            {member.member_code || `#${member.id}`}
                          </span>
                        </td>

                        {/* Member Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2dd4bf] to-[#0d9488] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                              {(member.full_name || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 leading-snug">{member.full_name}</p>
                              {member.nominee?.nominee_name && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  Nominee: {member.nominee.nominee_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-900 font-medium">{member.mobile || '—'}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{member.email || '—'}</p>
                          </div>
                        </td>

                        {/* City / Location */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="capitalize">{member.city || 'Kerala'}</span>
                          </div>
                        </td>

                        {/* KYC Status */}
                        <td className="py-4 px-5">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Pending Review
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Account Status Toggle Switch */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={member.is_active !== false}
                              onClick={() => handleToggleActive(member)}
                              disabled={isLoadingThis}
                              title={`Click to ${member.is_active !== false ? 'deactivate' : 'activate'} this member`}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                                member.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                              } ${isLoadingThis ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              <span className="sr-only">Toggle Member Status</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  member.is_active !== false ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-bold select-none ${
                                member.is_active !== false ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {member.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        {/* Unlock Column */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleUnlock(member)}
                            disabled={isLoadingThis}
                            title="Unlock Member Account"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center"
                          >
                            <Unlock className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        </td>

                        {/* Password Column */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setPasswordModal({ isOpen: true, member, newPassword: '' })}
                            disabled={isLoadingThis}
                            title="Reset Password"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                          </button>
                        </td>

                        {/* Registered At (Date and Time) */}
                        <td className="py-4 px-5 text-xs text-slate-600 whitespace-nowrap font-medium">
                          {member.created_at ? (
                            <div className="space-y-0.5">
                              <p className="text-slate-900 font-semibold">{new Date(member.created_at).toLocaleDateString()}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {new Date(member.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </p>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Pending: Direct Approve & Reject */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleReview(member.id, 'approved')}
                                  disabled={isLoadingThis}
                                  title="Approve Member"
                                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => setRejectModal({ isOpen: true, member, reason: '' })}
                                  disabled={isLoadingThis}
                                  title="Reject Member"
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(member)}
                              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-[#0f766e] border border-teal-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          isOpen={inspectModalOpen}
          onClose={() => {
            setInspectModalOpen(false);
            setSelectedMember(null);
          }}
          branchId={selectedMember.branch_id || managerUser.branch_id}
          memberId={selectedMember.id}
          initialMember={selectedMember}
          branchName={branchName}
          isBranchAdmin={true}
          onStatusUpdated={(id, status, updated) => {
            setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated, status } : m));
          }}
        />
      )}

      {/* Rejection Modal Dialog */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Member Application</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the official reason for rejecting {rejectModal.member?.full_name}.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Incomplete KYC documentation or unverified Aadhaar."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full mt-3 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModal({ isOpen: false, member: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(rejectModal.member.id, 'rejected', rejectModal.reason)}
                disabled={!rejectModal.reason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal Dialog */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <span>Reset Member Password</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set a temporary/new password for <strong className="text-slate-800">{passwordModal.member?.full_name}</strong> ({passwordModal.member?.member_code}).
            </p>
            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Enter new password..."
                value={passwordModal.newPassword}
                onChange={(e) => setPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-800"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModal({ isOpen: false, member: null, newPassword: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!passwordModal.newPassword || passwordModal.newPassword.length < 8}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Centered Backend Error Alert Popup */}
      {errorPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {typeof errorPopup === 'object' ? (errorPopup.title || 'Action Error') : 'Notice'}
              </h3>
              <p className="text-xs sm:text-sm text-rose-900 mt-2.5 leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 font-medium break-words text-left">
                {typeof errorPopup === 'object' ? (errorPopup.message || JSON.stringify(errorPopup)) : String(errorPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Okay, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Successful Action Popup */}
      {successPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {typeof successPopup === 'object' ? (successPopup.title || 'Success!') : 'Success!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {typeof successPopup === 'object' ? successPopup.message : String(successPopup)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                className="w-full h-11 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Okay, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fadeIn text-xs sm:text-sm max-w-md">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </DashboardLayout>
  );
}

