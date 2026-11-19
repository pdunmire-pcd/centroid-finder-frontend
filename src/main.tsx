import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AppThemeProvider } from './components/layout/AppThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Theme + light/dark mode for the whole app */}
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
