import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import {
  InvestmentSchemeDetailModal,
  formatInterestRate
} from '../../components/dashboard/InvestmentSchemeModals';
import { getMemberInvestmentSchemes } from '../../services/investmentSchemeService';
import { getMemberMe } from '../../services/memberService';
import {
  TrendingUp,
  Coins,
  PiggyBank,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Landmark
} from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function MemberInvestmentSchemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    scheme: null,
  });

  const [memberUser, setMemberUser] = useState(() => {
    try {
      const u = localStorage.getItem('member_user');
      if (u) return JSON.parse(u);
    } catch {}
    return { full_name: 'Member', member_code: 'MEM-001' };
  });

  useEffect(() => {
    getMemberMe()
      .then((data) => {
        if (data) setMemberUser(data);
      })
      .catch(() => {});
  }, []);

  const fetchSchemes = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getMemberInvestmentSchemes({
        frequency: frequencyFilter !== 'all' ? frequencyFilter : undefined,
      });
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch member investment schemes:', err);
      setError(err.message || 'Unable to retrieve investment schemes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [frequencyFilter]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
        (s.scheme_code && s.scheme_code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      const matchesFrequency =
        frequencyFilter === 'all' ||
        String(s.contribution_frequency || '').toLowerCase() === frequencyFilter.toLowerCase();

      return matchesSearch && matchesFrequency;
    });
  }, [schemes, searchQuery, frequencyFilter]);

  // Statistics (same 4 cards as Branch Manager)
  const stats = useMemo(() => {
    const total = schemes.length;
    const daily = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'daily'
    ).length;
    const weekly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'weekly'
    ).length;
    const monthly = schemes.filter(
      (s) => String(s.contribution_frequency || '').toLowerCase() === 'monthly'
    ).length;

    return { total, daily, weekly, monthly };
  }, [schemes]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage) || 1;
  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchemes.slice(start, start + itemsPerPage);
  }, [filteredSchemes, currentPage]);

  return (
    <DashboardLayout role="member" user={memberUser} activeTab="investment_schemes">
      <div className="space-y-6">
        {/* Banner Section (Same clean teal style as branch manager, without image) */}
        <div className="bg-gradient-to-r from-[#d8f6ef] via-[#eafaf6] to-[#c7f3e8] rounded-3xl p-5 sm:p-7 lg:p-8 border border-teal-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 max-w-2xl w-full">
            {/* Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xs text-[11px] sm:text-xs font-semibold border border-teal-200/80 shadow-2xs text-[#0f766e] mb-3 max-w-full">
              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00b4a7]" />
                <span>{t("dashboardModule.monthlyTargets.roleLabel", "Role:")} <strong className="font-bold text-teal-950">{t("memberInvestmentSchemes.activeMember", "Active Member")}</strong></span>
              </span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="text-slate-600 sm:text-[#0f766e]">{t("memberInvestmentSchemes.cooperativeInvestmentFolios", "Cooperative Investment Folios")}</span>
              <span className="text-teal-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("common.active", "Active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-1.5 h-7 sm:h-9 bg-[#00b4a7] rounded-full flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                {t("memberInvestmentSchemes.cooperativeInvestmentSchemes", "Cooperative Investment Schemes")}
              </h1>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium leading-relaxed max-w-xl">
              {t("memberInvestmentSchemes.reviewAuthorizedRecurringInvestmentDeposit", "Review authorized recurring investment deposit plans available for society members. Members can enroll in daily, weekly, or monthly contribution schemes with guaranteed cooperative interest.")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => fetchSchemes(true)}
              disabled={loading || refreshing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-teal-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-[#00b4a7] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t("branchManagerInvestmentSchemes.refreshCatalogue", "Refresh Catalogue")}</span>
            </button>
          </div>

          {/* Decorative ambient gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-100/50 blur-2xl" />
          </div>
        </div>

        {/* Statistics Cards (Same 4 cards as Branch Admin) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("branchManagerFdMisSchemes.activeSchemes", "Active Schemes")}
            label={t("branchManagerFdMisSchemes.activeSchemes", "Active Schemes")}
            value={stats.total}
            icon={TrendingUp}
            variant="emerald"
            subtitle={t("memberInvestmentSchemes.verifiedSocietyDepositPlans", "Verified society deposit plans")}
            subtext="Verified society deposit plans"
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.dailySchemes", "Daily Schemes")}
            label={t("branchManagerInvestmentSchemes.dailySchemes", "Daily Schemes")}
            value={stats.daily}
            icon={Coins}
            variant="teal"
            subtitle={t("branchManagerInvestmentSchemes.microDepositPlans", "Micro deposit plans")}
            subtext="Micro deposit plans"
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.weeklySchemes", "Weekly Schemes")}
            label={t("branchManagerInvestmentSchemes.weeklySchemes", "Weekly Schemes")}
            value={stats.weekly}
            icon={Calendar}
            variant="blue"
            subtitle={t("branchManagerInvestmentSchemes.7DayRecurringPlans", "7-day recurring plans")}
            subtext="7-day recurring plans"
          />
          <StatCard
            title={t("branchManagerInvestmentSchemes.monthlySchemes", "Monthly Schemes")}
            label={t("branchManagerInvestmentSchemes.monthlySchemes", "Monthly Schemes")}
            value={stats.monthly}
            icon={PiggyBank}
            variant="purple"
            subtitle={t("branchManagerInvestmentSchemes.monthlyPeriodicPlans", "Monthly periodic plans")}
            subtext="Monthly periodic plans"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("branchManagerInvestmentSchemes.searchInvestmentSchemesByTitle", "Search investment schemes by title, code or terms...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Frequency Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              {t("branchManagerInvestmentSchemes.frequency", "Frequency:")}
            </span>
            {[
              { id: 'all', label: t("branchManagerInvestmentSchemes.allFrequencies", "All Frequencies") },
              { id: 'daily', label: t("branchManagerInvestmentSchemes.daily", "Daily") },
              { id: 'weekly', label: t("branchManagerInvestmentSchemes.weekly", "Weekly") },
              { id: 'monthly', label: t("dashboardModule.monthlyTargets.periodMonthly", "Monthly") },
            ].map((f) => {
              const isActive = frequencyFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFrequencyFilter(f.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchSchemes()}
              className="font-bold underline text-rose-900 cursor-pointer"
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Schemes Catalogue Table (Exact same columns and structure as Branch Admin) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-black text-slate-900 text-base">
                {t("branchManagerInvestmentSchemes.authorizedInvestmentSchemes", "Authorized Investment Schemes")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("common.showing", "Showing")} {filteredSchemes.length} {t("common.of", "of")} {schemes.length} {t("branchManagerFdMisSchemes.schemes", "schemes")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600">{t("memberInvestmentSchemes.loadingInvestmentSchemes", "Loading investment schemes...")}</p>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">{t("branchManagerInvestmentSchemes.noInvestmentSchemesAvailable", "No Investment Schemes Available")}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || frequencyFilter !== 'all'
                  ? t("branchManagerInvestmentSchemes.noSchemesMatchedYourActive", "No schemes matched your active filter. Try resetting search or frequency filters.")
                  : t("memberInvestmentSchemes.noActiveInvestmentSchemesAre", "No active investment schemes are currently available.")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">{t("dashboardModule.productAccounts.schemeName", "Scheme Name")}</th>
                      <th className="py-3 px-4">{t("dashboardModule.productAccounts.schemeCode", "Scheme Code")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.frequency2", "Frequency")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.installment", "Installment")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.investmentDuration", "Investment Duration")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.annualInterestRate", "Annual Interest Rate")}</th>
                      <th className="py-3 px-4">{t("branchManagerInvestmentSchemes.estTotalPrincipal", "Est. Total Principal")}</th>
                      <th className="py-3 px-4 text-center">{t("common.status", "Status")}</th>
                      <th className="py-3 px-4 text-right">{t("dashboardModule.branchOverview.colAction", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSchemes.map((scheme) => {
  const { t } = useTranslation();
                      const schemeId = scheme.id || scheme.scheme_id;
                      const freq = String(scheme.contribution_frequency || 'daily').toLowerCase();
                      const estTotal =
                        (Number(scheme.installment_amount) || 0) *
                        (parseInt(scheme.tenure_installments, 10) || 0);

                      const freqBadges = {
                        daily: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                        weekly: 'bg-blue-50 text-blue-700 border-blue-200/60',
                        monthly: 'bg-purple-50 text-purple-700 border-purple-200/60',
                      };

                      return (
                        <tr key={schemeId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            {scheme.scheme_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 inline-block">
                              {scheme.scheme_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${
                                freqBadges[freq] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {freq}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatCurrency(scheme.installment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {scheme.tenure_installments}{' '}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {freq === 'daily' ? t("branchManagerInvestmentSchemes.days", "Days") : freq === 'weekly' ? t("branchManagerInvestmentSchemes.weeks", "Weeks") : freq === 'monthly' ? t("branchManagerInvestmentSchemes.months", "Months") : t("branchManagerInvestmentSchemes.days", "Days")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600">
                            {formatInterestRate(scheme.annual_interest_rate)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {formatCurrency(estTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                scheme.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  scheme.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{scheme.is_active !== false ? t("common.active", "Active") : t("common.inactive", "Inactive")}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailModal({ isOpen: true, scheme })}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{t("common.view", "View")}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("common.showing", "Showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to", "to")}{' '}
                    {Math.min(currentPage * itemsPerPage, filteredSchemes.length)} {t("common.of", "of")}{' '}
                    {filteredSchemes.length} {t("branchManagerFdMisSchemes.schemes", "schemes")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                    >
                      {t("branchManagerFdMisSchemes.previous", "Previous")}
                    </button>
                    <span className="text-slate-700 font-bold">
                      {t("branchManagerInvestmentSchemes.page", "Page")} {currentPage} {t("common.of", "of")} {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
                    >
                      {t("branchManagerFdMisSchemes.next", "Next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Detail Modal */}
      <InvestmentSchemeDetailModal
        isOpen={detailModal.isOpen}
        scheme={detailModal.scheme}
        onClose={() => setDetailModal({ isOpen: false, scheme: null })}
      />
    </DashboardLayout>
  );
}
