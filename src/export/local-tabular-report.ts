import {
  computeArithmeticTotals,
  filterEntriesByPeriod,
} from "@/calculator/arithmetic";
import {
  buildExpenseCategoryBreakdown,
  buildExpenseStatusBreakdown,
  buildIncomeCategoryBreakdown,
  buildIncomeSourceBreakdown,
  type BreakdownDetail,
} from "@/calculator/breakdown";
import {
  getAllowanceCategoryLabel,
  getExpenseCategoryLabel,
  getIncomeCategoryLabel,
} from "@/calculator/categories";
import type { CalculatorWorkspace, EntryFrequency } from "@/calculator/types";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { satangToBaht } from "@/tax/money";

export const TABULAR_EXPORT_TAX_RULE_STATUS =
  "Tax Rules 2568/2569: unverified / not for calculation";
export const TABULAR_EXPORT_DISCLAIMER =
  "เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น";

export interface LocalTabularReportOptions {
  readonly generatedAt: Date;
}

export interface LocalTabularSummaryRow {
  readonly label: string;
  readonly amountBaht: number;
}

export interface LocalTabularIncomeRow {
  readonly period: string;
  readonly source: string;
  readonly category: string;
  readonly amountBaht: number;
}

export interface LocalTabularExpenseRow {
  readonly period: string;
  readonly category: string;
  readonly amountBaht: number;
}

export interface LocalTabularWithholdingRow {
  readonly period: string;
  readonly source: string;
  readonly amountBaht: number;
}

export interface LocalTabularDeductionRow {
  readonly type: string;
  readonly amountBaht: number;
}

export interface LocalTabularBreakdownRow {
  readonly type: string;
  readonly group: string;
  readonly entryCount: number;
  readonly totalBaht: number;
  readonly percentage: number;
}

export interface LocalTabularReportModel {
  readonly taxYearBE: number;
  readonly generatedAtLabel: string;
  readonly generatedAtFileStamp: string;
  readonly taxRuleStatus: typeof TABULAR_EXPORT_TAX_RULE_STATUS;
  readonly disclaimer: typeof TABULAR_EXPORT_DISCLAIMER;
  readonly summaryRows: readonly LocalTabularSummaryRow[];
  readonly incomeRows: readonly LocalTabularIncomeRow[];
  readonly expenseRows: readonly LocalTabularExpenseRow[];
  readonly withholdingRows: readonly LocalTabularWithholdingRow[];
  readonly deductionRows: readonly LocalTabularDeductionRow[];
  readonly breakdownRows: readonly LocalTabularBreakdownRow[];
}

function normalizedOptionalText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function formatBangkokDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")} ${part("month")} ${part("year")} ${part("hour")}:${part("minute")} น. (Asia/Bangkok)`;
}

function formatBangkokFileStamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00";

  return `${part("year")}${part("month")}${part("day")}-${part("hour")}${part("minute")}`;
}

function formatExportPeriod(entry: {
  readonly entryFrequency: EntryFrequency;
  readonly occurredOn: string | null;
  readonly occurredMonth: string | null;
}): string {
  if (entry.entryFrequency === "monthly" && entry.occurredMonth) {
    const [year, month] = entry.occurredMonth.split("-").map(Number);
    if (year && month) {
      return `${String(month).padStart(2, "0")}/${year + 543}`;
    }
    return entry.occurredMonth;
  }

  if (entry.entryFrequency === "one_time" && entry.occurredOn) {
    const [year, month, day] = entry.occurredOn.split("-").map(Number);
    if (year && month && day) {
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 543}`;
    }
    return entry.occurredOn;
  }

  return "";
}

function breakdownRows(
  type: string,
  details: readonly BreakdownDetail[],
): LocalTabularBreakdownRow[] {
  const overallSatang = details.reduce(
    (total, detail) => total + detail.group.totalSatang,
    0,
  );

  return details.map(({ group }) => ({
    type,
    group: group.label,
    entryCount: group.entryCount,
    totalBaht: satangToBaht(group.totalSatang),
    percentage:
      overallSatang === 0
        ? 0
        : Math.round((group.totalSatang / overallSatang) * 10_000) / 100,
  }));
}

export function buildLocalTabularReportModel(
  workspace: CalculatorWorkspace,
  options: LocalTabularReportOptions,
): LocalTabularReportModel {
  const incomeEntries = sortEntriesByDateDesc(
    filterEntriesByPeriod(
      workspace.incomeEntries,
      workspace.periodStart,
      workspace.periodEnd,
    ),
  );
  const expenseEntries = sortEntriesByDateDesc(
    filterEntriesByPeriod(
      workspace.expenseEntries,
      workspace.periodStart,
      workspace.periodEnd,
    ),
  );
  const withholdingEntries = sortEntriesByDateDesc(
    filterEntriesByPeriod(
      workspace.withholdingEntries,
      workspace.periodStart,
      workspace.periodEnd,
    ),
  );
  const totals = computeArithmeticTotals(workspace);

  return {
    taxYearBE: workspace.taxYearBE,
    generatedAtLabel: formatBangkokDateTime(options.generatedAt),
    generatedAtFileStamp: formatBangkokFileStamp(options.generatedAt),
    taxRuleStatus: TABULAR_EXPORT_TAX_RULE_STATUS,
    disclaimer: TABULAR_EXPORT_DISCLAIMER,
    summaryRows: [
      {
        label: "รายรับรวม",
        amountBaht: satangToBaht(totals.totalIncomeSatang),
      },
      {
        label: "รายจ่ายรวม",
        amountBaht: satangToBaht(totals.totalExpenseSatang),
      },
      {
        label: "ภาษีหัก ณ ที่จ่ายรวม",
        amountBaht: satangToBaht(totals.totalWithholdingSatang),
      },
      {
        label: "ค่าลดหย่อน/ค่าลดภาษีรวม",
        amountBaht: satangToBaht(totals.totalDeclaredAllowanceSatang),
      },
      {
        label: "ยอดคงเหลือ",
        amountBaht: satangToBaht(totals.netBeforeTaxSatang),
      },
    ],
    incomeRows: incomeEntries.map((entry) => ({
      period: formatExportPeriod(entry),
      source: normalizedOptionalText(entry.sourceName),
      category: getIncomeCategoryLabel(entry.categoryCode),
      amountBaht: satangToBaht(entry.amountSatang),
    })),
    expenseRows: expenseEntries.map((entry) => ({
      period: formatExportPeriod(entry),
      category: getExpenseCategoryLabel(entry.categoryCode),
      amountBaht: satangToBaht(entry.amountSatang),
    })),
    withholdingRows: withholdingEntries.map((entry) => ({
      period: formatExportPeriod(entry),
      source: normalizedOptionalText(entry.payerName),
      amountBaht: satangToBaht(entry.amountSatang),
    })),
    deductionRows: workspace.allowanceDraftEntries.flatMap((entry) =>
      entry.declaredAmountSatang === undefined
        ? []
        : [
            {
              type: getAllowanceCategoryLabel(entry.categoryCode),
              amountBaht: satangToBaht(entry.declaredAmountSatang),
            },
          ],
    ),
    breakdownRows: [
      ...breakdownRows(
        "รายรับ — แหล่งที่มา",
        buildIncomeSourceBreakdown(workspace),
      ),
      ...breakdownRows(
        "รายรับ — หมวดหมู่",
        buildIncomeCategoryBreakdown(workspace),
      ),
      ...breakdownRows(
        "รายจ่าย — หมวดหมู่",
        buildExpenseCategoryBreakdown(workspace),
      ),
      ...breakdownRows(
        "รายจ่าย — สถานะการจัดกลุ่ม",
        buildExpenseStatusBreakdown(workspace),
      ),
    ],
  };
}
