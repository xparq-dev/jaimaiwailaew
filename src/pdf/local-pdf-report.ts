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
  getExpenseStatusLabel,
  getIncomeCategoryLabel,
} from "@/calculator/categories";
import type {
  AllowanceDraftEntry,
  CalculatorWorkspace,
  EntryFrequency,
  ExpenseEntry,
  IncomeEntry,
  WithholdingEntry,
} from "@/calculator/types";
import { formatEntryPeriod, formatThaiDate } from "@/calculator/utils";
import {
  buildCalculatorAssumptions,
  buildCalculatorWarnings,
} from "@/calculator/warnings";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { resolveTaxRules } from "@/tax/engine/taxRuleResolver";
import type { MoneySatang } from "@/tax/money";
import { safeAddMoney, toMoneySatang } from "@/tax/money";

export const LOCAL_PDF_REPORT_VERSION = "1.0.0";

export interface LocalPdfReportOptions {
  readonly generatedAt: Date;
  readonly reportName?: string | undefined;
  readonly displayName?: string | undefined;
}

export interface LocalPdfEntryRow {
  readonly id: string;
  readonly periodLabel: string;
  readonly entryFrequency: EntryFrequency;
  readonly primaryLabel: string;
  readonly secondaryLabel?: string | undefined;
  readonly amountSatang: MoneySatang;
  readonly note?: string | undefined;
}

export interface LocalPdfEntryGroup {
  readonly entryFrequency: EntryFrequency;
  readonly label: string;
  readonly entryCount: number;
  readonly totalSatang: MoneySatang;
  readonly rows: readonly LocalPdfEntryRow[];
}

export interface LocalPdfBreakdownSection {
  readonly key: string;
  readonly title: string;
  readonly details: readonly BreakdownDetail[];
}

export interface LocalPdfAllowanceRow {
  readonly id: string;
  readonly label: string;
  readonly amountSatang?: MoneySatang | undefined;
  readonly note?: string | undefined;
}

export interface LocalPdfReportModel {
  readonly title: string;
  readonly displayName?: string | undefined;
  readonly generatedAtLabel: string;
  readonly taxYearBE: number;
  readonly periodLabel: string;
  readonly totals: ReturnType<typeof computeArithmeticTotals>;
  readonly incomeGroups: readonly LocalPdfEntryGroup[];
  readonly expenseGroups: readonly LocalPdfEntryGroup[];
  readonly withholdingGroups: readonly LocalPdfEntryGroup[];
  readonly allowanceRows: readonly LocalPdfAllowanceRow[];
  readonly breakdownSections: readonly LocalPdfBreakdownSection[];
  readonly warnings: readonly string[];
  readonly assumptions: readonly string[];
  readonly ruleSetId: string;
  readonly ruleSetVersion: string;
  readonly ruleStatus: string;
  readonly validationStatus: string;
  readonly resolverStatus: string;
  readonly reportVersion: string;
}

const FREQUENCY_ORDER: readonly EntryFrequency[] = ["monthly", "one_time"];

const FREQUENCY_LABELS: Record<EntryFrequency, string> = {
  monthly: "รายการรายเดือน",
  one_time: "รายการระบุวัน / ครั้งเดียว",
};

function normalizeOptionalLabel(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function formatBangkokDateTime(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function groupEntryRows(
  rows: readonly LocalPdfEntryRow[],
): LocalPdfEntryGroup[] {
  return FREQUENCY_ORDER.flatMap((entryFrequency) => {
    const frequencyRows = rows.filter(
      (row) => row.entryFrequency === entryFrequency,
    );
    if (frequencyRows.length === 0) {
      return [];
    }

    return [
      {
        entryFrequency,
        label: FREQUENCY_LABELS[entryFrequency],
        entryCount: frequencyRows.length,
        totalSatang: frequencyRows.reduce(
          (total, row) => safeAddMoney(total, row.amountSatang),
          toMoneySatang(0),
        ),
        rows: frequencyRows,
      },
    ];
  });
}

function incomeRows(entries: readonly IncomeEntry[]): LocalPdfEntryRow[] {
  return sortEntriesByDateDesc(entries).map((entry) => ({
    id: entry.id,
    periodLabel: formatEntryPeriod(entry),
    entryFrequency: entry.entryFrequency,
    primaryLabel: getIncomeCategoryLabel(entry.categoryCode),
    secondaryLabel: normalizeOptionalLabel(entry.sourceName),
    amountSatang: entry.amountSatang,
    note: normalizeOptionalLabel(entry.note),
  }));
}

function expenseRows(entries: readonly ExpenseEntry[]): LocalPdfEntryRow[] {
  return sortEntriesByDateDesc(entries).map((entry) => ({
    id: entry.id,
    periodLabel: formatEntryPeriod(entry),
    entryFrequency: entry.entryFrequency,
    primaryLabel: getExpenseCategoryLabel(entry.categoryCode),
    secondaryLabel: getExpenseStatusLabel(entry.taxRelevanceStatus),
    amountSatang: entry.amountSatang,
    note: normalizeOptionalLabel(entry.note),
  }));
}

function withholdingRows(
  entries: readonly WithholdingEntry[],
): LocalPdfEntryRow[] {
  return sortEntriesByDateDesc(entries).map((entry) => ({
    id: entry.id,
    periodLabel: formatEntryPeriod(entry),
    entryFrequency: entry.entryFrequency,
    primaryLabel: normalizeOptionalLabel(entry.payerName) ?? "ไม่ระบุผู้จ่าย",
    secondaryLabel: normalizeOptionalLabel(entry.certificateReference),
    amountSatang: entry.amountSatang,
    note: normalizeOptionalLabel(entry.note),
  }));
}

function allowanceRows(
  entries: readonly AllowanceDraftEntry[],
): LocalPdfAllowanceRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: getAllowanceCategoryLabel(entry.categoryCode),
    amountSatang: entry.declaredAmountSatang,
    note: normalizeOptionalLabel(entry.note),
  }));
}

export function buildLocalPdfReportModel(
  workspace: CalculatorWorkspace,
  options: LocalPdfReportOptions,
): LocalPdfReportModel {
  const ruleResolution = resolveTaxRules({ taxYearBE: workspace.taxYearBE });
  const metadata = ruleResolution.metadata;
  const incomeInPeriod = filterEntriesByPeriod(
    workspace.incomeEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const expensesInPeriod = filterEntriesByPeriod(
    workspace.expenseEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const withholdingInPeriod = filterEntriesByPeriod(
    workspace.withholdingEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );

  return {
    title:
      normalizeOptionalLabel(options.reportName) ??
      normalizeOptionalLabel(workspace.reportName) ??
      "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย",
    displayName: normalizeOptionalLabel(options.displayName),
    generatedAtLabel: formatBangkokDateTime(options.generatedAt),
    taxYearBE: workspace.taxYearBE,
    periodLabel: `${formatThaiDate(workspace.periodStart)} – ${formatThaiDate(workspace.periodEnd)}`,
    totals: computeArithmeticTotals(workspace),
    incomeGroups: groupEntryRows(incomeRows(incomeInPeriod)),
    expenseGroups: groupEntryRows(expenseRows(expensesInPeriod)),
    withholdingGroups: groupEntryRows(withholdingRows(withholdingInPeriod)),
    allowanceRows: allowanceRows(workspace.allowanceDraftEntries),
    breakdownSections: [
      {
        key: "income-source",
        title: "รายรับตามแหล่งที่มา",
        details: buildIncomeSourceBreakdown(workspace),
      },
      {
        key: "income-category",
        title: "รายรับตามหมวดบันทึก",
        details: buildIncomeCategoryBreakdown(workspace),
      },
      {
        key: "expense-category",
        title: "รายจ่ายตามหมวดบันทึก",
        details: buildExpenseCategoryBreakdown(workspace),
      },
      {
        key: "expense-status",
        title: "รายจ่ายตามสถานะการจัดกลุ่ม",
        details: buildExpenseStatusBreakdown(workspace),
      },
    ],
    warnings: buildCalculatorWarnings(workspace).map((item) => item.message),
    assumptions: buildCalculatorAssumptions().map((item) => item.message),
    ruleSetId: metadata?.ruleSetId ?? "ไม่พร้อมใช้งาน",
    ruleSetVersion: metadata?.version ?? "ไม่พร้อมใช้งาน",
    ruleStatus: metadata?.status ?? "unavailable",
    validationStatus:
      metadata?.validationStatus ?? ruleResolution.validation.validationStatus,
    resolverStatus: `${ruleResolution.availability} / fail-closed`,
    reportVersion: LOCAL_PDF_REPORT_VERSION,
  };
}
