import { describe, expect, it } from "vitest";

import { getTaxRuleSourceRegistry } from "@/tax/tax-rule-source-registry";

describe("getTaxRuleSourceRegistry", () => {
  it("projects reviewed local rule metadata without internal identifiers", () => {
    const entries = getTaxRuleSourceRegistry();

    expect(entries.map((entry) => entry.taxYearBE)).toEqual([2568, 2569]);
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          calculationAvailable: true,
          version: "1.0.0",
        }),
      ]),
    );

    const serialized = JSON.stringify(entries);
    expect(serialized).not.toMatch(
      /ruleSetId|sourceId|lastReviewedBy|workspace|entryId/i,
    );
  });

  it("keeps only linkable official source metadata for each supported year", () => {
    const entries = getTaxRuleSourceRegistry();

    for (const entry of entries) {
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) {
        expect(source.url).toMatch(/^https:\/\//u);
        expect(source.title).not.toHaveLength(0);
        expect(source.authority).not.toHaveLength(0);
      }
    }
  });
});
