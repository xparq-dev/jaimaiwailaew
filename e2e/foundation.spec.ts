import { expect, test } from "@playwright/test";

test("renders the responsive foundation shell and legal access", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "รายรับ รายจ่าย และภาษี อยู่ในที่เดียว",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "เปิดข้อมูลของฉัน" }),
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

test("publishes a read-only tax rule source registry without private identifiers", async ({
  page,
}) => {
  const response = await page.goto("/tax-rules");
  expect(response).not.toBeNull();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "ตรวจแหล่งอ้างอิงก่อนใช้ประมาณการ",
    }),
  ).toBeVisible();
  await expect(page.getByText("กฎภาษีปี 2568")).toBeVisible();
  await expect(page.getByText("กฎภาษีปี 2569")).toBeVisible();
  await expect(
    page.getByText("พร้อมใช้สำหรับการประมาณการ").first(),
  ).toBeVisible();

  const sourceLink = page
    .getByRole("link", { name: "เปิดแหล่งอ้างอิง" })
    .first();
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAttribute("rel", /noopener/);
  await expect(sourceLink).toHaveAttribute("rel", /noreferrer/);
  await expect(page.locator("body")).not.toContainText(
    /ruleSetId|sourceId|lastReviewedBy|workspaceId/iu,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("publishes verified filing dates with official sources only", async ({
  page,
}) => {
  const response = await page.goto("/tax-calendar");
  expect(response).not.toBeNull();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "กำหนดเวลายื่นแบบที่ตรวจสอบแล้ว",
    }),
  ).toBeVisible();
  await expect(page.getByText("ภ.ง.ด.94", { exact: true })).toBeVisible();
  await expect(page.getByText("8 ตุลาคม 2569", { exact: true })).toBeVisible();
  await expect(page.getByText("ภ.ง.ด.90/91", { exact: true })).toBeVisible();
  await expect(page.getByText("31 มีนาคม 2569", { exact: true })).toBeVisible();
  await expect(page.getByText("8 เมษายน 2569", { exact: true })).toBeVisible();

  const sourceLink = page.getByRole("link", {
    name: "เปิดแหล่งอ้างอิงของ ภ.ง.ด.94",
  });
  await expect(sourceLink).toHaveAttribute(
    "href",
    "https://www.rd.go.th/272.html",
  );
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAttribute("rel", /noopener/);
  await expect(sourceLink).toHaveAttribute("rel", /noreferrer/);
  await expect(page.locator("body")).not.toContainText(
    /workspaceId|entryId|userId|ruleSetId|taxDue|refundAmount/iu,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
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

test("searches reviewed learning content and publishes offline guidance", async ({
  page,
}) => {
  await page.goto("/learn");
  await page
    .getByRole("searchbox", { name: "ค้นหาหัวข้อที่ต้องการ" })
    .fill("50 ทวิ");
  await expect(
    page.getByRole("link", { name: /ตรวจภาษีหัก ณ ที่จ่ายจากเอกสาร/ }),
  ).toBeVisible();
  await expect(page.getByText("พบ 1 บทความ")).toBeVisible();

  await page.getByRole("button", { name: "ล้างคำค้นหา" }).click();
  await page.getByRole("button", { name: "แบบภาษี" }).click();
  await expect(page.getByText("พบ 3 บทความ")).toBeVisible();

  await page.goto("/learn/tax-basics");
  await expect(
    page.getByRole("heading", { name: "พื้นฐานภาษีเงินได้บุคคลธรรมดา" }),
  ).toBeVisible();
  await expect(page.getByText(/ตรวจทาน .*รุ่น 1\.0\.0/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "แหล่งข้อมูลทางการ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /ประมวลรัษฎากร มาตรา 38–64/ }),
  ).toHaveAttribute("href", "https://www.rd.go.th/5937.html");

  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: "ใช้เครื่องคำนวณต่อได้เมื่อออฟไลน์" }),
  ).toBeVisible();
});

test("recommends a local-first learning path from the active workspace persona", async ({
  page,
}) => {
  const recommendationRequests: string[] = [];
  let captureRecommendationRequests = false;
  page.on("request", (request) => {
    if (captureRecommendationRequests) {
      recommendationRequests.push(request.url());
    }
  });

  await page.addInitScript(() => {
    const timestamp = "2026-09-26T04:00:00.000Z";
    localStorage.setItem(
      "jaimaiwailaew:calculator:v2",
      JSON.stringify({
        state: {
          workspace: {
            id: "knowledge-path-workspace",
            schemaVersion: 2,
            createdAt: timestamp,
            updatedAt: timestamp,
            taxYearBE: 2569,
            persona: "salaried_employee",
            calculationMode: "pnd91",
            periodStart: "2026-01-01",
            periodEnd: "2026-12-31",
            incomeEntries: [],
            expenseEntries: [],
            withholdingEntries: [],
            allowanceDraftEntries: [],
            socialSecuritySettings: { mode: "auto_m33" },
            taxRuleResolutionSnapshot: {
              taxYearBE: 2569,
              ruleSetId: "thai-pit-2569",
              ruleSetVersion: "1.0.0",
              availability: "available",
              status: "verified",
              resolvedAt: timestamp,
            },
            localOnly: true,
          },
          otherWorkspaces: [],
          pendingWorkspaceDeletionIds: [],
          lastSavedAt: timestamp,
        },
        version: 0,
      }),
    );
  });

  await page.goto("/learn");
  await expect(
    page.getByRole("heading", { name: "เส้นทางสำหรับพนักงานประจำ" }),
  ).toBeVisible();
  await expect(page.getByText(/อิงจาก Workspace ปัจจุบัน/)).toContainText(
    "พนักงานประจำ",
  );
  const libraryPath = page.getByRole("region", {
    name: "เส้นทางสำหรับพนักงานประจำ",
  });
  await expect(
    libraryPath.getByRole("link", {
      name: /พื้นฐานภาษีเงินได้บุคคลธรรมดา/,
    }),
  ).toBeVisible();

  captureRecommendationRequests = true;
  await page
    .getByLabel("เลือกสถานการณ์สำหรับการอ่าน")
    .selectOption("freelancer");
  await expect(
    page.getByRole("heading", { name: "เส้นทางสำหรับฟรีแลนซ์" }),
  ).toBeVisible();
  await expect(
    page.getByText("เปลี่ยนเฉพาะคำแนะนำหน้านี้ ไม่แก้ประเภทผู้ใช้ใน Workspace"),
  ).toBeVisible();
  expect(recommendationRequests.filter((url) => url.includes("/api/"))).toEqual(
    [],
  );
  expect(
    await page.evaluate(() => {
      const persisted = JSON.parse(
        localStorage.getItem("jaimaiwailaew:calculator:v2") ?? "{}",
      ) as { state?: { workspace?: { persona?: string } } };
      return persisted.state?.workspace?.persona;
    }),
  ).toBe("salaried_employee");

  captureRecommendationRequests = false;
  await page.goto("/learn/tax-basics");
  await expect(
    page.getByText("อ่านต่อให้ตรงกับคุณ", { exact: true }),
  ).toBeVisible();
  const personalizedPath = page.getByRole("region", {
    name: "เส้นทางสำหรับพนักงานประจำ",
  });
  await expect(personalizedPath).toBeVisible();
  await expect(
    personalizedPath.getByRole("link", {
      name: /ตรวจภาษีหัก ณ ที่จ่ายจากเอกสาร/,
    }),
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
