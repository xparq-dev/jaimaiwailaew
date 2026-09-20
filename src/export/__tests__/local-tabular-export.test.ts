import { unzipSync } from "fflate";
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
import { createLocalCsvBundleArtifact } from "@/export/create-local-csv-bundle";
import { createLocalXlsxArtifact } from "@/export/create-local-xlsx";
import {
  buildLocalTabularReportModel,
  TABULAR_EXPORT_DISCLAIMER,
  TABULAR_EXPORT_TAX_RULE_STATUS,
} from "@/export/local-tabular-report";
import { toMoneySatang } from "@/tax/money";

const timestamp = "2026-01-01T00:00:00.000Z";

function createWorkspaceFixture(): CalculatorWorkspace {
  const workspace = createCalculatorWorkspace(
    getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
  );
  const incomeEntries: readonly IncomeEntry[] = [
    {
      id: "income-monthly-secret-id",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-02",
      categoryCode: "salary",
      sourceName: "บริษัทประจำ",
      amountSatang: toMoneySatang(40_000_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "income-one-time-secret-id",
      entryFrequency: "one_time",
      occurredOn: "2026-03-15",
      occurredMonth: null,
      categoryCode: "freelance_service",
      sourceName: '=HYPERLINK("https://invalid.example")',
      amountSatang: toMoneySatang(10_000_00),
      note: "private-income-note",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "income-outside-secret-id",
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
      id: "expense-secret-id",
      entryFrequency: "one_time",
      occurredOn: "2026-03-16",
      occurredMonth: null,
      categoryCode: "shipping",
      taxRelevanceStatus: "needs_review",
      amountSatang: toMoneySatang(2_000_00),
      note: "private-expense-note",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const withholdingEntries: readonly WithholdingEntry[] = [
    {
      id: "withholding-secret-id",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-03",
      payerName: "ลูกค้า ก",
      certificateReference: "CERT-SECRET",
      amountSatang: toMoneySatang(300_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const allowanceDraftEntries: readonly AllowanceDraftEntry[] = [
    {
      id: "allowance-secret-id",
      categoryCode: "insurance_draft",
      declaredAmountSatang: toMoneySatang(5_000_00),
      note: "private-allowance-note",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "empty-allowance-secret-id",
      categoryCode: "donation_draft",
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

function createReport() {
  return buildLocalTabularReportModel(createWorkspaceFixture(), {
    generatedAt: new Date("2026-09-13T07:55:00.000Z"),
  });
}

async function unzipBlob(blob: Blob) {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

describe("local tabular report", () => {
  it("uses selected-period data, editable numbers, metadata, and no internal fields", () => {
    const workspace = createWorkspaceFixture();
    const before = structuredClone(workspace);
    const report = buildLocalTabularReportModel(workspace, {
      generatedAt: new Date("2026-09-13T07:55:00.000Z"),
    });

    expect(report.generatedAtLabel).toBe(
      "13 กันยายน 2569 14:55 น. (Asia/Bangkok)",
    );
    expect(report.generatedAtFileStamp).toBe("20260913-1455");
    expect(report.taxRuleStatus).toBe(TABULAR_EXPORT_TAX_RULE_STATUS);
    expect(report.disclaimer).toBe(TABULAR_EXPORT_DISCLAIMER);
    expect(report.summaryRows).toEqual([
      { label: "รายรับรวม", amountBaht: 50_000 },
      { label: "รายจ่ายรวม", amountBaht: 2_000 },
      { label: "ภาษีหัก ณ ที่จ่ายรวม", amountBaht: 300 },
      { label: "ค่าลดหย่อน/ค่าลดภาษีรวม", amountBaht: 5_000 },
      { label: "ยอดคงเหลือ", amountBaht: 48_000 },
    ]);
    expect(report.incomeRows.map((row) => row.period)).toEqual([
      "15/03/2569",
      "02/2569",
    ]);
    expect(report.incomeRows).toHaveLength(2);
    expect(report.deductionRows).toHaveLength(1);
    expect(report.breakdownRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "รายรับ — แหล่งที่มา",
          group: "บริษัทประจำ",
          entryCount: 1,
          totalBaht: 40_000,
          percentage: 80,
        }),
        expect.objectContaining({
          type: "รายจ่าย — หมวดหมู่",
          entryCount: 1,
          totalBaht: 2_000,
          percentage: 100,
        }),
      ]),
    );
    expect(JSON.stringify(report)).not.toMatch(
      /secret-id|private-|CERT-SECRET|ruleSetId|taxDue|refund/i,
    );
    expect(workspace).toEqual(before);
  });
});

describe("local XLSX export", () => {
  it("creates a standards-based workbook with the required sheets and no private fields", async () => {
    const artifact = createLocalXlsxArtifact(createReport());
    const bytes = new Uint8Array(await artifact.blob.arrayBuffer());
    const files = unzipSync(bytes);
    const workbook = decodeUtf8(files["xl/workbook.xml"]!);
    const allXml = Object.values(files).map(decodeUtf8).join("\n");

    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
    expect(artifact.fileName).toBe(
      "รายงานข้อมูลรายรับรายจ่าย-2569-20260913-1455.xlsx",
    );
    expect(artifact.blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(workbook).toContain('name="Summary"');
    expect(workbook).toContain('name="Income"');
    expect(workbook).toContain('name="Expense"');
    expect(workbook).toContain('name="Withholding Tax"');
    expect(workbook).toContain('name="Deductions"');
    expect(workbook).toContain('name="Breakdown"');
    expect(workbook).toContain('name="Tax Estimate"');
    expect(allXml).toContain("รายรับรวม");
    expect(allXml).toContain(TABULAR_EXPORT_TAX_RULE_STATUS);
    expect(allXml).toContain(TABULAR_EXPORT_DISCLAIMER);
    expect(allXml).toContain("<v>50000</v>");
    expect(allXml).not.toMatch(
      /secret-id|private-|CERT-SECRET|income-outside|taxDue|refund|%PDF/i,
    );
  });

  it("omits optional sheets when no withholding or declared deductions exist", async () => {
    const report = createReport();
    const files = await unzipBlob(
      createLocalXlsxArtifact({
        ...report,
        withholdingRows: [],
        deductionRows: [],
      }).blob,
    );
    const workbook = decodeUtf8(files["xl/workbook.xml"]!);

    expect(workbook).not.toContain('name="Withholding Tax"');
    expect(workbook).not.toContain('name="Deductions"');
    expect(workbook).toContain('name="Breakdown"');
  });
});

describe("local CSV export", () => {
  it("creates separate UTF-8 CSV files in one ZIP and neutralizes spreadsheet formulas", async () => {
    const artifact = createLocalCsvBundleArtifact(createReport());
    const files = await unzipBlob(artifact.blob);
    const names = Object.keys(files);
    const summaryBytes = files["01-Summary.csv"]!;
    const summary = decodeUtf8(summaryBytes);
    const income = decodeUtf8(files["02-Income.csv"]!);
    const breakdown = decodeUtf8(files["06-Breakdown.csv"]!);
    const allCsv = Object.values(files).map(decodeUtf8).join("\n");

    expect(artifact.fileName).toBe(
      "รายงานข้อมูลรายรับรายจ่าย-2569-20260913-1455-csv.zip",
    );
    expect(artifact.blob.type).toBe("application/zip");
    expect(names).toEqual([
      "01-Summary.csv",
      "02-Income.csv",
      "03-Expense.csv",
      "04-Withholding-Tax.csv",
      "05-Deductions.csv",
      "06-Breakdown.csv",
      "07-Tax-Estimate.csv",
    ]);
    expect(Array.from(summaryBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(summary).toContain(TABULAR_EXPORT_TAX_RULE_STATUS);
    expect(summary).toContain(TABULAR_EXPORT_DISCLAIMER);
    expect(income).toContain('"\'=HYPERLINK(""https://invalid.example"")"');
    expect(breakdown).toContain('"สัดส่วน (%)"');
    expect(allCsv).not.toMatch(
      /secret-id|private-|CERT-SECRET|income-outside|taxDue|refund|%PDF/i,
    );
    expect(names.every((name) => name.endsWith(".csv"))).toBe(true);
  });
});
