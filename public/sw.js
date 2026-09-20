/* global self, caches, fetch */

"use strict";

// Service Worker for Phase 1B: Calculator UX.
// Caches public static assets, app shell, and route assets needed to open the calculator offline.
// Strictly NEVER caches user-generated data, entries, localStorage, PDF/CSV/Excel, or API responses.
const CACHE_NAMESPACE = "jmwl-public-static";
const CACHE_VERSION = "v2";
const STATIC_CACHE = `${CACHE_NAMESPACE}-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = "/offline-fallback.html";

const PRECACHE_URLS = [
  OFFLINE_FALLBACK,
  "/icons/icon.svg",
  "/icons/maskable-icon.svg",
];

const SAFE_STATIC_PATHS = new Set([
  OFFLINE_FALLBACK,
  "/favicon.ico",
  "/manifest.webmanifest",
  "/site.webmanifest",
]);

// Never cache API routes, export/download endpoints, generated documents, uploads, or sensitive paths
const NEVER_CACHE_PATH =
  /(?:^\/api(?:\/|$)|(?:^|\/)(?:export|download|receipt|document|upload)(?:\/|$)|\.(?:pdf|csv|xlsx?|zip)(?:$|\/))/i;

function isSafeStaticRequest(request, url) {
  if (
    url.origin !== self.location.origin ||
    NEVER_CACHE_PATH.test(url.pathname)
  ) {
    return false;
  }

  // Query-bearing public paths are not cached to avoid unbounded cache keys and leak risks
  if (url.search && !url.pathname.startsWith("/_next/static/")) {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    SAFE_STATIC_PATHS.has(url.pathname)
  );
}

async function cacheFirstPublicAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(`${CACHE_NAMESPACE}-`) &&
                cacheName !== STATIC_CACHE,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: Network-first for fresh static HTML shell, falling back to cached shell or offline fallback.
  // The static HTML shell contains NO user financial data (financial data resides purely in localStorage via Zustand).
  if (request.mode === "navigate") {
    const canCacheShell = !url.search && !NEVER_CACHE_PATH.test(url.pathname);

    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (canCacheShell && response.ok && response.type === "basic") {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match(request);
          if (cachedShell) {
            return cachedShell;
          }
          return caches.match(OFFLINE_FALLBACK, { ignoreSearch: true });
        }),
    );
    return;
  }

  if (!isSafeStaticRequest(request, url)) {
    return;
  }

  event.respondWith(cacheFirstPublicAsset(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CLEAR_PUBLIC_STATIC_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((cacheName) =>
                cacheName.startsWith(`${CACHE_NAMESPACE}-`),
              )
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
    );
  }
});
