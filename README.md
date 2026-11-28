# AurumFX Banking Application

## Internationalization

The application uses LinguiJS for English (`en`), Malayalam (`ml`), Kannada (`kn`), Hindi (`hi`), and Tamil (`ta`). English is selected by default. The language selector stores the choice in `aurumfx_language`; catalogs are loaded on demand and remain active across routes.

Lingui catalogs are maintained in `src/i18n/locales/{locale}/messages.po`.

```sh
npm run i18n:extract
npm run i18n:compile
npm run check:i18n
npm run test:i18n:resources
```

Use Lingui macros for new interface messages:

```jsx
import { Trans } from '@lingui/react/macro';

<button><Trans>Save changes</Trans></button>
```

For messages in JavaScript, use `t` or `msg` from `@lingui/core/macro`. Supply stable IDs and translator-friendly defaults for interpolated or plural messages. Keep the five catalogs synchronized after extraction and translate every new entry before release. Missing messages are reported and shown with an explicit translation-needed marker instead of silently falling back to English.

Use the `useLocaleFormatting` hook from `src/i18n/useLocaleFormatting.js` for locale-aware dates, numbers, and INR amounts. Formatting does not alter stored values or personal data.
