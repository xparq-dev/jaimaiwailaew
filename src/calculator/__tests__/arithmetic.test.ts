import { describe, expect, it } from "vitest";

import {
  computeArithmeticTotals,
  computeMonthlyBreakdown,
  hasEntriesOutsidePeriod,
  zeroArithmeticTotals,
} from "@/calculator/arithmetic";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
  sortEntriesByDateDesc,
} from "@/calculator/workspace";
import {
  getEntryChronologicalSortKey,
  isEntryWithinPeriod,
} from "@/calculator/utils";
import { decimalStringToSatang, toMoneySatang } from "@/tax/money";
import type { IncomeEntry } from "@/calculator/types";

describe("Calculator Arithmetic Totals and Mixed Frequencies", () => {
  it("computes exact integer satang totals for mixed frequency income, expense, and withholding within period", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const updatedWorkspace = {
      ...workspace,
      incomeEntries: [
        // One-time entry in Feb
        {
          id: "inc-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-02-15",
          occurredMonth: null,
          categoryCode: "online_sales" as const,
          amountSatang: decimalStringToSatang("50000.50", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-02-15T00:00:00.000Z",
          updatedAt: "2026-02-15T00:00:00.000Z",
        },
        // Monthly entry in March (Salary)
        {
          id: "inc-2",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-03",
          categoryCode: "salary" as const,
          amountSatang: decimalStringToSatang("25000.25", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
        // Outside period (July, first half ends 2026-06-30)
        {
          id: "inc-3",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-07",
          categoryCode: "online_sales" as const,
          amountSatang: decimalStringToSatang("10000.00", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        // Monthly rent expense in March
        {
          id: "exp-1",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-03",
          categoryCode: "shipping" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: decimalStringToSatang("12000.75", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
      withholdingEntries: [
        // One-time withholding in March
        {
          id: "wht-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-03-20",
          occurredMonth: null,
          payerName: "Shopee Platform",
          certificateReference: "50TW-001",
          amountSatang: decimalStringToSatang("750.00", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        },
      ],
      allowanceDraftEntries: [
        {
          id: "alw-1",
          categoryCode: "personal_draft" as const,
          declaredAmountSatang: decimalStringToSatang("60000.00", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    const totals = computeArithmeticTotals(updatedWorkspace);

    // 50000.50 + 25000.25 = 75000.75 Baht = 7500075 Satang
    expect(totals.totalIncomeSatang).toBe(toMoneySatang(7500075));
    // 12000.75 Baht = 1200075 Satang
    expect(totals.totalExpenseSatang).toBe(toMoneySatang(1200075));
    // 75000.75 - 12000.75 = 63000.00 Baht = 6300000 Satang
    expect(totals.netBeforeTaxSatang).toBe(toMoneySatang(6300000));
    // 750.00 Baht = 75000 Satang
    expect(totals.totalWithholdingSatang).toBe(toMoneySatang(75000));
    // 60000.00 Baht = 6000000 Satang
    expect(totals.totalDeclaredAllowanceSatang).toBe(toMoneySatang(6000000));
  });

  it("handles period filtering for both one_time and monthly frequencies", () => {
    const oneTimeInPeriod: IncomeEntry = {
      id: "inc-ot-in",
      entryFrequency: "one_time",
      occurredOn: "2026-03-10",
      occurredMonth: null,
      categoryCode: "online_sales",
      amountSatang: toMoneySatang(100000),
      createdAt: "2026-03-10T00:00:00.000Z",
      updatedAt: "2026-03-10T00:00:00.000Z",
    };
    const oneTimeOutPeriod: IncomeEntry = {
      id: "inc-ot-out",
      entryFrequency: "one_time",
      occurredOn: "2026-08-10",
      occurredMonth: null,
      categoryCode: "online_sales",
      amountSatang: toMoneySatang(100000),
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    };
    const monthlyInPeriod: IncomeEntry = {
      id: "inc-m-in",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-05",
      categoryCode: "salary",
      amountSatang: toMoneySatang(200000),
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
    };
    const monthlyOutPeriod: IncomeEntry = {
      id: "inc-m-out",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-07",
      categoryCode: "salary",
      amountSatang: toMoneySatang(200000),
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    };

    const pStart = "2026-01-01";
    const pEnd = "2026-06-30";

    expect(isEntryWithinPeriod(oneTimeInPeriod, pStart, pEnd)).toBe(true);
    expect(isEntryWithinPeriod(oneTimeOutPeriod, pStart, pEnd)).toBe(false);
    expect(isEntryWithinPeriod(monthlyInPeriod, pStart, pEnd)).toBe(true);
    expect(isEntryWithinPeriod(monthlyOutPeriod, pStart, pEnd)).toBe(false);
  });

  it("handles negative netBeforeTax when expenses exceed income without throwing", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const updatedWorkspace = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-02-01",
          occurredMonth: null,
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(100000), // 1,000 Baht
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        {
          id: "exp-1",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-02",
          categoryCode: "inventory" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: toMoneySatang(500000), // 5,000 Baht
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    };

    const totals = computeArithmeticTotals(updatedWorkspace);
    // 1,000 - 5,000 = -4,000 Baht = -400000 Satang
    expect(totals.netBeforeTaxSatang).toBe(
      toMoneySatang(-400000, { allowNegative: true }),
    );
  });

  it("identifies when entries exist outside selected period for mixed frequencies", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    expect(hasEntriesOutsidePeriod(workspace)).toBe(false);

    const withOutsideMonthly = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-outside",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-09",
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(10000),
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    };
    expect(hasEntriesOutsidePeriod(withOutsideMonthly)).toBe(true);
  });

  it("computes monthly breakdown correctly with mixed frequencies", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    const updatedWorkspace = {
      ...workspace,
      incomeEntries: [
        // One-time in Jan
        {
          id: "inc-jan",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-01-10",
          occurredMonth: null,
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(200000),
          createdAt: "2026-01-10T00:00:00.000Z",
          updatedAt: "2026-01-10T00:00:00.000Z",
        },
        // Monthly in Feb
        {
          id: "inc-feb",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-02",
          categoryCode: "salary" as const,
          amountSatang: toMoneySatang(300000),
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        // One-time in Jan
        {
          id: "exp-jan",
          entryFrequency: "one_time" as const,
          occurredOn: "2026-01-20",
          occurredMonth: null,
          categoryCode: "shipping" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: toMoneySatang(50000),
          createdAt: "2026-01-20T00:00:00.000Z",
          updatedAt: "2026-01-20T00:00:00.000Z",
        },
        // Monthly in Feb
        {
          id: "exp-feb",
          entryFrequency: "monthly" as const,
          occurredOn: null,
          occurredMonth: "2026-02",
          categoryCode: "utilities" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: toMoneySatang(70000),
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    };

    const breakdown = computeMonthlyBreakdown(updatedWorkspace);
    expect(breakdown).toHaveLength(2);

    expect(breakdown[0]?.monthKey).toBe("2026-01");
    expect(breakdown[0]?.incomeSatang).toBe(toMoneySatang(200000));
    expect(breakdown[0]?.expenseSatang).toBe(toMoneySatang(50000));
    expect(breakdown[0]?.netSatang).toBe(toMoneySatang(150000));

    expect(breakdown[1]?.monthKey).toBe("2026-02");
    expect(breakdown[1]?.incomeSatang).toBe(toMoneySatang(300000));
    expect(breakdown[1]?.expenseSatang).toBe(toMoneySatang(70000));
    expect(breakdown[1]?.netSatang).toBe(toMoneySatang(230000));
  });

  it("sorts mixed entries chronologically descending", () => {
    const entries = [
      {
        id: "e1",
        entryFrequency: "one_time" as const,
        occurredOn: "2026-01-15",
        occurredMonth: null,
      },
      {
        id: "e2",
        entryFrequency: "monthly" as const,
        occurredOn: null,
        occurredMonth: "2026-03",
      },
      {
        id: "e3",
        entryFrequency: "one_time" as const,
        occurredOn: "2026-02-20",
        occurredMonth: null,
      },
    ];

    expect(getEntryChronologicalSortKey(entries[0]!)).toBe("2026-01-15");
    expect(getEntryChronologicalSortKey(entries[1]!)).toBe("2026-03-01");
    expect(getEntryChronologicalSortKey(entries[2]!)).toBe("2026-02-20");

    const sorted = sortEntriesByDateDesc(entries);
    // e2 (March 2026) -> e3 (Feb 20, 2026) -> e1 (Jan 15, 2026)
    expect(sorted.map((e) => e.id)).toEqual(["e2", "e3", "e1"]);
  });

  it("returns zeroed totals correctly", () => {
    const zero = zeroArithmeticTotals();
    expect(zero.totalIncomeSatang).toBe(toMoneySatang(0));
    expect(zero.totalExpenseSatang).toBe(toMoneySatang(0));
    expect(zero.netBeforeTaxSatang).toBe(toMoneySatang(0));
    expect(zero.totalWithholdingSatang).toBe(toMoneySatang(0));
    expect(zero.totalDeclaredAllowanceSatang).toBe(toMoneySatang(0));
  });
});
