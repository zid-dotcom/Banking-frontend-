import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useLocaleFormatting() {
  const { i18n } = useTranslation();
  const locale = `${(i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]}-IN`;

  const formatDate = useCallback(
    (value, options) => {
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : new Intl.DateTimeFormat(locale, options).format(date);
    },
    [locale]
  );
  const formatNumber = useCallback(
    (value, options) => {
      const number = Number(value);
      return Number.isFinite(number)
        ? new Intl.NumberFormat(locale, options).format(number)
        : String(value);
    },
    [locale]
  );
  const formatCurrency = useCallback(
    (value, currency = 'INR', options) => {
      const number = Number(value);
      return Number.isFinite(number)
        ? new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            ...options,
          }).format(number)
        : String(value);
    },
    [locale]
  );

  return { formatDate, formatNumber, formatCurrency };
}
