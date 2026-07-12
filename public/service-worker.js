// ============================================
// SERVICE WORKER - OFFLINE SUPPORT
// ============================================

const CACHE_NAME = 'school-results-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.webmanifest',
  '/assets/css/main.css',
  '/assets/css/auth.css',
  '/assets/css/dashboard.css',
  '/assets/css/table.css',
  '/assets/css/responsive.css',
  '/assets/css/animations.css',
  '/assets/js/config.js',
  '/assets/js/utils.js',
  '/assets/js/cache.js',
  '/assets/js/offline.js',
  '/assets/js/api.js',
  '/assets/js/auth.js',
  '/assets/js/students.js',
  '/assets/js/subjects.js',
  '/assets/js/results.js',
  '/assets/js/reports.js',
  '/assets/js/staff.js',
  '/assets/js/subscription.js',
  '/assets/js/developer.js',
  '/assets/js/ui.js',
  '/assets/js/app.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses for future
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Offline fallback
            return new Response('Hakuna mtandao', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
