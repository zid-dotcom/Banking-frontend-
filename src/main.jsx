import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nextProvider } from 'react-i18next'
import { i18n, initializeI18n } from './i18n/index.js'

const root = createRoot(document.getElementById('root'))

try {
  await initializeI18n()
  root.render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </StrictMode>,
  )
} catch (error) {
  console.error('Unable to initialize application translations.', error)
  root.render(<div role="alert">Unable to load application translations.</div>)
}
