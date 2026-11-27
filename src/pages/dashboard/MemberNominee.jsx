import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  getMemberNominee,
  submitMemberNominee,
  getMemberMe,
  getMemberNomineeDocument,
  downloadMemberNomineeDocument
} from '../../services/memberService';
import {
  createMemberNomineeChangeRequest,
  getMemberNomineeChangeRequests,
  getMemberNomineeChangeRequest,
} from '../../services/nomineeService';
import { handleAuthExpired, isTokenExpiredError } from '../../services/branchService';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  User,
  PlusCircle,
  RefreshCw,
  Eye,
  Download,
  X,
  ExternalLink,
  Edit2,
  Check,
  Building2,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  Info,
  Lock,
  Send,
} from 'lucide-react';
import nomineeIllustration from '../../assets/Nominee Registration Family Security Illustration.png';

function formatDate(isoString) {
  if (!isoString) return 'N/A';
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

const COMMON_RELATIONSHIPS = [
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Other'
];

export default function MemberNominee() {
  const [nominee, setNominee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Submit / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nominee_name: '',
    relationship_type: 'Spouse',
    custom_relationship: '',
    date_of_birth: '',
    aadhaar_front: null,
    aadhaar_back: null
  });
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  // Document Viewer Modal
  const [viewDoc, setViewDoc] = useState(null); // { url, isPdf, title, docType }
  const [docLoading, setDocLoading] = useState({});
  const [downloadingDoc, setDownloadingDoc] = useState({});

  const handleOpenDocument = async (docType, defaultTitle) => {
    setDocLoading((prev) => ({ ...prev, [docType]: true }));
    try {
      const rawField = nominee?.[`${docType}_url`] || nominee?.[docType];
      let docResult;
      try {
        docResult = await getMemberNomineeDocument(docType);
      } catch (err1) {
        if (rawField && typeof rawField === 'string' && rawField !== docType) {
          docResult = await getMemberNomineeDocument(rawField);
        } else {
          throw err1;
        }
      }

      const url = typeof docResult === 'string' ? docResult : docResult?.url;
      const isPdf = typeof docResult === 'object' ? Boolean(docResult?.isPdf) : Boolean(url?.toLowerCase()?.includes('.pdf'));

      if (url) {
        setViewDoc({
          url,
          isPdf,
          title: defaultTitle || (docType === 'aadhaar_front' ? 'Nominee Aadhaar Card (Front)' : 'Nominee Aadhaar Card (Back)'),
          docType
        });
      }
    } catch (err) {
      console.error(`Error opening document ${docType}:`, err);
      const rawField = nominee?.[`${docType}_url`] || nominee?.[docType];
      if (rawField && typeof rawField === 'string') {
        const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';
        const cleanPath = rawField.startsWith('/') ? rawField : `/${rawField}`;
        const fullUrl = rawField.startsWith('http') ? rawField : `${BASE_URL}${cleanPath}`;
        setViewDoc({
          url: fullUrl,
          isPdf: fullUrl.toLowerCase().includes('.pdf'),
          title: defaultTitle || (docType === 'aadhaar_front' ? 'Nominee Aadhaar Card (Front)' : 'Nominee Aadhaar Card (Back)'),
          docType
        });
      } else {
        alert(err.message || 'Could not load nominee document.');
      }
    } finally {
      setDocLoading((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const handleDownloadDocument = async (docType, filename) => {
    setDownloadingDoc((prev) => ({ ...prev, [docType]: true }));
    try {
      const nomineeName = nominee?.nominee_name ? nominee.nominee_name.trim().replace(/\s+/g, '_') : 'nominee';
      const defaultFilename = filename || `${nomineeName}_${docType}`;
      await downloadMemberNomineeDocument(docType, defaultFilename);
    } catch (err) {
      console.error(`Error downloading nominee document ${docType}:`, err);
      alert(err.message || 'Could not download nominee document.');
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
      branch_name: '',
      branch_location: '',
      status: 'approved',
      avatarText: 'M'
    };
  });

  // Fetch Member Profile
  useEffect(() => {
    getMemberMe()
      .then((data) => {
        if (data) {
          const name = data.full_name || data.name || 'Member';
          const branchObj = typeof data.branch === 'object' && data.branch !== null ? data.branch : null;
          const branchName = branchObj?.name || (typeof data.branch === 'string' ? data.branch : '');
          const branchLocation = [branchObj?.city, branchObj?.state].filter(Boolean).join(', ');
          setMemberUser({
            name,
            full_name: name,
            id: data.member_code || (data.id ? `MEM-${data.id}` : 'AFX-MEM-8842'),
            member_code: data.member_code || (data.id ? String(data.id) : ''),
            email: data.email || '',
            mobile: data.mobile || '',
            branch: branchName || 'Society Branch',
            branch_name: branchName,
            branch_location: branchLocation,
            status: data.status || 'approved',
            avatarText: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'M'
          });
        }
      })
      .catch((err) => {
        if (isTokenExpiredError(null, err?.message)) {
          handleAuthExpired('member');
        }
      });
  }, []);

  // Change Requests State
  const [changeRequests, setChangeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ subject: '', message: '' });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [viewRequestModal, setViewRequestModal] = useState({ isOpen: false, request: null, loading: false });

  // Fetch Nominee Details
  const fetchNominee = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getMemberNominee();
      setNominee(data);
    } catch (err) {
      console.warn('getMemberNominee error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('member');
        return;
      }
      setError(err.message || 'Failed to load nominee details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChangeRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await getMemberNomineeChangeRequests({ limit: 50 });
      setChangeRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('getMemberNomineeChangeRequests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchNominee();
    fetchChangeRequests();
  }, []);

  const nomineeStatus = (nominee?.status || 'pending').toLowerCase();
  const nomineeAge = nominee?.date_of_birth ? calculateAge(nominee.date_of_birth) : null;
  const isApproved = nomineeStatus === 'approved';
  const isRejected = nomineeStatus === 'rejected';
  const isPending = nomineeStatus === 'pending' || nomineeStatus === 'under_review';

  // Check if member has an approved, unconsumed change request allowing edit
  const approvedUnconsumedRequest = changeRequests.find(
    (r) => (r.status || '').toLowerCase() === 'approved' && !r.consumed_at
  );
  const isLocked = isApproved && !approvedUnconsumedRequest;

  const handleOpenRequestModal = () => {
    setRequestForm({
      subject: nominee ? `Request to Change Nominee from ${nominee.nominee_name}` : 'Request to Change Nominee',
      message: ''
    });
    setRequestError(null);
    setRequestModalOpen(true);
  };

  const handleSubmitChangeRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.subject.trim() || !requestForm.message.trim()) {
      setRequestError('Subject and message are required.');
      return;
    }
    setSubmittingRequest(true);
    setRequestError(null);
    try {
      await createMemberNomineeChangeRequest({
        subject: requestForm.subject.trim(),
        message: requestForm.message.trim()
      });
      setSuccessToast('Nominee change request submitted successfully to your branch!');
      setRequestModalOpen(false);
      fetchChangeRequests();
    } catch (err) {
      setRequestError(err.message || 'Failed to submit change request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleViewRequest = async (req) => {
    setViewRequestModal({ isOpen: true, request: req, loading: true });
    try {
      const full = await getMemberNomineeChangeRequest(req.id);
      setViewRequestModal({ isOpen: true, request: full || req, loading: false });
    } catch {
      setViewRequestModal({ isOpen: true, request: req, loading: false });
    }
  };

  // Open modal pre-filled with existing data if available
  const handleOpenModal = () => {
    if (isLocked) return;
    if (nominee) {
      const rel = nominee.relationship_type || nominee.relationship || 'Spouse';
      const isCustomRel = !COMMON_RELATIONSHIPS.includes(rel);
      setFormData({
        nominee_name: nominee.nominee_name || nominee.name || nominee.full_name || '',
        relationship_type: isCustomRel ? 'Other' : rel,
        custom_relationship: isCustomRel ? rel : '',
        date_of_birth: nominee.date_of_birth || nominee.dob || '',
        aadhaar_front: null,
        aadhaar_back: null
      });
      setFrontPreview(nominee.aadhaar_front_url || nominee.aadhaar_front || null);
      setBackPreview(nominee.aadhaar_back_url || nominee.aadhaar_back || null);
    } else {
      setFormData({
        nominee_name: '',
        relationship_type: 'Spouse',
        custom_relationship: '',
        date_of_birth: '',
        aadhaar_front: null,
        aadhaar_back: null
      });
      setFrontPreview(null);
      setBackPreview(null);
    }
    setFormError(null);
    setModalOpen(true);
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    setFormData((prev) => ({ ...prev, [field]: file }));
    const objectUrl = URL.createObjectURL(file);
    if (field === 'aadhaar_front') setFrontPreview(objectUrl);
    if (field === 'aadhaar_back') setBackPreview(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.nominee_name.trim();
    const finalRel =
      formData.relationship_type === 'Other'
        ? formData.custom_relationship.trim()
        : formData.relationship_type;
    const dob = formData.date_of_birth;

    if (!name) {
      setFormError('Please enter the nominee full name.');
      return;
    }
    if (!finalRel) {
      setFormError('Please specify the relationship with the nominee.');
      return;
    }
    if (!dob) {
      setFormError('Please select the nominee date of birth.');
      return;
    }
    if (!formData.aadhaar_front && !nominee?.aadhaar_front_url && !nominee?.aadhaar_front) {
      setFormError('Please upload the front side of the nominee Aadhaar card.');
      return;
    }
    if (!formData.aadhaar_back && !nominee?.aadhaar_back_url && !nominee?.aadhaar_back) {
      setFormError('Please upload the back side of the nominee Aadhaar card.');
      return;
    }

    if (isLocked) {
      setFormError('Approved nominee records are locked. Please submit a Nominee Change Request to your branch first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('nominee_name', name);
      payload.append('relationship_type', finalRel);
      payload.append('date_of_birth', dob);
      if (formData.aadhaar_front) {
        payload.append('aadhaar_front', formData.aadhaar_front);
      }
      if (formData.aadhaar_back) {
        payload.append('aadhaar_back', formData.aadhaar_back);
      }

      const res = await submitMemberNominee(payload);
      setNominee(res || { ...formData, relationship_type: finalRel, status: 'pending' });
      setModalOpen(false);
      setSuccessToast(nominee ? 'Nominee details updated successfully!' : 'Nominee registered successfully!');
      setTimeout(() => setSuccessToast(null), 5000);
      fetchNominee(true);
      fetchChangeRequests();
    } catch (err) {
      console.error('Submit nominee error:', err);
      if (isTokenExpiredError(null, err?.message)) {
        handleAuthExpired('member');
        return;
      }
      setFormError(err.message || 'Failed to submit nominee details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="member"
      user={memberUser}
      activeTab="nominee"
    >
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        {/* Toast Notification */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="p-1 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#d8f6f0] via-[#eafaf6] to-[#cbf3eb] rounded-3xl p-6 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <HeartHandshake className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Family Security &amp; Beneficiary Desk</span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                {memberUser.branch_name || 'Society Branch'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Nominee &amp; Beneficiary Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Designate a trusted family member or authorized nominee for society deposits, savings folios, and member insurance settlements.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {isLocked ? (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm select-none">
                    <Lock className="w-4 h-4 text-emerald-200" />
                    <span>Nominee Verified &amp; Locked</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenRequestModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Request Nominee Change</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer ${
                    isRejected
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {nominee ? (
                    <>
                      <Edit2 className="w-4 h-4" />
                      <span>
                        {approvedUnconsumedRequest
                          ? 'Update Nominee (Request Approved)'
                          : isRejected
                          ? 'Re-submit Nominee Details'
                          : 'Update Nominee Details'}
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Register Nominee</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  fetchNominee(true);
                  fetchChangeRequests();
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 font-bold text-xs border border-teal-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Right Banner Illustration */}
          <div className="relative z-10 flex justify-center md:justify-end pointer-events-none -my-2 sm:-my-5 lg:-my-6 flex-shrink-0 w-full md:w-auto">
            <img
              src={nomineeIllustration}
              alt="Nominee Registration Family Security"
              className="h-32 sm:h-44 lg:h-52 max-w-full w-auto object-contain drop-shadow-md select-none pointer-events-none transform hover:scale-102 transition-transform duration-300 mx-auto md:mx-0"
            />
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Nominee Status"
            value={
              !nominee
                ? 'Not Registered'
                : isApproved
                ? 'Approved'
                : isRejected
                ? 'Rejected'
                : nominee?.status
                ? nominee.status.charAt(0).toUpperCase() + nominee.status.slice(1).toLowerCase()
                : 'Pending'
            }
            valueClassName={
              !nominee
                ? 'text-lg sm:text-[21px] font-medium text-slate-500 tracking-normal font-sans'
                : isApproved
                ? 'text-lg sm:text-[21px] font-semibold text-emerald-600 tracking-normal font-sans'
                : isRejected
                ? 'text-lg sm:text-[21px] font-semibold text-rose-600 tracking-normal font-sans'
                : 'text-lg sm:text-[21px] font-semibold text-amber-600 tracking-normal font-sans'
            }
            subtext={
              !nominee
                ? 'No Nominee Linked'
                : isApproved
                ? 'Locked & Official'
                : isRejected
                ? 'Action Required'
                : 'Pending Verification'
            }
            icon={isApproved ? Lock : isRejected ? AlertCircle : ShieldCheck}
            trend={
              isApproved
                ? 'Approved'
                : isRejected
                ? 'Rejected'
                : nominee?.status
                ? nominee.status.charAt(0).toUpperCase() + nominee.status.slice(1).toLowerCase()
                : 'Pending'
            }
            trendType={isApproved ? 'up' : isRejected ? 'down' : 'neutral'}
          />

          <StatCard
            title="Nominee Name"
            value={nominee?.nominee_name || nominee?.name || '—'}
            valueClassName="text-base sm:text-lg font-medium text-slate-800 tracking-normal font-sans capitalize"
            subtext={nominee?.relationship_type || nominee?.relationship || 'Family Relation'}
            icon={User}
          />

          <StatCard
            title="Relationship"
            value={nominee?.relationship_type || nominee?.relationship || '—'}
            valueClassName="text-base sm:text-lg font-medium text-slate-800 tracking-normal font-sans"
            subtext={nomineeAge !== null ? `Age: ${nomineeAge} years` : 'Beneficiary Relation'}
            icon={HeartHandshake}
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
              onClick={() => fetchNominee(true)}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Rejection Notice Banner */}
        {nominee && isRejected && (
          <div className="p-5 sm:p-6 rounded-3xl bg-red-50/90 border-2 border-red-200 shadow-sm space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-red-700 font-black text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>Nominee Verification Status: Rejected</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              The branch administration reviewed your nominee submission and rejected the request. Please review the reason below and submit updated details.
            </p>
            {/* Rejection Reason in RED */}
            <div className="p-4 rounded-2xl bg-white border-2 border-red-300 text-red-700 shadow-2xs space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-red-500">
                Reason for Rejection:
              </p>
              <p className="text-sm sm:text-base font-extrabold text-red-600 leading-relaxed">
                {nominee.rejection_reason || nominee.rejection_remarks || nominee.remarks || 'Incomplete or mismatching nominee identity records. Please re-submit valid details.'}
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Re-submit Corrected Nominee Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Nominee Profile Details Card or Empty State */}
        {loading ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading nominee information...</p>
          </div>
        ) : nominee ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-lg border border-teal-100 shadow-2xs">
                  {(nominee.nominee_name || nominee.name || 'N').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {nominee.nominee_name || nominee.name || nominee.full_name}
                    </h3>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                      {nominee.relationship_type || nominee.relationship || 'Nominee'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Nominee for Member Account #{memberUser.member_code || memberUser.id}
                  </p>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-2">
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Approved</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-black text-xs rounded-full border border-red-300 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>Rejected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending</span>
                  </span>
                )}

                {/* Edit Button or Locked Tag */}
                {isLocked ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded-full border border-slate-200 ml-1 select-none">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Locked (Read Only)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenRequestModal}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs rounded-full border border-teal-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3 text-[#00b4a7]" />
                      <span>Request Change</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer ml-1"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>{approvedUnconsumedRequest ? 'Update Nominee' : isRejected ? 'Re-submit' : 'Edit'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Approved Locked Alert */}
            {isLocked && (
              <div className="mx-5 sm:mx-7 mt-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs font-semibold text-emerald-800">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Verified Nominee: Information is locked and read-only to protect member accounts.</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenRequestModal}
                  className="font-bold text-[#0f766e] hover:underline cursor-pointer ml-auto"
                >
                  Need to change nominee? Submit Request &rarr;
                </button>
              </div>
            )}

            {/* Approved Unconsumed Request Notice */}
            {approvedUnconsumedRequest && (
              <div className="mx-5 sm:mx-7 mt-5 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Change Request #{approvedUnconsumedRequest.id} Approved: You can now update your nominee records!</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer text-xs"
                >
                  Update Now
                </button>
              </div>
            )}

            {/* Rejection Reason In-Card Banner in RED */}
            {isRejected && (
              <div className="mx-5 sm:mx-7 mt-5 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-red-600">
                    Nominee Verification Status: Rejected
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Reason for Rejection:{' '}
                    <span className="font-black text-red-600">
                      {nominee.rejection_reason || nominee.rejection_remarks || nominee.remarks || 'Incomplete or unverified records. Please update and re-submit.'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Profile Grid */}
            <div className="p-5 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nominee Full Name
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {nominee.nominee_name || nominee.name || nominee.full_name || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Relationship
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {nominee.relationship_type || nominee.relationship || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Date of Birth
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatDate(nominee.date_of_birth || nominee.dob)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nominee Age
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {nomineeAge !== null ? `${nomineeAge} years` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Submitted & Updated Times */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted on: {formatDateTime(nominee.created_at || nominee.submitted_at)}</span>
                </div>
                {nominee.updated_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last updated: {formatDateTime(nominee.updated_at)}</span>
                  </div>
                )}
              </div>

              {/* KYC Document Verification Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Uploaded Aadhaar Verification Documents</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">2 Verified ID Folios</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aadhaar Front Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between gap-3 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-100/60 text-teal-800 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Aadhaar Card (Front Side)
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          Proof of Identity with Photo &amp; Name
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument('aadhaar_front', 'Nominee Aadhaar Card (Front)')}
                        disabled={docLoading['aadhaar_front']}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {docLoading['aadhaar_front'] ? (
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
                            'aadhaar_front',
                            `nominee_${nominee?.nominee_name ? nominee.nominee_name.trim().replace(/\s+/g, '_') : 'nominee'}_aadhaar_front`
                          )
                        }
                        disabled={downloadingDoc['aadhaar_front']}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        title="Download Document"
                      >
                        {downloadingDoc['aadhaar_front'] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-teal-700" />
                        )}
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Aadhaar Back Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between gap-3 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-100/60 text-teal-800 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Aadhaar Card (Back Side)
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          Proof of Address &amp; Family Records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument('aadhaar_back', 'Nominee Aadhaar Card (Back)')}
                        disabled={docLoading['aadhaar_back']}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {docLoading['aadhaar_back'] ? (
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
                            'aadhaar_back',
                            `nominee_${nominee?.nominee_name ? nominee.nominee_name.trim().replace(/\s+/g, '_') : 'nominee'}_aadhaar_back`
                          )
                        }
                        disabled={downloadingDoc['aadhaar_back']}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        title="Download Document"
                      >
                        {downloadingDoc['aadhaar_back'] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-teal-700" />
                        )}
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Society Policy Notice */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70 text-teal-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <Info className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span>Important Multi-State Cooperative Society Guideline</span>
                </div>
                <p className="text-[11px] text-teal-800 font-medium leading-relaxed">
                  Per cooperative bylaws, nominee verification is conducted by your mapped society branch. Only one primary beneficiary may be designated at a time. Updating your nominee requires fresh verification of Aadhaar identity records.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - No Nominee Registered */
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
              <HeartHandshake className="w-8 h-8 text-[#00b4a7]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                No Nominee Linked Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                Protect your cooperative holdings, savings accounts, and fixed deposits by appointing an authorized nominee.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Nominee Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Nominee Change Requests History Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#00b4a7]" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Nominee Change Requests
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Requests submitted to your branch to modify your designated beneficiary records
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenRequestModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Change Request</span>
              </button>

              <button
                type="button"
                onClick={fetchChangeRequests}
                disabled={loadingRequests}
                title="Refresh requests"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00b4a7] ${loadingRequests ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingRequests ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#00b4a7] mx-auto" />
              <p className="text-xs text-slate-500">Loading change requests...</p>
            </div>
          ) : changeRequests.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-slate-500">
              <p className="text-sm font-bold text-slate-700">No Nominee Change Requests Submitted</p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                If your nominee is approved and you need to update beneficiary details, click &quot;Submit Change Request&quot; above to notify your branch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Request ID</th>
                    <th className="py-3.5 px-6">Subject</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {changeRequests.map((req) => {
                    const st = (req.status || 'pending').toLowerCase();
                    const isReqApproved = st === 'approved';
                    const isReqRejected = st === 'rejected';
                    return (
                      <tr key={req.id} className="hover:bg-teal-50/25 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#0f766e]">
                          #{req.id}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-slate-900 group-hover:text-[#0f766e] transition-colors">
                            {req.subject}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {req.message}
                          </p>
                          {isReqRejected && req.rejection_reason && (
                            <p className="text-xs font-bold text-red-600 mt-1">
                              Rejection reason: {req.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatDateTime(req.created_at)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {isReqApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : isReqRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 font-black text-xs rounded-full border border-red-200">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleViewRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs rounded-xl border border-teal-200 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
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

      {/* Register / Update Nominee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <HeartHandshake className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {nominee ? 'Update Nominee Information' : 'Register New Nominee'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Submit beneficiary records &amp; Aadhaar documentation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {approvedUnconsumedRequest && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Branch Authorization Active (Request #{approvedUnconsumedRequest.id}): You can edit and submit updated nominee details.</span>
                </div>
              )}

              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nominee Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nominee Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.nominee_name}
                  onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                />
              </div>

              {/* Relationship Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Relationship with Member <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.relationship_type}
                  onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800 bg-white"
                >
                  {COMMON_RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>

                {formData.relationship_type === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Specify Relationship (e.g. Legal Guardian, Cousin)"
                    value={formData.custom_relationship}
                    onChange={(e) => setFormData({ ...formData, custom_relationship: e.target.value })}
                    className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                  />
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800 bg-white"
                />
              </div>

              {/* Aadhaar Front File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Aadhaar Card Front Side <span className="text-rose-500">*</span>
                </label>
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 transition-colors text-center relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    required={!nominee}
                    onChange={(e) => handleFileChange('aadhaar_front', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <Upload className="w-5 h-5 text-teal-600" />
                    <span className="font-bold text-xs text-slate-800">
                      {formData.aadhaar_front ? formData.aadhaar_front.name : frontPreview ? 'Current File Attached (Click to replace)' : 'Upload Aadhaar Front'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Supports JPG, PNG or PDF (Max 5MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Aadhaar Back File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Aadhaar Card Back Side <span className="text-rose-500">*</span>
                </label>
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 transition-colors text-center relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    required={!nominee}
                    onChange={(e) => handleFileChange('aadhaar_back', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <Upload className="w-5 h-5 text-teal-600" />
                    <span className="font-bold text-xs text-slate-800">
                      {formData.aadhaar_back ? formData.aadhaar_back.name : backPreview ? 'Current File Attached (Click to replace)' : 'Upload Aadhaar Back'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Supports JPG, PNG or PDF (Max 5MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{nominee ? 'Save Changes' : 'Submit Nominee'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      viewDoc.docType || 'aadhaar_front',
                      `nominee_${nominee?.nominee_name ? nominee.nominee_name.trim().replace(/\s+/g, '_') : 'nominee'}_${viewDoc.docType || 'doc'}`
                    )
                  }
                  disabled={downloadingDoc[viewDoc.docType || 'aadhaar_front']}
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
                (viewDoc.isPdf || viewDoc.url.toLowerCase().endsWith('.pdf')) ? (
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
                    <div style={{ display: 'none' }} className="doc-fallback flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-2">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-sm font-semibold">Image preview could not be displayed directly.</p>
                      <a
                        href={viewDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open / Download Document</span>
                      </a>
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

      {/* Submit Nominee Change Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-[#0f766e] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Submit Nominee Change Request
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Request authorization from your branch to update nominee records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="p-5 sm:p-6 space-y-4">
              {requestError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {requestError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  minLength={2}
                  placeholder="e.g. Request to change nominee to spouse"
                  value={requestForm.subject}
                  onChange={(e) => setRequestForm({ ...requestForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] font-medium text-slate-800 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for Change &amp; Nominee Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={5000}
                  minLength={1}
                  placeholder="Explain why you are requesting this nominee update, who the new beneficiary is, and any relevant details for branch approval..."
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#14b8a6] font-medium text-slate-800 text-sm resize-none"
                />
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[11px] text-teal-800 leading-relaxed">
                Once submitted, your branch manager will review and approve your request. After approval, you will be able to submit updated Aadhaar documents and nominee records.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#0d9488] hover:to-[#0f766e] text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{submittingRequest ? 'Submitting...' : 'Submit Change Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Nominee Change Request Details Modal */}
      {viewRequestModal.isOpen && viewRequestModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-[#0f766e] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-[#00b4a7]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0f766e]">
                      Request #{viewRequestModal.request.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        viewRequestModal.request.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : viewRequestModal.request.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {viewRequestModal.request.status ? viewRequestModal.request.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {viewRequestModal.request.subject}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewRequestModal({ isOpen: false, request: null, loading: false })}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Request Message
                </p>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {viewRequestModal.request.message}
                </p>
              </div>

              {viewRequestModal.request.status === 'rejected' && viewRequestModal.request.rejection_reason && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl space-y-1">
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                    Rejection Reason
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-red-600">
                    {viewRequestModal.request.rejection_reason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted At</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(viewRequestModal.request.created_at)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reviewed At</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(viewRequestModal.request.reviewed_at)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewRequestModal({ isOpen: false, request: null, loading: false })}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
