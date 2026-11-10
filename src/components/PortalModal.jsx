import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Lock, ShieldCheck, UserCheck, Building } from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';

export default function PortalModal({ isOpen, onClose }) {
  const [memberId, setMemberId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setStatusMessage('Member records are validated against offline registered ledgers. For active account status or passbook updates, please present your Society Membership Card at Antony Master Square Counter, Thrissur.');
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header with Teal Brand Accent */}
        <div className="bg-[#00b4a7] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">Member Portal & Services</h3>
              <p className="text-xs text-teal-100">{SOCIETY_INFO.shortName} Co-operative Gateway</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Welcome to the member verification portal of <strong>{SOCIETY_INFO.fullName}</strong>. Registered members can verify their membership folio or submit assistance requests.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Society Membership Folio / Application No.
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. AFX-MEM-2026-XXXX"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4a7] text-slate-900 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-[#00b4a7] hover:bg-[#009d91] text-white font-bold py-2.5 rounded transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-75"
            >
              {isSearching ? 'Verifying Society Register...' : 'Verify Member Records'}
            </button>
          </form>

          {statusMessage && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded text-xs text-teal-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00b4a7] mt-0.5 flex-shrink-0" />
                <div>{statusMessage}</div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Head Office: Arimpoor, Veluthur P.O., Thrissur</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Member data protected as per cooperative society bye-laws</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">Administration:</span>
            <div className="flex items-center gap-3">
              <Link
                to="/super-admin/login"
                onClick={onClose}
                className="font-semibold text-[#00b4a7] hover:underline"
              >
                Super Admin &rarr;
              </Link>
              <span className="text-slate-300">&bull;</span>
              <Link
                to="/branch-admin-login"
                onClick={onClose}
                className="font-semibold text-amber-600 hover:underline"
              >
                Branch Admin &rarr;
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
