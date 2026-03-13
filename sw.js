// CollaBoard Service Worker
// Auto-refresh on hard reload for real-time collaborative app

const CACHE_NAME = 'collaboard-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Hard reload detection: Check if this is a forced reload
// In a hard reload (Ctrl+F5/Cmd+Shift+R), the navigation preload or
// skipWaiting behavior helps us detect this
let isHardReload = false;

// HIGH PRIORITY FIX: Add counter limit to prevent hard reload loop
const HARD_RELOAD_MAX_ATTEMPTS = 2;

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
  // Skip waiting immediately - this ensures the new SW activates right away
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        // Silently handle cache failure
      })
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              return caches.delete(name);
            })
        );
      }),
      // Claim all clients so the SW is in control immediately
      self.clients.claim()
    ])
  );
  
  // Notify all clients that the SW has activated
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        timestamp: Date.now()
      });
    });
  });
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with fresh content
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For same-origin requests, use cache-first strategy
  if (url.origin === self.location.origin) {
    // For index.html specifically, always try network first to detect updates
    if (url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
          .catch(() => {
            return caches.match(request);
          })
      );
      return;
    }
    
    // For other assets, use stale-while-revalidate
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // For cross-origin requests (e.g., PeerJS CDN), just fetch
  event.respondWith(fetch(request));
});

// ==================== MESSAGE EVENT ====================
// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (!data) return;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      // Force skip waiting
      self.skipWaiting();
      break;
      
    case 'CHECK_FOR_UPDATE':
      // Trigger an update check
      self.registration.update();
      break;
      
    case 'HARD_RELOAD_DETECTED':
      // HIGH PRIORITY FIX: Add counter limit (max 2 attempts) to prevent hard reload loop
      const reloadCount = parseInt(event.data.attemptCount || '0', 10);
      if (reloadCount >= HARD_RELOAD_MAX_ATTEMPTS) {
        // Max attempts reached, don't reload again
        return;
      }
      
      // Client detected a hard reload - clear cache to ensure fresh content
      isHardReload = true;
      
      // Fire-and-forget - no waitUntil for MessageEvent
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(urlsToCache);
        });
      });
      break;
      
    default:
      break;
  }
});

// ==================== SYNC EVENT (Background) ====================
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(
      self.registration.update()
    );
  }
});

// ==================== PERIODIC SYNC ====================
// Check for updates periodically if supported
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(
      self.registration.update()
    );
  }
});
