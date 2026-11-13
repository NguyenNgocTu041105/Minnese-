import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Auto-update handling: when mobile Chrome restores from background tab (bfcache)
// or when a new deployment invalidates old lazy-loaded chunks (vite:preloadError)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    if (navigator.onLine) {
      console.warn('[Minnese] New version detected after deploy. Automatically updating...');
      window.location.reload();
    }
  });

  window.addEventListener('pageshow', (event) => {
    // Page restored from mobile browser bfcache / suspended background tab
    if (event.persisted && navigator.onLine) {
      window.location.reload();
    }
  });

  // Gracefully prevent benign AbortError / WebSocket disconnects from surfacing uncaught errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.message || (typeof reason === 'string' ? reason : ''))) || '';
    if (
      reason?.name === 'AbortError' ||
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('The play() request was interrupted') ||
      msg.includes('The user aborted a request') ||
      msg.includes('user aborted')
    ) {
      event.preventDefault();
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

