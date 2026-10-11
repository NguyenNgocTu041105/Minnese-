import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Gracefully prevent benign AbortError / WebSocket disconnects from surfacing uncaught errors
if (typeof window !== 'undefined') {
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

