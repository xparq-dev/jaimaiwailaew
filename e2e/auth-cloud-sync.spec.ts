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

const secondWorkspace = {
  ...workspace,
  id: "e2e-cloud-workspace-2568",
  updatedAt: "2026-09-20T11:00:00.000Z",
  taxYearBE: 2568,
  persona: "freelancer",
  calculationMode: "annual_estimate",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  reportName: "Cloud Sync E2E 2568",
  taxRuleResolutionSnapshot: {
    ...workspace.taxRuleResolutionSnapshot,
    taxYearBE: 2568,
    ruleSetId: "thai-pit-2568",
  },
};

test("login, opt-in sync, restore from cloud, and logout", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("member@example.com");
  await page.getByLabel("รหัสผ่าน").fill("test-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.locator("#main-content").getByText("member@example.com"),
  ).toBeVisible();

  await page.evaluate(
    (value) => {
      localStorage.setItem(
        "jaimaiwailaew:calculator:v2",
        JSON.stringify({
          state: {
            workspace: value.current,
            otherWorkspaces: [value.other],
            lastSavedAt: value.other.updatedAt,
          },
          version: 0,
        }),
      );
    },
    { current: workspace, other: secondWorkspace },
  );
  await page.reload();

  await page.goto("/settings");
  await page
    .getByRole("checkbox", { name: "เปิดการสำรองข้อมูลในอุปกรณ์นี้" })
    .check();
  await expect(
    page.locator("#main-content").getByText("ซิงก์แล้ว", { exact: true }),
  ).toBeVisible();

  const cloudWorkspaceIds = await page.evaluate(() => {
    const documents = JSON.parse(
      localStorage.getItem("jaimaiwailaew:e2e:cloud-workspaces") ?? "[]",
    ) as Array<{ workspace: { id: string } }>;
    return documents.map((document) => document.workspace.id).sort();
  });
  expect(cloudWorkspaceIds).toEqual([
    "e2e-cloud-workspace",
    "e2e-cloud-workspace-2568",
  ]);

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
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage
          .getItem("jaimaiwailaew:calculator:v2")
          ?.includes("e2e-cloud-workspace-2568"),
      ),
    )
    .toBe(true);

  await page.goto("/start");
  await expect(page.getByText("พบ 2 ชุดข้อมูลในอุปกรณ์นี้")).toBeVisible();
  await page.getByRole("link", { name: "เพิ่มชุดข้อมูล" }).click();
  await page.getByRole("button", { name: /ฟรีแลนซ์/ }).click();
  await page.getByRole("button", { name: "พ.ศ. 2569 (ค.ศ. 2026)" }).click();
  await page.getByRole("button", { name: /ทั้งปี/ }).click();
  await page
    .getByRole("button", { name: "สร้างชุดข้อมูลและเริ่มบันทึก" })
    .click();
  await expect(page).toHaveURL(/\/calculator$/);
  await page.goto("/start");
  await expect(page.getByText("พบ 3 ชุดข้อมูลในอุปกรณ์นี้")).toBeVisible();
  await page
    .getByRole("button", {
      name: "ลบชุดข้อมูล ฟรีแลนซ์ ปีภาษี 2568",
    })
    .click();
  const deleteDialog = page.getByRole("dialog", {
    name: "ยืนยันลบชุดข้อมูล",
  });
  await expect(deleteDialog).toContainText("ฟรีแลนซ์ · ปีภาษี 2568");
  await deleteDialog.getByRole("button", { name: "ยืนยันลบชุดข้อมูล" }).click();
  await expect(page.getByText("พบ 2 ชุดข้อมูลในอุปกรณ์นี้")).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("button", { name: /ซิงก์ตอนนี้|ลองอีกครั้ง/ }).click();
  await expect(
    page.locator("#main-content").getByText("ซิงก์แล้ว", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("รอลบข้อมูลสำรอง")).toBeHidden();
  const deletionState = await page.evaluate(() => ({
    cloud: localStorage.getItem("jaimaiwailaew:e2e:cloud-workspaces") ?? "",
    deletions:
      localStorage.getItem("jaimaiwailaew:e2e:cloud-workspaces:deletions") ??
      "",
  }));
  expect(deletionState.cloud).not.toContain("e2e-cloud-workspace-2568");
  expect(deletionState.deletions).toContain("e2e-cloud-workspace-2568");

  await page.evaluate(() => {
    localStorage.removeItem("jaimaiwailaew:calculator:v2");
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("jaimaiwailaew:calculator:v2") ?? "";
        return (
          raw.includes("e2e-cloud-workspace") &&
          !raw.includes("e2e-cloud-workspace-2568")
        );
      }),
    )
    .toBe(true);
  const cloudSyncSection = page
    .getByRole("heading", { name: "สำรองข้อมูลและใช้หลายอุปกรณ์" })
    .locator("xpath=ancestor::section");
  await page.context().setOffline(true);
  await expect(cloudSyncSection.locator("strong")).toHaveText(
    /\u0e2d\u0e2d\u0e1f\u0e44\u0e25\u0e19\u0e4c/,
  );
  await page.context().setOffline(false);
  await expect(
    page.locator("#main-content").getByText("ซิงก์แล้ว", { exact: true }),
  ).toBeVisible();

  const calculatorStorageBeforeLogout = await page.evaluate(() =>
    localStorage.getItem("jaimaiwailaew:calculator:v2"),
  );
  expect(calculatorStorageBeforeLogout).toContain("e2e-cloud-workspace");

  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "บัญชีและข้อมูลของฉัน" }),
  ).toBeVisible();
  await expect(page.getByText("เข้าสู่ระบบด้วย อีเมล")).toBeVisible();
  await expect(page.getByText(/ซิงก์แล้ว · ล่าสุด/)).toBeVisible();
  const workspaceRegion = page.getByRole("region", {
    name: "ชุดข้อมูลของฉัน",
  });
  await expect(workspaceRegion).toBeVisible();
  await expect(
    workspaceRegion.getByRole("button", { name: /เปิดชุดข้อมูล/ }).first(),
  ).toBeVisible();
  await expect(
    workspaceRegion.getByRole("button", { name: /เปิดรายงาน/ }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("e2e-cloud-workspace", { exact: false }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);

  await page.goto("/settings");
  await page.getByRole("button", { name: "ลบข้อมูลสำรองทั้งหมด" }).click();
  const deleteCloudDialog = page.getByRole("dialog", {
    name: "ยืนยันลบข้อมูลสำรอง",
  });
  await expect(deleteCloudDialog).toContainText(
    "ไม่ลบบัญชีหรือข้อมูลในอุปกรณ์นี้",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await deleteCloudDialog
    .getByRole("button", { name: "ยืนยันลบข้อมูลสำรอง" })
    .click();
  await expect(
    page.getByText(/ลบข้อมูลสำรองแล้ว ข้อมูลในอุปกรณ์นี้ยังอยู่ครบ/),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "เปิดการสำรองข้อมูลในอุปกรณ์นี้" }),
  ).not.toBeChecked();
  const cloudDeletionResult = await page.evaluate(() => ({
    cloud: localStorage.getItem("jaimaiwailaew:e2e:cloud-workspaces"),
    deletions: localStorage.getItem(
      "jaimaiwailaew:e2e:cloud-workspaces:deletions",
    ),
    local: localStorage.getItem("jaimaiwailaew:calculator:v2"),
  }));
  expect(cloudDeletionResult.cloud).toBeNull();
  expect(cloudDeletionResult.deletions).toBeNull();
  expect(cloudDeletionResult.local).toContain("e2e-cloud-workspace");

  await page.goto("/profile");
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "เข้าสู่ระบบ" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage
          .getItem("jaimaiwailaew:calculator:v2")
          ?.includes("e2e-cloud-workspace"),
      ),
    )
    .toBe(true);
});

test("account dashboard keeps local-first recovery clear before login", async ({
  page,
}) => {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "บัญชีและข้อมูลของฉัน" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "เข้าสู่ระบบเพื่อดูภาพรวมบัญชี" }),
  ).toBeVisible();
  await expect(
    page.getByText(/ข้อมูลเครื่องคำนวณในอุปกรณ์นี้ยังอยู่ตามเดิม/),
  ).toBeVisible();
  await expect(
    page.locator("#main-content").getByRole("link", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();
});
