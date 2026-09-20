import { describe, expect, it } from "vitest";

import bundle2568 from "../rules/2568/placeholder-bundle.json";
import manifests2568 from "../rules/2568/manifest.json";
import meta2568 from "../rules/2568/meta.json";
import sources2568 from "../rules/2568/sources.json";

import bundle2569 from "../rules/2569/placeholder-bundle.json";
import manifests2569 from "../rules/2569/manifest.json";
import meta2569 from "../rules/2569/meta.json";
import sources2569 from "../rules/2569/sources.json";

import { resolveTaxRules } from "../engine/taxRuleResolver";
import {
  ruleFamilyManifestSchema,
  taxRuleSetMetadataSchema,
  taxRuleSourceSchema,
} from "../schemas";

describe("Tax Rules Verification (Steps 1 & 2 Drafts)", () => {
  it("validates official sources against taxRuleSourceSchema for 2568 and 2569", () => {
    for (const s of sources2568) {
      const parsed = taxRuleSourceSchema.safeParse(s);
      expect(parsed.success).toBe(true);
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.lastCheckedAt).toBe("2026-09-20");
    }

    for (const s of sources2569) {
      const parsed = taxRuleSourceSchema.safeParse(s);
      expect(parsed.success).toBe(true);
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.lastCheckedAt).toBe("2026-09-20");
    }
  });

  it("validates metadata against taxRuleSetMetadataSchema for 2568 and 2569", () => {
    const res68 = taxRuleSetMetadataSchema.safeParse(meta2568);
    expect(res68.success).toBe(true);
    expect(meta2568.version).toBe("1.0.0");
    expect(meta2568.status).toBe("published");
    expect(meta2568.validationStatus).toBe("valid");
    expect(meta2568.notForCalculation).toBe(false);

    const res69 = taxRuleSetMetadataSchema.safeParse(meta2569);
    expect(res69.success).toBe(true);
    expect(meta2569.version).toBe("1.0.0");
    expect(meta2569.status).toBe("published");
    expect(meta2569.validationStatus).toBe("valid");
    expect(meta2569.notForCalculation).toBe(false);
  });

  it("validates all rule family manifests for 2568 and 2569", () => {
    const expectedFamilies = [
      "tax_brackets",
      "income_types",
      "expense_deduction_rules",
      "allowance_rules",
      "withholding_tax_rules",
      "pnd94_rules",
      "pnd91_rules",
    ];

    const families68 = manifests2568.map((m) => m.family);
    for (const f of expectedFamilies) {
      expect(families68).toContain(f);
    }

    for (const m of manifests2568) {
      const parsed = ruleFamilyManifestSchema.safeParse(m);
      expect(parsed.success).toBe(true);
      expect(m.notForCalculation).toBe(false);
      expect(m.status).toBe("published");
      expect(m.reviewerStatus).toBe("reviewed");
    }

    const families69 = manifests2569.map((m) => m.family);
    for (const f of expectedFamilies) {
      expect(families69).toContain(f);
    }

    for (const m of manifests2569) {
      const parsed = ruleFamilyManifestSchema.safeParse(m);
      expect(parsed.success).toBe(true);
      expect(m.notForCalculation).toBe(false);
      expect(m.status).toBe("published");
      expect(m.reviewerStatus).toBe("reviewed");
    }
  });

  it("verifies drafted tax brackets 0% to 35% across 8 tiers in bundle", () => {
    for (const bundle of [bundle2568, bundle2569]) {
      const brackets = bundle.sections.taxBrackets;
      expect(brackets).toHaveLength(8);
      expect(brackets[0]).toMatchObject({
        min: 0,
        max: 150000,
        ratePercent: 0,
      });
      expect(brackets[1]).toMatchObject({
        min: 150001,
        max: 300000,
        ratePercent: 5,
      });
      expect(brackets[2]).toMatchObject({
        min: 300001,
        max: 500000,
        ratePercent: 10,
      });
      expect(brackets[3]).toMatchObject({
        min: 500001,
        max: 750000,
        ratePercent: 15,
      });
      expect(brackets[4]).toMatchObject({
        min: 750001,
        max: 1000000,
        ratePercent: 20,
      });
      expect(brackets[5]).toMatchObject({
        min: 1000001,
        max: 2000000,
        ratePercent: 25,
      });
      expect(brackets[6]).toMatchObject({
        min: 2000001,
        max: 5000000,
        ratePercent: 30,
      });
      expect(brackets[7]).toMatchObject({
        min: 5000001,
        max: null,
        ratePercent: 35,
      });
    }
  });

  it("verifies drafted expense deductions for 40(1) to 40(8)", () => {
    for (const bundle of [bundle2568, bundle2569]) {
      const deductions = bundle.sections.expenseDeductions;
      const salaryAndService = deductions.find(
        (d) => d.category === "employment_and_service",
      );
      expect(salaryAndService).toBeDefined();
      expect(salaryAndService?.ratePercent).toBe(50);
      expect(salaryAndService?.combinedMaxLimitBaht).toBe(100000);

      const copyright = deductions.find(
        (d) => d.category === "copyright_and_royalties",
      );
      expect(copyright).toBeDefined();
      expect(copyright?.ratePercent).toBe(50);
      expect(copyright?.maxLimitBaht).toBe(100000);

      const medical = deductions.find(
        (d) => d.category === "liberal_profession_medical",
      );
      expect(medical?.ratePercent).toBe(60);

      const liberalOther = deductions.find(
        (d) => d.category === "liberal_profession_other",
      );
      expect(liberalOther?.ratePercent).toBe(30);

      const contractor = deductions.find((d) => d.category === "contractor");
      expect(contractor?.ratePercent).toBe(60);

      const business = deductions.find(
        (d) => d.category === "business_commerce",
      );
      expect(business?.ratePercent).toBe(60);
    }
  });

  it("verifies drafted standard allowances: personal, social security, funds, insurance", () => {
    for (const bundle of [bundle2568, bundle2569]) {
      const allowances = bundle.sections.allowances;
      const personal = allowances.find((a) => a.id === "personal");
      expect(personal?.amountBaht).toBe(60000);

      const sso = allowances.find((a) => a.id === "social_security");
      expect(sso?.maxLimitBaht).toBe(9000);

      const pvd = allowances.find((a) => a.id === "provident_fund");
      expect(pvd?.maxLimitBaht).toBe(500000);

      const rmf = allowances.find((a) => a.id === "rmf");
      expect(rmf?.maxLimitBaht).toBe(500000);

      const ssf = allowances.find((a) => a.id === "ssf");
      expect(ssf?.maxLimitBaht).toBe(200000);

      const thaiesg = allowances.find((a) => a.id === "thaiesg");
      expect(thaiesg?.maxLimitBaht).toBe(300000);

      const life = allowances.find((a) => a.id === "life_insurance");
      expect(life?.maxLimitBaht).toBe(100000);

      const health = allowances.find((a) => a.id === "health_insurance");
      expect(health?.maxLimitBaht).toBe(25000);
    }
  });

  it("confirms resolver returns available for both 2568 and 2569 once verified and published", () => {
    const res68 = resolveTaxRules({ taxYearBE: 2568 });
    expect(res68.availability).toBe("available");
    expect(res68.metadata?.notForCalculation).toBe(false);
    expect(res68.featureGates.taxEstimate).toBe("available");

    const res69 = resolveTaxRules({ taxYearBE: 2569 });
    expect(res69.availability).toBe("available");
    expect(res69.metadata?.notForCalculation).toBe(false);
    expect(res69.featureGates.taxEstimate).toBe("available");
  });
});
