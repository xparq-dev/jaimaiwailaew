import { filterEntriesByPeriod } from "./arithmetic";
import type { CalculatorWorkspace } from "./types";
import { toMoneySatang, type MoneySatang } from "@/tax/money";

const CONTRIBUTION_RATE = 0.05;

export const SOCIAL_SECURITY_RULES = {
  2568: {
    monthlyWageCeilingBaht: 15_000,
    monthlyContributionCeilingBaht: 750,
    annualContributionCeilingBaht: 9_000,
  },
  2569: {
    monthlyWageCeilingBaht: 17_500,
    monthlyContributionCeilingBaht: 875,
    annualContributionCeilingBaht: 10_500,
  },
} as const;

export interface SocialSecuritySummary {
  readonly mode: CalculatorWorkspace["socialSecuritySettings"]["mode"];
  readonly contributionSatang: MoneySatang;
  readonly salaryMonthsIncluded: number;
  readonly hasOneTimeSalaryEntries: boolean;
  readonly annualContributionCeilingBaht: number;
}

export function calculateWorkspaceSocialSecurity(
  workspace: CalculatorWorkspace,
): SocialSecuritySummary {
  const rules = SOCIAL_SECURITY_RULES[workspace.taxYearBE];
  const salaryEntries = filterEntriesByPeriod(
    workspace.incomeEntries.filter((entry) => entry.categoryCode === "salary"),
    workspace.periodStart,
    workspace.periodEnd,
  );
  const hasOneTimeSalaryEntries = salaryEntries.some(
    (entry) => entry.entryFrequency === "one_time",
  );

  if (workspace.socialSecuritySettings.mode === "none") {
    return {
      mode: "none",
      contributionSatang: toMoneySatang(0),
      salaryMonthsIncluded: 0,
      hasOneTimeSalaryEntries,
      annualContributionCeilingBaht: rules.annualContributionCeilingBaht,
    };
  }

  if (workspace.socialSecuritySettings.mode === "manual") {
    const annualCeilingSatang = rules.annualContributionCeilingBaht * 100;
    return {
      mode: "manual",
      contributionSatang: toMoneySatang(
        Math.min(
          workspace.socialSecuritySettings.manualContributionSatang,
          annualCeilingSatang,
        ),
      ),
      salaryMonthsIncluded: 0,
      hasOneTimeSalaryEntries,
      annualContributionCeilingBaht: rules.annualContributionCeilingBaht,
    };
  }

  const grossSalaryByMonth = new Map<string, number>();
  for (const entry of salaryEntries) {
    if (entry.entryFrequency !== "monthly") {
      continue;
    }
    if (entry.amountSatang <= 0) {
      continue;
    }
    grossSalaryByMonth.set(
      entry.occurredMonth,
      (grossSalaryByMonth.get(entry.occurredMonth) ?? 0) + entry.amountSatang,
    );
  }

  const monthlyWageCeilingSatang = rules.monthlyWageCeilingBaht * 100;
  const monthlyWageFloorSatang = 1_650 * 100;
  const contributionSatang = [...grossSalaryByMonth.values()].reduce(
    (total, grossSalarySatang) =>
      total +
      Math.round(
        (Math.min(
          Math.max(grossSalarySatang, monthlyWageFloorSatang),
          monthlyWageCeilingSatang,
        ) /
          100) *
          CONTRIBUTION_RATE,
      ) *
        100,
    0,
  );

  return {
    mode: "auto_m33",
    contributionSatang: toMoneySatang(contributionSatang),
    salaryMonthsIncluded: grossSalaryByMonth.size,
    hasOneTimeSalaryEntries,
    annualContributionCeilingBaht: rules.annualContributionCeilingBaht,
  };
}
