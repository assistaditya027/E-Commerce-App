import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

if (typeof window !== 'undefined') {
  const OFFLINE_URL = '/offline.html';

  const goOffline = () => {
    if (window.location.pathname !== OFFLINE_URL) {
      window.location.replace(OFFLINE_URL);
    }
  };

  const goOnline = () => {
    if (window.location.pathname === OFFLINE_URL) {
      window.location.replace('/');
    }
  };

  window.addEventListener('offline', goOffline);
  window.addEventListener('online', goOnline);

  if (!navigator.onLine) {
    goOffline();
  }
}
