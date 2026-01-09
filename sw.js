/**
 * Service Worker for Restaurant Picker PWA
 *
 * Provides offline support through caching strategies:
 * - Static assets: Cache-first strategy
 * - API calls: Network-first with fallback to cache
 * - Images: Cache-first with network fallback
 *
 * Version: 1.0.0
 */

const CACHE_NAME = 'restaurant-picker-v1';
const STATIC_CACHE = 'restaurant-picker-static-v1';
const API_CACHE = 'restaurant-picker-api-v1';
const IMAGE_CACHE = 'restaurant-picker-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/sw.js'];

/**
 * Service Worker Installation
 * Pre-caches static assets for offline use
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

/**
 * Service Worker Activation
 * Cleans up old caches from previous versions
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event Handler
 * Implements caching strategies based on request type
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Image requests: Cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets: Cache-first strategy
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

/**
 * Network-First Strategy
 * Try network first, fall back to cache if network fails
 * Useful for API calls that should be fresh but work offline
 *
 * @param {Request} request - The fetch request
 * @param {string} cacheName - Name of cache to use
 * @returns {Promise<Response>} - Response from network or cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // If successful, update cache and return response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for API failures
    return new Response(
      JSON.stringify({
        error: 'Offline - cached data not available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

/**
 * Cache-First Strategy
 * Check cache first, fall back to network if not cached
 * Useful for static assets that don't change often
 *
 * @param {Request} request - The fetch request
 * @param {string} cacheName - Name of cache to use
 * @returns {Promise<Response>} - Response from cache or network
 */
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Cache miss, try network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);

    // Return fallback response
    return new Response('Offline - content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Message Handler
 * Handles messages from the main application
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls, cacheName } = event.data;
    event.waitUntil(caches.open(cacheName || STATIC_CACHE).then((cache) => cache.addAll(urls)));
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
    );
  }
});

/**
 * Background Sync Handler
 * Handles background sync for pending operations
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-restaurants') {
    event.waitUntil(syncRestaurants());
  }
});

/**
 * Sync Restaurants
 * Syncs any pending restaurant changes when back online
 */
async function syncRestaurants() {
  try {
    // Get pending changes from IndexedDB or cache
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();

    // Process pending requests
    for (const request of requests) {
      if (request.method !== 'GET') {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('[ServiceWorker] Sync failed for request:', error);
        }
      }
    }

    console.log('[ServiceWorker] Sync complete');
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}
