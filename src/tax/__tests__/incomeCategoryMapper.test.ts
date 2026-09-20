import { describe, expect, it } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import {
  INCOME_CATEGORY_TO_INCOME_TYPE_MAP,
  mapIncomeCategoryToIncomeType,
} from "@/tax/engine/incomeCategoryMapper";
import {
  buildPITInputFromWorkspace,
  calculateWorkspacePIT,
} from "@/tax/engine/workspacePitAdapter";
import { toMoneySatang } from "@/tax/money";
import type { IncomeCategoryCode } from "@/calculator/types";

describe("Income Category to Section 40 Mapper", () => {
  it("maps creator_affiliate to 40_2 (Service/Freelance)", () => {
    expect(mapIncomeCategoryToIncomeType("creator_affiliate")).toBe("40_2");
  });

  it("maps professional_service to 40_6_other (Liberal profession - non-medical)", () => {
    expect(mapIncomeCategoryToIncomeType("professional_service")).toBe(
      "40_6_other",
    );
  });

  it("maps employment incomes to 40_1", () => {
    const employmentCategories: IncomeCategoryCode[] = [
      "salary",
      "bonus",
      "overtime",
      "commission",
      "pension",
    ];
    for (const cat of employmentCategories) {
      expect(mapIncomeCategoryToIncomeType(cat)).toBe("40_1");
    }
  });

  it("maps commercial/business incomes to 40_8", () => {
    const businessCategories: IncomeCategoryCode[] = [
      "online_sales",
      "store_sales",
      "business_income",
      "agriculture",
      "prize_grant",
      "other",
    ];
    for (const cat of businessCategories) {
      expect(mapIncomeCategoryToIncomeType(cat)).toBe("40_8");
    }
  });

  it("maps capital and passive incomes to 40_3, 40_4, 40_5", () => {
    expect(mapIncomeCategoryToIncomeType("royalty")).toBe("40_3");
    expect(mapIncomeCategoryToIncomeType("interest")).toBe("40_4");
    expect(mapIncomeCategoryToIncomeType("dividend")).toBe("40_4");
    expect(mapIncomeCategoryToIncomeType("investment")).toBe("40_4");
    expect(mapIncomeCategoryToIncomeType("rental")).toBe("40_5");
  });

  it("covers all 19 defined income category codes", () => {
    const allKeys = Object.keys(INCOME_CATEGORY_TO_INCOME_TYPE_MAP);
    expect(allKeys).toHaveLength(19);
  });
});

describe("Workspace PIT Adapter", () => {
  it("builds PITCalculationInput and calculates PIT correctly from workspace data", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("freelancer", 2568, "full_year"),
    );

    const populatedWorkspace = {
      ...workspace,
      incomeEntries: [
        {
          id: "inc-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2025-03-01",
          occurredMonth: null,
          categoryCode: "freelance_service" as const,
          amountSatang: toMoneySatang(300_000_00),
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        },
        {
          id: "inc-2",
          entryFrequency: "one_time" as const,
          occurredOn: "2025-05-01",
          occurredMonth: null,
          categoryCode: "creator_affiliate" as const,
          amountSatang: toMoneySatang(100_000_00),
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        },
      ],
      withholdingEntries: [
        {
          id: "wht-1",
          entryFrequency: "one_time" as const,
          occurredOn: "2025-03-01",
          occurredMonth: null,
          amountSatang: toMoneySatang(12_000_00),
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        },
      ],
      allowanceDraftEntries: [
        {
          id: "alw-1",
          categoryCode: "insurance_draft" as const,
          declaredAmountSatang: toMoneySatang(30_000_00),
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        },
        {
          id: "alw-2",
          categoryCode: "savings_investment_draft" as const,
          declaredAmountSatang: toMoneySatang(50_000_00),
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        },
      ],
    };

    const input = buildPITInputFromWorkspace(populatedWorkspace);
    expect(input.taxYearBE).toBe(2568);
    // Both freelance_service and creator_affiliate mapped to 40_2: 300,000 + 100,000 = 400,000
    expect(input.incomes).toHaveLength(1);
    expect(input.incomes[0]).toEqual({
      type: "40_2",
      grossIncomeBaht: 400_000,
      expenseMethod: "flat_rate",
    });
    // Allowances: personal 60,000, life insurance 30,000, ssf 50,000
    expect(input.allowances.personalBaht).toBe(60_000);
    expect(input.allowances.lifeInsuranceBaht).toBe(30_000);
    expect(input.allowances.ssfBaht).toBe(50_000);
    expect(input.withholdingTaxPaidBaht).toBe(12_000);

    const result = calculateWorkspacePIT(populatedWorkspace);
    expect(result.taxYearBE).toBe(2568);
    expect(result.grossIncomeSatang).toBe(toMoneySatang(400_000_00));
    // 40_2 50% cap 100,000 -> expense = 100,000
    expect(result.expenseDeductionSatang).toBe(toMoneySatang(100_000_00));
    // Allowances: 60k + 30k + 50k = 140,000
    expect(result.totalAllowancesSatang).toBe(toMoneySatang(140_000_00));
    // Net: 400k - 100k - 140k = 160,000
    expect(result.netTaxableIncomeSatang).toBe(toMoneySatang(160_000_00));
    // Brackets:
    // 0 - 150,000: 0% = 0
    // 150,001 - 160,000 (10,000): 5% = 500
    expect(result.grossTaxSatang).toBe(toMoneySatang(500_00));
    // Withholding = 12,000 -> Refund = 500 - 12,000 = -11,500
    expect(result.withholdingTaxPaidSatang).toBe(toMoneySatang(12_000_00));
    expect(result.taxDueOrRefundSatang).toBe(
      toMoneySatang(-11_500_00, { allowNegative: true }),
    );
    expect(result.outcome).toBe("refund");
  });
});
