/* ===== UPLINE Service Worker — Cache-First Offline Strategy ===== */
const CACHE_NAME = 'upline-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/pages.css',
    './js/utils/router.js',
    './js/utils/storage.js',
    './js/engine/symptoms.js',
    './js/engine/triage.js',
    './js/engine/speech.js',
    './js/pages/splash.js',
    './js/pages/dashboard.js',
    './js/pages/voice.js',
    './js/pages/results.js',
    './js/pages/firstaid.js',
    './js/pages/emergency.js',
    './js/pages/hospitals.js',
    './js/pages/settings.js',
    './js/app.js',
    './data/symptoms.json',
    './data/rules.json',
    './data/firstaid.json',
    './data/contacts.json'
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

    // Skip external requests (like Overpass API for hospitals)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        // Network-only for external APIs
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
