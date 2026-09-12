import { describe, expect, it } from "vitest";

import metadata2568 from "../rules/2568/meta.json";
import {
  machineIdentifierSchema,
  taxRuleSetMetadataSchema,
  taxRuleSourceSchema,
} from "../schemas";

describe("Tax Schema validations", () => {
  it("passes validation for valid structural unverified rule set 2568", () => {
    const result = taxRuleSetMetadataSchema.safeParse(metadata2568);
    expect(result.success).toBe(true);
  });

  it("rejects malformed rule set metadata", () => {
    const malformed = {
      ...metadata2568,
      taxYearBE: 2570, // Invalid tax year
    };
    const result = taxRuleSetMetadataSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it("rejects invalid machine identifiers", () => {
    expect(machineIdentifierSchema.safeParse("valid-id-123").success).toBe(
      true,
    );
    expect(machineIdentifierSchema.safeParse("Invalid_ID!").success).toBe(
      false,
    );
    expect(machineIdentifierSchema.safeParse("UPPERCASE").success).toBe(false);
    expect(machineIdentifierSchema.safeParse("with spaces").success).toBe(
      false,
    );
  });

  it("rejects invalid, relative, or malformed source URLs", () => {
    const baseSource = {
      sourceId: "source-1",
      sourceType: "official_webpage",
      authority: "กรมสรรพากร",
      title: "Test Title",
      url: "/relative/path/not/allowed",
      evidenceLevel: "unverified",
      reviewerStatus: "not_reviewed",
      lastCheckedAt: null,
      notes: ["Note"],
    };

    expect(taxRuleSourceSchema.safeParse(baseSource).success).toBe(false);

    const malformedUrlSource = {
      ...baseSource,
      url: "ftp://invalid-protocol.com",
    };
    expect(taxRuleSourceSchema.safeParse(malformedUrlSource).success).toBe(
      false,
    );

    const validUrlSource = {
      ...baseSource,
      url: "https://www.rd.go.th/official-announcement",
    };
    expect(taxRuleSourceSchema.safeParse(validUrlSource).success).toBe(true);

    const nullUrlSource = {
      ...baseSource,
      url: null,
    };
    expect(taxRuleSourceSchema.safeParse(nullUrlSource).success).toBe(true);
  });
});
