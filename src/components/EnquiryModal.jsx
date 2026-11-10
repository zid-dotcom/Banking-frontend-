import React, { useState } from 'react';
import { X, CheckCircle2, Send } from 'lucide-react';
import { SOCIETY_INFO } from '../data/societyData';

export default function EnquiryModal({ isOpen, onClose, initialData = null }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: initialData?.title || 'General Loan Enquiry',
    amount: initialData?.amount ? `₹ ${initialData.amount.toLocaleString('en-IN')}` : '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#161c28] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#ffc21a] to-[#f0a800] flex items-center justify-center text-slate-950 font-bold shadow">
              <svg viewBox="0 0 36 36" className="w-4 h-4 fill-slate-950">
                <path d="M18 5.5L4 12.5H32L18 5.5Z" />
                <rect x="5.5" y="13.5" width="25" height="1.8" rx="0.4" />
                <rect x="7.5" y="16.5" width="3" height="10.5" rx="0.5" />
                <rect x="13.5" y="16.5" width="3" height="10.5" rx="0.5" />
                <rect x="19.5" y="16.5" width="3" height="10.5" rx="0.5" />
                <rect x="25.5" y="16.5" width="3" height="10.5" rx="0.5" />
                <rect x="3.5" y="30.2" width="29" height="2.2" rx="0.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">Member Enquiry Desk</h3>
              <p className="text-xs text-slate-400">Aurumfx Multi State Agro Co-operative Society Limited</p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-xl font-bold text-slate-900 mb-2">
                Enquiry Successfully Registered
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                Thank you, <span className="font-semibold text-slate-900">{formData.name}</span>. Your enquiry has been received at the society member desk. Our representative will contact you during society office hours.
              </p>
              <div className="p-3 bg-slate-50 rounded text-xs text-slate-500 mb-6 border border-slate-200 text-left">
                <strong>Office Desk:</strong> {SOCIETY_INFO.address.full}
              </div>
              <button
                onClick={handleResetAndClose}
                className="bg-[#161c28] hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <p className="text-xs text-slate-600 pb-1">
                Please submit your details below. A society counter officer will assist you with guidelines, membership forms, and scheme verification.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Member Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ffba00] text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ffba00] text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enquiry Subject / Scheme
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ffba00] text-slate-900 text-sm"
                  />
                </div>
              </div>

              {initialData?.amount && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Borrowing Requirement
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.amount}
                    className="w-full px-3.5 py-2.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Details or Questions (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Mention your agricultural crop, business trade, or deposit query..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ffba00] text-slate-900 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#ffba00] hover:bg-[#e6a700] text-slate-900 font-bold py-3 rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Enquiry to Society Desk</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

