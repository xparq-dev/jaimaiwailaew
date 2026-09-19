import { describe, expect, it } from "vitest";

import type {
  AllowanceDraftEntry,
  CalculatorWorkspace,
  ExpenseEntry,
  IncomeEntry,
  WithholdingEntry,
} from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { buildLocalPdfReportModel } from "@/pdf/local-pdf-report";
import { toMoneySatang } from "@/tax/money";

const timestamp = "2026-01-01T00:00:00.000Z";

function createWorkspaceFixture(): CalculatorWorkspace {
  const workspace = createCalculatorWorkspace(
    getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
  );
  const incomeEntries: readonly IncomeEntry[] = [
    {
      id: "income-monthly",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-02",
      categoryCode: "salary",
      sourceName: "งานประจำ",
      amountSatang: toMoneySatang(40_000_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "income-one-time",
      entryFrequency: "one_time",
      occurredOn: "2026-03-15",
      occurredMonth: null,
      categoryCode: "freelance_service",
      amountSatang: toMoneySatang(10_000_00),
      note: "งานออกแบบ",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "income-outside",
      entryFrequency: "one_time",
      occurredOn: "2026-07-01",
      occurredMonth: null,
      categoryCode: "online_sales",
      sourceName: "นอกช่วง",
      amountSatang: toMoneySatang(99_000_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const expenseEntries: readonly ExpenseEntry[] = [
    {
      id: "expense-one-time",
      entryFrequency: "one_time",
      occurredOn: "2026-03-16",
      occurredMonth: null,
      categoryCode: "shipping",
      taxRelevanceStatus: "needs_review",
      amountSatang: toMoneySatang(2_000_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const withholdingEntries: readonly WithholdingEntry[] = [
    {
      id: "withholding-monthly",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-03",
      payerName: "ลูกค้า ก",
      certificateReference: "CERT-LOCAL",
      amountSatang: toMoneySatang(300_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const allowanceDraftEntries: readonly AllowanceDraftEntry[] = [
    {
      id: "allowance",
      categoryCode: "insurance_draft",
      declaredAmountSatang: toMoneySatang(5_000_00),
      note: "แบบร่างเท่านั้น",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  return {
    ...workspace,
    incomeEntries,
    expenseEntries,
    withholdingEntries,
    allowanceDraftEntries,
  };
}

describe("buildLocalPdfReportModel", () => {
  it("builds a local report from selected-period arithmetic and breakdown data", () => {
    const workspace = createWorkspaceFixture();
    const before = structuredClone(workspace);
    const report = buildLocalPdfReportModel(workspace, {
      generatedAt: new Date("2026-09-13T07:55:00.000Z"),
      reportName: "  รายงานทดสอบ  ",
      displayName: "  ผู้ใช้ตัวอย่าง  ",
    });

    expect(report.title).toBe("รายงานทดสอบ");
    expect(report.displayName).toBe("ผู้ใช้ตัวอย่าง");
    expect(report.generatedAtLabel).toBe(
      "13 กันยายน 2569 14:55 น. (Asia/Bangkok)",
    );
    expect(report.generatedAtFileStamp).toBe("20260913-1455");
    expect(report.totals).toMatchObject({
      totalIncomeSatang: toMoneySatang(50_000_00),
      totalExpenseSatang: toMoneySatang(2_000_00),
      totalWithholdingSatang: toMoneySatang(300_00),
      totalDeclaredAllowanceSatang: toMoneySatang(5_000_00),
    });
    expect(report.incomeGroups.map((group) => group.entryFrequency)).toEqual([
      "monthly",
      "one_time",
    ]);
    expect(
      report.incomeGroups.flatMap((group) => group.rows.map((row) => row.id)),
    ).toEqual(["income-monthly", "income-one-time"]);
    expect(
      report.breakdownSections[0]?.details.map((detail) => detail.group.label),
    ).not.toContain("ไม่ระบุแหล่งที่มา");
    expect(report.allowanceRows[0]).toMatchObject({
      label: "ประกัน (ร่าง)",
      amountSatang: toMoneySatang(5_000_00),
    });
    expect(workspace).toEqual(before);
  });

  it("does not expose internal rule metadata, notes, or numeric tax results", () => {
    const report = buildLocalPdfReportModel(createWorkspaceFixture(), {
      generatedAt: new Date("2026-09-13T07:55:00.000Z"),
    });

    expect(report).not.toHaveProperty("ruleSetId");
    expect(report).not.toHaveProperty("ruleSetVersion");
    expect(report).not.toHaveProperty("ruleStatus");
    expect(report).not.toHaveProperty("validationStatus");
    expect(report).not.toHaveProperty("resolverStatus");
    expect(report).not.toHaveProperty("warnings");
    expect(report).not.toHaveProperty("assumptions");
    expect(report.incomeGroups[1]?.rows[0]).not.toHaveProperty("note");
    expect(report.allowanceRows[0]).not.toHaveProperty("note");
    expect(report.withholdingGroups[0]?.rows[0]?.primaryLabel).not.toContain(
      "ไม่ระบุ",
    );
    expect(report).not.toHaveProperty("taxEstimateSatang");
    expect(report).not.toHaveProperty("taxDueSatang");
    expect(report).not.toHaveProperty("refundSatang");
  });
});
