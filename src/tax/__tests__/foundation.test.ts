import { describe, expect, it } from "vitest";

import metadata2568 from "../rules/2568/meta.json";
import metadata2569 from "../rules/2569/meta.json";
import sampleFixture from "../fixtures/structural-sample-family.json";
import { ruleFamilyManifestSchema, taxRuleSetMetadataSchema } from "../schemas";
import type { TaxRuleSetMetadata } from "../types";

const placeholderMetadataList = [metadata2568, metadata2569] as const;

function collectObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectObjectKeys);
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => [
    key,
    ...collectObjectKeys(nestedValue),
  ]);
}

describe("Tax Foundation placeholder rule sets", () => {
  it.each(placeholderMetadataList)(
    "validates the verified metadata for tax year $taxYearBE",
    (candidate) => {
      const parsed: TaxRuleSetMetadata =
        taxRuleSetMetadataSchema.parse(candidate);

      expect(parsed.status).toBe("published");
      expect(parsed.validationStatus).toBe("valid");
      expect(parsed.notForCalculation).toBe(false);
      expect(parsed.sources.every((s) => s.reviewerStatus === "reviewed")).toBe(
        true,
      );
    },
  );

  it("validates the structural sample family fixture with exampleOnly: true", () => {
    const parsed = ruleFamilyManifestSchema.parse(sampleFixture);
    expect(parsed.exampleOnly).toBe(true);
    expect(parsed.notForCalculation).toBe(true);
  });

  it.each(placeholderMetadataList)(
    "contains no legal numeric rule fields for tax year $taxYearBE",
    (meta) => {
      const prohibitedKeys = new Set([
        "amount",
        "amounts",
        "rate",
        "rates",
        "threshold",
        "thresholds",
      ]);

      const presentProhibitedKeys = collectObjectKeys(meta).filter((key) =>
        prohibitedKeys.has(key),
      );

      expect(presentProhibitedKeys).toEqual([]);
    },
  );

  it("rejects an unverified rule set that sets notForCalculation to false without being published", () => {
    expect(() =>
      taxRuleSetMetadataSchema.parse({
        ...metadata2568,
        status: "unverified",
        notForCalculation: false,
      }),
    ).toThrow();
  });
});
