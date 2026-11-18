import React from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function RecentTransactionsTable({
  title = 'Recent Transactions',
  subtitle = 'Verified society ledger entries',
  transactions = [],
  onViewAll
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-[#0d9488] hover:text-[#0f766e] hover:underline self-start sm:self-auto cursor-pointer"
          >
            View Full Ledger &rarr;
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-5">Transaction / Folio</th>
              <th className="py-3.5 px-5">Type / Category</th>
              <th className="py-3.5 px-5">Date & Time</th>
              <th className="py-3.5 px-5">Amount</th>
              <th className="py-3.5 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-5 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Cash counter deposits and withdrawals will appear here in real time as soon as they are processed.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
              const isCredit = tx.type === 'credit' || tx.type === 'deposit';
              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{tx.description}</p>
                        <span className="text-[11px] text-slate-400 font-mono">{tx.refNo}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-5 text-xs font-medium text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                      {tx.category}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                    {tx.date}
                  </td>

                  <td className="py-4 px-5 whitespace-nowrap">
                    <span
                      className={`font-extrabold text-sm sm:text-base ${
                        isCredit ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{tx.amount}
                    </span>
                  </td>

                  <td className="py-4 px-5 whitespace-nowrap">
                    {tx.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                    {tx.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        Processing
                      </span>
                    )}
                    {tx.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#00b4a7] border border-teal-200/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
