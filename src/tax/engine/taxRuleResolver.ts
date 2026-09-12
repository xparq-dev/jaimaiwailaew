import meta2568 from "../rules/2568/meta.json";
import manifests2568 from "../rules/2568/manifest.json";
import meta2569 from "../rules/2569/meta.json";
import manifests2569 from "../rules/2569/manifest.json";
import { ruleFamilyManifestSchema, taxRuleSetMetadataSchema } from "../schemas";
import type {
  CalculationFeatureGate,
  RuleFamilyManifest,
  RuleValidationResult,
  TaxRuleResolution,
  TaxRuleSetMetadata,
} from "../types";

export interface ResolveTaxRuleOptions {
  readonly taxYearBE: number;
  readonly ruleSetId?: string;
}

const LOCAL_RULE_REGISTRY: Record<
  number,
  { metadata: unknown; manifests: unknown }
> = {
  2568: { metadata: meta2568, manifests: manifests2568 },
  2569: { metadata: meta2569, manifests: manifests2569 },
};

export function getUnavailableFeatureGates(): CalculationFeatureGate {
  return {
    summaryTotals: "available",
    taxEstimate: "unavailable_until_verified",
    pnd94Estimate: "unavailable_until_verified",
    pnd91Estimate: "unavailable_until_verified",
    taxRulePublication: "unavailable_until_reviewed",
  };
}

export function resolveTaxRules(
  options: ResolveTaxRuleOptions,
): TaxRuleResolution {
  const { taxYearBE, ruleSetId } = options;

  const rawEntry = LOCAL_RULE_REGISTRY[taxYearBE];
  if (!rawEntry) {
    return {
      availability: "unavailable_unknown_tax_year",
      metadata: null,
      manifests: [],
      validation: {
        isValid: false,
        validationStatus: "blocked",
        issues: [
          {
            issueCode: "unknown-tax-year",
            path: ["taxYearBE"],
            message: `Tax year BE ${taxYearBE} is not supported by the Tax Rule Engine.`,
            severity: "error",
          },
        ],
      },
      featureGates: getUnavailableFeatureGates(),
    };
  }

  // Validate metadata schema
  const metadataResult = taxRuleSetMetadataSchema.safeParse(rawEntry.metadata);
  if (!metadataResult.success) {
    return {
      availability: "unavailable_invalid_rules",
      metadata: null,
      manifests: [],
      validation: {
        isValid: false,
        validationStatus: "invalid",
        issues: metadataResult.error.issues.map((issue) => ({
          issueCode: "invalid-metadata-schema",
          path: issue.path.map(String),
          message: issue.message,
          severity: "error",
        })),
      },
      featureGates: getUnavailableFeatureGates(),
    };
  }

  const metadata: TaxRuleSetMetadata = metadataResult.data;

  // If a specific ruleSetId was requested, verify it matches
  if (ruleSetId && metadata.ruleSetId !== ruleSetId) {
    return {
      availability: "unavailable_invalid_rules",
      metadata: null,
      manifests: [],
      validation: {
        isValid: false,
        validationStatus: "invalid",
        issues: [
          {
            issueCode: "rule-set-id-mismatch",
            path: ["ruleSetId"],
            message: `Requested ruleSetId "${ruleSetId}" does not match found ruleSetId "${metadata.ruleSetId}".`,
            severity: "error",
          },
        ],
      },
      featureGates: getUnavailableFeatureGates(),
    };
  }

  // Validate manifests schema
  const manifestsArray = Array.isArray(rawEntry.manifests)
    ? rawEntry.manifests
    : [];
  const parsedManifests: RuleFamilyManifest[] = [];
  const validationIssues = [];

  for (let i = 0; i < manifestsArray.length; i++) {
    const parseRes = ruleFamilyManifestSchema.safeParse(manifestsArray[i]);
    if (parseRes.success) {
      // Exclude exampleOnly fixtures from being resolved for calculation
      if (!parseRes.data.exampleOnly) {
        parsedManifests.push(parseRes.data);
      }
    } else {
      for (const issue of parseRes.error.issues) {
        validationIssues.push({
          issueCode: "invalid-manifest-schema",
          path: [`manifests[${i}]`, ...issue.path.map(String)],
          message: issue.message,
          severity: "error" as const,
        });
      }
    }
  }

  if (validationIssues.length > 0) {
    return {
      availability: "unavailable_invalid_rules",
      metadata,
      manifests: parsedManifests,
      validation: {
        isValid: false,
        validationStatus: "invalid",
        issues: validationIssues,
      },
      featureGates: getUnavailableFeatureGates(),
    };
  }

  const validation: RuleValidationResult = {
    isValid: metadata.validationStatus === "valid",
    validationStatus: metadata.validationStatus,
    issues: [],
  };

  // Fail-closed policy check: unverified or notForCalculation or publicationBlocked
  if (
    metadata.status === "unverified" ||
    metadata.status === "draft" ||
    metadata.validationStatus === "unverified" ||
    metadata.notForCalculation
  ) {
    return {
      availability: "unavailable_unverified_rules",
      metadata,
      manifests: parsedManifests,
      validation,
      featureGates: getUnavailableFeatureGates(),
    };
  }

  if (
    metadata.status === "retired" ||
    metadata.validationStatus === "blocked"
  ) {
    return {
      availability: "unavailable_policy_blocked",
      metadata,
      manifests: parsedManifests,
      validation,
      featureGates: getUnavailableFeatureGates(),
    };
  }

  // If published and valid
  return {
    availability: "available",
    metadata,
    manifests: parsedManifests,
    validation,
    featureGates: {
      summaryTotals: "available",
      taxEstimate: "available",
      pnd94Estimate: "available",
      pnd91Estimate: "available",
      taxRulePublication: "available",
    },
  };
}
