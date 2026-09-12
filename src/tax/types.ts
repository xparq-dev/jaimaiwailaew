export const SUPPORTED_TAX_YEARS_BE = [2568, 2569] as const;
export type TaxYearBE = (typeof SUPPORTED_TAX_YEARS_BE)[number];

export const TAX_RULE_SET_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "retired",
  "unverified",
] as const;
export type TaxRuleSetStatus = (typeof TAX_RULE_SET_STATUSES)[number];

export const TAX_RULE_SET_VALIDATION_STATUSES = [
  "valid",
  "invalid",
  "unverified",
  "blocked",
] as const;
export type TaxRuleSetValidationStatus =
  (typeof TAX_RULE_SET_VALIDATION_STATUSES)[number];

export const CALCULATION_AVAILABILITIES = [
  "available",
  "unavailable_unverified_rules",
  "unavailable_unknown_tax_year",
  "unavailable_invalid_rules",
  "unavailable_policy_blocked",
] as const;
export type CalculationAvailability =
  (typeof CALCULATION_AVAILABILITIES)[number];

export const TAX_RULE_SOURCE_TYPES = [
  "official_webpage",
  "official_pdf",
  "official_form",
  "official_announcement",
  "official_law",
  "local_verified_copy",
  "other",
] as const;
export type TaxRuleSourceType = (typeof TAX_RULE_SOURCE_TYPES)[number];

export const EVIDENCE_LEVELS = [
  "primary_official",
  "secondary_official",
  "professional_review",
  "unverified",
] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const REVIEWER_STATUSES = [
  "not_reviewed",
  "under_review",
  "reviewed",
  "rejected",
] as const;
export type ReviewerStatus = (typeof REVIEWER_STATUSES)[number];

export const RULE_FAMILIES = [
  "tax_brackets",
  "income_types",
  "expense_deduction_rules",
  "allowance_rules",
  "withholding_tax_rules",
  "filing_rules",
  "pnd94_rules",
  "pnd91_rules",
  "validation_rules",
  "disclaimer_rules",
] as const;
export type RuleFamily = (typeof RULE_FAMILIES)[number];

export const TAX_CALCULATION_SCOPES = [
  "personal-income-tax-estimate",
  "pnd91-estimate",
  "pnd94-estimate",
] as const;
export type TaxCalculationScope = (typeof TAX_CALCULATION_SCOPES)[number];

export interface RuleReference {
  readonly sourceId: string;
  readonly section?: string | undefined;
  readonly clause?: string | undefined;
}

export interface TaxRuleSource {
  readonly sourceId: string;
  readonly sourceType: TaxRuleSourceType;
  readonly authority: string;
  readonly title: string;
  readonly url: string | null;
  readonly evidenceLevel: EvidenceLevel;
  readonly reviewerStatus: ReviewerStatus;
  readonly lastCheckedAt: string | null;
  readonly notes: readonly string[];
}

export interface TaxRuleChangelogEntry {
  readonly version: string;
  readonly changedAt: string;
  readonly author: string;
  readonly description: string;
  readonly references: readonly RuleReference[];
}

export interface TaxRuleSetMetadata {
  readonly schemaVersion: "1.0.0";
  readonly taxYearBE: TaxYearBE;
  readonly taxYearCE: number;
  readonly ruleSetId: string;
  readonly version: string;
  readonly status: TaxRuleSetStatus;
  readonly validationStatus: TaxRuleSetValidationStatus;
  readonly notForCalculation: boolean;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly lastReviewedAt: string | null;
  readonly lastReviewedBy: string | null;
  readonly scope: readonly TaxCalculationScope[];
  readonly disclaimer: string;
  readonly sources: readonly TaxRuleSource[];
  readonly changelog: readonly TaxRuleChangelogEntry[];
  readonly canonicalChecksum?: string | undefined;
  readonly notes: readonly string[];
}

export interface RuleFamilyManifest {
  readonly manifestId: string;
  readonly taxYearBE: TaxYearBE;
  readonly ruleSetId: string;
  readonly family: RuleFamily;
  readonly version: string;
  readonly status: TaxRuleSetStatus;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly sources: readonly TaxRuleSource[];
  readonly applicabilityConditions: readonly string[];
  readonly reviewerStatus: ReviewerStatus;
  readonly notForCalculation: boolean;
  readonly exampleOnly?: boolean | undefined;
  readonly notes: readonly string[];
}

export interface TaxRuleValidationIssue {
  readonly issueCode: string;
  readonly path: readonly string[];
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface RuleValidationResult {
  readonly isValid: boolean;
  readonly validationStatus: TaxRuleSetValidationStatus;
  readonly issues: readonly TaxRuleValidationIssue[];
}

export interface TaxRuleResolution {
  readonly availability: CalculationAvailability;
  readonly metadata: TaxRuleSetMetadata | null;
  readonly manifests: readonly RuleFamilyManifest[];
  readonly validation: RuleValidationResult;
  readonly featureGates: CalculationFeatureGate;
}

export interface CalculationAssumption {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly value: boolean | string | number;
  readonly description: string;
}

export interface CalculationWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "blocking";
}

export interface CalculationTrace {
  readonly stepId: string;
  readonly description: string;
  readonly timestamp: string;
}

export interface CalculationFeatureGate {
  readonly summaryTotals: "available" | "unavailable_until_verified";
  readonly taxEstimate: "available" | "unavailable_until_verified";
  readonly pnd94Estimate: "available" | "unavailable_until_verified";
  readonly pnd91Estimate: "available" | "unavailable_until_verified";
  readonly taxRulePublication: "available" | "unavailable_until_reviewed";
}

export interface TaxRuleSet {
  readonly metadata: TaxRuleSetMetadata;
  readonly manifests: readonly RuleFamilyManifest[];
}
