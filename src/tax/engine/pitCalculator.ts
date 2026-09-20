/**
 * Thai Personal Income Tax (PIT) Pure Calculation Engine
 *
 * This module provides a deterministic, pure calculation function for Thai PIT
 * based on a validated rule bundle. It does NOT check notForCalculation or
 * resolver policies — that is the caller's responsibility.
 *
 * Used by:
 *  - Golden Test Suite (Step 3) to verify calculation correctness before unlock
 *  - Future: the resolver-gated UI calculator (Step 4+)
 *
 * All monetary values are in integer satang (MoneySatang).
 * 1 Thai Baht = 100 satang.
 */

import { bahtToSatang, toMoneySatang } from "../money";
import type { MoneySatang } from "../money";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type IncomeTypeCode =
  | "40_1"
  | "40_2"
  | "40_3"
  | "40_4"
  | "40_5"
  | "40_6_medical"
  | "40_6_other"
  | "40_7"
  | "40_8";

export type ExpenseMethod = "flat_rate" | "actual";

export interface IncomeItem {
  /** Income type code per Revenue Code Section 40 */
  readonly type: IncomeTypeCode;
  /** Gross income in integer baht (will be converted to satang internally) */
  readonly grossIncomeBaht: number;
  /**
   * Expense deduction method.
   * - "flat_rate": use the statutory flat-rate percentage (default)
   * - "actual": use actualExpenseBaht instead (must also provide actualExpenseBaht)
   */
  readonly expenseMethod?: ExpenseMethod;
  /**
   * Actual expenses in integer baht (only used when expenseMethod = "actual").
   * For 40(4): always 0 (no deduction allowed).
   */
  readonly actualExpenseBaht?: number;
}

export interface AllowanceInput {
  readonly personalBaht: number; // Fixed 60,000 per law — caller must provide correct value
  readonly socialSecurityBaht: number; // Max 9,000
  readonly lifeInsuranceBaht: number; // Max 100,000
  readonly healthInsuranceBaht: number; // Max 25,000; combined with life must ≤ 100,000
  readonly providentFundBaht: number; // Max 500,000 (in retirement group cap)
  readonly rmfBaht: number; // Max 500,000 (in retirement group cap)
  readonly ssfBaht: number; // Max 200,000 (in retirement group cap)
  readonly thaiEsgBaht: number; // Max 300,000 (separate cap)
}

export interface PITCalculationInput {
  readonly taxYearBE: 2568 | 2569;
  readonly incomes: readonly IncomeItem[];
  readonly allowances: AllowanceInput;
  /** Withholding tax already paid (integer baht) */
  readonly withholdingTaxPaidBaht: number;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface PITBracketApplication {
  readonly level: number;
  readonly ratePercent: number;
  readonly taxableInBracketSatang: MoneySatang;
  readonly taxInBracketSatang: MoneySatang;
}

export interface PITCalculationResult {
  readonly taxYearBE: 2568 | 2569;

  // Step 1: Gross income
  readonly grossIncomeSatang: MoneySatang;

  // Step 2: Expense deductions
  readonly expenseDeductionSatang: MoneySatang;
  readonly incomeAfterExpensesSatang: MoneySatang;

  // Step 3: Allowances
  readonly totalAllowancesSatang: MoneySatang;

  // Step 4: Net taxable income
  readonly netTaxableIncomeSatang: MoneySatang;

  // Step 5: Tax calculation
  readonly bracketApplications: readonly PITBracketApplication[];
  readonly grossTaxSatang: MoneySatang;

  // Step 6: Withholding
  readonly withholdingTaxPaidSatang: MoneySatang;

  // Step 7: Final balance
  /** Positive = tax due to RD; negative = refund from RD */
  readonly taxDueOrRefundSatang: MoneySatang;
  readonly outcome: "pay" | "refund" | "zero";
}

// ---------------------------------------------------------------------------
// Constants (mirroring placeholder-bundle.json — source of truth is the JSON)
// ---------------------------------------------------------------------------

const TAX_BRACKETS: readonly {
  level: number;
  /** First baht of this bracket (inclusive) */
  min: number;
  /** Last baht of this bracket (inclusive), null = open-ended */
  max: number | null;
  /** Capacity of this bracket in baht: max - min + 1 (open-ended = unlimited) */
  capacityBaht: number | null;
  ratePercent: number;
}[] = [
  { level: 1, min: 0, max: 150000, capacityBaht: 150000, ratePercent: 0 },
  { level: 2, min: 150001, max: 300000, capacityBaht: 150000, ratePercent: 5 },
  { level: 3, min: 300001, max: 500000, capacityBaht: 200000, ratePercent: 10 },
  { level: 4, min: 500001, max: 750000, capacityBaht: 250000, ratePercent: 15 },
  {
    level: 5,
    min: 750001,
    max: 1000000,
    capacityBaht: 250000,
    ratePercent: 20,
  },
  {
    level: 6,
    min: 1000001,
    max: 2000000,
    capacityBaht: 1000000,
    ratePercent: 25,
  },
  {
    level: 7,
    min: 2000001,
    max: 5000000,
    capacityBaht: 3000000,
    ratePercent: 30,
  },
  { level: 8, min: 5000001, max: null, capacityBaht: null, ratePercent: 35 },
] as const;

// Expense deduction caps in baht per Revenue Code and Royal Decree 629
const EXPENSE_FLAT_RATE: Record<IncomeTypeCode, number> = {
  "40_1": 50, // 50%, combined with 40_2 capped at 100,000
  "40_2": 50, // 50%, combined with 40_1 capped at 100,000
  "40_3": 50, // 50%, capped at 100,000 (independent)
  "40_4": 0, // No deduction
  "40_5": 30, // 30% for most rental; simplified here
  "40_6_medical": 60, // 60%, no baht cap
  "40_6_other": 30, // 30%, no baht cap
  "40_7": 60, // 60%, no baht cap
  "40_8": 60, // 60%, no baht cap
};

// ---------------------------------------------------------------------------
// Allowance cap helpers
// ---------------------------------------------------------------------------

function clampBaht(value: number, max: number): number {
  return Math.min(Math.max(0, value), max);
}

function calcAllowancesSatang(a: AllowanceInput): MoneySatang {
  const personal = clampBaht(a.personalBaht, 60000);
  const sso = clampBaht(a.socialSecurityBaht, 9000);

  // Life + Health combined ≤ 100,000; health alone ≤ 25,000
  const lifeCap = 100000;
  const healthCap = 25000;
  const lifeApplied = clampBaht(a.lifeInsuranceBaht, lifeCap);
  const healthApplied = clampBaht(
    Math.min(a.healthInsuranceBaht, healthCap),
    lifeCap - lifeApplied,
  );

  // Retirement group: PVD + RMF + SSF combined ≤ 500,000
  const retirementGroupCap = 500000;
  const pvdApplied = clampBaht(a.providentFundBaht, retirementGroupCap);
  const rmfApplied = clampBaht(a.rmfBaht, retirementGroupCap - pvdApplied);
  const ssfApplied = clampBaht(
    Math.min(a.ssfBaht, 200000),
    retirementGroupCap - pvdApplied - rmfApplied,
  );

  // ThaiESG: separate cap 300,000
  const thaiEsgApplied = clampBaht(a.thaiEsgBaht, 300000);

  const totalBaht =
    personal +
    sso +
    lifeApplied +
    healthApplied +
    pvdApplied +
    rmfApplied +
    ssfApplied +
    thaiEsgApplied;

  return bahtToSatang(totalBaht);
}

// ---------------------------------------------------------------------------
// Expense deduction calculation
// ---------------------------------------------------------------------------

function calcExpenseDeductionSatang(
  incomes: readonly IncomeItem[],
): MoneySatang {
  let combinedEmploymentBaht = 0; // tracks 40_1 + 40_2 combined for the 100k cap

  // Separate 40_1 and 40_2 income totals first for combined cap logic
  const income40_1 = incomes
    .filter((i) => i.type === "40_1")
    .reduce((s, i) => s + i.grossIncomeBaht, 0);
  const income40_2 = incomes
    .filter((i) => i.type === "40_2")
    .reduce((s, i) => s + i.grossIncomeBaht, 0);

  // Combined 40(1)+40(2) expense = 50% of combined, capped at 100,000
  const combined12 = Math.min((income40_1 + income40_2) * 0.5, 100000);
  combinedEmploymentBaht = combined12;
  let totalDeductionBaht = combinedEmploymentBaht;

  // All other income types (not 40_1 or 40_2)
  for (const item of incomes) {
    if (item.type === "40_1" || item.type === "40_2") continue;

    if (item.expenseMethod === "actual") {
      const actual = item.actualExpenseBaht ?? 0;
      totalDeductionBaht += actual;
    } else {
      // flat_rate
      const rate = EXPENSE_FLAT_RATE[item.type] / 100;
      let deduction = item.grossIncomeBaht * rate;

      // 40_3: capped at 100,000 independently
      if (item.type === "40_3") {
        deduction = Math.min(deduction, 100000);
      }
      // 40_4: no deduction
      if (item.type === "40_4") {
        deduction = 0;
      }
      totalDeductionBaht += deduction;
    }
  }

  // Must be integer baht — all inputs are integer baht so deductions are always integer
  return bahtToSatang(Math.round(totalDeductionBaht));
}

// ---------------------------------------------------------------------------
// Tax bracket calculation
// ---------------------------------------------------------------------------

function calcGrossTaxFromBrackets(netTaxableIncomeSatang: MoneySatang): {
  grossTaxSatang: MoneySatang;
  bracketApplications: PITBracketApplication[];
} {
  // Work in integer satang throughout to avoid floating-point drift.
  // Thai RD calculates per whole-baht bracket, then rounds each bracket's
  // tax to whole baht. We replicate by computing bracket tax in satang
  // using integer arithmetic (taxable × ratePercent / 100, floored to satang).
  //
  // NOTE: Arithmetic on MoneySatang (branded number) yields plain `number`
  // in TypeScript, so we use plain number accumulators inside the loop and
  // brand them as MoneySatang only when constructing the final result.
  let remainingSatang: number = netTaxableIncomeSatang; // plain number accumulator
  let totalTaxSatang = 0;
  const bracketApplications: PITBracketApplication[] = [];

  for (const bracket of TAX_BRACKETS) {
    if (remainingSatang <= 0) break;

    // capacityBaht pre-computed in constant; convert to satang
    const bracketCapacitySatang: number =
      bracket.capacityBaht !== null
        ? bracket.capacityBaht * 100
        : remainingSatang; // open-ended: consume all remaining

    const taxableInBracketSatang: number = Math.min(
      remainingSatang,
      bracketCapacitySatang,
    );

    // Tax = taxable × rate; keep in satang integer
    // ratePercent is 0, 5, 10, 15, 20, 25, 30, 35 — all divisible cleanly
    const taxInBracketSatang: number = Math.round(
      taxableInBracketSatang * (bracket.ratePercent / 100),
    );

    bracketApplications.push({
      level: bracket.level,
      ratePercent: bracket.ratePercent,
      taxableInBracketSatang: toMoneySatang(taxableInBracketSatang),
      taxInBracketSatang: toMoneySatang(taxInBracketSatang),
    });

    totalTaxSatang += taxInBracketSatang;
    remainingSatang -= taxableInBracketSatang;
  }

  return {
    grossTaxSatang: toMoneySatang(totalTaxSatang),
    bracketApplications,
  };
}

// ---------------------------------------------------------------------------
// Main calculation entry point
// ---------------------------------------------------------------------------

export function calculatePIT(input: PITCalculationInput): PITCalculationResult {
  // Step 1: Gross income
  const grossIncomeBaht = input.incomes.reduce(
    (sum, item) => sum + item.grossIncomeBaht,
    0,
  );
  const grossIncomeSatang = bahtToSatang(grossIncomeBaht);

  // Step 2: Expense deductions
  const expenseDeductionSatang = calcExpenseDeductionSatang(input.incomes);
  const incomeAfterExpensesSatang = toMoneySatang(
    grossIncomeSatang - expenseDeductionSatang,
  );

  // Step 3: Allowances
  const totalAllowancesSatang = calcAllowancesSatang(input.allowances);

  // Step 4: Net taxable income (floor at 0)
  const rawNetSatang = incomeAfterExpensesSatang - totalAllowancesSatang;
  const netTaxableIncomeSatang = toMoneySatang(Math.max(0, rawNetSatang));

  // Step 5: Apply brackets
  const { grossTaxSatang, bracketApplications } = calcGrossTaxFromBrackets(
    netTaxableIncomeSatang,
  );

  // Step 6: Withholding
  const withholdingTaxPaidSatang = bahtToSatang(input.withholdingTaxPaidBaht);

  // Step 7: Balance (positive = pay, negative = refund)
  const taxDueOrRefundSatang = toMoneySatang(
    grossTaxSatang - withholdingTaxPaidSatang,
    { allowNegative: true },
  );

  const outcome: "pay" | "refund" | "zero" =
    taxDueOrRefundSatang > 0
      ? "pay"
      : taxDueOrRefundSatang < 0
        ? "refund"
        : "zero";

  return {
    taxYearBE: input.taxYearBE,
    grossIncomeSatang,
    expenseDeductionSatang,
    incomeAfterExpensesSatang,
    totalAllowancesSatang,
    netTaxableIncomeSatang,
    bracketApplications,
    grossTaxSatang,
    withholdingTaxPaidSatang,
    taxDueOrRefundSatang,
    outcome,
  };
}
