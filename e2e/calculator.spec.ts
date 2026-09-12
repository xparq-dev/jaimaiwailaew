import { expect, test } from "@playwright/test";

test.describe("Calculator UX (Local-only)", () => {
  test("complete flow: wizard -> entries CRUD with frequencies -> summary -> persistence -> clear data", async ({
    page,
  }, testInfo) => {
    // Track network requests to verify NO financial data is transmitted
    const requestedUrls: string[] = [];
    page.on("request", (request) => {
      requestedUrls.push(request.url());
      const postData = request.postData();
      if (postData) {
        expect(postData).not.toContain("50000");
        expect(postData).not.toContain("40000");
        expect(postData).not.toContain("Shopee");
      }
    });

    // 1. Visit Start and Onboarding Wizard
    await page.goto("/start/income-type");

    await expect(
      page.getByRole("heading", { level: 1, name: "ตั้งค่าเครื่องคำนวณ" }),
    ).toBeVisible();

    // Select Persona "ขายออนไลน์ / ธุรกิจ"
    await page.getByRole("button", { name: /ขายออนไลน์ \/ ธุรกิจ/ }).click();

    // Select Year 2569
    await page.getByRole("button", { name: "พ.ศ. 2569 (ค.ศ. 2026)" }).click();

    // Select Period First Half
    await page.getByRole("button", { name: /ครึ่งปีแรก/ }).click();

    // Create workspace
    await page
      .getByRole("button", { name: "สร้าง Workspace และเริ่มบันทึกข้อมูล" })
      .click();

    // URL should now be /calculator
    await expect(page).toHaveURL(/\/calculator$/);

    // Requirement A: Compact Privacy Indicator
    // Check that it's rendered as a compact inline control, NOT a large section banner
    const privacyTrigger = page.getByRole("button", {
      name: /ข้อมูลบันทึกในอุปกรณ์นี้/,
    });
    await expect(privacyTrigger).toBeVisible();
    await expect(
      page.locator("section[aria-label='สถานะข้อมูลในอุปกรณ์']"),
    ).toBeHidden();

    // Requirement A: Open privacy detail via mouse click/tap
    await privacyTrigger.click();
    const privacyDialog = page.getByRole("dialog", {
      name: "ความเป็นส่วนตัวและการจัดเก็บข้อมูล",
    });
    await expect(privacyDialog).toBeVisible();
    await expect(
      page.getByText(
        "ข้อมูลที่คุณกรอกจัดเก็บในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "ระบบในเวอร์ชันนี้ไม่ส่งรายการรายรับ รายจ่าย หรือข้อมูลคำนวณขึ้นไปเก็บบนเว็บไซต์",
      ),
    ).toBeVisible();

    // Close detail via close button
    await page.getByRole("button", { name: "ปิดกล่องรายละเอียด" }).click();
    await expect(privacyDialog).toBeHidden();

    // Requirement A: Open and close via keyboard
    await privacyTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(privacyDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(privacyDialog).toBeHidden();

    const isMobile = testInfo.project.name.includes("mobile");
    const expectVisible = async (text: string, exact = false) => {
      const locator = page.getByText(text, { exact });
      await expect(locator.filter({ visible: true }).first()).toBeVisible();
    };

    // 2. Add Income Entries (One-time and Monthly)
    await page.goto("/calculator/income");
    await expect(
      page.getByRole("heading", { level: 1, name: "รายรับ" }),
    ).toBeVisible();

    // 2a. Add One-time Income
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายรับ" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await expect(
      page.getByRole("heading", { name: "เพิ่มรายรับ" }),
    ).toBeVisible();

    // Ensure one_time is selected by default and date input is present
    await page.locator("#income-date").fill("2026-03-01");
    await page.locator("#income-category").selectOption("online_sales");
    await page.locator("#income-source").fill("Shopee Store");
    await page.locator("#income-amount").fill("50000.00");
    await page.locator("#income-note").fill("ยอดขายครั้งเดียว");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("50,000.00 ฿");
    await expectVisible("Shopee Store");
    await expectVisible("ระบุวัน", true);

    // 2b. Add Monthly Salary Income (without entering a day)
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายรับ" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    // Switch to monthly
    await page
      .getByRole("radio", { name: "ระบุเดือน / รายการรายเดือน" })
      .click();
    await expect(page.locator("#income-month")).toBeVisible();
    await expect(page.locator("#income-date")).toBeHidden();

    await page.locator("#income-month").fill("2026-03");
    await page.locator("#income-category").selectOption("salary");
    await page.locator("#income-source").fill("ประจำเดือน มี.ค.");
    await page.locator("#income-amount").fill("40000.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("40,000.00 ฿");
    await expectVisible("มีนาคม 2569");
    await expectVisible("รายเดือน", true);

    // 2c. Test edit frequency switch clears incompatible period field
    if (!isMobile) {
      const editButton = page
        .getByRole("button", { name: /แก้ไขรายการ/ })
        .first();
      await editButton.click();
      await expect(
        page.getByRole("heading", { name: "แก้ไขรายรับ" }),
      ).toBeVisible();

      // Toggle to one-time then monthly
      await page
        .getByRole("radio", { name: "ระบุวัน / รายการครั้งเดียว" })
        .click();
      await expect(page.locator("#income-date")).toBeVisible();
      await expect(page.locator("#income-month")).toBeHidden();

      await page
        .getByRole("radio", { name: "ระบุเดือน / รายการรายเดือน" })
        .click();
      await expect(page.locator("#income-month")).toBeVisible();
      await expect(page.locator("#income-date")).toBeHidden();

      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "ยกเลิก" })
        .click();
    }

    // 3. Add Expense Entries (One-time and Monthly)
    await page.goto("/calculator/expenses");
    await expect(
      page.getByRole("heading", { level: 1, name: "รายจ่าย" }),
    ).toBeVisible();

    // 3a. Add One-time Expense
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายจ่าย" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await page.locator("#expense-date").fill("2026-03-05");
    await page.locator("#expense-category").selectOption("shipping");
    await page.locator("#expense-amount").fill("15000.00");
    await page.locator("#expense-status").selectOption("likely_related");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("15,000.00 ฿");

    // 3b. Add Monthly Expense (without entering a day)
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายจ่าย" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await page
      .getByRole("radio", { name: "ระบุเดือน / รายการรายเดือน" })
      .click();
    await expect(page.locator("#expense-month")).toBeVisible();
    await expect(page.locator("#expense-date")).toBeHidden();

    await page.locator("#expense-month").fill("2026-03");
    await page.locator("#expense-category").selectOption("utilities");
    await page.locator("#expense-status").selectOption("likely_related");
    await page.locator("#expense-amount").fill("5000.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("5,000.00 ฿");
    await expectVisible("รายเดือน", true);

    // 4. Add Withholding Tax Entries (Monthly without entering a day)
    await page.goto("/calculator/withholding-tax");
    await expect(
      page.getByRole("heading", { level: 1, name: "ภาษีหัก ณ ที่จ่าย" }),
    ).toBeVisible();

    if (isMobile) {
      await page
        .getByRole("button", { name: "เพิ่มรายการภาษีหัก ณ ที่จ่าย" })
        .click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    // Use monthly frequency for withholding
    await page
      .getByRole("radio", { name: "ระบุเดือน / รายการรายเดือน" })
      .click();
    await expect(page.locator("#withholding-month")).toBeVisible();
    await expect(page.locator("#withholding-date")).toBeHidden();

    await page.locator("#withholding-month").fill("2026-03");
    await page.locator("#withholding-payer").fill("Shopee Co., Ltd.");
    await page.locator("#withholding-ref").fill("REF-2026-001");
    await page.locator("#withholding-amount").fill("1500.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("1,500.00 ฿");
    await expectVisible("Shopee Co., Ltd.");
    await expectVisible("รายเดือน", true);

    // 5. Add Allowance Draft Entry
    await page.goto("/calculator/allowances");
    await expect(
      page.getByRole("heading", { level: 1, name: "ค่าลดหย่อน (แบบร่าง)" }),
    ).toBeVisible();

    if (isMobile) {
      await page
        .getByRole("button", { name: "เพิ่มรายการค่าลดหย่อนแบบร่าง" })
        .click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await page.locator("#allowance-category").selectOption("personal_draft");
    await page.locator("#allowance-amount").fill("60000.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("60,000.00 ฿");

    // 6. View Summary Page and Verify Mixed Arithmetic Totals
    await page.goto("/calculator/summary");
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();

    // Total income: 50,000 + 40,000 = 90,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายรับรวม" })
        .getByText("90,000.00 ฿"),
    ).toBeVisible();

    // Total expense: 15,000 + 5,000 = 20,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายจ่ายรวม" })
        .getByText("20,000.00 ฿"),
    ).toBeVisible();

    // Net before tax: 90,000 - 20,000 = 70,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("70,000.00 ฿"),
    ).toBeVisible();

    // Total withholding: 1,500
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ภาษีหัก ณ ที่จ่ายที่บันทึกไว้" })
        .getByText("1,500.00 ฿"),
    ).toBeVisible();

    // 7. Verify Local Persistence across Page Reload
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("70,000.00 ฿"),
    ).toBeVisible();

    // 8. Verify No Financial Data in URL
    expect(page.url()).not.toContain("90000");
    expect(page.url()).not.toContain("70000");
    expect(page.url()).not.toContain("Shopee");

    // 9. Responsive Viewport Check (320px)
    await page.setViewportSize({ width: 320, height: 700 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 10. Clear Local Data
    await page.getByRole("button", { name: "ล้างข้อมูลในอุปกรณ์นี้" }).click();
    await expect(
      page.getByRole("heading", { name: "ล้างข้อมูลในอุปกรณ์นี้" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "ยืนยันล้างข้อมูล" }).click();

    // After clearing, reload and check that workspace is cleared
    await page.goto("/calculator");
    await expect(page.getByText("ยังไม่ได้เริ่มจัดข้อมูล")).toBeVisible();
  });
});
