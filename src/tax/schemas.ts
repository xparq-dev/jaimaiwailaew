import { z } from "zod";

import {
  RULE_SET_STATUSES,
  RULE_SOURCE_STATUSES,
  RULE_VERIFICATION_STATUSES,
  TAX_CALCULATION_SCOPES,
} from "./types";

const nonEmptyTextSchema = z.string().trim().min(1);
const nullableIsoDateSchema = z.union([z.iso.date(), z.null()]);

export const taxYearBESchema = z.union([z.literal(2568), z.literal(2569)]);

export const ruleSetStatusSchema = z.enum(RULE_SET_STATUSES);
export const ruleVerificationStatusSchema = z.enum(RULE_VERIFICATION_STATUSES);
export const taxCalculationScopeSchema = z.enum(TAX_CALCULATION_SCOPES);
export const ruleSourceStatusSchema = z.enum(RULE_SOURCE_STATUSES);

export const moneySatangSchema = z.number().int().nonnegative().finite();

export const taxRuleSourceMetadataSchema = z
  .strictObject({
    sourceId: nonEmptyTextSchema,
    authority: nonEmptyTextSchema,
    title: nonEmptyTextSchema,
    url: z.union([z.url(), z.null()]),
    status: ruleSourceStatusSchema,
    lastCheckedAt: nullableIsoDateSchema,
    notes: z.array(nonEmptyTextSchema),
  })
  .superRefine((source, context) => {
    if (source.status === "verified" && source.url === null) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "A verified source must include its official URL.",
      });
    }

    if (source.status === "verified" && source.lastCheckedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["lastCheckedAt"],
        message: "A verified source must include the date it was checked.",
      });
    }
  });

const taxRuleMetadataShape = {
  schemaVersion: z.literal("1.0.0"),
  taxYearBE: taxYearBESchema,
  taxYearCE: z.number().int(),
  ruleSetId: z.string().regex(/^th-pit-25(?:68|69)-[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  status: ruleSetStatusSchema,
  verificationStatus: ruleVerificationStatusSchema,
  calculationEnabled: z.boolean(),
  publicationBlocked: z.boolean(),
  effectiveFrom: nullableIsoDateSchema,
  effectiveTo: nullableIsoDateSchema,
  lastReviewedAt: nullableIsoDateSchema,
  reviewedBy: z.union([nonEmptyTextSchema, z.null()]),
  scope: z.array(taxCalculationScopeSchema).min(1),
  disclaimer: nonEmptyTextSchema,
  sources: z.array(taxRuleSourceMetadataSchema).min(1),
  notes: z.array(nonEmptyTextSchema).min(1),
} as const;

export const taxRuleMetadataSchema = z
  .strictObject(taxRuleMetadataShape)
  .superRefine((metadata, context) => {
    const isVerified = metadata.verificationStatus === "verified";

    if (metadata.calculationEnabled && !isVerified) {
      context.addIssue({
        code: "custom",
        path: ["calculationEnabled"],
        message: "Unverified tax rules cannot be enabled for calculation.",
      });
    }

    if (metadata.status === "published" && !isVerified) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Unverified tax rules cannot be published.",
      });
    }

    if (metadata.status === "published" && metadata.publicationBlocked) {
      context.addIssue({
        code: "custom",
        path: ["publicationBlocked"],
        message: "A published tax rule set cannot remain publication-blocked.",
      });
    }
  });

export const placeholderTaxRuleMetadataSchema = z.strictObject({
  ...taxRuleMetadataShape,
  status: z.literal("draft"),
  verificationStatus: z.literal("requires_professional_verification"),
  calculationEnabled: z.literal(false),
  publicationBlocked: z.literal(true),
  effectiveFrom: z.null(),
  effectiveTo: z.null(),
  lastReviewedAt: z.null(),
  reviewedBy: z.null(),
});

const emptyPlaceholderSectionSchema = z.array(z.never()).length(0);

export const placeholderTaxRuleBundleSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  taxYearBE: taxYearBESchema,
  ruleSetId: z.string().regex(/^th-pit-25(?:68|69)-[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  status: z.literal("draft"),
  verificationStatus: z.literal("requires_professional_verification"),
  calculationEnabled: z.literal(false),
  requiresVerification: z.literal(true),
  sections: z.strictObject({
    taxBrackets: emptyPlaceholderSectionSchema,
    incomeTypes: emptyPlaceholderSectionSchema,
    expenseDeductions: emptyPlaceholderSectionSchema,
    allowances: emptyPlaceholderSectionSchema,
    pnd91: emptyPlaceholderSectionSchema,
    pnd94: emptyPlaceholderSectionSchema,
  }),
  notes: z.array(nonEmptyTextSchema).min(1),
});

export const placeholderTaxRuleSetSchema = z
  .strictObject({
    metadata: placeholderTaxRuleMetadataSchema,
    bundle: placeholderTaxRuleBundleSchema,
  })
  .superRefine((ruleSet, context) => {
    const identityFields = ["taxYearBE", "ruleSetId", "version"] as const;

    for (const field of identityFields) {
      if (ruleSet.metadata[field] !== ruleSet.bundle[field]) {
        context.addIssue({
          code: "custom",
          path: ["bundle", field],
          message: `Bundle ${field} must match its metadata.`,
        });
      }
    }
  });

export type ParsedTaxRuleMetadata = z.infer<typeof taxRuleMetadataSchema>;
export type ParsedPlaceholderTaxRuleMetadata = z.infer<
  typeof placeholderTaxRuleMetadataSchema
>;
export type ParsedPlaceholderTaxRuleBundle = z.infer<
  typeof placeholderTaxRuleBundleSchema
>;
export type ParsedPlaceholderTaxRuleSet = z.infer<
  typeof placeholderTaxRuleSetSchema
>;
