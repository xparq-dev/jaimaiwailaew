import { describe, expect, it } from "vitest";

import {
  ALLOWANCE_DRAFT_CATEGORY_OPTIONS,
  EXPENSE_CATEGORY_DISCLAIMER,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  INCOME_CATEGORY_DISCLAIMER,
  INCOME_CATEGORY_OPTIONS,
  PERSONA_OPTIONS,
  getAllowanceCategoryLabel,
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getIncomeCategoryLabel,
  getPersonaLabel,
} from "@/calculator/categories";
import {
  buildCalculatorAssumptions,
  buildCalculatorWarnings,
  computeCompleteness,
} from "@/calculator/warnings";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { toMoneySatang } from "@/tax/money";

describe("Calculator Warnings, Assumptions, and Completeness", () => {
  it("generates warning when there are no income entries in selected period", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const warnings = buildCalculatorWarnings(workspace);
    expect(warnings.some((w) => w.code === "no-income-in-period")).toBe(true);
  });

  it("does not falsely trigger missing day warning for monthly entries", () => {
    const input = getDefaultWorkspaceInput(
      "salaried_employee",
      2569,
      "full_year",
    );
    const workspace = createCalculatorWorkspace(input);

    const withMonthly = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-m1",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-03",
          categoryCode: "salary" as const,
          amountSatang: toMoneySatang(4000000),
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
    };

    const warnings = buildCalculatorWarnings(withMonthly);
    // Should NOT have "no-income-in-period"
    expect(warnings.some((w) => w.code === "no-income-in-period")).toBe(false);
    // Should NOT have any day missing warning
    expect(warnings.some((w) => w.message.includes("ขาดวัน"))).toBe(false);
  });

  it("does not falsely trigger missing month warning for one-time entries", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const withOneTime = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-ot1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-03-15",
          occurredMonth: null,
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(500000),
          createdAt: "2026-03-15T00:00:00.000Z",
          updatedAt: "2026-03-15T00:00:00.000Z",
        },
      ],
    };

    const warnings = buildCalculatorWarnings(withOneTime);
    expect(warnings.some((w) => w.code === "no-income-in-period")).toBe(false);
    expect(warnings.some((w) => w.message.includes("ขาดเดือน"))).toBe(false);
  });

  it("generates warning when expenses have needs_review or uncategorized status", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const withNeedsReview = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-02-10",
          occurredMonth: null,
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(100000),
          createdAt: "2026-02-10T00:00:00.000Z",
          updatedAt: "2026-02-10T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        {
          id: "exp-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-02-15",
          occurredMonth: null,
          categoryCode: "other" as const,
          taxRelevanceStatus: "needs_review" as const,
          amountSatang: toMoneySatang(20000),
          createdAt: "2026-02-15T00:00:00.000Z",
          updatedAt: "2026-02-15T00:00:00.000Z",
        },
      ],
    };

    const warnings = buildCalculatorWarnings(withNeedsReview);
    expect(warnings.some((w) => w.code === "expense-needs-review")).toBe(true);
  });

  it("generates warning when withholding entries lack payer name and reference", () => {
    const input = getDefaultWorkspaceInput("freelancer", 2569, "first_half");
    const workspace = createCalculatorWorkspace(input);

    const withIncompleteWht = {
      ...workspace,
      withholdingEntries: [
        {
          id: "wht-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-03-01",
          occurredMonth: null,
          amountSatang: toMoneySatang(5000),
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
    };

    const warnings = buildCalculatorWarnings(withIncompleteWht);
    expect(
      warnings.some((w) => w.code === "withholding-missing-reference"),
    ).toBe(true);
  });

  it("returns standard assumptions emphasizing arithmetic nature and unverified rules", () => {
    const assumptions = buildCalculatorAssumptions();
    expect(assumptions.length).toBeGreaterThanOrEqual(4);
    expect(assumptions.some((a) => a.id === "arithmetic-only")).toBe(true);
    expect(assumptions.some((a) => a.id === "rules-unverified")).toBe(true);
  });

  it("computes completeness score without claiming tax compliance", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const initialCompleteness = computeCompleteness(workspace);
    expect(initialCompleteness.score).toBeLessThan(
      initialCompleteness.maxScore,
    );
    expect(initialCompleteness.statusLabel).toBeDefined();
    expect(initialCompleteness.description).toBeDefined();
    // Must never claim tax compliance
    expect(initialCompleteness.statusLabel).not.toMatch(/พร้อมยื่น/);
    expect(initialCompleteness.description).not.toMatch(/พร้อมยื่น/);
  });

  it("provides valid category options and localized Thai labels", () => {
    expect(PERSONA_OPTIONS.length).toBe(5);
    expect(getPersonaLabel("online_seller_business")).toBe(
      "ขายออนไลน์ / ธุรกิจ",
    );

    expect(INCOME_CATEGORY_OPTIONS.length).toBe(6);
    expect(getIncomeCategoryLabel("online_sales")).toBe(
      "ขายสินค้า / ขายออนไลน์",
    );
    expect(getIncomeCategoryLabel("salary")).toBe("เงินเดือน / ค่าจ้างประจำ");
    expect(getIncomeCategoryLabel("bonus")).toBe("โบนัส / เงินพิเศษ");
    expect(getIncomeCategoryLabel("freelance_service")).toBe(
      "รับจ้าง / งานอิสระ / บริการ",
    );
    expect(getIncomeCategoryLabel("rental")).toBe("รายได้จากค่าเช่า");
    expect(getIncomeCategoryLabel("other")).toBe("รายได้อื่น ๆ");

    expect(EXPENSE_CATEGORY_OPTIONS.length).toBeGreaterThanOrEqual(8);
    expect(getExpenseCategoryLabel("shipping")).toBe("ค่าขนส่ง");

    expect(EXPENSE_STATUS_OPTIONS.length).toBe(4);
    expect(getExpenseStatusLabel("likely_related")).toBe(
      "น่าจะเกี่ยวข้องกับงาน",
    );

    expect(ALLOWANCE_DRAFT_CATEGORY_OPTIONS.length).toBeGreaterThanOrEqual(6);
    expect(getAllowanceCategoryLabel("personal_draft")).toBe(
      "ค่าลดหย่อนส่วนตัว (ร่าง)",
    );
  });

  it("provides product data grouping disclaimers that do not determine tax status", () => {
    expect(INCOME_CATEGORY_DISCLAIMER).toContain(
      "หมวดบันทึกนี้ใช้เพื่อจัดระเบียบข้อมูลส่วนตัวเท่านั้น ไม่ใช่การจัดประเภทเงินได้หรือคำวินิจฉัยภาษีตามกฎหมาย",
    );
    expect(EXPENSE_CATEGORY_DISCLAIMER).toContain(
      "สถานะการจัดกลุ่มรายการเป็นเพียงเครื่องช่วยทบทวนข้อมูล ไม่ได้ยืนยันว่ารายจ่ายรายการใดหักภาษีได้",
    );
  });
});
