import { describe, expect, it } from "vitest";

import { calculatorWorkspaceSchema } from "@/calculator/schemas";
import {
  calculateWorkspaceSocialSecurity,
  SOCIAL_SECURITY_RULES,
} from "@/calculator/social-security";
import type { IncomeEntry } from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { calculateWorkspacePIT } from "@/tax/engine/workspacePitAdapter";
import { toMoneySatang } from "@/tax/money";

const timestamp = "2026-01-01T00:00:00.000Z";

function monthlySalary(month: string, amountBaht: number): IncomeEntry {
  return {
    id: `salary-${month}`,
    entryFrequency: "monthly",
    occurredOn: null,
    occurredMonth: month,
    categoryCode: "salary",
    sourceName: "บริษัท",
    amountSatang: toMoneySatang(amountBaht * 100),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("social security calculation", () => {
  it("calculates the 2568 and 2569 monthly M.33 ceilings from gross salary", () => {
    for (const [taxYearBE, expectedBaht] of [
      [2568, 750],
      [2569, 875],
    ] as const) {
      const workspace = createCalculatorWorkspace(
        getDefaultWorkspaceInput("salaried_employee", taxYearBE, "full_year"),
      );
      const result = calculateWorkspaceSocialSecurity({
        ...workspace,
        incomeEntries: [monthlySalary(`${taxYearBE - 543}-01`, 18_000)],
      });

      expect(result.contributionSatang).toBe(toMoneySatang(expectedBaht * 100));
      expect(result.salaryMonthsIncluded).toBe(1);
    }
  });

  it("groups salary entries by month and caps a complete 2569 year at 10,500 baht", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    );
    const incomeEntries = Array.from({ length: 12 }, (_, index) =>
      monthlySalary(`2026-${String(index + 1).padStart(2, "0")}`, 18_000),
    );
    incomeEntries.push({
      ...monthlySalary("2026-01", 2_000),
      id: "salary-january-adjustment",
    });

    const result = calculateWorkspaceSocialSecurity({
      ...workspace,
      incomeEntries,
    });

    expect(result.contributionSatang).toBe(toMoneySatang(10_500 * 100));
    expect(result.salaryMonthsIncluded).toBe(12);
    expect(result.annualContributionCeilingBaht).toBe(
      SOCIAL_SECURITY_RULES[2569].annualContributionCeilingBaht,
    );
  });

  it("uses the statutory 1,650 baht minimum wage base for a positive monthly salary", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    );
    const result = calculateWorkspaceSocialSecurity({
      ...workspace,
      incomeEntries: [monthlySalary("2026-01", 1_000)],
    });

    expect(result.contributionSatang).toBe(toMoneySatang(83 * 100));
  });

  it("uses and caps a manual actual contribution in the PIT calculation", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    );
    const configured = {
      ...workspace,
      incomeEntries: [monthlySalary("2026-01", 600_000)],
      socialSecuritySettings: {
        mode: "manual" as const,
        manualContributionSatang: toMoneySatang(15_000 * 100),
      },
    };

    expect(
      calculateWorkspaceSocialSecurity(configured).contributionSatang,
    ).toBe(toMoneySatang(10_500 * 100));
    expect(calculateWorkspacePIT(configured).totalAllowancesSatang).toBe(
      toMoneySatang(70_500 * 100),
    );
  });

  it("defaults compatible saved v2 workspaces without the new setting to none", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    );
    const savedBeforeThisChange = Object.fromEntries(
      Object.entries(workspace).filter(
        ([key]) => key !== "socialSecuritySettings",
      ),
    );

    const parsed = calculatorWorkspaceSchema.parse(savedBeforeThisChange);

    expect(parsed.socialSecuritySettings).toEqual({ mode: "none" });
  });
});
