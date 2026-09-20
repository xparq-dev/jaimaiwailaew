import {
  computeArithmeticTotals,
  filterEntriesByPeriod,
} from "@/calculator/arithmetic";
import {
  buildExpenseCategoryBreakdown,
  buildExpenseStatusBreakdown,
  buildIncomeCategoryBreakdown,
  buildIncomeSourceBreakdown,
  MISSING_INCOME_SOURCE_LABEL,
  type BreakdownDetail,
} from "@/calculator/breakdown";
import {
  getAllowanceCategoryLabel,
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getIncomeCategoryLabel,
} from "@/calculator/categories";
import { calculateWorkspaceSocialSecurity } from "@/calculator/social-security";
import type {
  AllowanceDraftEntry,
  CalculatorWorkspace,
  EntryFrequency,
  ExpenseEntry,
  IncomeEntry,
  WithholdingEntry,
} from "@/calculator/types";
import { formatEntryPeriod, formatThaiDate } from "@/calculator/utils";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import type { MoneySatang } from "@/tax/money";
import { safeAddMoney, toMoneySatang } from "@/tax/money";
import type { PITCalculationResult } from "@/tax/engine/pitCalculator";
import { calculateWorkspacePIT } from "@/tax/engine/workspacePitAdapter";

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
}

export interface LocalPdfReportModel {
  readonly title: string;
  readonly displayName?: string | undefined;
  readonly generatedAt: Date;
  readonly generatedAtLabel: string;
  readonly generatedAtFileStamp: string;
  readonly taxYearBE: number;
  readonly periodLabel: string;
  readonly totals: ReturnType<typeof computeArithmeticTotals>;
  readonly socialSecurityContributionSatang: MoneySatang;
  readonly taxEstimate?: PITCalculationResult | undefined;
  readonly incomeGroups: readonly LocalPdfEntryGroup[];
  readonly expenseGroups: readonly LocalPdfEntryGroup[];
  readonly withholdingGroups: readonly LocalPdfEntryGroup[];
  readonly allowanceRows: readonly LocalPdfAllowanceRow[];
  readonly breakdownSections: readonly LocalPdfBreakdownSection[];
}

const FREQUENCY_ORDER: readonly EntryFrequency[] = ["monthly", "one_time"];

const FREQUENCY_LABELS: Record<EntryFrequency, string> = {
  monthly: "รายการรายเดือน",
  one_time: "รายการระบุวัน",
};

function normalizeOptionalLabel(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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
  }));
}

function withholdingRows(
  entries: readonly WithholdingEntry[],
): LocalPdfEntryRow[] {
  return sortEntriesByDateDesc(entries).map((entry) => ({
    id: entry.id,
    periodLabel: formatEntryPeriod(entry),
    entryFrequency: entry.entryFrequency,
    primaryLabel: normalizeOptionalLabel(entry.payerName) ?? "",
    secondaryLabel: normalizeOptionalLabel(entry.certificateReference),
    amountSatang: entry.amountSatang,
  }));
}

function allowanceRows(
  entries: readonly AllowanceDraftEntry[],
): LocalPdfAllowanceRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: getAllowanceCategoryLabel(entry.categoryCode),
    amountSatang: entry.declaredAmountSatang,
  }));
}

export function buildLocalPdfReportModel(
  workspace: CalculatorWorkspace,
  options: LocalPdfReportOptions,
): LocalPdfReportModel {
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
  const socialSecurity = calculateWorkspaceSocialSecurity(workspace);

  return {
    title:
      normalizeOptionalLabel(options.reportName) ??
      normalizeOptionalLabel(workspace.reportName) ??
      "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย",
    displayName: normalizeOptionalLabel(options.displayName),
    generatedAt: options.generatedAt,
    generatedAtLabel: formatBangkokDateTime(options.generatedAt),
    generatedAtFileStamp: formatBangkokFileStamp(options.generatedAt),
    taxYearBE: workspace.taxYearBE,
    periodLabel: `${formatThaiDate(workspace.periodStart)} – ${formatThaiDate(workspace.periodEnd)}`,
    totals: computeArithmeticTotals(workspace),
    socialSecurityContributionSatang: socialSecurity.contributionSatang,
    taxEstimate:
      workspace.taxRuleResolutionSnapshot.availability === "available"
        ? calculateWorkspacePIT(workspace)
        : undefined,
    incomeGroups: groupEntryRows(incomeRows(incomeInPeriod)),
    expenseGroups: groupEntryRows(expenseRows(expensesInPeriod)),
    withholdingGroups: groupEntryRows(withholdingRows(withholdingInPeriod)),
    allowanceRows: [
      ...(socialSecurity.contributionSatang > 0
        ? [
            {
              id: "social-security",
              label: "เงินสมทบประกันสังคม",
              amountSatang: socialSecurity.contributionSatang,
            },
          ]
        : []),
      ...allowanceRows(workspace.allowanceDraftEntries),
    ],
    breakdownSections: [
      {
        key: "income-source",
        title: "รายรับตามแหล่งที่มา",
        details: buildIncomeSourceBreakdown(workspace).filter(
          ({ group }) => group.label !== MISSING_INCOME_SOURCE_LABEL,
        ),
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
  };
}
