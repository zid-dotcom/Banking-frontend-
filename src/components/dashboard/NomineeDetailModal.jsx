import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  User,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Eye,
  Clock,
  HeartHandshake,
  Check
} from 'lucide-react';
import {
  getBranchAdminNominee,
  getBranchAdminNomineeDocument,
  reviewBranchAdminNominee
} from '../../services/branchAdminService';

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

export default function NomineeDetailModal({
  isOpen,
  nomineeId,
  initialData = null,
  onClose,
  onStatusUpdated
}) {
  const [nominee, setNominee] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Document states
  const [docLoading, setDocLoading] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);

  // Review states
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (isOpen && nomineeId) {
      fetchNomineeDetail();
    } else {
      setNominee(null);
      setError(null);
      setShowRejectInput(false);
      setRejectionReason('');
      setActionSuccess(null);
      setActionError(null);
      setPreviewDoc(null);
    }
  }, [isOpen, nomineeId]);

  const fetchNomineeDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranchAdminNominee(nomineeId);
      setNominee(data);
    } catch (err) {
      console.warn('Failed to fetch nominee detail, falling back to initial data:', err);
      if (initialData) {
        setNominee(initialData);
      } else {
        setError(err.message || 'Failed to load nominee details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = async (docType) => {
    setDocLoading((prev) => ({ ...prev, [docType]: true }));
    try {
      const docUrl = await getBranchAdminNomineeDocument(nomineeId, docType);
      if (typeof docUrl === 'string' && docUrl.startsWith('http')) {
        window.open(docUrl, '_blank', 'noopener,noreferrer');
      } else if (typeof docUrl === 'string') {
        setPreviewDoc({
          url: docUrl,
          title: docType === 'aadhaar_front' ? 'Nominee Aadhaar (Front)' : 'Nominee Aadhaar (Back)'
        });
      }
    } catch (err) {
      console.error(`Error opening document ${docType}:`, err);
      // Fallback: check if direct URL is present in nominee object
      const directUrl = nominee?.[`${docType}_url`];
      if (directUrl) {
        window.open(directUrl, '_blank', 'noopener,noreferrer');
      } else {
        setActionError(err.message || `Could not retrieve ${docType.replace('_', ' ')}.`);
      }
    } finally {
      setDocLoading((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const handleReviewAction = async (status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      setActionError('Please provide a specific rejection reason for the member.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await reviewBranchAdminNominee(nomineeId, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason.trim() : null
      });

      setNominee((prev) => ({
        ...prev,
        ...updated,
        status,
        rejection_reason: status === 'rejected' ? rejectionReason.trim() : null,
        reviewed_at: new Date().toISOString()
      }));

      setShowRejectInput(false);
      setRejectionReason('');
      setActionSuccess(`Nominee has been successfully marked as ${status.toUpperCase()}.`);

      if (onStatusUpdated) {
        onStatusUpdated(nomineeId, status, updated);
      }
    } catch (err) {
      console.error('Review nominee failed:', err);
      setActionError(err.message || `Failed to update nominee status to ${status}.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStatus = (nominee?.status || 'pending').toLowerCase();
  const age = calculateAge(nominee?.date_of_birth);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#00b4a7] to-[#0f766e] text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold text-xl flex-shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {nominee?.nominee_name || 'Nominee Verification'}
                </h3>
                {nominee?.relationship_type && (
                  <span className="font-medium text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg capitalize">
                    {nominee.relationship_type}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentStatus === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  ● {currentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Nominee Registration Details &amp; KYC Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Messages */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Loading nominee details...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3 bg-red-50 rounded-2xl border border-red-200 text-red-700">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-sm font-bold text-red-900">{error}</p>
              <button
                onClick={fetchNomineeDetail}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : nominee ? (
            <>
              {/* Linked Member Card */}
              <div className="bg-gradient-to-r from-teal-50/50 via-slate-50 to-teal-50/30 rounded-2xl p-4 border border-teal-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                      Member Account Holder
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {nominee.member_name || 'Member'}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Member Code:</span>
                  <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                    {nominee.member_code || `MEM-${nominee.id}`}
                  </span>
                </div>
              </div>

              {/* Nominee Profile Details */}
              <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#00b4a7]" />
                  <span>Nominee Identification &amp; Relationship</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                    <span className="text-slate-500 block font-medium">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {nominee.nominee_name}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                    <span className="text-slate-500 block font-medium">Relationship</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block capitalize">
                      {nominee.relationship_type || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                    <span className="text-slate-500 block font-medium">Date of Birth</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatDate(nominee.date_of_birth)}
                      </span>
                      {age !== null && (
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          ({age} yrs)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Audit Timeline */}
              <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00b4a7]" />
                  <span>Application Audit &amp; Timestamps</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                    <span className="text-slate-500 block font-medium">Submitted At</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm mt-1 block">
                      {formatDateTime(nominee.submitted_at)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/80">
                    <span className="text-slate-500 block font-medium">Reviewed At</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm mt-1 block">
                      {formatDateTime(nominee.reviewed_at)}
                    </span>
                  </div>
                </div>

                {nominee.rejection_reason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-rose-900 block flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      Rejection Remarks:
                    </span>
                    <p className="text-rose-700 font-medium">{nominee.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* KYC Document Verification */}
              <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00b4a7]" />
                  <span>Nominee Aadhaar Identification KYC</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Aadhaar Front */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Aadhaar Card (Front)</p>
                        <p className="text-[10px] text-slate-400">Photo &amp; Identity side</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenDocument('aadhaar_front')}
                      disabled={docLoading['aadhaar_front']}
                      className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-[#0f766e] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
                    >
                      {docLoading['aadhaar_front'] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>View</span>
                    </button>
                  </div>

                  {/* Aadhaar Back */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Aadhaar Card (Back)</p>
                        <p className="text-[10px] text-slate-400">Address side</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenDocument('aadhaar_back')}
                      disabled={docLoading['aadhaar_back']}
                      className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-[#0f766e] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
                    >
                      {docLoading['aadhaar_back'] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Image Lightbox */}
              {previewDoc && (
                <div className="p-4 bg-slate-900 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-xs font-bold">{previewDoc.title}</span>
                    <button
                      onClick={() => setPreviewDoc(null)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto rounded-xl bg-black flex items-center justify-center p-2">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.title}
                      className="max-h-72 max-w-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Rejection input box */}
              {showRejectInput && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Specify Rejection Reason (Required)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={255}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Aadhaar copy is blurry or does not match nominee details..."
                    className="w-full p-3 rounded-xl border border-rose-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {rejectionReason.length} / 255 characters
                    </span>
                    <button
                      type="button"
                      disabled={actionLoading || !rejectionReason.trim()}
                      onClick={() => handleReviewAction('rejected')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Review Controls */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {/* Action buttons (allow approval/rejection) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentStatus !== 'rejected' && !showRejectInput && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowRejectInput(true)}
                className="px-3.5 sm:px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}

            {currentStatus !== 'approved' && !showRejectInput && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleReviewAction('approved')}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Approve Nominee</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
