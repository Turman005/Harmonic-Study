/* Atualize VERSION ao publicar novos arquivos. Uma versão completa é armazenada
   antes da ativação. Sem skipWaiting: nenhuma troca de arquivos durante o estudo. */
const VERSION = 'estudo-musical-v2-20261026-1';
const FILES = ['./', './index.html', './assets/base.css', './assets/app.css', './assets/engine.js', './assets/app.js', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable.png'];
const ALLOWED = new Set(FILES.map(file => new URL(file, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('estudo-musical-v2-') && key !== VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !ALLOWED.has(new URL(request.url).origin + new URL(request.url).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });
    if(cached) return cached;
    try { return await fetch(request); }
    catch(error) {
      if(request.mode === 'navigate') return await cache.match('./index.html');
      throw error;
    }
  })());
});
