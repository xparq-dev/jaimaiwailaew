import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const serviceWorkerSource = readFileSync(
  resolve(process.cwd(), "public/sw.js"),
  "utf8",
);

describe("Phase 1B service-worker policy", () => {
  it("pre-caches only the offline fallback and public icons", () => {
    const preCacheBlock = serviceWorkerSource.match(
      /const PRECACHE_URLS = \[([\s\S]*?)\];/,
    )?.[1];

    expect(preCacheBlock).toBeDefined();
    expect(preCacheBlock).toContain("OFFLINE_FALLBACK");
    expect(preCacheBlock).toContain("/icons/icon.svg");
    expect(preCacheBlock).not.toMatch(
      /api|pdf|document|upload|receipt|export/i,
    );
  });

  it("blocks sensitive routes and generated document extensions from caching", () => {
    expect(serviceWorkerSource).toContain("NEVER_CACHE_PATH");
    expect(serviceWorkerSource).toMatch(/api/);
    expect(serviceWorkerSource).toMatch(/pdf/);
    expect(serviceWorkerSource).toMatch(/xlsx/);
    expect(serviceWorkerSource).toMatch(/export/);
    expect(serviceWorkerSource).toMatch(/download/);
    expect(serviceWorkerSource).toMatch(/request\.method !== ["']GET["']/);
  });

  it("permits offline navigation for app shell with fallback to OFFLINE_FALLBACK", () => {
    expect(serviceWorkerSource).toContain('request.mode === "navigate"');
    expect(serviceWorkerSource).toContain("OFFLINE_FALLBACK");
    expect(serviceWorkerSource).toContain("caches.match(request)");
  });

  it("refuses to cache query-bearing requests to prevent data leakage in URL", () => {
    expect(serviceWorkerSource).toContain("url.search");
    expect(serviceWorkerSource).toContain("canCacheShell");
  });

  it("does not access or cache localStorage, user financial entries, or state in code", () => {
    const executableCode = serviceWorkerSource.replace(
      /\/\*[\s\S]*?\*\/|\/\/.*/g,
      "",
    );
    expect(executableCode).not.toMatch(/\blocalStorage\b/);
    expect(executableCode).not.toMatch(/\bindexedDB\b/);
    expect(executableCode).not.toMatch(/jaimaiwailaew:calculator/i);
    expect(executableCode).not.toMatch(/incomeEntries/i);
    expect(executableCode).not.toMatch(/expenseEntries/i);
    expect(executableCode).not.toMatch(/withholdingEntries/i);
    expect(executableCode).not.toMatch(/allowanceDraftEntries/i);
  });
});
