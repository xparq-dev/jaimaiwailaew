import { expect, test } from "@playwright/test";

interface CacheMetadata {
  cacheVersion: string;
  taxRuleVersion: string;
  cachedAt: string;
  ready: boolean;
  warmedRoutes: number;
}

async function waitForOfflineShell(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () =>
      "serviceWorker" in navigator &&
      Boolean(navigator.serviceWorker.controller),
    undefined,
    { timeout: 30_000 },
  );

  return page.evaluate(async () => {
    const deadline = Date.now() + 45_000;

    while (Date.now() < deadline) {
      const metadata = await new Promise<CacheMetadata | null>((resolve) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => resolve(null), 2_000);
        channel.port1.onmessage = (event) => {
          window.clearTimeout(timeout);
          if (event.data?.ok && event.data.metadata) {
            resolve(event.data.metadata as CacheMetadata);
          } else {
            resolve(null);
          }
        };
        navigator.serviceWorker.controller?.postMessage(
          { type: "GET_CACHE_METADATA" },
          [channel.port2],
        );
      });
      if (metadata?.ready) return metadata;
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }

    throw new Error("Offline shell preparation timed out");
  });
}

test.describe("Phase 1F PWA and offline completion", () => {
  test("installs public shell, calculates locally, exports PDF offline, and recovers online", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);

    const manifestResponse = await page.request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
        }),
        expect.objectContaining({
          src: "/icons/maskable-icon-512.png",
          purpose: "maskable",
        }),
      ]),
    );

    await page.goto("/start/income-type");
    await page.getByRole("button", { name: /พนักงานประจำ/ }).click();
    await page.getByRole("button", { name: "พ.ศ. 2569 (ค.ศ. 2026)" }).click();
    await page.getByRole("button", { name: /ทั้งปี/ }).click();
    await page
      .getByRole("button", { name: "สร้าง Workspace และเริ่มบันทึกข้อมูล" })
      .click();

    await page.goto("/calculator/summary");
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();

    const metadata = await waitForOfflineShell(page);
    expect(metadata).toMatchObject({
      cacheVersion: "v4",
      taxRuleVersion: "1.0.0",
      ready: true,
    });
    expect(Date.parse(metadata.cachedAt)).not.toBeNaN();

    const cacheSnapshot = await page.evaluate(async () => {
      const names = await caches.keys();
      const requests = (
        await Promise.all(
          names.map(async (name) => {
            const cache = await caches.open(name);
            return (await cache.keys()).map((request) => request.url);
          }),
        )
      ).flat();
      return { names, requests };
    });

    expect(cacheSnapshot.names).toContain("jmwl-public-static-v4-rules-1.0.0");
    expect(cacheSnapshot.requests).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/calculator\/summary$/),
        expect.stringMatching(/\/calculator\/income$/),
        expect.stringMatching(/\/manifest\.webmanifest$/),
      ]),
    );
    for (const url of cacheSnapshot.requests) {
      expect(url).not.toMatch(
        /\/(?:api|auth|login|signup|profile|settings|sync)(?:\/|$)|\.(?:pdf|csv|xlsx?|zip)(?:$|\?)/i,
      );
      expect(url).not.toContain("jaimaiwailaew:calculator");
    }

    await context.setOffline(true);
    await page.goto("/calculator/income");
    await expect(
      page.getByRole("heading", { level: 1, name: "รายรับ" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({
        hasText: "คุณกำลังใช้งานแบบออฟไลน์",
      }),
    ).toContainText("เวอร์ชัน 1.0.0");

    const addButton = testInfo.project.name.includes("mobile")
      ? page.getByRole("button", { name: "เพิ่มรายการรายรับ" })
      : page.getByRole("button", { name: "เพิ่มรายการ" }).first();
    await addButton.click();
    await page.locator("#income-date").fill("2026-09-24");
    await page.locator("#income-category").selectOption("salary");
    await page.locator("#income-amount").fill("18000");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();
    await expect(page.getByText("18,000.00 ฿").first()).toBeVisible();

    await page.goto("/calculator/summary");
    await expect(page.getByText("18,000.00 ฿").first()).toBeVisible();

    const pdfPanel = page.getByRole("region", {
      name: "ดาวน์โหลดรายงาน PDF",
    });
    await pdfPanel.getByRole("button", { name: "ดูตัวอย่าง PDF" }).click();
    const pdfDialog = page.getByRole("dialog", {
      name: "ตัวอย่างรายงาน PDF",
    });
    await expect(pdfDialog).toBeVisible();
    await expect(pdfDialog.getByTitle("ตัวอย่างรายงาน PDF")).toHaveAttribute(
      "src",
      /^blob:/,
    );

    const downloadPromise = page.waitForEvent("download");
    await pdfDialog.getByRole("button", { name: "ดาวน์โหลด PDF" }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-");

    await context.setOffline(false);
    await page.reload();
    await expect(page.getByText("18,000.00 ฿").first()).toBeVisible();
    await expect(page.getByText("คุณกำลังใช้งานแบบออฟไลน์")).toBeHidden();
  });
});
