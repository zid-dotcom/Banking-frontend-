import React, { useRef } from 'react';
import {
  Receipt,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Wallet,
  Coins,
  Scale,
  Landmark,
  Building2,
  FileText
} from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
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
      hour12: true
    });
  } catch {
    return isoString;
  }
}

export default function ReconciliationReceiptsModal({
  report,
  singleTransaction,
  onClose
}) {
  const printRef = useRef(null);

  if (!report && !singleTransaction) return null;

  const handlePrint = () => {
    window.print();
  };

  // If a single transaction is passed for receipt voucher view
  if (singleTransaction && !report) {
    const tx = singleTransaction;
    const isDep = String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
                  String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-lg">
                  Counter Cash Receipt Voucher
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified Society Counter Cash Transaction
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-5 sm:p-6 space-y-4 text-xs" ref={printRef}>
            {/* Receipt Number & Date */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Number</span>
                <span className="font-mono font-black text-teal-900 text-sm">
                  {tx.receipt_number || tx.reference_number || `#TX-${tx.id || '001'}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date &amp; Time</span>
                <span className="font-bold text-slate-800">
                  {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                </span>
              </div>
            </div>

            {/* Amount Banner */}
            <div
              className={`p-4 rounded-2xl border text-center ${
                isDep ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  isDep ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isDep ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                <span>{isDep ? 'Cash Deposit Verified' : 'Cash Withdrawal Verified'}</span>
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
                  isDep ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isDep ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </div>

            {/* Member & Account Details */}
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{tx.account_number || '—'}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Member Name</span>
                <span className="font-bold text-slate-900 capitalize">{tx.member_name || 'Member'}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Balance Before</span>
                <span className="font-mono font-semibold text-slate-600">
                  {tx.balance_before !== undefined && tx.balance_before !== null ? formatCurrency(tx.balance_before) : '—'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between bg-teal-50/30">
                <span className="text-teal-900 font-bold">Balance After Transaction</span>
                <span className="font-mono font-black text-teal-900 text-sm">
                  {tx.balance_after !== undefined && tx.balance_after !== null
                    ? formatCurrency(tx.balance_after)
                    : (tx.balance ? formatCurrency(tx.balance) : '—')}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Cashier Desk</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {tx.cashier_name || 'Cashier'} {tx.cashier_code ? `(#${tx.cashier_code})` : ''}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Branch</span>
                <span className="font-semibold text-slate-800">
                  {tx.branch_name || 'Society Branch'} {tx.ifsc_code ? `(IFSC: ${tx.ifsc_code})` : ''}
                </span>
              </div>
              {tx.notes && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Transaction Notes</span>
                  <span className="font-medium text-slate-700 max-w-[200px] truncate">{tx.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#00b4a7] hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt Voucher</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reconciliation Report Modal (Matching Image 1 perfectly!)
  const r = report;
  const transactions = Array.isArray(r.transactions) ? r.transactions : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
                Reconciliation Receipts Audit: #REC-{r.id || '1'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verified counter cash vouchers, receipts, and member balance before/after logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 7 Summary Cards matching Image 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">BUSINESS DATE</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(r.business_date)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">CASHIER</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5 truncate capitalize">
                {r.cashier_name || 'Cashier'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">OPENING FLOAT</div>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                {formatCurrency(r.opening_cash)}
              </div>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
              <div className="text-[10px] uppercase font-bold text-emerald-800">DEPOSITS</div>
              <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                +{formatCurrency(r.deposit_total)}
              </div>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80">
              <div className="text-[10px] uppercase font-bold text-rose-800">WITHDRAWALS</div>
              <div className="font-mono font-bold text-rose-700 text-sm mt-0.5">
                -{formatCurrency(r.withdrawal_total)}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">EXPECTED CLOSING</div>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                {formatCurrency(r.expected_closing_cash)}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">PHYSICAL CLOSING</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {r.closing_cash !== null && r.closing_cash !== undefined ? formatCurrency(r.closing_cash) : '—'}
              </div>
            </div>
          </div>

          {/* Transactions Receipts Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00b4a7]" />
                <span>Counter Transactions &amp; Receipts ({transactions.length})</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 pl-4 pr-2">RECEIPT NUMBER</th>
                      <th className="py-2.5 px-2">TYPE</th>
                      <th className="py-2.5 px-2">AMOUNT</th>
                      <th className="py-2.5 px-2">BALANCE BEFORE</th>
                      <th className="py-2.5 px-2">BALANCE AFTER</th>
                      <th className="py-2.5 px-2">DATE &amp; TIME</th>
                      <th className="py-2.5 pl-2 pr-4">NOTES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions recorded for this reconciliation shift.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => {
                        const isDep = String(tx.transaction_type || tx.type || '').toLowerCase().includes('deposit') ||
                                      String(tx.transaction_type || tx.type || '').toLowerCase().includes('credit');
                        return (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 pl-4 pr-2 font-mono font-bold text-slate-900">
                              {tx.receipt_number || `#TX-${tx.id || idx + 1}`}
                            </td>
                            <td className="py-2.5 px-2">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                  isDep ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {isDep ? <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> : <ArrowUpRight className="w-3 h-3 text-rose-600" />}
                                <span>{isDep ? 'Deposit' : 'Withdrawal'}</span>
                              </span>
                            </td>
                            <td className={`py-2.5 px-2 font-mono font-bold ${isDep ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isDep ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-2.5 px-2 font-mono text-slate-600">
                              {tx.balance_before !== undefined && tx.balance_before !== null ? formatCurrency(tx.balance_before) : '—'}
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                              {tx.balance_after !== undefined && tx.balance_after !== null ? formatCurrency(tx.balance_after) : (tx.balance ? formatCurrency(tx.balance) : '—')}
                            </td>
                            <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                              {formatDateTime(tx.created_at || tx.timestamp || tx.date)}
                            </td>
                            <td className="py-2.5 pl-2 pr-4 text-slate-600 truncate max-w-[150px]" title={tx.notes}>
                              {tx.notes || '—'}
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#00b4a7] hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Audit Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
}
