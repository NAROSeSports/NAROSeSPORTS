// Service worker: makes the app open instantly and work offline.
// - Pages: network first, falling back to the cached app shell when offline.
// - Built assets (hashed filenames): cache first.
// - Fonts & images: stale-while-revalidate.
// Firestore and /api requests are left alone (Firestore has its own offline cache).

const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS, RUNTIME].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put("/", response.clone());
    return response;
  });
  const cached = await cache.match("/");
  if (!cached) return network.catch(() => Response.error());
  // On patchy connections don't wait forever: fall back to the cached app after 3s.
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), 3000));
  return Promise.race([network.catch(() => cached), timeout]);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    trim(cacheName, 80);
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
        trim(RUNTIME, 150);
      }
      return response;
    })
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return;
    // Share-target launches (/?text=...) are navigations too, so sharing works offline.
    if (request.mode === "navigate") return event.respondWith(networkFirstPage(request));
    if (url.pathname.startsWith("/assets/")) return event.respondWith(cacheFirst(request, ASSETS));
    return event.respondWith(staleWhileRevalidate(request));
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "i.ytimg.com") {
    return event.respondWith(staleWhileRevalidate(request));
  }
});
