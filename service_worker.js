// Service Worker voor de Aanwezigheidsapp
const CACHE_NAME = 'aanwezigheidsapp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Installeer de service worker en cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
      })
  );
});

// Activeer de service worker en verwijder oude caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch events - gebruik cache-first strategie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Gebruik cache indien beschikbaar
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Anders haal het van het netwerk
        return fetch(event.request)
          .then(response => {
            // Controleer voor geldige response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache het resultaat
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});
