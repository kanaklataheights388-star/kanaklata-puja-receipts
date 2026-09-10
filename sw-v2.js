const CACHE='puja-receipts-v7';
const ASSETS=['./','./index.html','./styles.css?v=6','./receipt-theme.css?v=6','./durga-receipt-background.png','./community-puja-moment.jpg','./app.js?v=6','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>event.respondWith(fetch(event.request).then(response=>response).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./')))));
