import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safely suppress benign third-party browser extension lifecycle exceptions (e.g. MetaMask/Rabby port disconnects in iframes)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('disconnected port') ||
      msg.includes('Extension context invalidated') ||
      msg.includes('Failed to fetch') && msg.includes('chrome-extension')
    ) {
      event.preventDefault();
      console.warn('Suppressed third-party browser extension port disconnect error:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('disconnected port') ||
      msg.includes('Extension context invalidated')
    ) {
      event.preventDefault();
      console.warn('Suppressed third-party browser extension port error:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
