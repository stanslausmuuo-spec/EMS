import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import App from './App';
import './index.css';

const RELOAD_GUARD_KEY = 'ems_preload_reloaded';

window.addEventListener('load', () => {
  try {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
  } catch {
    /* ignore */
  }
});

// A lazily-loaded asset/chunk failed to fetch — most often a stale deploy where the
// old HTML references hashed files that no longer exist. Reload once to self-heal.
window.addEventListener('vite:preloadError', (event) => {
  let alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD_KEY) === '1';
  } catch {
    /* ignore */
  }
  if (alreadyReloaded) {
    console.error('Asset preload failed again after reload:', event?.payload);
    return;
  }
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
  } catch {
    /* ignore */
  }
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((err) => console.warn('ServiceWorker registration failed: ', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
