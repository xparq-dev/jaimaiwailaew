import {
  safeSubtractMoney,
  toMoneySatang,
  type MoneySatang,
} from "@/tax/money";

import { subtractMoneySatang, sumMoneySatang } from "./schemas";
import type {
  CalculatorArithmeticTotals,
  CalculatorWorkspace,
  MonthlyArithmeticBreakdownRow,
} from "./types";
import {
  formatMonthLabel,
  isDateWithinPeriod,
  monthKeyFromDate,
} from "./utils";

function filterByPeriod<T extends { occurredOn: string }>(
  entries: readonly T[],
  periodStart: string,
  periodEnd: string,
): T[] {
  return entries.filter((entry) =>
    isDateWithinPeriod(entry.occurredOn, periodStart, periodEnd),
  );
}

export function computeArithmeticTotals(
  workspace: CalculatorWorkspace,
): CalculatorArithmeticTotals {
  const incomeInPeriod = filterByPeriod(
    workspace.incomeEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const expenseInPeriod = filterByPeriod(
    workspace.expenseEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const withholdingInPeriod = filterByPeriod(
    workspace.withholdingEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );

  const totalIncomeSatang = sumMoneySatang(
    incomeInPeriod.map((entry) => entry.amountSatang),
  );
  const totalExpenseSatang = sumMoneySatang(
    expenseInPeriod.map((entry) => entry.amountSatang),
  );
  const totalWithholdingSatang = sumMoneySatang(
    withholdingInPeriod.map((entry) => entry.amountSatang),
  );
  const totalDeclaredAllowanceSatang = sumMoneySatang(
    workspace.allowanceDraftEntries
      .map((entry) => entry.declaredAmountSatang)
      .filter((value): value is MoneySatang => value !== undefined),
  );

  const netBeforeTaxSatang = subtractMoneySatang(
    totalIncomeSatang,
    totalExpenseSatang,
  );

  return {
    totalIncomeSatang,
    totalExpenseSatang,
    netBeforeTaxSatang,
    totalWithholdingSatang,
    totalDeclaredAllowanceSatang,
  };
}

export function computeMonthlyBreakdown(
  workspace: CalculatorWorkspace,
): MonthlyArithmeticBreakdownRow[] {
  const incomeInPeriod = filterByPeriod(
    workspace.incomeEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const expenseInPeriod = filterByPeriod(
    workspace.expenseEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );

  const monthKeys = new Set<string>();
  for (const entry of [...incomeInPeriod, ...expenseInPeriod]) {
    monthKeys.add(monthKeyFromDate(entry.occurredOn));
  }

  const sortedMonthKeys = [...monthKeys].sort();

  return sortedMonthKeys.map((monthKey) => {
    const incomeSatang = sumMoneySatang(
      incomeInPeriod
        .filter((entry) => monthKeyFromDate(entry.occurredOn) === monthKey)
        .map((entry) => entry.amountSatang),
    );
    const expenseSatang = sumMoneySatang(
      expenseInPeriod
        .filter((entry) => monthKeyFromDate(entry.occurredOn) === monthKey)
        .map((entry) => entry.amountSatang),
    );

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      incomeSatang,
      expenseSatang,
      netSatang: safeSubtractMoney(incomeSatang, expenseSatang, {
        allowNegative: true,
      }),
    };
  });
}

export function hasEntriesOutsidePeriod(workspace: CalculatorWorkspace) {
  const datedEntries = [
    ...workspace.incomeEntries,
    ...workspace.expenseEntries,
    ...workspace.withholdingEntries,
  ];

  return datedEntries.some(
    (entry) =>
      !isDateWithinPeriod(
        entry.occurredOn,
        workspace.periodStart,
        workspace.periodEnd,
      ),
  );
}

export function zeroArithmeticTotals(): CalculatorArithmeticTotals {
  const zero = toMoneySatang(0);
  return {
    totalIncomeSatang: zero,
    totalExpenseSatang: zero,
    netBeforeTaxSatang: zero,
    totalWithholdingSatang: zero,
    totalDeclaredAllowanceSatang: zero,
  };
}
