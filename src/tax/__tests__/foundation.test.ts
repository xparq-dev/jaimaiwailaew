import { describe, expect, it } from "vitest";

import metadata2568 from "../rules/2568/meta.json";
import bundle2568 from "../rules/2568/placeholder-bundle.json";
import metadata2569 from "../rules/2569/meta.json";
import bundle2569 from "../rules/2569/placeholder-bundle.json";
import {
  placeholderTaxRuleMetadataSchema,
  placeholderTaxRuleSetSchema,
  taxRuleMetadataSchema,
} from "../schemas";
import type {
  PlaceholderTaxRuleMetadata,
  PlaceholderTaxRuleSet,
} from "../types";
import type { ExecutableTaxRuleMetadata } from "../engine/contracts";

const placeholderRuleSets = [
  { metadata: metadata2568, bundle: bundle2568 },
  { metadata: metadata2569, bundle: bundle2569 },
] as const;

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
  it.each(placeholderRuleSets)(
    "validates the draft, disabled placeholder for tax year $metadata.taxYearBE",
    (candidate) => {
      const parsed: PlaceholderTaxRuleSet =
        placeholderTaxRuleSetSchema.parse(candidate);

      expect(parsed.metadata.status).toBe("draft");
      expect(parsed.metadata.verificationStatus).toBe(
        "requires_professional_verification",
      );
      expect(parsed.metadata.publicationBlocked).toBe(true);
      expect(parsed.bundle.calculationEnabled).toBe(false);
      expect(parsed.bundle.requiresVerification).toBe(true);
      expect(
        Object.values(parsed.bundle.sections).every(
          (items) => items.length === 0,
        ),
      ).toBe(true);
    },
  );

  it.each(placeholderRuleSets)(
    "contains no legal numeric rule fields for tax year $metadata.taxYearBE",
    ({ bundle }) => {
      const prohibitedKeys = new Set([
        "amount",
        "amounts",
        "rate",
        "rates",
        "threshold",
        "thresholds",
      ]);

      const presentProhibitedKeys = collectObjectKeys(bundle).filter((key) =>
        prohibitedKeys.has(key),
      );

      expect(presentProhibitedKeys).toEqual([]);
    },
  );

  it("rejects an unverified rule set that is enabled or published", () => {
    expect(() =>
      taxRuleMetadataSchema.parse({
        ...metadata2568,
        status: "published",
        calculationEnabled: true,
        publicationBlocked: false,
      }),
    ).toThrow();
  });

  it("keeps placeholder metadata restricted to the safe draft state", () => {
    expect(() =>
      placeholderTaxRuleMetadataSchema.parse({
        ...metadata2569,
        verificationStatus: "verified",
      }),
    ).toThrow();
  });
});

describe("Tax calculation contract safety", () => {
  it("does not allow placeholder metadata to satisfy the executable contract", () => {
    type PlaceholderCanExecute =
      PlaceholderTaxRuleMetadata extends ExecutableTaxRuleMetadata
        ? true
        : false;

    const placeholderCanExecute: PlaceholderCanExecute = false;

    expect(placeholderCanExecute).toBe(false);
  });
});
