import { z } from "zod";

import {
  CALCULATION_AVAILABILITIES,
  EVIDENCE_LEVELS,
  REVIEWER_STATUSES,
  RULE_FAMILIES,
  SUPPORTED_TAX_YEARS_BE,
  TAX_CALCULATION_SCOPES,
  TAX_RULE_SET_STATUSES,
  TAX_RULE_SET_VALIDATION_STATUSES,
  TAX_RULE_SOURCE_TYPES,
} from "./types";

export const machineIdentifierSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, {
    message:
      "Identifier must consist of lower-case alphanumeric characters and hyphens.",
  });

export const ruleSetIdSchema = z
  .string()
  .trim()
  .regex(/^th-pit-25(?:68|69)-[a-z0-9-]+$/, {
    message: "ruleSetId must match th-pit-2568-* or th-pit-2569-* format.",
  });

export const semverVersionSchema = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, {
    message: "Version must be a valid semantic version string.",
  });

export const isoDateOrTimestampSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
    { message: "Must be a valid ISO date or date-time string (YYYY-MM-DD)." },
  );

export const nullableIsoDateSchema = z.union([
  isoDateOrTimestampSchema,
  z.null(),
]);

export const httpUrlSchema = z
  .string()
  .trim()
  .url({ message: "Source URL must be a valid absolute HTTP/HTTPS URL." })
  .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
    message: "Source URL must use http:// or https:// protocol.",
  });

export const nullableSourceUrlSchema = z.union([httpUrlSchema, z.null()]);

export const taxYearBESchema = z.union([
  z.literal(SUPPORTED_TAX_YEARS_BE[0]),
  z.literal(SUPPORTED_TAX_YEARS_BE[1]),
]);

export const taxRuleSetStatusSchema = z.enum(TAX_RULE_SET_STATUSES);
export const taxRuleSetValidationStatusSchema = z.enum(
  TAX_RULE_SET_VALIDATION_STATUSES,
);
export const calculationAvailabilitySchema = z.enum(CALCULATION_AVAILABILITIES);
export const taxRuleSourceTypeSchema = z.enum(TAX_RULE_SOURCE_TYPES);
export const evidenceLevelSchema = z.enum(EVIDENCE_LEVELS);
export const reviewerStatusSchema = z.enum(REVIEWER_STATUSES);
export const ruleFamilySchema = z.enum(RULE_FAMILIES);
export const taxCalculationScopeSchema = z.enum(TAX_CALCULATION_SCOPES);

export const ruleReferenceSchema = z.strictObject({
  sourceId: machineIdentifierSchema,
  section: z.string().trim().min(1).optional(),
  clause: z.string().trim().min(1).optional(),
});

export const taxRuleSourceSchema = z
  .strictObject({
    sourceId: machineIdentifierSchema,
    sourceType: taxRuleSourceTypeSchema,
    authority: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: nullableSourceUrlSchema,
    evidenceLevel: evidenceLevelSchema,
    reviewerStatus: reviewerStatusSchema,
    lastCheckedAt: nullableIsoDateSchema,
    notes: z.array(z.string().trim().min(1)),
  })
  .superRefine((source, context) => {
    if (
      source.evidenceLevel === "primary_official" &&
      source.reviewerStatus === "reviewed" &&
      source.url === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message:
          "A reviewed primary official source must include its official URL.",
      });
    }
  });

export const taxRuleChangelogEntrySchema = z.strictObject({
  version: semverVersionSchema,
  changedAt: isoDateOrTimestampSchema,
  author: z.string().trim().min(1),
  description: z.string().trim().min(1),
  references: z.array(ruleReferenceSchema),
});

export const taxRuleSetMetadataSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    taxYearBE: taxYearBESchema,
    taxYearCE: z.number().int(),
    ruleSetId: ruleSetIdSchema,
    version: semverVersionSchema,
    status: taxRuleSetStatusSchema,
    validationStatus: taxRuleSetValidationStatusSchema,
    notForCalculation: z.boolean(),
    effectiveFrom: nullableIsoDateSchema,
    effectiveTo: nullableIsoDateSchema,
    lastReviewedAt: nullableIsoDateSchema,
    lastReviewedBy: z.union([z.string().trim().min(1), z.null()]),
    scope: z.array(taxCalculationScopeSchema).min(1),
    disclaimer: z.string().trim().min(1),
    sources: z.array(taxRuleSourceSchema),
    changelog: z.array(taxRuleChangelogEntrySchema),
    canonicalChecksum: z.string().trim().min(1).optional(),
    notes: z.array(z.string().trim().min(1)),
  })
  .superRefine((metadata, context) => {
    if (!metadata.notForCalculation && metadata.status !== "published") {
      context.addIssue({
        code: "custom",
        path: ["notForCalculation"],
        message: "Only published rule sets can set notForCalculation to false.",
      });
    }

    if (
      metadata.status === "published" &&
      metadata.validationStatus !== "valid"
    ) {
      context.addIssue({
        code: "custom",
        path: ["validationStatus"],
        message: "A published rule set must have validationStatus = 'valid'.",
      });
    }
  });

export const ruleFamilyManifestSchema = z
  .strictObject({
    manifestId: machineIdentifierSchema,
    taxYearBE: taxYearBESchema,
    ruleSetId: ruleSetIdSchema,
    family: ruleFamilySchema,
    version: semverVersionSchema,
    status: taxRuleSetStatusSchema,
    effectiveFrom: nullableIsoDateSchema,
    effectiveTo: nullableIsoDateSchema,
    sources: z.array(taxRuleSourceSchema),
    applicabilityConditions: z.array(z.string().trim().min(1)),
    reviewerStatus: reviewerStatusSchema,
    notForCalculation: z.boolean(),
    exampleOnly: z.boolean().optional(),
    notes: z.array(z.string().trim().min(1)),
  })
  .superRefine((manifest, context) => {
    if (manifest.exampleOnly && !manifest.notForCalculation) {
      context.addIssue({
        code: "custom",
        path: ["notForCalculation"],
        message:
          "Structural sample fixtures must set notForCalculation to true.",
      });
    }
  });

export const taxRuleValidationIssueSchema = z.strictObject({
  issueCode: machineIdentifierSchema,
  path: z.array(z.string()),
  message: z.string().trim().min(1),
  severity: z.enum(["error", "warning"]),
});

export const ruleValidationResultSchema = z.strictObject({
  isValid: z.boolean(),
  validationStatus: taxRuleSetValidationStatusSchema,
  issues: z.array(taxRuleValidationIssueSchema),
});

export const calculationFeatureGateSchema = z.strictObject({
  summaryTotals: z.enum(["available", "unavailable_until_verified"]),
  taxEstimate: z.enum(["available", "unavailable_until_verified"]),
  pnd94Estimate: z.enum(["available", "unavailable_until_verified"]),
  pnd91Estimate: z.enum(["available", "unavailable_until_verified"]),
  taxRulePublication: z.enum(["available", "unavailable_until_reviewed"]),
});

export const taxRuleResolutionSchema = z.strictObject({
  availability: calculationAvailabilitySchema,
  metadata: z.union([taxRuleSetMetadataSchema, z.null()]),
  manifests: z.array(ruleFamilyManifestSchema),
  validation: ruleValidationResultSchema,
  featureGates: calculationFeatureGateSchema,
});

export const taxRuleSetSchema = z
  .strictObject({
    metadata: taxRuleSetMetadataSchema,
    manifests: z.array(ruleFamilyManifestSchema),
  })
  .superRefine((ruleSet, context) => {
    for (const manifest of ruleSet.manifests) {
      if (manifest.taxYearBE !== ruleSet.metadata.taxYearBE) {
        context.addIssue({
          code: "custom",
          path: ["manifests"],
          message: `Manifest taxYearBE (${manifest.taxYearBE}) does not match metadata taxYearBE (${ruleSet.metadata.taxYearBE}).`,
        });
      }
      if (manifest.ruleSetId !== ruleSet.metadata.ruleSetId) {
        context.addIssue({
          code: "custom",
          path: ["manifests"],
          message: `Manifest ruleSetId (${manifest.ruleSetId}) does not match metadata ruleSetId (${ruleSet.metadata.ruleSetId}).`,
        });
      }
    }
  });

export type ParsedTaxRuleSetMetadata = z.infer<typeof taxRuleSetMetadataSchema>;
export type ParsedRuleFamilyManifest = z.infer<typeof ruleFamilyManifestSchema>;
export type ParsedTaxRuleSet = z.infer<typeof taxRuleSetSchema>;
