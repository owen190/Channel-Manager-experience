const CACHE_VERSION = 'v1';
const STATIC_CACHE = `channel-companion-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `channel-companion-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/live/manager',
  '/offline.html',
  '/manifest.json',
];

const API_ROUTES = ['/api/'];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets aren't available yet
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API calls: network-first strategy
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'Offline - no cached response available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Background sync for offline note creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncOfflineNotes());
  }
});

async function syncOfflineNotes() {
  try {
    const db = await openIndexedDB();
    const notes = await getOfflineNotes(db);

    for (const note of notes) {
      try {
        const response = await fetch('/api/live/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        });

        if (response.ok) {
          await deleteOfflineNote(db, note.id);

          // Notify clients of sync success
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              noteId: note.id,
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync note:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChannelCompanion', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineNotes')) {
        db.createObjectStore('offlineNotes', { keyPath: 'id' });
      }
    };
  });
}

function getOfflineNotes(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineNotes', 'readonly');
    const store = transaction.objectStore('offlineNotes');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteOfflineNote(db, noteId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineNotes', 'readwrite');
    const store = transaction.objectStore('offlineNotes');
    const request = store.delete(noteId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message handler for client requests
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
