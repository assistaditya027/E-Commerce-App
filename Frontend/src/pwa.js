import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

if (typeof window !== 'undefined') {
  const OFFLINE_URL = '/offline.html';
  let redirecting = false;

  const redirectWithFade = (url) => {
    if (redirecting) return;
    redirecting = true;
    const root = document.documentElement;
    root.classList.add('offline-transition');
    window.setTimeout(() => {
      window.location.replace(url);
    }, 220);
  };

  const goOffline = () => {
    if (window.location.pathname !== OFFLINE_URL) {
      redirectWithFade(OFFLINE_URL);
    }
  };

  const goOnline = () => {
    if (window.location.pathname === OFFLINE_URL) {
      redirectWithFade('/');
    }
  };

  window.addEventListener('offline', goOffline);
  window.addEventListener('online', goOnline);

  if (!navigator.onLine) {
    goOffline();
  }
}
