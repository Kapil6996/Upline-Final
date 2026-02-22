/* ===== UPLINE Service Worker — Cache-First Offline Strategy ===== */
const CACHE_NAME = 'upline-v24';

// Forced-offline mode flag — toggled by postMessage from the page
let forcedOffline = false;

// Listen for messages from the page to toggle network mode
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_OFFLINE_MODE') {
        forcedOffline = event.data.offline;
        console.log('[SW] forcedOffline =', forcedOffline);
        // Notify all clients of the new state
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'OFFLINE_MODE_CHANGED', offline: forcedOffline });
            });
        });
    }
    // Allow page to force new SW to take over immediately
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/pages.css',
    './js/utils/router.js?v=24',
    './js/utils/storage.js?v=24',
    './js/engine/symptoms.js?v=24',
    './js/engine/triage.js?v=24',
    './js/engine/speech.js?v=24',
    './js/pages/splash.js?v=24',
    './js/pages/dashboard.js?v=24',
    './js/pages/voice.js?v=24',
    './js/pages/results.js?v=24',
    './js/pages/firstaid.js?v=24',
    './js/pages/emergency.js?v=24',
    './js/pages/network.js?v=24',
    './js/pages/hospitals.js?v=24',
    './js/pages/settings.js?v=24',
    './js/pages/medicalid.js?v=24',
    './js/pages/vault.js?v=24',
    './js/pages/map.js?v=24',
    './js/pages/triage-chat.js?v=24',
    './js/app.js?v=24',
    './data/symptoms.json',
    './data/rules.json',
    './data/firstaid.json',
    './data/contacts.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
];

// Install — precache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch — cache-first strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Handle external requests (Leaflet, Map tiles, Overpass API)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {

        // Dynamic caching for map tiles and Leaflet assets
        if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('unpkg.com')) {
            event.respondWith(
                caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return from cache, but fetch in background to update
                        if (!forcedOffline) {
                            fetch(event.request).then((networkResponse) => {
                                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                            }).catch(() => { });
                        }
                        return cachedResponse;
                    }
                    if (forcedOffline) {
                        return new Response(null, { status: 404, statusText: 'Offline' });
                    }
                    return fetch(event.request).then((networkResponse) => {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                        return networkResponse;
                    }).catch(() => new Response(null, { status: 404 }));
                })
            );
            return;
        }

        // If forced offline, block other external network requests
        if (forcedOffline) {
            event.respondWith(
                Promise.resolve(new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                }))
            );
            return;
        }
        // Network-only for other external APIs (like emergency routing)
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Cache-first for local assets
    event.respondWith(
        caches.match(event.request)
            .then((cached) => {
                if (cached) return cached;

                return fetch(event.request).then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback for HTML pages
                if (event.request.headers.get('Accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            })
    );
});
