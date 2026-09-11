import './polyfill';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { wazeerDB } from '@/lib/db';
import App from '@/App';
import './index.css';

async function bootstrap() {
  await wazeerDB.init();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* PWA service worker registration failed — non-critical */
    });
  });
}
