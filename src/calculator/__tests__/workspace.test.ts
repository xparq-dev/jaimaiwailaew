import { describe, expect, it } from "vitest";

import {
  calculatorWorkspaceSchema,
  incomeEntrySchema,
  expenseEntrySchema,
  withholdingEntrySchema,
} from "@/calculator/schemas";
import {
  createCalculatorWorkspace,
  createTaxRuleResolutionSnapshot,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { toMoneySatang } from "@/tax/money";

describe("Calculator Workspace and Schema Validation", () => {
  it("creates a valid default workspace for online seller with PND94 period and schemaVersion 2", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

    expect(workspace.schemaVersion).toBe(2);
    expect(workspace.taxYearBE).toBe(2569);
    expect(workspace.persona).toBe("online_seller_business");
    expect(workspace.calculationMode).toBe("pnd94");
    expect(workspace.periodStart).toBe("2026-01-01");
    expect(workspace.periodEnd).toBe("2026-06-30");
    expect(workspace.localOnly).toBe(true);

    // Validate using Zod schema
    const parseResult = calculatorWorkspaceSchema.safeParse(workspace);
    expect(parseResult.success).toBe(true);
  });

  it("creates a valid default workspace for salaried employee with full-year PND91 period", () => {
    const input = getDefaultWorkspaceInput(
      "salaried_employee",
      2568,
      "full_year",
    );
    const workspace = createCalculatorWorkspace(input);

    expect(workspace.schemaVersion).toBe(2);
    expect(workspace.taxYearBE).toBe(2568);
    expect(workspace.persona).toBe("salaried_employee");
    expect(workspace.calculationMode).toBe("pnd91");
    expect(workspace.periodStart).toBe("2025-01-01");
    expect(workspace.periodEnd).toBe("2025-12-31");

    const parseResult = calculatorWorkspaceSchema.safeParse(workspace);
    expect(parseResult.success).toBe(true);
  });

  it("resolves tax rule snapshot as unverified availability fail-closed", () => {
    const snapshot2569 = createTaxRuleResolutionSnapshot(2569);
    expect(snapshot2569.taxYearBE).toBe(2569);
    expect(snapshot2569.availability).toBe("unavailable_unverified_rules");

    const snapshot2568 = createTaxRuleResolutionSnapshot(2568);
    expect(snapshot2568.taxYearBE).toBe(2568);
    expect(snapshot2568.availability).toBe("unavailable_unverified_rules");
  });

  it("schema validates one_time entry with occurredOn and occurredMonth null", () => {
    const validOneTime = {
      id: "inc-1",
      entryFrequency: "one_time",
      occurredOn: "2026-03-15",
      occurredMonth: null,
      categoryCode: "online_sales",
      sourceName: "Shopee",
      amountSatang: toMoneySatang(500000),
      createdAt: "2026-03-15T00:00:00.000Z",
      updatedAt: "2026-03-15T00:00:00.000Z",
    };

    const parsed = incomeEntrySchema.safeParse(validOneTime);
    expect(parsed.success).toBe(true);
  });

  it("schema validates monthly entry with occurredMonth and occurredOn null", () => {
    const validMonthly = {
      id: "inc-2",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-03",
      categoryCode: "salary",
      sourceName: "Company XYZ",
      amountSatang: toMoneySatang(4500000),
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    };

    const parsed = incomeEntrySchema.safeParse(validMonthly);
    expect(parsed.success).toBe(true);
  });

  it("invalid one_time missing occurredOn is rejected", () => {
    const missingOccurredOn = {
      id: "inc-invalid",
      entryFrequency: "one_time",
      occurredOn: null,
      occurredMonth: null,
      categoryCode: "online_sales",
      amountSatang: toMoneySatang(1000),
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(missingOccurredOn).success).toBe(false);
  });

  it("invalid monthly missing occurredMonth is rejected", () => {
    const missingOccurredMonth = {
      id: "inc-invalid",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: null,
      categoryCode: "salary",
      amountSatang: toMoneySatang(1000),
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(missingOccurredMonth).success).toBe(
      false,
    );
  });

  it("invalid entry with both occurredOn and occurredMonth is rejected", () => {
    const bothSet = {
      id: "inc-both",
      entryFrequency: "one_time",
      occurredOn: "2026-03-15",
      occurredMonth: "2026-03",
      categoryCode: "online_sales",
      amountSatang: toMoneySatang(1000),
      createdAt: "2026-03-15T00:00:00.000Z",
      updatedAt: "2026-03-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(bothSet).success).toBe(false);
  });

  it("malformed monthly period is rejected", () => {
    const malformedMonth = {
      id: "inc-bad-month",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-13", // Invalid month 13
      categoryCode: "salary",
      amountSatang: toMoneySatang(1000),
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(malformedMonth).success).toBe(false);
  });

  it("rejects income entry with negative amountSatang", () => {
    const invalidNegative = {
      id: "inc-invalid",
      entryFrequency: "one_time",
      occurredOn: "2026-02-15",
      occurredMonth: null,
      categoryCode: "online_sales",
      amountSatang: -500,
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(invalidNegative).success).toBe(false);
  });

  it("validates withholding and expense entries across both frequencies", () => {
    const monthlyExpense = {
      id: "exp-1",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-04",
      categoryCode: "utilities",
      taxRelevanceStatus: "likely_related",
      amountSatang: toMoneySatang(350000),
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    };
    expect(expenseEntrySchema.safeParse(monthlyExpense).success).toBe(true);

    const monthlyWithholding = {
      id: "wht-1",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-04",
      payerName: "Employer Corp",
      certificateReference: "WHT-04-2026",
      amountSatang: toMoneySatang(150000),
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    };
    expect(withholdingEntrySchema.safeParse(monthlyWithholding).success).toBe(
      true,
    );
  });

  it("rejects expense entry with HTML/script in note", () => {
    const invalidScript = {
      id: "exp-invalid-note",
      entryFrequency: "one_time",
      occurredOn: "2026-02-15",
      occurredMonth: null,
      categoryCode: "shipping",
      taxRelevanceStatus: "likely_related",
      amountSatang: toMoneySatang(1000),
      note: "Normal note <script>alert(1)</script>",
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(expenseEntrySchema.safeParse(invalidScript).success).toBe(false);
  });
});
