import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const serviceWorkerSource = readFileSync(
  resolve(process.cwd(), "public/sw.js"),
  "utf8",
);

describe("Phase 0 service-worker policy", () => {
  it("pre-caches only the offline fallback and public icons", () => {
    const preCacheBlock = serviceWorkerSource.match(
      /const PRECACHE_URLS = \[([\s\S]*?)\];/,
    )?.[1];

    expect(preCacheBlock).toBeDefined();
    expect(preCacheBlock).toContain("OFFLINE_FALLBACK");
    expect(preCacheBlock).toContain("/icons/icon.svg");
    expect(preCacheBlock).not.toMatch(/calculator|api|pdf|document|report/i);
  });

  it("blocks sensitive routes and generated document extensions from caching", () => {
    expect(serviceWorkerSource).toContain("NEVER_CACHE_PATH");
    expect(serviceWorkerSource).toMatch(/calculator/);
    expect(serviceWorkerSource).toMatch(/api/);
    expect(serviceWorkerSource).toMatch(/pdf/);
    expect(serviceWorkerSource).toMatch(/xlsx/);
    expect(serviceWorkerSource).toMatch(/request\.method !== ["']GET["']/);
  });
});
