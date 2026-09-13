import { describe, expect, it } from "vitest";

import {
  MISSING_INCOME_SOURCE_LABEL,
  buildExpenseCategoryBreakdown,
  buildExpenseStatusBreakdown,
  buildIncomeCategoryBreakdown,
  buildIncomeSourceBreakdown,
  normalizeIncomeSourceName,
} from "@/calculator/breakdown";
import type {
  CalculatorWorkspace,
  ExpenseEntry,
  IncomeEntry,
} from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { toMoneySatang } from "@/tax/money";

const timestamp = "2026-01-01T00:00:00.000Z";

function oneTimeIncome(
  id: string,
  occurredOn: string,
  amountSatang: number,
  overrides: Partial<IncomeEntry> = {},
): IncomeEntry {
  return {
    id,
    entryFrequency: "one_time",
    occurredOn,
    occurredMonth: null,
    categoryCode: "online_sales",
    sourceName: "Shopee",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  } as IncomeEntry;
}

function monthlyIncome(
  id: string,
  occurredMonth: string,
  amountSatang: number,
  overrides: Partial<IncomeEntry> = {},
): IncomeEntry {
  return {
    id,
    entryFrequency: "monthly",
    occurredOn: null,
    occurredMonth,
    categoryCode: "salary",
    sourceName: "บริษัทตัวอย่าง",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  } as IncomeEntry;
}

function oneTimeExpense(
  id: string,
  occurredOn: string,
  amountSatang: number,
  overrides: Partial<ExpenseEntry> = {},
): ExpenseEntry {
  return {
    id,
    entryFrequency: "one_time",
    occurredOn,
    occurredMonth: null,
    categoryCode: "shipping",
    taxRelevanceStatus: "likely_related",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  } as ExpenseEntry;
}

function monthlyExpense(
  id: string,
  occurredMonth: string,
  amountSatang: number,
  overrides: Partial<ExpenseEntry> = {},
): ExpenseEntry {
  return {
    id,
    entryFrequency: "monthly",
    occurredOn: null,
    occurredMonth,
    categoryCode: "utilities",
    taxRelevanceStatus: "needs_review",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  } as ExpenseEntry;
}

function workspaceWith({
  incomeEntries = [],
  expenseEntries = [],
}: {
  incomeEntries?: readonly IncomeEntry[];
  expenseEntries?: readonly ExpenseEntry[];
}): CalculatorWorkspace {
  const workspace = createCalculatorWorkspace(
    getDefaultWorkspaceInput("multiple_income", 2569, "full_year"),
  );

  return { ...workspace, incomeEntries, expenseEntries };
}

describe("Summary breakdown arithmetic grouping", () => {
  it("groups missing, empty, whitespace, undefined, and null source names under the required label", () => {
    expect(normalizeIncomeSourceName(undefined)).toBe(
      MISSING_INCOME_SOURCE_LABEL,
    );
    expect(normalizeIncomeSourceName(null)).toBe(MISSING_INCOME_SOURCE_LABEL);
    expect(normalizeIncomeSourceName("")).toBe(MISSING_INCOME_SOURCE_LABEL);
    expect(normalizeIncomeSourceName("   ")).toBe(MISSING_INCOME_SOURCE_LABEL);

    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("missing", "2026-01-01", 100, {
          sourceName: undefined,
        }),
        oneTimeIncome("whitespace", "2026-01-02", 200, {
          sourceName: "  ",
        }),
      ],
    });

    expect(buildIncomeSourceBreakdown(workspace)).toEqual([
      {
        group: {
          key: MISSING_INCOME_SOURCE_LABEL,
          label: MISSING_INCOME_SOURCE_LABEL,
          entryCount: 2,
          totalSatang: toMoneySatang(300),
          percentage: 100,
        },
        entryIds: ["missing", "whitespace"],
      },
    ]);
  });

  it("trims exact source labels without fuzzy merging or case normalization", () => {
    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("shopee-spaced", "2026-01-01", 200, {
          sourceName: "  Shopee  ",
        }),
        oneTimeIncome("shopee", "2026-01-02", 300),
        oneTimeIncome("shopee-thailand", "2026-01-03", 100, {
          sourceName: "Shopee Thailand",
        }),
        oneTimeIncome("lowercase", "2026-01-04", 50, {
          sourceName: "shopee",
        }),
      ],
    });

    const groups = buildIncomeSourceBreakdown(workspace);
    expect(groups.map((detail) => detail.group.label)).toEqual([
      "Shopee",
      "Shopee Thailand",
      "shopee",
    ]);
    expect(groups[0]?.entryIds).toEqual(["shopee-spaced", "shopee"]);
  });

  it("aggregates income source and category totals with exact MoneySatang and entry IDs", () => {
    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("sales", "2026-02-01", 10_001),
        monthlyIncome("salary", "2026-02", 20_002),
        oneTimeIncome("bonus", "2026-03-01", 30_003, {
          categoryCode: "bonus",
          sourceName: "บริษัทตัวอย่าง",
        }),
      ],
    });

    const sourceGroups = buildIncomeSourceBreakdown(workspace);
    expect(sourceGroups[0]?.group.totalSatang).toBe(toMoneySatang(50_005));
    expect(sourceGroups[0]?.group.percentage).toBe(83.3);
    expect(sourceGroups[0]?.entryIds).toEqual(["salary", "bonus"]);
    expect(sourceGroups[1]?.group.totalSatang).toBe(toMoneySatang(10_001));
    expect(sourceGroups[1]?.group.percentage).toBe(16.7);

    const categoryGroups = buildIncomeCategoryBreakdown(workspace);
    expect(
      categoryGroups.map((detail) => [
        detail.group.key,
        detail.group.totalSatang,
      ]),
    ).toEqual([
      ["bonus", toMoneySatang(30_003)],
      ["salary", toMoneySatang(20_002)],
      ["online_sales", toMoneySatang(10_001)],
    ]);
  });

  it("aggregates expense category and review-status groups without legal classification", () => {
    const workspace = workspaceWith({
      expenseEntries: [
        oneTimeExpense("shipping-review", "2026-02-01", 400, {
          taxRelevanceStatus: "needs_review",
        }),
        oneTimeExpense("shipping-related", "2026-02-02", 500),
        monthlyExpense("utilities", "2026-02", 600),
      ],
    });

    const categoryGroups = buildExpenseCategoryBreakdown(workspace);
    expect(categoryGroups[0]?.group).toMatchObject({
      key: "shipping",
      label: "ค่าขนส่ง",
      entryCount: 2,
      totalSatang: toMoneySatang(900),
    });

    const statusGroups = buildExpenseStatusBreakdown(workspace);
    expect(statusGroups.map((detail) => detail.group.key)).toEqual([
      "needs_review",
      "likely_related",
    ]);
    expect(statusGroups[0]?.entryIds).toEqual(["shipping-review", "utilities"]);
    expect(statusGroups).not.toHaveProperty("taxDeductible");
  });

  it("filters one-time, monthly, and mixed entries to the selected period", () => {
    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("one-time-in", "2026-01-31", 100),
        monthlyIncome("monthly-in", "2026-06", 200),
        oneTimeIncome("one-time-out", "2026-07-01", 400),
        monthlyIncome("monthly-out", "2026-12", 800),
      ],
      expenseEntries: [
        oneTimeExpense("expense-in", "2026-03-15", 50),
        monthlyExpense("expense-out", "2026-09", 75),
      ],
    });
    const firstHalfWorkspace = {
      ...workspace,
      periodStart: "2026-01-01",
      periodEnd: "2026-06-30",
    };

    expect(
      buildIncomeSourceBreakdown(firstHalfWorkspace).flatMap(
        (detail) => detail.entryIds,
      ),
    ).toEqual(expect.arrayContaining(["one-time-in", "monthly-in"]));
    expect(
      buildIncomeSourceBreakdown(firstHalfWorkspace).flatMap(
        (detail) => detail.entryIds,
      ),
    ).not.toEqual(expect.arrayContaining(["one-time-out", "monthly-out"]));
    expect(
      buildExpenseCategoryBreakdown(firstHalfWorkspace).flatMap(
        (detail) => detail.entryIds,
      ),
    ).toEqual(["expense-in"]);
  });

  it("returns zero percentages without division errors when the overall total is zero", () => {
    const workspace = workspaceWith({
      incomeEntries: [oneTimeIncome("zero", "2026-01-01", 0)],
    });

    expect(buildIncomeSourceBreakdown(workspace)[0]?.group).toMatchObject({
      totalSatang: toMoneySatang(0),
      percentage: 0,
    });
  });

  it("sorts by total descending and Thai/Unicode label ascending on ties", () => {
    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("small", "2026-01-01", 100, { sourceName: "ค" }),
        oneTimeIncome("tie-b", "2026-01-02", 200, { sourceName: "ข" }),
        oneTimeIncome("tie-a", "2026-01-03", 200, { sourceName: "ก" }),
      ],
    });

    expect(
      buildIncomeSourceBreakdown(workspace).map((detail) => detail.group.label),
    ).toEqual(["ก", "ข", "ค"]);
  });

  it("does not mutate workspace entries while grouping", () => {
    const workspace = workspaceWith({
      incomeEntries: [
        oneTimeIncome("income", "2026-01-01", 100, {
          sourceName: "  Shopee  ",
        }),
      ],
      expenseEntries: [oneTimeExpense("expense", "2026-01-02", 50)],
    });
    const before = structuredClone(workspace);

    buildIncomeSourceBreakdown(workspace);
    buildIncomeCategoryBreakdown(workspace);
    buildExpenseCategoryBreakdown(workspace);
    buildExpenseStatusBreakdown(workspace);

    expect(workspace).toEqual(before);
  });
});
