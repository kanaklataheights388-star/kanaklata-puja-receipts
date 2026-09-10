const CACHE='puja-receipts-v3';
const ASSETS=['./','./index.html','./styles.css?v=2','./receipt-theme.css?v=2','./durga-receipt-background.png','./app.js?v=2','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>event.respondWith(fetch(event.request).then(response=>response).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./')))));
