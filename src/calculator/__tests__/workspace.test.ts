import { describe, expect, it } from "vitest";

import {
  calculatorWorkspaceSchema,
  incomeEntrySchema,
  expenseEntrySchema,
} from "@/calculator/schemas";
import {
  createCalculatorWorkspace,
  createTaxRuleResolutionSnapshot,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { toMoneySatang } from "@/tax/money";

describe("Calculator Workspace and Schema Validation", () => {
  it("creates a valid default workspace for online seller with PND94 period", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    const workspace = createCalculatorWorkspace(input);

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

  it("rejects income entry with negative amountSatang or missing required fields", () => {
    const invalidNegative = {
      id: "inc-invalid",
      occurredOn: "2026-02-15",
      categoryCode: "online_sales",
      amountSatang: -500,
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(invalidNegative).success).toBe(false);

    const invalidDate = {
      id: "inc-invalid-date",
      occurredOn: "15/02/2026", // Invalid ISO format
      categoryCode: "online_sales",
      amountSatang: toMoneySatang(1000),
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };
    expect(incomeEntrySchema.safeParse(invalidDate).success).toBe(false);
  });

  it("rejects expense entry with HTML/script in note", () => {
    const invalidScript = {
      id: "exp-invalid-note",
      occurredOn: "2026-02-15",
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
