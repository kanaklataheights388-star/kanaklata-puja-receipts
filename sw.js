const CACHE='puja-receipts-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./styles.css','./receipt-theme.css','./durga-receipt-background.png','./app.js','./manifest.webmanifest']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
