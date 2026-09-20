import { describe, expect, it } from "vitest";

import { createUnavailableTaxCalculationResult } from "../engine/contracts";
import { resolveTaxRules } from "../engine/taxRuleResolver";

describe("Tax Rule Resolver and Fail-Closed Policy", () => {
  it("fails closed for unknown tax year (e.g. 2570)", () => {
    const res = resolveTaxRules({ taxYearBE: 2570 });
    expect(res.availability).toBe("unavailable_unknown_tax_year");
    expect(res.metadata).toBeNull();
    expect(res.validation.isValid).toBe(false);
    expect(res.featureGates.taxEstimate).toBe("unavailable_until_verified");
  });

  it("resolves and enables estimate for verified 2568 rule set", () => {
    const res = resolveTaxRules({ taxYearBE: 2568 });
    expect(res.availability).toBe("available");
    expect(res.metadata).not.toBeNull();
    expect(res.metadata?.status).toBe("published");
    expect(res.metadata?.validationStatus).toBe("valid");
    expect(res.metadata?.notForCalculation).toBe(false);
    expect(res.featureGates.taxEstimate).toBe("available");
    expect(res.featureGates.pnd94Estimate).toBe("available");
    expect(res.featureGates.pnd91Estimate).toBe("available");
    expect(res.featureGates.taxRulePublication).toBe("available");
  });

  it("resolves and enables estimate for verified 2569 rule set", () => {
    const res = resolveTaxRules({ taxYearBE: 2569 });
    expect(res.availability).toBe("available");
    expect(res.metadata).not.toBeNull();
    expect(res.metadata?.status).toBe("published");
    expect(res.metadata?.validationStatus).toBe("valid");
    expect(res.metadata?.notForCalculation).toBe(false);
    expect(res.featureGates.taxEstimate).toBe("available");
  });

  it("returns correct feature gates when tax year is unknown", () => {
    const res = resolveTaxRules({ taxYearBE: 2570 });
    expect(res.featureGates).toEqual({
      summaryTotals: "available",
      taxEstimate: "unavailable_until_verified",
      pnd94Estimate: "unavailable_until_verified",
      pnd91Estimate: "unavailable_until_verified",
      taxRulePublication: "unavailable_until_reviewed",
    });
  });

  it("creates an unavailable calculation result that contains NO numeric tax estimate fields", () => {
    const unavailableResult = createUnavailableTaxCalculationResult({
      taxYearBE: 2568,
      availability: "unavailable_unverified_rules",
      reasonMessage: "Tax rules for 2568 are unverified.",
    });

    expect(unavailableResult.availability).toBe("unavailable_unverified_rules");
    expect(unavailableResult.totals).toBeUndefined();

    // Verify absence of official tax due fields
    const resultObj = unavailableResult as unknown as Record<string, unknown>;
    expect(resultObj.taxDue).toBeUndefined();
    expect(resultObj.refundAmount).toBeUndefined();
    expect(resultObj.finalTax).toBeUndefined();
    expect(resultObj.officialTaxPayable).toBeUndefined();
  });
});
