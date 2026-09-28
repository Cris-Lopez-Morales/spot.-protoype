/* Offline shell only. No inference, background location, or third-party fetches. */
const VERSION='spot-map-4.7.0', SHELL=VERSION+'-shell';
const FILES=['/','/index.html','/manifest.webmanifest','/spot/theme-boot.js','/spot/styles.css','/spot/brand.css','/spot/venue-cover.css','/spot/lincoln-data.js','/spot/core.js','/spot/place-search.js','/spot/map-core.js','/spot/map-gestures.js','/spot/map-renderer.js','/spot/theme.js','/spot/venue-cover.js','/spot/app.js','/spot/pwa.js','/spot/assets/spot-mark.svg','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);await cache.addAll(FILES);await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  // Migrate only this project's old shells/assets. Do not erase conversations,
  // IndexedDB, saved map preferences, or unrelated applications' caches.
  for(const name of await caches.keys())if(/^(spot-ai-|spot-map-)/.test(name)&&name!==SHELL)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||event.request.method!=='GET'||!FILES.includes(url.pathname))return;
  // No generic navigation fallback: removed routes cannot reopen a cached chat UI.
  event.respondWith((async()=>{
    const cache=await caches.open(SHELL);
    try { const response=await fetch(event.request);if(response.ok&&!response.redirected)await cache.put(url.pathname,response.clone());return response; }
    catch { return await cache.match(url.pathname)||Response.error(); }
  })());
});
