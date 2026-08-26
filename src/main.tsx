import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safely suppress benign third-party browser extension lifecycle exceptions (e.g. MetaMask/Rabby/Coinbase port disconnects, iframe injection limits)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (
      msg.includes('disconnected port') ||
      msg.includes('Extension context invalidated') ||
      msg.includes('Failed to connect to MetaMask') ||
      msg.includes('User rejected the request') ||
      msg.includes('chrome-extension') ||
      msg.includes('moz-extension') ||
      (msg.includes('Failed to fetch') && msg.includes('extension'))
    ) {
      event.preventDefault();
      console.warn('Safely handled Web3 wallet/extension event:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || String(event || '');
    if (
      msg.includes('disconnected port') ||
      msg.includes('Extension context invalidated') ||
      msg.includes('Failed to connect to MetaMask') ||
      msg.includes('chrome-extension') ||
      msg.includes('moz-extension')
    ) {
      event.preventDefault();
      console.warn('Safely handled Web3 wallet/extension error:', msg);
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
