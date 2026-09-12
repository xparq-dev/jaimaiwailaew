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
} from "@/calculator/workspace";
import { decimalStringToSatang, toMoneySatang } from "@/tax/money";

describe("Calculator Arithmetic Totals", () => {
  it("computes exact integer satang totals for income, expense, and withholding within period", () => {
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
          occurredOn: "2026-02-15",
          categoryCode: "online_sales" as const,
          amountSatang: decimalStringToSatang("50000.50", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-02-15T00:00:00.000Z",
          updatedAt: "2026-02-15T00:00:00.000Z",
        },
        {
          id: "inc-2",
          occurredOn: "2026-03-20",
          categoryCode: "online_sales" as const,
          amountSatang: decimalStringToSatang("25000.25", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        },
        // Outside period (first half ends 2026-06-30)
        {
          id: "inc-3",
          occurredOn: "2026-07-10",
          categoryCode: "online_sales" as const,
          amountSatang: decimalStringToSatang("10000.00", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-07-10T00:00:00.000Z",
          updatedAt: "2026-07-10T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        {
          id: "exp-1",
          occurredOn: "2026-02-18",
          categoryCode: "shipping" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: decimalStringToSatang("12000.75", {
            roundingPolicy: "exact_only",
          }),
          createdAt: "2026-02-18T00:00:00.000Z",
          updatedAt: "2026-02-18T00:00:00.000Z",
        },
      ],
      withholdingEntries: [
        {
          id: "wht-1",
          occurredOn: "2026-03-20",
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
          occurredOn: "2026-02-01",
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(100000), // 1,000 Baht
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        {
          id: "exp-1",
          occurredOn: "2026-02-05",
          categoryCode: "inventory" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: toMoneySatang(500000), // 5,000 Baht
          createdAt: "2026-02-05T00:00:00.000Z",
          updatedAt: "2026-02-05T00:00:00.000Z",
        },
      ],
    };

    const totals = computeArithmeticTotals(updatedWorkspace);
    // 1,000 - 5,000 = -4,000 Baht = -400000 Satang
    expect(totals.netBeforeTaxSatang).toBe(
      toMoneySatang(-400000, { allowNegative: true }),
    );
  });

  it("identifies when entries exist outside selected period", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    expect(hasEntriesOutsidePeriod(workspace)).toBe(false);

    const withOutside = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-outside",
          occurredOn: "2026-08-01",
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(10000),
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    };
    expect(hasEntriesOutsidePeriod(withOutside)).toBe(true);
  });

  it("computes monthly breakdown correctly with monthly sorting", () => {
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
          id: "inc-jan",
          occurredOn: "2026-01-10",
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(200000),
          createdAt: "2026-01-10T00:00:00.000Z",
          updatedAt: "2026-01-10T00:00:00.000Z",
        },
        {
          id: "inc-feb",
          occurredOn: "2026-02-15",
          categoryCode: "online_sales" as const,
          amountSatang: toMoneySatang(300000),
          createdAt: "2026-02-15T00:00:00.000Z",
          updatedAt: "2026-02-15T00:00:00.000Z",
        },
      ],
      expenseEntries: [
        {
          id: "exp-jan",
          occurredOn: "2026-01-20",
          categoryCode: "shipping" as const,
          taxRelevanceStatus: "likely_related" as const,
          amountSatang: toMoneySatang(50000),
          createdAt: "2026-01-20T00:00:00.000Z",
          updatedAt: "2026-01-20T00:00:00.000Z",
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
    expect(breakdown[1]?.expenseSatang).toBe(toMoneySatang(0));
    expect(breakdown[1]?.netSatang).toBe(toMoneySatang(300000));
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
