const CACHE = 'shuttle-static-v2';
const BASE = new URL('.', self.registration.scope);
const ASSETS = ['', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new URL(path, BASE).href)))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(BASE.pathname)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response;
  }).catch(()=>caches.match(new URL('index.html', BASE).href))));
});
