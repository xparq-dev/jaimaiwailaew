import { expect, test } from "@playwright/test";

const workspace = {
  id: "e2e-cloud-workspace",
  schemaVersion: 2,
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-20T10:00:00.000Z",
  taxYearBE: 2569,
  persona: "salaried_employee",
  calculationMode: "pnd91",
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  reportName: "Cloud Sync E2E",
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
    resolvedAt: "2026-09-20T10:00:00.000Z",
  },
  localOnly: true,
};

test("login, opt-in sync, restore from cloud, and logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("member@example.com");
  await page.getByLabel("รหัสผ่าน").fill("test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.locator("#main-content").getByText("member@example.com"),
  ).toBeVisible();

  await page.evaluate((value) => {
    localStorage.setItem(
      "jaimaiwailaew:calculator:v2",
      JSON.stringify({
        state: { workspace: value, lastSavedAt: value.updatedAt },
        version: 0,
      }),
    );
  }, workspace);
  await page.reload();

  await page.goto("/settings");
  await page
    .getByRole("checkbox", { name: "เปิด Cloud Sync สำหรับบัญชีนี้" })
    .check();
  await expect(
    page.locator("#main-content").getByText("ซิงก์แล้ว", { exact: true }),
  ).toBeVisible();

  const cloudWorkspaceId = await page.evaluate(() => {
    const documents = JSON.parse(
      localStorage.getItem("jaimaiwailaew:e2e:cloud-workspaces") ?? "[]",
    ) as Array<{ workspace: { id: string } }>;
    return documents[0]?.workspace.id;
  });
  expect(cloudWorkspaceId).toBe("e2e-cloud-workspace");

  await page.evaluate(() => {
    localStorage.removeItem("jaimaiwailaew:calculator:v2");
  });
  await page.reload();
  await expect(
    page.locator("#main-content").getByText("ซิงก์แล้ว", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage
          .getItem("jaimaiwailaew:calculator:v2")
          ?.includes("e2e-cloud-workspace"),
      ),
    )
    .toBe(true);

  await page.goto("/profile");
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "เข้าสู่ระบบ" })).toBeVisible();
});
