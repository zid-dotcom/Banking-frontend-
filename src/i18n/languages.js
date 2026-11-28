export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    dir: 'ltr',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    dir: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    dir: 'ltr',
  },
];

export function getLanguageByCode(code) {
  const normalized = (code || 'en').split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.find((language) => language.code === normalized) || SUPPORTED_LANGUAGES[0];
}
