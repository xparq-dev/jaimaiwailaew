/* global self, caches, fetch */

"use strict";

// This service worker intentionally starts with a narrow public-asset allowlist.
// Financial entries, generated reports, PDFs, API responses, and page responses
// are never written to a service-worker cache by this Phase 0 implementation.
const CACHE_NAMESPACE = "jmwl-public-static";
const CACHE_VERSION = "v1";
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

const NEVER_CACHE_PATH =
  /(?:^\/api(?:\/|$)|^\/calculator(?:\/|$)|^\/start(?:\/|$)|(?:^|\/)(?:export|download|receipt|document)(?:\/|$)|\.(?:pdf|csv|xlsx?)(?:$|\/))/i;

function isSafeStaticRequest(request, url) {
  if (
    url.origin !== self.location.origin ||
    NEVER_CACHE_PATH.test(url.pathname)
  ) {
    return false;
  }

  // Query-bearing public paths are not cached to avoid an unbounded cache key space.
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

  // Navigation stays network-only. On failure, return the static fallback without
  // retaining the requested page or any data it might contain.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_FALLBACK, { ignoreSearch: true }),
      ),
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
