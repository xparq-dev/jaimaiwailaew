import { safeAddMoney, toMoneySatang, type MoneySatang } from "@/tax/money";

import { filterEntriesByPeriod } from "./arithmetic";
import {
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getIncomeCategoryLabel,
} from "./categories";
import type { CalculatorWorkspace, ExpenseEntry, IncomeEntry } from "./types";

export const MISSING_INCOME_SOURCE_LABEL = "ไม่ระบุแหล่งที่มา";

export type BreakdownKind =
  "income_source" | "income_category" | "expense_category" | "expense_status";

export interface BreakdownGroup {
  readonly key: string;
  readonly label: string;
  readonly entryCount: number;
  readonly totalSatang: MoneySatang;
  readonly percentage: number;
}

export interface BreakdownDetail {
  readonly group: BreakdownGroup;
  readonly entryIds: readonly string[];
}

type BreakdownEntry = IncomeEntry | ExpenseEntry;

interface MutableBreakdownAccumulator {
  label: string;
  entryIds: string[];
  totalSatang: MoneySatang;
}

export function normalizeIncomeSourceName(
  sourceName: string | null | undefined,
): string {
  const trimmed = sourceName?.trim();
  return trimmed ? trimmed : MISSING_INCOME_SOURCE_LABEL;
}

function compareBreakdownDetails(
  left: BreakdownDetail,
  right: BreakdownDetail,
): number {
  if (left.group.totalSatang !== right.group.totalSatang) {
    return right.group.totalSatang - left.group.totalSatang;
  }

  return left.group.label.localeCompare(right.group.label, "th-TH", {
    sensitivity: "variant",
  });
}

function toDisplayPercentage(
  groupTotalSatang: MoneySatang,
  overallTotalSatang: MoneySatang,
): number {
  if (overallTotalSatang === 0) {
    return 0;
  }

  return Math.round((groupTotalSatang / overallTotalSatang) * 1000) / 10;
}

function buildBreakdownDetails<TEntry extends BreakdownEntry>(
  entries: readonly TEntry[],
  getGroup: (entry: TEntry) => { readonly key: string; readonly label: string },
): BreakdownDetail[] {
  const groups = new Map<string, MutableBreakdownAccumulator>();
  let overallTotalSatang = toMoneySatang(0);

  for (const entry of entries) {
    const { key, label } = getGroup(entry);
    const existing = groups.get(key);
    const nextTotal = safeAddMoney(
      existing?.totalSatang ?? toMoneySatang(0),
      entry.amountSatang,
    );

    groups.set(key, {
      label,
      entryIds: existing ? [...existing.entryIds, entry.id] : [entry.id],
      totalSatang: nextTotal,
    });
    overallTotalSatang = safeAddMoney(overallTotalSatang, entry.amountSatang);
  }

  return [...groups.entries()]
    .map(([key, value]) => ({
      group: {
        key,
        label: value.label,
        entryCount: value.entryIds.length,
        totalSatang: value.totalSatang,
        percentage: toDisplayPercentage(value.totalSatang, overallTotalSatang),
      },
      entryIds: [...value.entryIds],
    }))
    .sort(compareBreakdownDetails);
}

function incomeInSelectedPeriod(workspace: CalculatorWorkspace): IncomeEntry[] {
  return filterEntriesByPeriod(
    workspace.incomeEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
}

function expensesInSelectedPeriod(
  workspace: CalculatorWorkspace,
): ExpenseEntry[] {
  return filterEntriesByPeriod(
    workspace.expenseEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
}

export function buildIncomeSourceBreakdown(
  workspace: CalculatorWorkspace,
): BreakdownDetail[] {
  return buildBreakdownDetails(incomeInSelectedPeriod(workspace), (entry) => {
    const label = normalizeIncomeSourceName(entry.sourceName);
    return { key: label, label };
  });
}

export function buildIncomeCategoryBreakdown(
  workspace: CalculatorWorkspace,
): BreakdownDetail[] {
  return buildBreakdownDetails(incomeInSelectedPeriod(workspace), (entry) => ({
    key: entry.categoryCode,
    label: getIncomeCategoryLabel(entry.categoryCode),
  }));
}

export function buildExpenseCategoryBreakdown(
  workspace: CalculatorWorkspace,
): BreakdownDetail[] {
  return buildBreakdownDetails(
    expensesInSelectedPeriod(workspace),
    (entry) => ({
      key: entry.categoryCode,
      label: getExpenseCategoryLabel(entry.categoryCode),
    }),
  );
}

export function buildExpenseStatusBreakdown(
  workspace: CalculatorWorkspace,
): BreakdownDetail[] {
  return buildBreakdownDetails(
    expensesInSelectedPeriod(workspace),
    (entry) => ({
      key: entry.taxRelevanceStatus,
      label: getExpenseStatusLabel(entry.taxRelevanceStatus),
    }),
  );
}
