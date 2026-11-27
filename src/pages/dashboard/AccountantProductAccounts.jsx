import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProductAccountsDirectoryView from '../../components/dashboard/ProductAccountsDirectoryView';
import {
  Landmark,
  Coins,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Calculator
} from 'lucide-react';

export default function AccountantProductAccounts() {
  const [activeTab, setActiveTab] = useState('fd_mis'); // 'fd_mis' | 'investment'

  return (
    <DashboardLayout role="staff" activeTab="product_accounts">
      <div className="space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Calculator className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>Role: <strong className="font-bold text-teal-950">Accountant</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">Financial Auditing &amp; Ledgers</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Auditor Access
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Deposit &amp; Investment Accounts
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              Inspect opened term fixed deposits, monthly income schemes (MIS), and recurring investment accounts across branch folios.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-center pointer-events-none flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/80 border border-teal-200/80 shadow-sm flex items-center justify-center text-teal-700 backdrop-blur-xs">
              <Landmark className="w-10 h-10 sm:w-12 sm:h-12 text-[#00b4a7]" />
            </div>
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('fd_mis')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'fd_mis'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>FD &amp; MIS Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('investment')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'investment'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Investment Accounts</span>
          </button>
        </div>

        {/* Product Accounts Content */}
        {activeTab === 'fd_mis' ? (
          <ProductAccountsDirectoryView
            role="accountant"
            productType="fd_mis"
            title="Branch FD &amp; MIS Accounts"
          />
        ) : (
          <ProductAccountsDirectoryView
            role="accountant"
            productType="investment"
            title="Branch Investment Accounts"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
