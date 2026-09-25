import { expect, test } from "@playwright/test";

test("renders the responsive foundation shell and legal access", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "จัดข้อมูลการเงินให้เป็นเรื่องที่รับมือได้",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "เปิดพื้นที่ข้อมูลของฉัน" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ข้อจำกัดความรับผิด" }),
  ).toBeVisible();

  const isMobileProject = testInfo.project.name.includes("mobile");
  if (isMobileProject) {
    await page.setViewportSize({ width: 320, height: 700 });
    const appHeader = page.getByTestId("app-header");
    await expect(
      appHeader.getByRole("link", { name: "จ่ายไม่ไหวแล้ว" }),
    ).toBeVisible();
    await expect(appHeader.getByText("JM", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "เมนูหลักบนมือถือ" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "เมนูหลัก", exact: true }),
    ).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.getByTestId("app-header").evaluate((header) => {
          return header.scrollWidth <= header.clientWidth;
        }),
      )
      .toBe(true);
  } else {
    await expect(
      page.getByRole("navigation", { name: "เมนูหลักบนมือถือ" }),
    ).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "เมนูหลัก", exact: true }),
    ).toBeVisible();
  }
});

test("uses the signed-in provider avatar in the desktop brand", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"));

  const avatarUrl = "https://lh3.googleusercontent.com/a/e2e-avatar=s96-c";
  await page.route(avatarUrl, async (route) => {
    await route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0e8f68"/></svg>',
      contentType: "image/svg+xml",
      status: 200,
    });
  });
  await page.addInitScript(
    ({ url }) => {
      localStorage.setItem(
        "jaimaiwailaew:e2e:auth-user",
        JSON.stringify({
          id: "avatar-user",
          email: "avatar@example.com",
          provider: "google",
          avatarUrl: url,
        }),
      );
    },
    { url: avatarUrl },
  );

  await page.goto("/");
  const desktopBrand = page
    .getByRole("navigation", { name: "เมนูหลัก", exact: true })
    .locator("xpath=preceding-sibling::div")
    .getByRole("link", { name: "จ่ายไม่ไหวแล้ว" });
  await expect(desktopBrand.locator("img")).toBeVisible();
  await expect(desktopBrand.getByText("JM", { exact: true })).toHaveCount(0);
});

test("serves a scoped PWA manifest and baseline security headers", async ({
  page,
  request,
}) => {
  const pageResponse = await page.goto("/");
  expect(pageResponse).not.toBeNull();
  expect(pageResponse?.headers()["content-security-policy"]).toContain(
    "default-src 'self'",
  );
  expect(pageResponse?.headers()["content-security-policy"]).not.toContain(
    "unsafe-eval",
  );
  expect(pageResponse?.headers()["content-security-policy"]).toContain(
    "upgrade-insecure-requests",
  );
  expect(pageResponse?.headers()["content-security-policy"]).toContain(
    "frame-src 'self' blob:",
  );
  expect(pageResponse?.headers()["content-security-policy"]).toContain(
    "https://lh3.googleusercontent.com",
  );
  expect(pageResponse?.headers()["content-security-policy"]).toContain(
    "https://avatars.githubusercontent.com",
  );
  expect(pageResponse?.headers()["x-content-type-options"]).toBe("nosniff");

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    display: string;
    icons: Array<{ purpose?: string; src: string }>;
    scope: string;
    start_url: string;
  };

  expect(manifest.display).toBe("standalone");
  expect(manifest.scope).toBe("/");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/icons/icon-192.png",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/maskable-icon-512.png",
        purpose: "maskable",
      }),
    ]),
  );

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);
  expect(serviceWorkerResponse.headers()["content-type"]).toContain(
    "application/javascript",
  );
  expect(serviceWorkerResponse.headers()["cache-control"]).toBe(
    "no-cache, no-store, must-revalidate",
  );
  expect(serviceWorkerResponse.headers()["content-security-policy"]).toBe(
    "default-src 'self'; script-src 'self'",
  );

  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        const readyRegistration = await navigator.serviceWorker.ready;
        return readyRegistration.active?.state ?? null;
      });
    })
    .toBe("activated");

  const registrationScope = await page.evaluate(async () => {
    const readyRegistration = await navigator.serviceWorker.ready;
    return readyRegistration.scope;
  });
  expect(registrationScope).toBe(new URL("/", page.url()).toString());

  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller !== null),
    )
    .toBe(true);

  await page.context().setOffline(true);
  try {
    await page.goto("/offline-e2e-probe");
    await expect(
      page.getByRole("heading", {
        name: "หน้านี้ยังไม่ได้เตรียมไว้สำหรับออฟไลน์",
      }),
    ).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test("keeps unstarted learning content honest and publishes offline guidance", async ({
  page,
}) => {
  await page.goto("/learn/tax-basics");
  await expect(page.getByText("ยังไม่เปิดใช้การคำนวณ")).toBeVisible();

  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: "ใช้เครื่องคำนวณต่อได้เมื่อออฟไลน์" }),
  ).toBeVisible();
});

test("keeps the interface Thai-only and switches theme without changing the URL", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute(
    "data-locale-ready",
    "true",
  );

  await expect(page.getByRole("button", { name: /เปลี่ยนภาษา/ })).toHaveCount(
    0,
  );
  await expect(page.getByText("EN", { exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page).toHaveURL(/\/$/);

  const html = page.locator("html");
  const wasDark = await html.evaluate((element) =>
    element.classList.contains("dark"),
  );
  await page.getByRole("button", { name: "เปลี่ยนธีม" }).click();
  await expect
    .poll(() => html.evaluate((element) => element.classList.contains("dark")))
    .toBe(!wasDark);
});
