// Auto-versioned — updates automatically on every deploy
const CACHE = 'wavr-cache-1773025362';

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, no waiting
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/wavr/manifest.json', '/wavr/icon-192.png', '/wavr/icon-512.png'])
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for APIs and external resources
  const isExternal = ['supabase','spotify','youtube','googleapis','gstatic',
    'ytimg','esm.sh','jsdelivr','unpkg','allorigins','corsproxy','codetabs',
    'fonts.googleapis','fonts.gstatic'].some(h => url.hostname.includes(h));
  if (isExternal) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status:503})));
    return;
  }

  // NETWORK FIRST for HTML — always fetch fresh, fall back to cache offline
  if (e.request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/wavr/' ||
      url.pathname === '/wavr') {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for icons and manifest
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET')
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
    )
  );
});
