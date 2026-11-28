import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const localeRoot = path.join(sourceRoot, 'i18n', 'locales');
const locales = ['en', 'ml', 'kn', 'hi', 'ta'];
const expectedLocaleSet = new Set(locales);

const localeDirs = fs
  .readdirSync(localeRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const catalogs = Object.fromEntries(
  locales.map((locale) => {
    const file = path.join(localeRoot, locale, 'translation.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return [locale, data];
  })
);

const enKeys = Object.keys(catalogs.en);
const sharedAllowlist = new Set([
  'AurumFX',
  'Aurumfx Multi State Agro Co-operative Society Limited',
  '+91 751 010 4000',
  'Google Play',
  'App Store',
  'N/A',
  'IFSC',
  'OTP',
  'PDF',
  'CSV',
  'INR',
]);

function listFiles(directory, extensions) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', '.git', '__pycache__'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(file, extensions);
    return entry.isFile() && extensions.has(path.extname(entry.name)) ? [file] : [];
  });
}

const sourceFiles = listFiles(sourceRoot, new Set(['.js', '.jsx'])).filter(
  (file) => !file.includes(`${path.sep}i18n${path.sep}locales${path.sep}`)
);

const linguiReferences = [];
const usedKeys = new Set();
const missingInEnglish = [];
const disconnectedComponents = [];
const hardcodedCandidates = [];

const keyCallRegex = /\b(?:i18n\.)?t\(\s*(['"])([^'"\n]+)\1/g;

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(root, file).split(path.sep).join('/');

  if (/@lingui\/|useLingui\s*\(|linguiT\s*\(/.test(source)) {
    linguiReferences.push(relativePath);
  }

  for (const match of source.matchAll(keyCallRegex)) {
    const key = match[2];
    usedKeys.add(key);
    if (catalogs.en[key] === undefined) {
      missingInEnglish.push({ file: relativePath, key });
    }
  }

  const isPageOrComponent =
    (relativePath.startsWith('src/pages/') || relativePath.startsWith('src/components/')) &&
    source.split('\n').length > 5 &&
    relativePath !== 'src/components/dashboard/DashboardLayout.jsx';

  if (isPageOrComponent && !/useTranslation\s*\(|i18n\.t\s*\(/.test(source)) {
    disconnectedComponents.push(relativePath);
  }

  if (relativePath.startsWith('src/pages/') || relativePath.startsWith('src/components/')) {
    for (const match of source.matchAll(/>\s*([A-Za-z][^<>{}\n]*?)\s*</g)) {
      const text = match[1].trim();
      if (
        text.length >= 3 &&
        /[A-Za-z]{2,}/.test(text) &&
        !/^(https?:|className|return|const|let|var|import|export|true|false|null|e\.g\.)/.test(text)
      ) {
        hardcodedCandidates.push({ file: relativePath, text: text.slice(0, 80) });
      }
    }
  }
}

const coverage = {};
let totalMissingRegional = 0;
let totalUnchangedEnglish = 0;

for (const locale of locales) {
  const catalog = catalogs[locale];
  const keys = Object.keys(catalog);
  const missing = enKeys.filter((k) => !catalog[k]);
  const unchanged =
    locale === 'en'
      ? []
      : enKeys.filter(
          (k) =>
            catalog[k] &&
            catalog[k] === catalogs.en[k] &&
            !sharedAllowlist.has(catalogs.en[k]) &&
            /[a-zA-Z]{3,}/.test(catalogs.en[k])
        );
  const translated = enKeys.length - missing.length - unchanged.length;
  coverage[locale] = {
    catalogKeys: keys.length,
    translatedKeys: translated,
    missingKeys: missing.length,
    unchangedEnglishKeys: unchanged.length,
    translatedPercent:
      enKeys.length === 0 ? 100 : Number(((translated / enKeys.length) * 100).toFixed(1)),
  };
  if (locale !== 'en') {
    totalMissingRegional += missing.length;
    totalUnchangedEnglish += unchanged.length;
  }
}

const appSource = fs.readFileSync(path.join(sourceRoot, 'App.jsx'), 'utf8');
const routeCount = [...appSource.matchAll(/<Route\s+path=/g)].length;

const report = {
  i18nLibrary: 'i18next + react-i18next',
  supportedLocales: locales,
  unexpectedLocaleDirectories: localeDirs.filter((l) => !expectedLocaleSet.has(l)),
  routesChecked: routeCount,
  sourceFilesChecked: sourceFiles.length,
  extractedKeysInSource: usedKeys.size,
  missingInEnglishCount: missingInEnglish.length,
  disconnectedComponentsCount: disconnectedComponents.length,
  hardcodedTextCandidatesCount: hardcodedCandidates.length,
  missingRegionalTranslations: totalMissingRegional,
  unchangedEnglishTranslations: totalUnchangedEnglish,
  linguiReferencesRemaining: linguiReferences.length,
  catalogs: coverage,
  samples: {
    disconnectedComponents: disconnectedComponents.slice(0, 10),
    missingInEnglish: missingInEnglish.slice(0, 10),
    hardcodedCandidates: hardcodedCandidates.slice(0, 10),
  },
};

console.log(JSON.stringify(report, null, 2));

if (
  localeDirs.length !== locales.length ||
  report.unexpectedLocaleDirectories.length > 0 ||
  linguiReferences.length > 0 ||
  disconnectedComponents.length > 0 ||
  totalMissingRegional > 0
) {
  process.exitCode = 1;
}
