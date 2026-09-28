/* Optional offline shell for the server edition; standalone HTML skips this file. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || !window.isSecureContext || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope:'/', updateViaCache:'none' }).catch(error => {
      // Offline caching is optional. The map must remain usable if storage is denied.
      console.warn('Spot offline caching is unavailable:', error.message);
    });
  });
})();
