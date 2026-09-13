import { expect, test } from "@playwright/test";

test("renders the responsive foundation shell and legal access", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "เริ่มจากฐานที่ปลอดภัย ก่อนเริ่มคำนวณจริง",
    }),
  ).toBeVisible();
  await expect(page.getByText("ยังไม่พร้อมเผยแพร่")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ข้อจำกัดความรับผิด" }),
  ).toBeVisible();

  const isMobileProject = testInfo.project.name.includes("mobile");
  if (isMobileProject) {
    await page.setViewportSize({ width: 320, height: 700 });
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
  } else {
    await expect(
      page.getByRole("navigation", { name: "เมนูหลักบนมือถือ" }),
    ).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "เมนูหลัก", exact: true }),
    ).toBeVisible();
  }
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
      expect.objectContaining({ src: "/icons/icon.svg", purpose: "any" }),
      expect.objectContaining({
        src: "/icons/maskable-icon.svg",
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
      page.getByRole("heading", { name: "ขณะนี้คุณกำลังออฟไลน์" }),
    ).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test("serves remaining unstarted route families as honest placeholders", async ({
  page,
}) => {
  for (const route of ["/learn/tax-basics", "/offline"]) {
    await page.goto(route);
    await expect(page.getByText("ยังไม่เปิดใช้การคำนวณ")).toBeVisible();
  }
});

test("switches language and theme without putting state in the URL", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute(
    "data-locale-ready",
    "true",
  );

  await page.getByRole("button", { name: "เปลี่ยนภาษา EN" }).click();
  const navigationName = testInfo.project.name.includes("mobile")
    ? "เมนูหลักบนมือถือ"
    : "เมนูหลัก";
  await expect(
    page.getByRole("navigation", { name: navigationName, exact: true }),
  ).toContainText("Overview");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page).toHaveURL(/\/$/);

  const html = page.locator("html");
  const wasDark = await html.evaluate((element) =>
    element.classList.contains("dark"),
  );
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect
    .poll(() => html.evaluate((element) => element.classList.contains("dark")))
    .toBe(!wasDark);
});
