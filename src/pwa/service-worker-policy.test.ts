import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const serviceWorkerSource = readFileSync(
  resolve(process.cwd(), "public/sw.js"),
  "utf8",
);
const taxRuleVersions = [2568, 2569].map((year) => {
  const metadata = JSON.parse(
    readFileSync(
      resolve(process.cwd(), `src/tax/rules/${year}/meta.json`),
      "utf8",
    ),
  ) as { version: string };
  return metadata.version;
});

function sourceBlock(name: string) {
  return serviceWorkerSource.match(
    new RegExp(`const ${name} = (?:new Set\\()?\\[([\\s\\S]*?)\\]\\)?;`),
  )?.[1];
}

describe("Phase 1F public-shell service-worker policy", () => {
  it("versions the cache with the published tax-rule bundle", () => {
    expect(serviceWorkerSource).toContain('CACHE_VERSION = "v4"');
    expect(serviceWorkerSource).toContain('TAX_RULE_VERSION = "1.0.0"');
    expect(serviceWorkerSource).toContain(
      "${CACHE_NAMESPACE}-${CACHE_VERSION}-rules-${TAX_RULE_VERSION}",
    );
    expect(new Set(taxRuleVersions)).toEqual(new Set(["1.0.0"]));
  });

  it("pre-caches only public fallback, manifest, and install icons", () => {
    const preCacheBlock = sourceBlock("PRECACHE_URLS");

    expect(preCacheBlock).toBeDefined();
    expect(preCacheBlock).toContain("OFFLINE_FALLBACK");
    expect(preCacheBlock).toContain("/manifest.webmanifest");
    expect(preCacheBlock).toContain("/icons/icon-192.png");
    expect(preCacheBlock).toContain("/icons/maskable-icon-512.png");
    expect(preCacheBlock).not.toMatch(
      /api|auth|profile|settings|pdf|document|upload|receipt|export/i,
    );
  });

  it("warms only the explicit public calculator route allow-list", () => {
    const navigationBlock = sourceBlock("SAFE_NAVIGATION_PATHS");

    expect(navigationBlock).toContain('"/calculator"');
    expect(navigationBlock).toContain('"/calculator/summary"');
    expect(navigationBlock).toContain('"/offline"');
    expect(navigationBlock).not.toMatch(
      /login|signup|profile|settings|auth|api/,
    );
    expect(serviceWorkerSource).toContain("SAFE_NAVIGATION_PATHS.has");
  });

  it("fails closed for account, sync, API, and generated document paths", () => {
    expect(serviceWorkerSource).toContain("NEVER_CACHE_PATH");
    expect(serviceWorkerSource).toMatch(
      /api\|auth\|login\|signup\|profile\|settings/,
    );
    expect(serviceWorkerSource).toMatch(/sync\|export\|download/);
    expect(serviceWorkerSource).toMatch(/pdf\|csv\|xlsx/);
    expect(serviceWorkerSource).toMatch(/request\.method !== ["']GET["']/);
  });

  it("stores cache readiness metadata without user content", () => {
    expect(serviceWorkerSource).toContain("CACHE_METADATA_PATH");
    expect(serviceWorkerSource).toContain("taxRuleVersion");
    expect(serviceWorkerSource).toContain("cachedAt");
    expect(serviceWorkerSource).toContain('type === "GET_CACHE_METADATA"');
    expect(serviceWorkerSource).toContain('type === "WARM_OFFLINE_SHELL"');
  });

  it("serves safe navigation network-first with a static offline fallback", () => {
    expect(serviceWorkerSource).toContain('request.mode === "navigate"');
    expect(serviceWorkerSource).toContain("isSafeNavigation(url)");
    expect(serviceWorkerSource).toContain("OFFLINE_FALLBACK");
    expect(serviceWorkerSource).toContain("caches.match(url.pathname)");
  });

  it("refuses non-static query URLs to prevent user-derived cache keys", () => {
    expect(serviceWorkerSource).toContain("url.search");
    expect(serviceWorkerSource).toContain(
      '!url.pathname.startsWith("/_next/static/")',
    );
  });

  it("does not access user stores or add push/background-sync behavior", () => {
    const executableCode = serviceWorkerSource.replace(
      /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      "",
    );
    expect(executableCode).not.toMatch(/\blocalStorage\b/);
    expect(executableCode).not.toMatch(/\bindexedDB\b/);
    expect(executableCode).not.toMatch(/jaimaiwailaew:calculator/i);
    expect(executableCode).not.toMatch(/incomeEntries|expenseEntries/i);
    expect(executableCode).not.toMatch(
      /withholdingEntries|allowanceDraftEntries/i,
    );
    expect(executableCode).not.toMatch(/pushsubscription|showNotification/i);
    expect(executableCode).not.toMatch(/addEventListener\(["']sync["']/i);
  });
});
