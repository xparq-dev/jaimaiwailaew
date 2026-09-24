import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

function pngDimensions(relativePath: string) {
  const png = readFileSync(resolve(process.cwd(), relativePath));
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("Phase 1F install manifest", () => {
  it("defines a scoped standalone Thai application", () => {
    const value = manifest();
    expect(value.start_url).toBe("/");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.lang).toBe("th");
    expect(value.theme_color).toBe("#0B1F3A");
  });

  it("publishes PNG regular and maskable install icons", () => {
    const icons = manifest().icons ?? [];
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/maskable-icon-512.png",
          sizes: "512x512",
          purpose: "maskable",
        }),
      ]),
    );
  });

  it.each([
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/maskable-icon-512.png", 512],
    ["public/icons/apple-touch-icon-180.png", 180],
  ])("has a real square PNG at %s", (path, size) => {
    expect(pngDimensions(path)).toEqual({ width: size, height: size });
  });
});
