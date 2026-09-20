import { expect, test, type Download } from "@playwright/test";
import { unzipSync } from "fflate";

async function readDownloadBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

test.describe("Calculator UX (Local-only)", () => {
  test("complete flow: wizard -> entries CRUD with frequencies -> summary -> persistence -> clear data", async ({
    page,
  }, testInfo) => {
    // Track network requests to verify NO financial data is transmitted
    const requestedUrls: string[] = [];
    const contentSecurityPolicyErrors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("Content Security Policy")
      ) {
        contentSecurityPolicyErrors.push(message.text());
      }
    });
    page.on("request", (request) => {
      requestedUrls.push(request.url());
      const postData = request.postData();
      if (postData) {
        expect(postData).not.toContain("50000");
        expect(postData).not.toContain("40000");
        expect(postData).not.toContain("10000");
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

    // Workspace persona can be corrected without clearing existing data.
    await expect(
      page.getByRole("heading", {
        name: "ขายออนไลน์ / ธุรกิจ · ปีภาษี 2569",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "แก้ไขประเภทผู้ใช้งาน" }).click();
    await page.getByRole("radio", { name: /ฟรีแลนซ์/ }).click();
    await page.getByRole("button", { name: "บันทึกประเภทผู้ใช้งาน" }).click();
    await expect(
      page.getByRole("heading", { name: "ฟรีแลนซ์ · ปีภาษี 2569" }),
    ).toBeVisible();

    // Start page exposes the existing workspace and warns before adding another.
    await page.goto("/start");
    await expect(page.getByText("พบ Workspace เดิมในอุปกรณ์นี้")).toBeVisible();
    await page.getByRole("button", { name: "เพิ่ม Workspace" }).click();
    const addWorkspaceDialog = page.getByRole("dialog", {
      name: "เพิ่ม Workspace ใหม่",
    });
    await expect(addWorkspaceDialog).toContainText(
      "โหมดไม่สมัครสมาชิกเก็บได้ 1 Workspace",
    );
    await addWorkspaceDialog.getByRole("button", { name: "ยกเลิก" }).click();
    await page.getByRole("link", { name: "เปิด Workspace เดิม" }).click();
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
    await expect(
      page.getByRole("checkbox", {
        name: "เลือกแหล่งรายได้ ขายสินค้า / ขายออนไลน์",
      }),
    ).toBeChecked();
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
    await expect(
      page.getByRole("checkbox", {
        name: "เลือกแหล่งรายได้ เงินเดือน / ค่าจ้างประจำ",
      }),
    ).toBeChecked();
    await page.locator("#income-amount").fill("40000.00");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("40,000.00 ฿");
    await expectVisible("มีนาคม 2569");
    await expectVisible("รายเดือน", true);

    // 2c. Add income without a source so Summary can group it safely
    if (isMobile) {
      await page.getByRole("button", { name: "เพิ่มรายการรายรับ" }).click();
    } else {
      await page.getByRole("button", { name: "เพิ่มรายการ" }).first().click();
    }

    await page.locator("#income-date").fill("2026-04-10");
    await page.locator("#income-category").selectOption("freelance_service");
    await page
      .getByRole("checkbox", {
        name: "เลือกแหล่งรายได้ รับจ้าง / งานอิสระ / บริการ",
      })
      .locator("..")
      .click();
    await page.locator("#income-amount").fill("10000.00");
    await page.locator("#income-note").fill("งานที่ไม่ระบุแหล่งที่มา");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "เพิ่มรายการ", exact: true })
      .click();

    await expectVisible("10,000.00 ฿");

    // Income ledger separates months, while a month can contain both frequencies.
    const incomeMonthGroups = page.getByTestId("income-month-groups");
    expect(
      await incomeMonthGroups
        .locator("[data-month-key]")
        .evaluateAll((groups) =>
          groups.map((group) => group.getAttribute("data-month-key")),
        ),
    ).toEqual(["2026-04", "2026-03"]);

    const marchIncomeGroup = page.getByTestId("income-month-2026-03");
    await expect(
      marchIncomeGroup.getByRole("heading", { name: "มีนาคม 2569" }),
    ).toBeVisible();
    await expect(
      marchIncomeGroup
        .getByText("90,000.00 ฿", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    for (const frequencyHeading of ["รายการรายเดือน", "รายการระบุวัน"]) {
      await expect(
        marchIncomeGroup
          .getByText(frequencyHeading, { exact: true })
          .filter({ visible: true })
          .first(),
      ).toBeVisible();
    }
    await expect(
      marchIncomeGroup
        .getByText("40,000.00 ฿", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(
      marchIncomeGroup
        .getByText("50,000.00 ฿", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();

    const aprilIncomeGroup = page.getByTestId("income-month-2026-04");
    await expect(
      aprilIncomeGroup.getByRole("heading", { name: "เมษายน 2569" }),
    ).toBeVisible();
    await expect(
      aprilIncomeGroup
        .getByText("10,000.00 ฿", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();

    const viewportBeforeNarrowCheck = page.viewportSize();
    await page.setViewportSize({ width: 320, height: 700 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    const incomeHtml = page.locator("html");
    const incomeWasDark = await incomeHtml.evaluate((element) =>
      element.classList.contains("dark"),
    );
    await page.getByRole("button", { name: "เปลี่ยนธีม" }).click();
    await expect
      .poll(() =>
        incomeHtml.evaluate((element) => element.classList.contains("dark")),
      )
      .toBe(!incomeWasDark);
    await expect(
      marchIncomeGroup.getByRole("heading", { name: "มีนาคม 2569" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "เปลี่ยนธีม" }).click();
    await expect
      .poll(() =>
        incomeHtml.evaluate((element) => element.classList.contains("dark")),
      )
      .toBe(incomeWasDark);

    if (viewportBeforeNarrowCheck) {
      await page.setViewportSize(viewportBeforeNarrowCheck);
    }

    // 2d. Test edit frequency switch clears incompatible period field
    if (!isMobile) {
      const editButton = page
        .getByRole("button", { name: /แก้ไขรายการ/ })
        .first();
      await editButton.focus();
      await page.keyboard.press("Enter");
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

    // Total income: 50,000 + 40,000 + 10,000 = 100,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายรับรวม" })
        .getByText("100,000.00 ฿"),
    ).toBeVisible();

    // Total expense: 15,000 + 5,000 = 20,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "รายจ่ายรวม" })
        .getByText("20,000.00 ฿"),
    ).toBeVisible();

    // Net before tax: 100,000 - 20,000 = 80,000
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("80,000.00 ฿"),
    ).toBeVisible();

    // Total withholding: 1,500
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ภาษีหัก ณ ที่จ่ายที่บันทึกไว้" })
        .getByText("1,500.00 ฿"),
    ).toBeVisible();

    // 6a. Summary Breakdown renders all local-only arithmetic views
    const summaryBreakdown = page.getByTestId("summary-breakdown");
    for (const heading of [
      "รายรับตามแหล่งที่มา",
      "รายรับตามหมวดบันทึก",
      "รายจ่ายตามหมวดบันทึก",
      "รายจ่ายตามสถานะการจัดกลุ่ม",
    ]) {
      await expect(
        summaryBreakdown.getByRole("heading", { name: heading }),
      ).toBeVisible();
    }

    const summaryUrl = page.url();
    const requestCountBeforeDialog = requestedUrls.length;
    const missingSourceTrigger = summaryBreakdown.getByRole("button", {
      name: /ดูรายละเอียดรายรับตามแหล่งที่มา ไม่ระบุแหล่งที่มา จำนวน 1 รายการ รวม 10,000.00 ฿/,
    });
    await missingSourceTrigger.click();
    const breakdownDialog = page.getByRole("dialog", {
      name: "รายรับตามแหล่งที่มา: ไม่ระบุแหล่งที่มา",
    });
    await expect(breakdownDialog).toBeVisible();
    await expect(
      breakdownDialog.getByText("งานที่ไม่ระบุแหล่งที่มา"),
    ).toBeVisible();
    await expect(
      breakdownDialog.getByText("10,000.00 ฿").first(),
    ).toBeVisible();
    await expect(breakdownDialog.getByText("Shopee Store")).toBeHidden();
    expect(page.url()).toBe(summaryUrl);
    expect(requestedUrls).toHaveLength(requestCountBeforeDialog);

    await page.keyboard.press("Escape");
    await expect(breakdownDialog).toBeHidden();
    await expect(missingSourceTrigger).toBeFocused();
    expect(page.url()).toBe(summaryUrl);
    expect(requestedUrls).toHaveLength(requestCountBeforeDialog);

    // Keyboard activation opens only the matching source entries
    const shopeeTrigger = summaryBreakdown.getByRole("button", {
      name: /ดูรายละเอียดรายรับตามแหล่งที่มา Shopee Store จำนวน 1 รายการ รวม 50,000.00 ฿/,
    });
    await shopeeTrigger.focus();
    await page.keyboard.press("Enter");
    const shopeeDialog = page.getByRole("dialog", {
      name: "รายรับตามแหล่งที่มา: Shopee Store",
    });
    await expect(shopeeDialog).toBeVisible();
    await expect(shopeeDialog.getByText("ยอดขายครั้งเดียว")).toBeVisible();
    await expect(
      shopeeDialog.getByText("งานที่ไม่ระบุแหล่งที่มา"),
    ).toBeHidden();
    await shopeeDialog
      .getByRole("button", { name: "ปิดรายละเอียดรายการ" })
      .click();
    await expect(shopeeDialog).toBeHidden();
    await expect(shopeeTrigger).toBeFocused();

    // 6b. Local PDF previews before download without leaking financial data.
    const requestCountBeforePdf = requestedUrls.length;
    const pdfUrl = page.url();
    const pdfPanel = page.getByRole("region", {
      name: "ดาวน์โหลดรายงาน PDF",
    });
    await pdfPanel
      .getByRole("textbox", {
        name: "ชื่อผู้จัดทำ (ไม่บังคับ)",
      })
      .fill("ผู้ใช้ทดสอบ");
    await pdfPanel.getByRole("button", { name: "ดูตัวอย่าง PDF" }).click();
    const pdfPreviewDialog = page.getByRole("dialog", {
      name: "ตัวอย่างรายงาน PDF",
    });
    await expect(pdfPreviewDialog).toBeVisible();
    await expect(
      pdfPreviewDialog.getByTitle("ตัวอย่างรายงาน PDF"),
    ).toHaveAttribute("src", /^blob:/);
    await page.waitForTimeout(250);
    expect(contentSecurityPolicyErrors).toEqual([]);
    const downloadPromise = page.waitForEvent("download");
    await pdfPreviewDialog
      .getByRole("button", { name: "ดาวน์โหลด PDF" })
      .click();
    const download = await downloadPromise;
    await download.saveAs(testInfo.outputPath("professional-report.pdf"));
    await expect(
      pdfPreviewDialog.getByText("ดาวน์โหลดรายงานเรียบร้อยแล้ว"),
    ).toBeVisible();
    expect(download.suggestedFilename()).toMatch(
      /^รายงานสรุปรายรับรายจ่าย-2569-\d{8}-\d{4}\.pdf$/,
    );
    const pdfStream = await download.createReadStream();
    const pdfChunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      pdfChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBytes = Buffer.concat(pdfChunks);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdfBytes.byteLength).toBeGreaterThan(10_000);
    expect(page.url()).toBe(pdfUrl);
    for (const requestUrl of requestedUrls.slice(requestCountBeforePdf)) {
      expect(requestUrl).not.toContain("100000");
      expect(requestUrl).not.toContain("Shopee");
      expect(requestUrl).not.toContain("ผู้ใช้ทดสอบ");
    }
    await pdfPreviewDialog
      .getByRole("button", { name: "ปิดตัวอย่าง", exact: true })
      .click();
    await expect(pdfPreviewDialog).toBeHidden();

    // 6c. Excel export is generated locally with editable numeric cells and all required sheets.
    const requestCountBeforeExcel = requestedUrls.length;
    const excelDownloadPromise = page.waitForEvent("download");
    await pdfPanel.getByRole("button", { name: "ส่งออก Excel" }).click();
    const excelDownload = await excelDownloadPromise;
    expect(excelDownload.suggestedFilename()).toMatch(
      /^รายงานข้อมูลรายรับรายจ่าย-2569-\d{8}-\d{4}\.xlsx$/,
    );
    const excelBytes = await readDownloadBytes(excelDownload);
    expect(Array.from(excelBytes.subarray(0, 2))).toEqual([0x50, 0x4b]);
    const workbookFiles = unzipSync(new Uint8Array(excelBytes));
    const workbookXml = new TextDecoder().decode(
      workbookFiles["xl/workbook.xml"],
    );
    const worksheetXml = Object.entries(workbookFiles)
      .filter(([name]) => name.startsWith("xl/worksheets/"))
      .map(([, bytes]) => new TextDecoder().decode(bytes))
      .join("\n");
    for (const sheetName of [
      "Summary",
      "Income",
      "Expense",
      "Withholding Tax",
      "Deductions",
      "Breakdown",
    ]) {
      expect(workbookXml).toContain(`name="${sheetName}"`);
    }
    expect(worksheetXml).toContain("รายรับรวม");
    expect(worksheetXml).toContain(
      "Tax Rules 2568/2569: unverified / not for calculation",
    );
    expect(worksheetXml).toContain("<v>100000</v>");
    expect(worksheetXml).not.toMatch(
      /workspaceId|ruleSetId|taxDue|refund|%PDF/i,
    );
    for (const requestUrl of requestedUrls.slice(requestCountBeforeExcel)) {
      expect(requestUrl).not.toContain("100000");
      expect(requestUrl).not.toContain("Shopee");
    }

    // Dark mode does not block CSV or PDF downloads.
    await page.getByRole("button", { name: "เปลี่ยนธีม" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const requestCountBeforeCsv = requestedUrls.length;
    const csvDownloadPromise = page.waitForEvent("download");
    await pdfPanel.getByRole("button", { name: "ส่งออก CSV" }).click();
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toMatch(
      /^รายงานข้อมูลรายรับรายจ่าย-2569-\d{8}-\d{4}-csv\.zip$/,
    );
    const csvBytes = await readDownloadBytes(csvDownload);
    const csvFiles = unzipSync(new Uint8Array(csvBytes));
    expect(Object.keys(csvFiles)).toEqual([
      "01-Summary.csv",
      "02-Income.csv",
      "03-Expense.csv",
      "04-Withholding-Tax.csv",
      "05-Deductions.csv",
      "06-Breakdown.csv",
    ]);
    const allCsv = Object.values(csvFiles)
      .map((bytes) => new TextDecoder().decode(bytes))
      .join("\n");
    expect(allCsv).toContain("รายรับ — แหล่งที่มา");
    expect(allCsv).toContain("สัดส่วน (%)");
    expect(allCsv).toContain(
      "Tax Rules 2568/2569: unverified / not for calculation",
    );
    expect(allCsv).not.toMatch(/workspaceId|ruleSetId|taxDue|refund|%PDF/i);
    expect(Object.keys(csvFiles).every((name) => name.endsWith(".csv"))).toBe(
      true,
    );
    for (const requestUrl of requestedUrls.slice(requestCountBeforeCsv)) {
      expect(requestUrl).not.toContain("100000");
      expect(requestUrl).not.toContain("Shopee");
    }

    const requestCountBeforeDarkPdf = requestedUrls.length;
    await pdfPanel.getByRole("button", { name: "ดูตัวอย่าง PDF" }).click();
    await expect(pdfPreviewDialog).toBeVisible();
    const darkDownloadPromise = page.waitForEvent("download");
    await pdfPreviewDialog
      .getByRole("button", { name: "ดาวน์โหลด PDF" })
      .click();
    await darkDownloadPromise;
    const darkPdfRequests = requestedUrls.slice(requestCountBeforeDarkPdf);
    expect(darkPdfRequests.length).toBeGreaterThan(0);
    expect(
      darkPdfRequests.every((requestUrl) => requestUrl.startsWith("blob:")),
    ).toBe(true);
    await pdfPreviewDialog
      .getByRole("button", { name: "ปิดตัวอย่าง", exact: true })
      .click();
    await missingSourceTrigger.click();
    await expect(breakdownDialog).toBeVisible();
    await expect(
      breakdownDialog.getByRole("heading", {
        name: "รายรับตามแหล่งที่มา: ไม่ระบุแหล่งที่มา",
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(breakdownDialog).toBeHidden();

    // 7. Verify Local Persistence across Page Reload
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "สรุปข้อมูล" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "ส่วนต่างก่อนภาษี" })
        .getByText("80,000.00 ฿"),
    ).toBeVisible();

    // 8. Verify No Financial Data in URL
    expect(page.url()).not.toContain("100000");
    expect(page.url()).not.toContain("80000");
    expect(page.url()).not.toContain("Shopee");

    // 9. Responsive Viewport Check (320px)
    await page.setViewportSize({ width: 320, height: 700 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await missingSourceTrigger.click();
    await expect(breakdownDialog).toBeVisible();
    const dialogFitsViewport = await breakdownDialog.evaluate(
      (dialog) => dialog.getBoundingClientRect().width <= window.innerWidth,
    );
    expect(dialogFitsViewport).toBe(true);
    await page.keyboard.press("Escape");
    await expect(breakdownDialog).toBeHidden();

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
