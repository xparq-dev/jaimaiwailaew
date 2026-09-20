import { strToU8, zipSync } from "fflate";

import type { LocalDownloadArtifact } from "./download-local-artifact";
import type { LocalTabularReportModel } from "./local-tabular-report";

type CsvValue = string | number;

interface CsvDefinition {
  readonly fileName: string;
  readonly rows: readonly (readonly CsvValue[])[];
}

function protectSpreadsheetText(value: string): string {
  return /^[=+\-@\t\r]/u.test(value) ? `'${value}` : value;
}

function csvCell(value: CsvValue): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("CSV export only supports finite numeric values.");
    }
    return String(value);
  }

  return `"${protectSpreadsheetText(value).replaceAll('"', '""')}"`;
}

function csvContent(rows: readonly (readonly CsvValue[])[]): Uint8Array {
  return strToU8(
    `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`,
  );
}

function buildCsvFiles(
  report: LocalTabularReportModel,
): readonly CsvDefinition[] {
  const files: CsvDefinition[] = [
    {
      fileName: "01-Summary.csv",
      rows: [
        ["รายการ", "จำนวนเงิน (บาท)"],
        ...report.summaryRows.map(
          (row) => [row.label, row.amountBaht] as const,
        ),
        ["", ""],
        ["วันที่/เวลาที่ส่งออก", report.generatedAtLabel],
        ["Tax Rule Status", report.taxRuleStatus],
        ["หมายเหตุ", report.disclaimer],
      ],
    },
    {
      fileName: "02-Income.csv",
      rows: [
        ["วันที่", "แหล่งที่มา", "หมวดหมู่", "จำนวนเงิน (บาท)"],
        ...report.incomeRows.map((row) => [
          row.period,
          row.source,
          row.category,
          row.amountBaht,
        ]),
      ],
    },
    {
      fileName: "03-Expense.csv",
      rows: [
        ["วันที่", "หมวดหมู่", "จำนวนเงิน (บาท)"],
        ...report.expenseRows.map((row) => [
          row.period,
          row.category,
          row.amountBaht,
        ]),
      ],
    },
  ];

  if (report.withholdingRows.length > 0) {
    files.push({
      fileName: "04-Withholding-Tax.csv",
      rows: [
        ["วันที่", "แหล่งที่มา", "จำนวนเงิน (บาท)"],
        ...report.withholdingRows.map((row) => [
          row.period,
          row.source,
          row.amountBaht,
        ]),
      ],
    });
  }

  if (report.deductionRows.length > 0) {
    files.push({
      fileName: "05-Deductions.csv",
      rows: [
        ["ประเภท", "จำนวนเงิน (บาท)"],
        ...report.deductionRows.map((row) => [row.type, row.amountBaht]),
      ],
    });
  }

  files.push({
    fileName: "06-Breakdown.csv",
    rows: [
      ["ประเภท", "กลุ่ม", "จำนวนรายการ", "ยอดรวม (บาท)", "สัดส่วน (%)"],
      ...report.breakdownRows.map((row) => [
        row.type,
        row.group,
        row.entryCount,
        row.totalBaht,
        row.percentage,
      ]),
    ],
  });

  if (report.taxEstimateRows && report.taxEstimateRows.length > 0) {
    files.push({
      fileName: "07-Tax-Estimate.csv",
      rows: [
        ["รายการ", "จำนวนเงิน (บาท)"],
        ...report.taxEstimateRows.map(
          (row) => [row.label, row.amountBaht] as const,
        ),
        ["", ""],
        [
          "หมายเหตุ",
          report.taxEstimateDisclaimer ??
            "การคำนวณภาษีเป็นเพียงประมาณการเบื้องต้น โปรดปรึกษาผู้เชี่ยวชาญหรือกรมสรรพากรก่อนยื่นภาษีจริง",
        ],
      ],
    });
  }

  return files;
}

export function createLocalCsvBundleArtifact(
  report: LocalTabularReportModel,
): LocalDownloadArtifact {
  const files = Object.fromEntries(
    buildCsvFiles(report).map((file) => [file.fileName, csvContent(file.rows)]),
  );
  const bytes = zipSync(files, { level: 6 });

  return {
    blob: new Blob([bytes], { type: "application/zip" }),
    fileName: `รายงานข้อมูลรายรับรายจ่าย-${report.taxYearBE}-${report.generatedAtFileStamp}-csv.zip`,
  };
}
