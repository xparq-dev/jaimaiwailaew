/* global self, caches, fetch, Request, Response, URL */

"use strict";

// Public-shell-only service worker. User records remain in localStorage and are
// never copied into Cache Storage by this worker.
const CACHE_NAMESPACE = "jmwl-public-static";
const CACHE_VERSION = "v4";
const TAX_RULE_VERSION = "1.0.0";
const STATIC_CACHE = `${CACHE_NAMESPACE}-${CACHE_VERSION}-rules-${TAX_RULE_VERSION}`;
const OFFLINE_FALLBACK = "/offline-fallback.html";
const CACHE_METADATA_PATH = "/__pwa/cache-metadata";

const PRECACHE_URLS = [
  OFFLINE_FALLBACK,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
  "/icons/apple-touch-icon-180.png",
];

const SAFE_NAVIGATION_PATHS = new Set([
  "/",
  "/start",
  "/calculator",
  "/calculator/income",
  "/calculator/expenses",
  "/calculator/withholding-tax",
  "/calculator/allowances",
  "/calculator/summary",
  "/offline",
]);

const SAFE_STATIC_PATHS = new Set([
  OFFLINE_FALLBACK,
  "/favicon.ico",
  "/manifest.webmanifest",
  "/site.webmanifest",
]);

// Fail closed for all authenticated, synchronized, generated, or user-specific resources.
const NEVER_CACHE_PATH =
  /(?:^\/(?:api|auth|login|signup|profile|settings)(?:\/|$)|(?:^|\/)(?:sync|export|download|receipt|document|upload)(?:\/|$)|\.(?:pdf|csv|xlsx?|zip)(?:$|\/))/i;

function isSafeNavigation(url) {
  return (
    url.origin === self.location.origin &&
    !url.search &&
    SAFE_NAVIGATION_PATHS.has(url.pathname) &&
    !NEVER_CACHE_PATH.test(url.pathname)
  );
}

function isSafeStaticUrl(url) {
  if (
    url.origin !== self.location.origin ||
    NEVER_CACHE_PATH.test(url.pathname)
  ) {
    return false;
  }

  // Next build assets may have immutable cache-busting query strings. Other
  // query-bearing URLs are excluded to prevent unbounded/user-derived keys.
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
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

function extractPublicAssetUrls(source) {
  const matches = source.matchAll(
    /(?:src|href)=["']([^"']+)["']|["'](\/_next\/static\/[^"'\\\s)]+)["']/g,
  );
  const urls = new Set();

  for (const match of matches) {
    const raw = match[1] || match[2];
    if (!raw) continue;
    try {
      const url = new URL(raw.replaceAll("&amp;", "&"), self.location.origin);
      if (isSafeStaticUrl(url)) urls.add(url.href);
    } catch {
      // A malformed build reference is ignored; it must never broaden caching.
    }
  }
  return urls;
}

async function cachePublicAssetGraph(initialUrls) {
  const cache = await caches.open(STATIC_CACHE);
  const queue = [...initialUrls];
  const visited = new Set();

  while (queue.length > 0 && visited.size < 250) {
    const href = queue.shift();
    if (!href || visited.has(href)) continue;
    visited.add(href);

    const url = new URL(href, self.location.origin);
    if (!isSafeStaticUrl(url)) continue;

    try {
      const response = await fetch(url.href);
      if (!response.ok || response.type !== "basic") continue;
      await cache.put(url.href, response.clone());

      if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
        const source = await response.text();
        for (const discovered of extractPublicAssetUrls(source)) {
          if (!visited.has(discovered)) queue.push(discovered);
        }
      }
    } catch {
      // One optional chunk must not make the whole offline shell unavailable.
    }
  }
}

async function writeCacheMetadata(cache, warmedRoutes) {
  const metadata = {
    cacheVersion: CACHE_VERSION,
    taxRuleVersion: TAX_RULE_VERSION,
    cachedAt: new Date().toISOString(),
    ready: warmedRoutes === SAFE_NAVIGATION_PATHS.size,
    warmedRoutes,
  };
  await cache.put(
    CACHE_METADATA_PATH,
    new Response(JSON.stringify(metadata), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }),
  );
  return metadata;
}

async function readCacheMetadata() {
  const response = await caches.match(CACHE_METADATA_PATH);
  return response ? response.json() : null;
}

async function warmOfflineShell() {
  const cache = await caches.open(STATIC_CACHE);
  const assetUrls = new Set();
  let warmedRoutes = 0;

  for (const path of SAFE_NAVIGATION_PATHS) {
    try {
      const request = new Request(path, { headers: { Accept: "text/html" } });
      const response = await fetch(request);
      if (!response.ok || response.type !== "basic") continue;
      await cache.put(path, response.clone());
      warmedRoutes += 1;
      for (const assetUrl of extractPublicAssetUrls(await response.text())) {
        assetUrls.add(assetUrl);
      }
    } catch {
      // Keep the last complete shell when a refresh is temporarily unavailable.
    }
  }

  await cachePublicAssetGraph(assetUrls);
  return writeCacheMetadata(cache, warmedRoutes);
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
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (!isSafeNavigation(url)) {
      event.respondWith(
        fetch(request).catch(() =>
          caches.match(OFFLINE_FALLBACK, { ignoreSearch: true }),
        ),
      );
      return;
    }

    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok && response.type === "basic") {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match(url.pathname);
          return (
            cachedShell ??
            caches.match(OFFLINE_FALLBACK, { ignoreSearch: true })
          );
        }),
    );
    return;
  }

  if (!isSafeStaticUrl(url)) return;
  event.respondWith(cacheFirstPublicAsset(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "WARM_OFFLINE_SHELL") {
    event.waitUntil(
      warmOfflineShell()
        .then((metadata) => event.ports[0]?.postMessage({ ok: true, metadata }))
        .catch(() => event.ports[0]?.postMessage({ ok: false })),
    );
    return;
  }

  if (event.data?.type === "GET_CACHE_METADATA") {
    event.waitUntil(
      readCacheMetadata().then((metadata) =>
        event.ports[0]?.postMessage({ ok: true, metadata }),
      ),
    );
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
