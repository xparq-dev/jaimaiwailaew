import { computeArithmeticTotals, filterEntriesByPeriod } from "@/calculator/arithmetic";
import type { CalculatorWorkspace } from "@/calculator/types";
import { satangToBaht } from "@/tax/money";

import { mapIncomeCategoryToIncomeType } from "./incomeCategoryMapper";
import {
  calculatePIT,
  type AllowanceInput,
  type IncomeItem,
  type IncomeTypeCode,
  type PITCalculationInput,
  type PITCalculationResult,
} from "./pitCalculator";

/**
 * Builds PITCalculationInput from a CalculatorWorkspace.
 *
 * Mapping logic:
 *  - Filters income and withholding entries to the workspace's selected period.
 *  - Groups income entries by their statutory Revenue Code Section 40 IncomeTypeCode.
 *  - Applies the standard 60,000 baht personal allowance by law.
 *  - Maps allowance draft entries:
 *      * insurance_draft -> lifeInsuranceBaht (cap 100,000 in engine)
 *      * savings_investment_draft -> ssfBaht (cap 200,000 in engine, conservative default)
 *  - Computes period-filtered withholding tax already paid.
 */
export function buildPITInputFromWorkspace(
  workspace: CalculatorWorkspace,
): PITCalculationInput {
  const incomeInPeriod = filterEntriesByPeriod(
    workspace.incomeEntries,
    workspace.periodStart,
    workspace.periodEnd,
  );

  const incomeByType = new Map<IncomeTypeCode, number>();
  for (const entry of incomeInPeriod) {
    const type = mapIncomeCategoryToIncomeType(entry.categoryCode);
    const amountBaht = Math.round(satangToBaht(entry.amountSatang));
    incomeByType.set(type, (incomeByType.get(type) ?? 0) + amountBaht);
  }

  const incomes: IncomeItem[] = Array.from(incomeByType.entries()).map(
    ([type, grossIncomeBaht]) => ({
      type,
      grossIncomeBaht,
      expenseMethod: "flat_rate" as const,
    }),
  );

  let lifeInsuranceBaht = 0;
  let ssfBaht = 0;
  for (const entry of workspace.allowanceDraftEntries) {
    if (entry.declaredAmountSatang !== undefined) {
      const amountBaht = Math.round(satangToBaht(entry.declaredAmountSatang));
      if (entry.categoryCode === "insurance_draft") {
        lifeInsuranceBaht += amountBaht;
      } else if (entry.categoryCode === "savings_investment_draft") {
        ssfBaht += amountBaht;
      }
    }
  }

  const allowances: AllowanceInput = {
    personalBaht: 60000,
    socialSecurityBaht: 0,
    lifeInsuranceBaht,
    healthInsuranceBaht: 0,
    providentFundBaht: 0,
    rmfBaht: 0,
    ssfBaht,
    thaiEsgBaht: 0,
  };

  const totals = computeArithmeticTotals(workspace);
  const withholdingTaxPaidBaht = Math.round(
    satangToBaht(totals.totalWithholdingSatang),
  );

  return {
    taxYearBE: workspace.taxYearBE,
    incomes,
    allowances,
    withholdingTaxPaidBaht,
  };
}

/**
 * Executes a full PIT calculation for the given workspace.
 */
export function calculateWorkspacePIT(
  workspace: CalculatorWorkspace,
): PITCalculationResult {
  const input = buildPITInputFromWorkspace(workspace);
  return calculatePIT(input);
}
