import { expect, test } from "@playwright/test";

test.describe("Calculator UX (Local-only)", () => {
  test("complete flow: wizard -> entries CRUD -> summary -> persistence -> clear data", async ({
    page,
  }, testInfo) => {
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
    await expect(
      page.getByText("ข้อมูลอยู่ในอุปกรณ์นี้เท่านั้น"),
    ).toBeVisible();

    // 2. Add Income Entry
    await page.goto("/calculator/income");
    await expect(
      page.getByRole("heading", { level: 1, name: "รายรับ" }),
    ).toBeVisible();
    await expect(page.locator("#income-section-disclaimer")).toBeVisible();

    // Click Add entry (either desktop or mobile)
    const isMobile = testInfo.project.name.includes("mobile");
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายรับ" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await expect(
      page.getByRole("heading", { name: "เพิ่มรายรับ" }),
    ).toBeVisible();
    // Helper to check visibility across desktop (table first) and mobile (card last)
    const expectVisible = async (text: string) => {
      const locator = isMobile
        ? page.getByText(text).last()
        : page.getByText(text).first();
      await expect(locator).toBeVisible();
    };

    await page.locator("#income-date").fill("2026-03-01");
    await page.locator("#income-category").selectOption("online_sales");
    await page.locator("#income-source").fill("Shopee Store");
    await page.locator("#income-amount").fill("50000.00");
    await page.locator("#income-note").fill("ยอดขายเดือนมีนาคม");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("50,000.00 ฿");
    await expectVisible("Shopee Store");

    // 3. Add Expense Entry
    await page.goto("/calculator/expenses");
    await expect(
      page.getByRole("heading", { level: 1, name: "รายจ่าย" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "สถานะการจัดกลุ่มรายการเป็นเพียงเครื่องช่วยทบทวนข้อมูล ไม่ได้ยืนยันว่ารายจ่ายรายการใดหักภาษีได้",
      ),
    ).toBeVisible();

    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายจ่าย" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await expect(
      page.getByRole("heading", { name: "เพิ่มรายจ่าย" }),
    ).toBeVisible();
    await page.locator("#expense-date").fill("2026-03-05");
    await page.locator("#expense-category").selectOption("shipping");
    await page.locator("#expense-amount").fill("15000.00");
    await page.locator("#expense-status").selectOption("likely_related");
    await page.locator("#expense-note").fill("Flash Express delivery");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("15,000.00 ฿");

    // 4. Add Withholding Tax Entry
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

    await expect(
      page.getByRole("heading", { name: "เพิ่มภาษีหัก ณ ที่จ่าย" }),
    ).toBeVisible();
    await page.locator("#withholding-date").fill("2026-03-10");
    await page.locator("#withholding-payer").fill("Shopee Co., Ltd.");
    await page.locator("#withholding-ref").fill("REF-2026-001");
    await page.locator("#withholding-amount").fill("1500.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("1,500.00 ฿");
    await expectVisible("Shopee Co., Ltd.");

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

    await expect(
      page.getByRole("heading", { name: "เพิ่มค่าลดหย่อนแบบร่าง" }),
    ).toBeVisible();
    await page.locator("#allowance-category").selectOption("personal_draft");
    await page.locator("#allowance-amount").fill("60000.00");
    await page.locator("#allowance-note").fill("สิทธิส่วนตัวเบื้องต้น");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("60,000.00 ฿");

    // 6. View Summary Page
    await page.goto("/calculator/summary");
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();

    // Check Arithmetic Totals Cards
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายรับรวม" })
        .getByText("50,000.00 ฿"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายจ่ายรวม" })
        .getByText("15,000.00 ฿"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("35,000.00 ฿"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ภาษีหัก ณ ที่จ่ายที่บันทึกไว้" })
        .getByText("1,500.00 ฿"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ค่าลดหย่อนที่บันทึกแบบร่าง" })
        .getByText("60,000.00 ฿"),
    ).toBeVisible();

    // Check Disclaimers
    await expect(
      page.getByText(
        "เป็นส่วนต่างเชิงคณิตศาสตร์จากข้อมูลที่กรอก ไม่ใช่เงินได้สุทธิทางภาษี",
      ),
    ).toBeVisible();

    // Check Tax Estimate Unavailable Card
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "ยังไม่พร้อมคำนวณภาษีประมาณการ",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "ระบบจะไม่แสดงตัวเลขภาษี placeholder หรือ 0 บาท จนกว่ากฎจะผ่านการตรวจสอบ",
      ),
    ).toBeVisible();

    // Ensure NO numeric tax due or final tax is displayed
    await expect(page.getByText("ภาษีที่ต้องจ่ายแน่นอน")).toBeHidden();
    await expect(page.getByText("ภาษีสุทธิ")).toBeHidden();

    // 7. Verify Local Persistence across Page Reload
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("35,000.00 ฿"),
    ).toBeVisible();

    // 8. Verify No Financial Data in URL
    expect(page.url()).not.toContain("50000");
    expect(page.url()).not.toContain("15000");
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
