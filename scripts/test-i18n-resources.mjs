import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import i18next from 'i18next';

const languageNames = {
  en: 'English',
  ml: 'മലയാളം',
  kn: 'ಕನ್ನಡ',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
};

const languageLabels = {
  en: 'Select Language',
  ml: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
  kn: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  hi: 'भाषा चुनें',
  ta: 'மொழியைத் தேர்ந்தெடுக்கவும்',
};

const localeRoot = path.resolve('src/i18n/locales');
const resources = {};

for (const locale of Object.keys(languageNames)) {
  const file = path.join(localeRoot, locale, 'translation.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(data['common.selectLanguage'], `${locale} catalog must translate common.selectLanguage`);
  resources[locale] = { translation: data };
}

const instance = i18next.createInstance();
await instance.init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: Object.keys(languageNames),
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

for (const [locale, languageName] of Object.entries(languageNames)) {
  await instance.changeLanguage(locale);
  assert.equal(
    instance.t('common.selectLanguage'),
    languageLabels[locale],
    `${locale} should resolve its own translated catalog`
  );
  console.log(`${locale} (${languageName}): catalog loading and switching passed`);
}

await instance.changeLanguage('en');
assert.equal(
  instance.t('login.branchAdmin.resetInstructionsSent', { email: 'member@example.test' }),
  'Branch manager password reset instructions sent to member@example.test',
  'interpolated user-provided data should be preserved'
);

assert.equal(
  instance.t('dashboardModule.emergency.unreadCount', { count: 2 }),
  '2 unread replies',
  'pluralized labels should use active locale rules'
);

console.log('i18next five-language resource, interpolation, and pluralization checks passed');
