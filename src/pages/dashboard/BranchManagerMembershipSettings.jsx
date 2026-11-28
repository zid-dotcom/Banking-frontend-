import React, { useState, useEffect, useMemo } from 'react';
import { i18n } from '../../i18n/index.js';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  QrCode,
  Receipt,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  FileText,
  User,
  ArrowRight,
  Loader2,
  Download,
  ExternalLink,
  Coins,
  DollarSign,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import {
  getBranchAdminMembershipSettings,
  createBranchAdminMembershipSettings,
  updateBranchAdminMembershipSettings,
  getBranchAdminMemberRegistrationApplications,
  getBranchAdminMemberRegistrationApplication,
  getBranchAdminMemberRegistrationDocument,
  decideBranchAdminMemberRegistrationApplication,
  resolveBranchQrImageUrl,
} from '../../services/membershipSettingsService';
import { getBranchAdminMe } from '../../services/branchAdminService';
import { getMemberBranches } from '../../services/memberService';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(val));
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
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function BranchManagerMembershipSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'applications'
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const isConfigured = Boolean(settings && settings.is_configured && settings.membership_fee !== null);

  // Form State for Fee & QR upload
  const [feeInput, setFeeInput] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState(null);
  const [activeQrDisplayUrl, setActiveQrDisplayUrl] = useState(null);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Inspection
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title, isPdf }
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    app: null,
    action: 'approved', // 'approved' | 'rejected'
    rejectionReason: '',
    agentCode: '',
    loading: false,
  });

  // Alert Popups & Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Branch Manager User Info
  const [managerUser, setManagerUser] = useState(() => {
    try {
      const u = localStorage.getItem('branch_user') || localStorage.getItem('branch_manager_user');
      const parsed = u ? JSON.parse(u) : null;
      if (parsed) {
        return {
          name: parsed.full_name || parsed.name || 'Branch Manager',
          full_name: parsed.full_name || parsed.name || 'Branch Manager',
          id: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          user_code: parsed.user_code || (parsed.id ? `MGR-${parsed.id}` : 'MGR-001'),
          role: 'Branch Manager',
          branch: parsed.branch_name || 'Society Branch',
          branch_name: parsed.branch_name || 'Society Branch',
          branch_code: parsed.branch_code || 'BRA-01',
          branch_id: parsed.branch_id,
        };
      }
    } catch {}
    return {
      name: 'Branch Manager',
      full_name: 'Branch Manager',
      id: 'MGR-001',
      role: 'Branch Manager',
      branch: 'Society Branch',
    };
  });

  // Load Manager Details
  useEffect(() => {
    async function loadAdmin() {
      try {
        const profile = await getBranchAdminMe();
        if (profile) {
          let branchInfo = {};
          try {
            const branches = await getMemberBranches();
            if (Array.isArray(branches) && profile.branch_id) {
              const matched = branches.find((b) => String(b.id) === String(profile.branch_id));
              if (matched) {
                branchInfo = {
                  branch_name: matched.branch_name,
                  branch_code: matched.branch_code,
                  location: matched.city ? `${matched.city}, ${matched.state || 'Kerala'}` : matched.state,
                };
              }
            }
          } catch {}

          const updated = {
            ...profile,
            name: profile.full_name || profile.name || 'Branch Manager',
            full_name: profile.full_name || profile.name || 'Branch Manager',
            branch: branchInfo.branch_name || profile.branch_name || 'Society Branch',
            branch_name: branchInfo.branch_name || profile.branch_name || 'Society Branch',
            branch_code: branchInfo.branch_code || profile.branch_code || 'BRA-01',
            branch_id: profile.branch_id,
          };
          setManagerUser(updated);
        }
      } catch (e) {
        console.warn('Failed to load branch admin info:', e);
      }
    }
    loadAdmin();
  }, []);

  // Fetch Settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await getBranchAdminMembershipSettings();
      setSettings(data);
      if (data && data.membership_fee !== undefined) {
        setFeeInput(String(data.membership_fee));
      }
    } catch (err) {
      console.warn('getBranchAdminMembershipSettings error:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch Applications
  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const list = await getBranchAdminMemberRegistrationApplications({
        status: statusFilter,
        search: searchQuery,
      });
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('getBranchAdminMemberRegistrationApplications error:', err);
      showToast(err.message || 'Failed to load registration applications');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.qr_display_url) {
      setActiveQrDisplayUrl(settings.qr_display_url);
    } else if (settings?.qr_image_url || settings?.qr_code_url) {
      const path = settings.qr_image_url || settings.qr_code_url;
      resolveBranchQrImageUrl(path, settings.branch_id).then((url) => {
        if (url) setActiveQrDisplayUrl(url);
      });
    } else {
      setActiveQrDisplayUrl(null);
    }
  }, [settings]);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  // Handle QR File Selection
  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const url = URL.createObjectURL(file);
      setQrPreviewUrl(url);
    }
  };

  // Submit / Save Settings (POST /branch-admin/membership-settings as requested)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!feeInput || isNaN(Number(feeInput)) || Number(feeInput) < 0) {
      setErrorPopup({
        title: i18n.t("branchManagerMembershipSettings.invalidFeeAmount", "Invalid Fee Amount"),
        message: 'Please enter a valid numeric membership fee (₹).',
      });
      return;
    }

    const isConfigured = Boolean(settings && settings.is_configured && settings.membership_fee !== null);

    if (!isConfigured && !qrFile) {
      setErrorPopup({
        title: i18n.t("branchManagerMembershipSettings.qrCodeRequired", "QR Code Required"),
        message: 'Please upload the branch UPI QR code image to set membership settings.',
      });
      return;
    }

    setSavingSettings(true);
    try {
      const payload = new FormData();
      payload.append('membership_fee', feeInput.trim());
      if (qrFile) {
        payload.append('qr_image', qrFile);
      }

      let res;
      // When a QR file is uploaded or settings are not yet configured,
      // call POST /branch-admin/membership-settings ("Set the branch membership fee and upload its QR image")
      if (qrFile || !isConfigured) {
        try {
          res = await createBranchAdminMembershipSettings(payload);
        } catch (postErr) {
          // If already configured and backend requests PATCH instead
          if (postErr.message && (postErr.message.toLowerCase().includes('already') || postErr.message.includes('409'))) {
            res = await updateBranchAdminMembershipSettings(payload);
          } else {
            throw postErr;
          }
        }
      } else {
        // If already configured and only updating fee without replacing QR image, use PATCH
        try {
          res = await updateBranchAdminMembershipSettings(payload);
        } catch (patchErr) {
          if (patchErr.message && patchErr.message.includes('Create membership settings') && qrFile) {
            res = await createBranchAdminMembershipSettings(payload);
          } else {
            throw patchErr;
          }
        }
      }

      setSettings(res);
      setQrFile(null);
      setQrPreviewUrl(null);
      setSuccessPopup({
        title: i18n.t("branchManagerMembershipSettings.settingsSavedSuccessfully", "Settings Saved Successfully!"),
        message: `Branch membership fee is set to ${formatCurrency(res.membership_fee || feeInput)} with active QR code published.`,
      });
    } catch (err) {
      console.error('Save membership settings error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembershipSettings.failedToSaveSettings", "Failed to Save Settings"),
        message: err.message || 'Could not update membership settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Inspect Application Details
  const handleInspectApp = async (app) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
    try {
      const full = await getBranchAdminMemberRegistrationApplication(app.id);
      setSelectedApp(full);
    } catch (err) {
      console.warn('Failed to fetch full application detail:', err);
    }
  };

  // Open Document / Screenshot
  const handleOpenDoc = async (appId, docName, fallbackUrl = null) => {
    setDocLoading((prev) => ({ ...prev, [docName]: true }));
    try {
      const res = await getBranchAdminMemberRegistrationDocument(appId, docName);
      if (typeof res === 'string') {
        const isPdf = res.toLowerCase().includes('.pdf') || (fallbackUrl && fallbackUrl.toLowerCase().includes('.pdf'));
        setPreviewDoc({
          url: res,
          title: docName.replace(/_/g, ' ').toUpperCase(),
          isPdf,
        });
      }
    } catch (err) {
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        setErrorPopup({
          title: i18n.t("modal.member.documentUnavailable", "Document Unavailable"),
          message: err.message || 'Could not load requested document.',
        });
      }
    } finally {
      setDocLoading((prev) => ({ ...prev, [docName]: false }));
    }
  };

  // Open Decision Modal
  const openDecisionModal = (app, action) => {
    setDecisionModal({
      isOpen: true,
      app,
      action,
      rejectionReason: '',
      agentCode: app.agent_code || '',
      loading: false,
    });
  };

  // Submit Decision (Approve / Reject)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    const { app, action, rejectionReason, agentCode } = decisionModal;
    if (!app) return;

    if (action === 'rejected' && !rejectionReason.trim()) {
      setErrorPopup({
        title: i18n.t("modal.member.rejectionReasonRequired", "Rejection Reason Required"),
        message: 'Please provide a clear reason for declining this member application.',
      });
      return;
    }

    setDecisionModal((prev) => ({ ...prev, loading: true }));
    try {
      const updated = await decideBranchAdminMemberRegistrationApplication(app.id, {
        status: action,
        rejection_reason: action === 'rejected' ? rejectionReason.trim() : null,
        agent_code: agentCode.trim() || null,
      });

      setApplications((prev) => prev.map((item) => (item.id === app.id ? { ...item, ...updated } : item)));
      if (selectedApp?.id === app.id) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }

      setDecisionModal({ isOpen: false, app: null, action: 'approved', rejectionReason: '', agentCode: '', loading: false });

      setSuccessPopup({
        title: action === 'approved' ? 'Application Approved!' : 'Application Rejected',
        message:
          action === 'approved'
            ? `Member account created successfully! Member Code: ${updated.member_code || 'Generated'}.`
            : `Application #${app.id} has been marked as rejected.`,
      });
    } catch (err) {
      console.error('Decision error:', err);
      setErrorPopup({
        title: i18n.t("branchManagerMembershipSettings.decisionActionFailed", "Decision Action Failed"),
        message: err.message || 'Could not process application decision.',
      });
    } finally {
      setDecisionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filtered Applications for Search
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase().trim();
    return applications.filter(
      (app) =>
        (app.full_name && app.full_name.toLowerCase().includes(q)) ||
        (app.email && app.email.toLowerCase().includes(q)) ||
        (app.mobile && app.mobile.includes(q)) ||
        (app.agent_code && app.agent_code.toLowerCase().includes(q)) ||
        (app.member_code && app.member_code.toLowerCase().includes(q)) ||
        String(app.id).includes(q)
    );
  }, [applications, searchQuery]);

  const pendingCount = applications.filter((a) => (a.status || '').toLowerCase() === 'pending').length;
  const approvedCount = applications.filter((a) => (a.status || '').toLowerCase() === 'approved').length;

  return (
    <DashboardLayout role="branch_manager" user={managerUser} activeTab="membership_settings">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-semibold border border-teal-200/80 text-[#0f766e] mb-3 shadow-2xs">
              <QrCode className="w-3.5 h-3.5 text-[#00b4a7]" />
              <span>{t("branchManagerMembershipSettings.branchMembershipFeeManagement", "Branch Membership & Fee Management")}</span>
              <span className="text-teal-300">•</span>
              <span className="text-slate-600 font-mono">
                {managerUser.branch || 'Branch Office'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              {t("branchManagerMembershipSettings.membershipFeeQrSettings", "Membership Fee & QR Settings")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {t("branchManagerMembershipSettings.configureYourBranchSOfficial", "Configure your branch’s official membership enrollment fee, publish the UPI payment QR code, and audit incoming prospective member applications and payment screenshots.")}
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  fetchSettings();
                  fetchApplications();
                }}
                disabled={settingsLoading || appsLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-teal-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${(settingsLoading || appsLoading) ? 'animate-spin' : ''}`} />
                <span>{t("branchManagerMembershipSettings.refreshData", "Refresh Data")}</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 flex items-center justify-center p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/70 shadow-sm">
            <div className="text-center p-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20 mb-2">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("branchManagerMembershipSettings.currentFee", "Current Fee")}</p>
              <p className="text-xl font-black text-teal-900 mt-0.5">
                {isConfigured && settings?.membership_fee !== undefined && settings?.membership_fee !== null ? formatCurrency(settings.membership_fee) : t("branchManagerMembershipSettings.notSet", "Not Set")}
              </p>
            </div>
          </div>

          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title={t("branchManagerMembershipSettings.membershipFee", "Membership Fee")}
            value={isConfigured && settings?.membership_fee !== undefined && settings?.membership_fee !== null ? formatCurrency(settings.membership_fee) : '₹0.00'}
            valueClassName="text-lg sm:text-[21px] font-black text-slate-900 tracking-tight font-sans"
            subtext={isConfigured ? 'Active Branch Fee' : 'Configuration Pending'}
            icon={Coins}
            trend={isConfigured ? 'Active' : 'Unset'}
            trendType={isConfigured ? 'up' : 'neutral'}
          />

          <StatCard
            title={t("branchManagerMembershipSettings.paymentQrCode", "Payment QR Code")}
            value={(activeQrDisplayUrl || settings?.qr_display_url || settings?.qr_image_url || settings?.qr_code_url) ? 'Configured' : 'Not Uploaded'}
            valueClassName={`text-lg sm:text-[21px] font-black tracking-tight font-sans ${
              (activeQrDisplayUrl || settings?.qr_display_url || settings?.qr_image_url || settings?.qr_code_url) ? 'text-emerald-600' : 'text-amber-600'
            }`}
            subtext="UPI Payment Gateway"
            icon={QrCode}
            trend={(activeQrDisplayUrl || settings?.qr_display_url || settings?.qr_image_url || settings?.qr_code_url) ? 'Live' : 'Action Req.'}
            trendType={(activeQrDisplayUrl || settings?.qr_display_url || settings?.qr_image_url || settings?.qr_code_url) ? 'up' : 'down'}
          />

          <StatCard
            title={t("branchManagerDashboard.pendingApplications", "Pending Applications")}
            value={String(pendingCount)}
            valueClassName="text-lg sm:text-[21px] font-black text-amber-600 tracking-tight font-sans"
            subtext="Awaiting Verification"
            icon={Clock}
            trend={`${pendingCount} Review`}
            trendType={pendingCount > 0 ? 'down' : 'neutral'}
          />

          <StatCard
            title={t("branchManagerMembers.approvedMembers", "Approved Members")}
            value={String(approvedCount)}
            valueClassName="text-lg sm:text-[21px] font-black text-emerald-600 tracking-tight font-sans"
            subtext="Enrolled via Applications"
            icon={CheckCircle2}
            trend={`${approvedCount} Total`}
            trendType="up"
          />
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t("branchManagerMembershipSettings.membershipFeeQrSettings", "Membership Fee & QR Settings")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t("branchManagerMembershipSettings.memberApplications", "Member Applications")}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Fee & QR Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration Form Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <Receipt className="w-5 h-5 text-[#00b4a7]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {isConfigured ? t("branchManagerMembershipSettings.updateMembershipSettings", "Update Membership Settings") : t("branchManagerMembershipSettings.configureMembershipSettings", "Configure Membership Settings")}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {t("branchManagerMembershipSettings.setMandatoryEnrollmentFeeAnd", "Set mandatory enrollment fee and upload your branch’s UPI payment QR code")}
                    </p>
                  </div>
                </div>

                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{t("branchManagerMembershipSettings.configuredActive", "Configured & Active")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{t("branchManagerMembershipSettings.notConfigured", "Not Configured")}</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="p-5 sm:p-7 space-y-6">
                {/* Fee Amount Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("branchManagerMembershipSettings.membershipEnrollmentFee", "Membership Enrollment Fee (₹)")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-2xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 500.00"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 font-bold text-base transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t("branchManagerMembershipSettings.thisAmountIsChargedTo", "This amount is charged to new members upon registration. They pay via the branch QR code below.")}
                  </p>
                </div>

                {/* QR Code Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("branchManagerMembershipSettings.branchUpiQrCodeImage", "Branch UPI QR Code Image")} {!isConfigured && <span className="text-rose-500">*</span>}
                  </label>
                  
                  <div className="border-2 border-dashed border-teal-200/90 rounded-2xl p-6 bg-teal-50/20 hover:bg-teal-50/40 transition-colors text-center relative group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleQrFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {qrPreviewUrl ? (
                      <div className="space-y-3">
                        <img
                          src={qrPreviewUrl}
                          alt={t("branchManagerMembershipSettings.newQrPreview", "New QR Preview")}
                          className="w-36 h-36 object-contain mx-auto rounded-xl border border-teal-300 shadow-sm bg-white p-2"
                        />
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{t("branchManagerMembershipSettings.selected", "Selected:")} {qrFile?.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{t("branchManagerMembershipSettings.clickOrDragADifferent", "Click or drag a different image to replace")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-2xs">
                          <Upload className="w-6 h-6 text-teal-700" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          {t("branchManagerMembershipSettings.clickToUploadOrDrag", "Click to upload or drag & drop your UPI QR code image")}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t("branchManagerMembershipSettings.supportedFormatsPngJpgJpeg", "Supported formats: PNG, JPG, JPEG, WEBP (Square QR code recommended)")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {settings?.updated_at && (
                      <span>{t("branchManagerMembershipSettings.lastUpdated", "Last updated:")} {formatDateTime(settings.updated_at)}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-teal-600 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-teal-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    <span>{isConfigured ? t("branchManagerMembershipSettings.updateMembershipSettings", "Update Membership Settings") : t("branchManagerMembershipSettings.saveSetMembershipSettings", "Save & Set Membership Settings")}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live Branch QR Preview & Applicant Perspective */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t("branchManagerMembershipSettings.applicantViewPreview", "Applicant View Preview")}</span>
                </div>

                <h4 className="text-base font-black text-slate-900">
                  {t("branchManagerMembershipSettings.activeBranchPaymentQrCode", "Active Branch Payment QR Code")}
                </h4>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 inline-block mx-auto">
                  {qrPreviewUrl ? (
                    <img
                      src={qrPreviewUrl}
                      alt={t("branchManagerMembershipSettings.selectedQrPreview", "Selected QR Preview")}
                      className="w-48 h-48 object-contain rounded-xl bg-white p-2 shadow-xs"
                    />
                  ) : activeQrDisplayUrl ? (
                    <img
                      src={activeQrDisplayUrl}
                      alt={t("branchManagerMembershipSettings.activeBranchQr", "Active Branch QR")}
                      className="w-48 h-48 object-contain rounded-xl bg-white p-2 shadow-xs"
                    />
                  ) : (settings?.qr_display_url || settings?.qr_image_url || settings?.qr_code_url) ? (
                    <img
                      src={settings.qr_display_url || settings.qr_image_url || settings.qr_code_url}
                      alt={t("branchManagerMembershipSettings.activeBranchQr", "Active Branch QR")}
                      className="w-48 h-48 object-contain rounded-xl bg-white p-2 shadow-xs"
                      onError={async (e) => {
                        if (!e.target.dataset.tried) {
                          e.target.dataset.tried = 'true';
                          const resolved = await resolveBranchQrImageUrl(settings.qr_image_url || settings.qr_code_url, settings.branch_id);
                          if (resolved) {
                            setActiveQrDisplayUrl(resolved);
                            e.target.src = resolved;
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4">
                      <QrCode className="w-12 h-12 stroke-[1.5] mb-2" />
                      <p className="text-xs font-semibold">{t("branchManagerMembershipSettings.noQrUploaded", "No QR Uploaded")}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">{t("branchManagerMembershipSettings.applicableFee", "Applicable Fee")}</p>
                  <p className="text-2xl font-black text-teal-700">
                    {formatCurrency(feeInput || settings?.membership_fee || 0)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 text-left text-xs space-y-1">
                  <p className="font-bold text-teal-900">{t("branchManagerMembershipSettings.howThisWorksForMembers", "How this works for members:")}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {t("branchManagerMembershipSettings.1MemberChoosesThisBranch", "1. Member chooses this branch during online registration.")}<br />
                    {t("branchManagerMembershipSettings.2ThisQrCodeFee", "2. This QR code & fee appear automatically.")}<br />
                    {t("branchManagerMembershipSettings.3MemberScansWithGpay", "3. Member scans with GPay/PhonePe/Paytm, pays, and uploads the screenshot.")}<br />
                    {t("branchManagerMembershipSettings.4ApplicationAppearsUnderMember", "4. Application appears under \"Member Applications\" tab for your audit & approval.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Member Registration Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {/* Filters & Search Toolbar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: t("branchManagerMembershipSettings.allApplications", "All Applications") },
                  { id: 'pending', label: t("branchManagerMembers.pendingReview", "Pending Review") },
                  { id: 'approved', label: t("common.approved", "Approved") },
                  { id: 'rejected', label: t("common.rejected", "Rejected") },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("branchManagerMembershipSettings.searchApplicantMobileEmailAgent", "Search applicant, mobile, email, agent...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Applications Table Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {appsLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">{t("branchManagerMembershipSettings.loadingMemberRegistrationApplications", "Loading member registration applications...")}</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="py-16 text-center space-y-2 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{t("dashboardModule.productAccounts.noApplicationsFound", "No Applications Found")}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? t("branchManagerMembershipSettings.noApplicationsMatchYourSearch", "No applications match your search criteria. Try a different query.")
                      : t("branchManagerMembershipSettings.thereAreNoRegistrationApplications", "There are no registration applications submitted under this status category.")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.appId", "App ID")}</th>
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.applicant", "Applicant")}</th>
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.mobileEmail", "Mobile & Email")}</th>
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.agentCode", "Agent Code")}</th>
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.feePaid", "Fee Paid")}</th>
                        <th className="py-3.5 px-6 text-center">{t("branchManagerMembershipSettings.paymentProof", "Payment Proof")}</th>
                        <th className="py-3.5 px-6">{t("branchManagerMembershipSettings.date", "Date")}</th>
                        <th className="py-3.5 px-6 text-center">{t("common.status", "Status")}</th>
                        <th className="py-3.5 px-6 text-right">{t("common.actions", "Actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredApps.map((app) => {
  const { t } = useTranslation();
                        const s = (app.status || 'pending').toLowerCase();
                        const isPending = s === 'pending';
                        const isApproved = s === 'approved';
                        const isRejected = s === 'rejected';

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-mono font-extrabold text-teal-800 text-sm whitespace-nowrap">
                              {t("branchManagerMembershipSettings.app", "#APP-")}{app.id}
                            </td>

                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">{app.full_name}</div>
                              {app.member_code && (
                                <span className="font-mono text-[11px] text-teal-700 font-bold block mt-0.5">
                                  {t("branchManagerMembershipSettings.memberId", "Member ID:")} {app.member_code}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-xs text-slate-600">
                              <div className="font-semibold text-slate-800">{app.mobile || '—'}</div>
                              <div className="text-[11px] text-slate-400 break-all">{app.email || '—'}</div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap">
                              {app.agent_code ? (
                                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                                  {app.agent_code}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">{t("branchManagerMembershipSettings.directNone", "Direct (None)")}</span>
                              )}
                            </td>

                            <td className="py-4 px-6 font-bold font-sans text-sm text-slate-900 whitespace-nowrap">
                              {formatCurrency(app.membership_fee_paid || 0)}
                            </td>

                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              {app.payment_screenshot_url ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDoc(app.id, 'payment_screenshot', app.payment_screenshot_url)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                                  <span>{t("branchManagerMembershipSettings.viewReceipt", "View Receipt")}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                              {formatDateTime(app.created_at)}
                            </td>

                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                  isApproved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isPending ? (
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                ) : isApproved ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                )}
                                <span>{s}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleInspectApp(app)}
                                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 flex items-center justify-center transition-colors cursor-pointer"
                                  title={t("branchManagerMembershipSettings.viewApplicationDetails", "View Application Details")}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openDecisionModal(app, 'approved')}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                      title={t("branchManagerMembershipSettings.approveMemberApplication", "Approve Member Application")}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{t("branchManagerMembers.approve", "Approve")}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openDecisionModal(app, 'rejected')}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                                      title={t("branchManagerMembershipSettings.rejectApplication", "Reject Application")}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>{t("modal.nominee.reject", "Reject")}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPLICATION DETAIL MODAL */}
        {detailModalOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:px-6 sm:py-5 bg-gradient-to-r from-teal-50 via-teal-50/40 to-white border-b border-teal-100/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {selectedApp.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedApp.full_name}</h3>
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                        {t("branchManagerMembershipSettings.app", "#APP-")}{selectedApp.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("branchManagerMembershipSettings.submittedOn", "Submitted on")} {formatDateTime(selectedApp.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Personal & Contact Grid */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-3">
                    {t("branchManagerMembershipSettings.personalContactDetails", "Personal & Contact Details")}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("modal.member.mobileNumber", "Mobile Number")}</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedApp.mobile || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("modal.member.emailAddress", "Email Address")}</span>
                      <p className="font-bold text-slate-900 mt-0.5 break-all">{selectedApp.email || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("modal.member.dateOfBirth", "Date of Birth")}</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedApp.date_of_birth || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("modal.member.gender", "Gender")}</span>
                      <p className="font-bold text-slate-900 mt-0.5 capitalize">{selectedApp.gender || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("branchManagerMembershipSettings.aadhaarCard", "Aadhaar Card")}</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.aadhaar_number || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("branchManagerMembershipSettings.panNumber", "PAN Number")}</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.pan_number || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-3">
                    {t("branchManagerMembershipSettings.addressRecords", "Address Records")}
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                    {[
                      selectedApp.building_no,
                      selectedApp.street,
                      selectedApp.city,
                      selectedApp.district,
                      selectedApp.state,
                      selectedApp.zip_code,
                      selectedApp.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'No residential address provided.'}
                  </div>
                </div>

                {/* Bank Credentials */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-3">
                    {t("branchManagerMembershipSettings.bankAccountDisbursements", "Bank Account (Disbursements)")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("modal.member.accountHolder", "Account Holder")}</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedApp.bank_holder_name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("dashboard.accountNumber", "Account Number")}</span>
                      <p className="font-mono font-bold text-teal-800 mt-0.5">{selectedApp.bank_account_number || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t("dashboardModule.accountTransactions.colIfscCode", "IFSC Code")}</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.ifsc_code || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Membership Fee & Payment Proof Banner */}
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800">{t("branchManagerMembershipSettings.membershipFeePaid", "Membership Fee Paid")}</span>
                    <p className="text-xl font-black text-teal-950 mt-0.5">
                      {formatCurrency(selectedApp.membership_fee_paid || 0)}
                    </p>
                    {selectedApp.agent_code && (
                      <span className="font-mono text-[11px] font-semibold text-purple-700 mt-1 block">
                        {t("branchManagerMembershipSettings.assistingAgentCode", "Assisting Agent Code:")} {selectedApp.agent_code}
                      </span>
                    )}
                  </div>

                  {selectedApp.payment_screenshot_url && (
                    <button
                      type="button"
                      onClick={() => handleOpenDoc(selectedApp.id, 'payment_screenshot', selectedApp.payment_screenshot_url)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{t("branchManagerMembershipSettings.inspectPaymentScreenshot", "Inspect Payment Screenshot")}</span>
                    </button>
                  )}
                </div>

                {/* Verification Documents Gallery */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-3">
                    {t("branchManagerMembershipSettings.verificationDocuments", "Verification Documents")}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'aadhaar_front', label: t("modal.member.aadhaarFront", "Aadhaar Front"), url: selectedApp.aadhaar_front_url },
                      { key: 'aadhaar_back', label: t("modal.member.aadhaarBack", "Aadhaar Back"), url: selectedApp.aadhaar_back_url },
                      { key: 'passbook_image', label: t("branchManagerMembershipSettings.bankPassbook", "Bank Passbook"), url: selectedApp.passbook_image_url },
                      { key: 'pan_image', label: t("branchManagerMembershipSettings.panCard", "PAN Card"), url: selectedApp.pan_image_url },
                    ].map((doc) => (
                      <button
                        key={doc.key}
                        type="button"
                        onClick={() => handleOpenDoc(selectedApp.id, doc.key, doc.url)}
                        disabled={!doc.url || docLoading[doc.key]}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 text-center transition-all cursor-pointer disabled:opacity-40"
                      >
                        <FileText className="w-5 h-5 text-teal-700 mx-auto mb-1" />
                        <span className="block font-bold text-slate-800 truncate text-[11px]">{doc.label}</span>
                        <span className="text-[10px] text-teal-600 font-semibold">
                          {docLoading[doc.key] ? t("branchManagerMembershipSettings.loading", "Loading...") : doc.url ? t("branchManagerMembershipSettings.viewDocument", "View Document") : t("branchManagerMembershipSettings.notAttached", "Not Attached")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t("common.close", "Close")}
                </button>

                {(selectedApp.status || '').toLowerCase() === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDecisionModal(selectedApp, 'rejected')}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                    >
                      {t("branchManagerMembershipSettings.rejectApplication", "Reject Application")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDecisionModal(selectedApp, 'approved')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      {t("branchManagerMembershipSettings.approveActivateMember", "Approve & Activate Member")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DECISION ACTION MODAL (Approve / Reject) */}
        {decisionModal.isOpen && decisionModal.app && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    decisionModal.action === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {decisionModal.action === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {decisionModal.action === 'approved' ? t("branchManagerMembershipSettings.approveMemberApplication", "Approve Member Application") : t("branchManagerMembershipSettings.rejectApplication", "Reject Application")}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {decisionModal.app.full_name} {t("branchManagerMembershipSettings.app2", "(#APP-")}{decisionModal.app.id})
                  </p>
                </div>
              </div>

              <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
                {decisionModal.action === 'approved' ? (
                  <>
                    <p className="text-slate-600 leading-relaxed">
                      {t("branchManagerMembershipSettings.approvingThisApplicationVerifiesThe", "Approving this application verifies the membership fee payment and identity records. An active member account and official Member ID code will be generated.")}
                    </p>
                    <div className="space-y-1.5">
                      <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                        {t("branchManagerMembershipSettings.assignConfirmAgentCodeOptional", "Assign / Confirm Agent Code (Optional)")}
                      </label>
                      <input
                        type="text"
                        placeholder={t("branchManagerMembershipSettings.eGAgt1234", "e.g. AGT1234")}
                        value={decisionModal.agentCode}
                        onChange={(e) =>
                          setDecisionModal((prev) => ({ ...prev, agentCode: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 text-slate-800 font-mono font-bold text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-600 leading-relaxed">
                      {t("branchManagerMembershipSettings.pleaseEnterAClearReason", "Please enter a clear reason for rejecting this application (e.g. invalid payment screenshot, mismatch in Aadhaar, etc.).")}
                    </p>
                    <div className="space-y-1.5">
                      <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                        {t("branchManagerMembershipSettings.rejectionReason", "Rejection Reason")} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={t("branchManagerMembershipSettings.provideReasonForDecliningApplication", "Provide reason for declining application...")}
                        value={decisionModal.rejectionReason}
                        onChange={(e) =>
                          setDecisionModal((prev) => ({ ...prev, rejectionReason: e.target.value }))
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-rose-500 text-slate-800 text-xs"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionModal({ isOpen: false, app: null, action: 'approved', rejectionReason: '', agentCode: '', loading: false })}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={decisionModal.loading}
                    className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
                      decisionModal.action === 'approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {decisionModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{decisionModal.action === 'approved' ? t("branchManagerMembershipSettings.confirmApproval", "Confirm Approval") : t("modal.nominee.confirmRejection", "Confirm Rejection")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW MODAL */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 px-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">{previewDoc.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100/50">
                {previewDoc.isPdf ? (
                  <iframe src={previewDoc.url} title={previewDoc.title} className="w-full h-[65vh] rounded-xl border border-slate-200" />
                ) : (
                  <img src={previewDoc.url} alt={previewDoc.title} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-xs" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* POPUPS */}
        {errorPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">{errorPopup.title || 'Error'}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{errorPopup.message}</p>
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                {t("branchManagerMemberPasswordUpdate.dismiss", "Dismiss")}
              </button>
            </div>
          </div>
        )}

        {successPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">{successPopup.title || 'Success'}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{successPopup.message}</p>
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                {t("branchManagerMembershipSettings.continue", "Continue")}
              </button>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-slideUp">
            {toastMessage}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
