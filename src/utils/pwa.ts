export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] ServiceWorker registration failed:', error);
        });
    });
  }
}
