import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check, X, Search } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../i18n/languages.js';
import { activateLocale } from '../i18n/index.js';

export default function LanguageSelector({
  variant = 'default', // 'default', 'navbar', 'dashboard', 'mobile'
  className = '',
}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [allModalOpen, setAllModalOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const dropdownRef = useRef(null);

  const currentLangCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const currentLang = getLanguageByCode(currentLangCode);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setAllModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectLanguage = async (code) => {
    try {
      await activateLocale(code);
      setLoadError('');
      setIsOpen(false);
      setAllModalOpen(false);
      setDropdownSearch('');
      setModalSearch('');
    } catch (error) {
      console.error(`Unable to load the ${code} translation catalog.`, error);
      setLoadError(
        t('common.languageLoadError', 'Unable to load the selected language. Please try again.')
      );
    }
  };

  const filterLanguages = (query) => {
    if (!query.trim()) return SUPPORTED_LANGUAGES;
    const q = query.toLowerCase().trim();
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  };

  const filteredDropdownLanguages = filterLanguages(dropdownSearch);
  const filteredModalLanguages = filterLanguages(modalSearch);

  // Button styling based on variant
  const getButtonStyles = () => {
    if (variant === 'dashboard') {
      return 'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 shadow-xs cursor-pointer select-none';
    }
    if (variant === 'mobile') {
      return 'w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm cursor-pointer select-none';
    }
    // Navbar / default
    return 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200/80 shadow-2xs cursor-pointer select-none';
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {loadError && (
        <p role="alert" className="absolute right-0 top-full mt-2 w-72 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 shadow-lg">
          {loadError}
        </p>
      )}
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonStyles()}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t("common.selectLanguage", "Select Language")}
      >
        <Globe className="w-4 h-4 text-[#008579] flex-shrink-0" />
        <span className="font-medium text-slate-800">
          {currentLang.nativeName || currentLang.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#008579]' : ''
          }`}
        />
      </button>

      {/* Floating language menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-fadeIn text-left select-none">
          {/* Header */}
          <div className="px-3.5 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("common.selectLanguage", "Select Language")}
            </span>
            <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
              {t("common.supportedLanguages", "5 supported languages")}
            </span>
          </div>

          {/* Quick Search within Dropdown */}
          <div className="px-2.5 pt-2 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                placeholder={t("common.searchLanguage", "Search by language name or code...")}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#008579] focus:bg-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Languages List with Native Script & Status Badges */}
          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin divide-y divide-slate-50">
            {filteredDropdownLanguages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                {t("common.noMatchingLanguages", "No matching languages found")}
              </div>
            ) : (
              filteredDropdownLanguages.map((lang) => {
                const isSelected = currentLangCode === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 text-[#008579] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {lang.nativeName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {lang.name} {lang.dir === 'rtl' ? '• RTL' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        {t("common.available", "Available")}
                      </span>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#008579] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Action: View All in Full Modal */}
          <div className="border-t border-slate-100 pt-2 mt-1 px-2.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAllModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#008579] hover:bg-teal-50/70 rounded-xl transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#008579]" />
              <span>{t("common.viewAllLanguages", "View All 5 Supported Languages")}</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUPPORTED LANGUAGES MODAL
         ===================================================================== */}
      {allModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setAllModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-scaleUp max-h-[90vh] flex flex-col select-none">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008579] flex items-center justify-center shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                    {t("common.indianLanguagesTitle", "Select a Language")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("common.languageListDescription", "Choose from English, Malayalam, Kannada, Hindi, or Tamil.")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAllModalOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title={t("common.close", "Close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={t("common.searchLanguage", "Search by language name or code...")}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#008579] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Grid of Languages */}
            <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 scrollbar-thin">
              {filteredModalLanguages.map((lang) => {
                const isSelected = currentLangCode === lang.code;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/80 shadow-xs'
                        : 'border-slate-200/80 hover:border-teal-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {lang.nativeName}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#008579] stroke-[2.5] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {lang.name} &bull; <span className="font-mono text-[10px]">{lang.code.toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                        {t("common.available", "Available")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer Note */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{t("common.languageSelectionNote", "Your selection applies across the website and all role dashboards.")}</span>
              <button
                type="button"
                onClick={() => setAllModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
