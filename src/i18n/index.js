import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLanguageByCode } from './languages.js';
import enTranslations from './locales/en/translation.json';

const STORAGE_KEY = 'aurumfx_language';

const catalogLoaders = {
  en: () => Promise.resolve({ default: enTranslations }),
  ml: () => import('./locales/ml/translation.json'),
  kn: () => import('./locales/kn/translation.json'),
  hi: () => import('./locales/hi/translation.json'),
  ta: () => import('./locales/ta/translation.json'),
};

const loadedLocales = new Set(['en']);

function applyDocumentLocale(language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
  }
}

export async function activateLocale(locale) {
  const language = getLanguageByCode(locale);

  if (!loadedLocales.has(language.code)) {
    const mod = await catalogLoaders[language.code]();
    const translations = mod.default || mod;
    i18n.addResourceBundle(language.code, 'translation', translations, true, true);
    loadedLocales.add(language.code);
  }

  await i18n.changeLanguage(language.code);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, language.code);
  }
  applyDocumentLocale(language);
  return language.code;
}

export async function initializeI18n() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'en';
  const initialLanguage = getLanguageByCode(saved || 'en');

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: enTranslations },
      },
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'ml', 'kn', 'hi', 'ta'],
      keySeparator: false,
      nsSeparator: false,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  }

  return activateLocale(initialLanguage.code);
}

export { i18n };
export default i18n;
