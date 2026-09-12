export const SUPPORTED_TAX_YEARS_BE = [2568, 2569] as const;

export const RULE_SET_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "retired",
] as const;

export const RULE_VERIFICATION_STATUSES = [
  "requires_professional_verification",
  "verified",
] as const;

export const TAX_CALCULATION_SCOPES = [
  "personal-income-tax-estimate",
  "pnd91-estimate",
  "pnd94-estimate",
] as const;

export const RULE_SOURCE_STATUSES = [
  "source_required",
  "pending_review",
  "verified",
] as const;

export const PLACEHOLDER_RULE_SECTION_KEYS = [
  "taxBrackets",
  "incomeTypes",
  "expenseDeductions",
  "allowances",
  "pnd91",
  "pnd94",
] as const;

export type TaxYearBE = (typeof SUPPORTED_TAX_YEARS_BE)[number];
export type RuleSetStatus = (typeof RULE_SET_STATUSES)[number];
export type RuleVerificationStatus =
  (typeof RULE_VERIFICATION_STATUSES)[number];
export type TaxCalculationScope = (typeof TAX_CALCULATION_SCOPES)[number];
export type RuleSourceStatus = (typeof RULE_SOURCE_STATUSES)[number];
export type PlaceholderRuleSectionKey =
  (typeof PLACEHOLDER_RULE_SECTION_KEYS)[number];

export interface TaxRuleSourceMetadata {
  readonly sourceId: string;
  readonly authority: string;
  readonly title: string;
  readonly url: string | null;
  readonly status: RuleSourceStatus;
  readonly lastCheckedAt: string | null;
  readonly notes: readonly string[];
}

export interface TaxRuleMetadata {
  readonly schemaVersion: "1.0.0";
  readonly taxYearBE: TaxYearBE;
  readonly taxYearCE: number;
  readonly ruleSetId: string;
  readonly version: string;
  readonly status: RuleSetStatus;
  readonly verificationStatus: RuleVerificationStatus;
  readonly calculationEnabled: boolean;
  readonly publicationBlocked: boolean;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly lastReviewedAt: string | null;
  readonly reviewedBy: string | null;
  readonly scope: readonly TaxCalculationScope[];
  readonly disclaimer: string;
  readonly sources: readonly TaxRuleSourceMetadata[];
  readonly notes: readonly string[];
}

export interface PlaceholderTaxRuleMetadata extends Omit<
  TaxRuleMetadata,
  | "status"
  | "verificationStatus"
  | "calculationEnabled"
  | "publicationBlocked"
  | "effectiveFrom"
  | "effectiveTo"
  | "lastReviewedAt"
  | "reviewedBy"
> {
  readonly status: "draft";
  readonly verificationStatus: "requires_professional_verification";
  readonly calculationEnabled: false;
  readonly publicationBlocked: true;
  readonly effectiveFrom: null;
  readonly effectiveTo: null;
  readonly lastReviewedAt: null;
  readonly reviewedBy: null;
}

export type EmptyPlaceholderRuleSections = {
  readonly [Key in PlaceholderRuleSectionKey]: readonly never[];
};

export interface PlaceholderTaxRuleBundle {
  readonly schemaVersion: "1.0.0";
  readonly taxYearBE: TaxYearBE;
  readonly ruleSetId: string;
  readonly version: string;
  readonly status: "draft";
  readonly verificationStatus: "requires_professional_verification";
  readonly calculationEnabled: false;
  readonly requiresVerification: true;
  readonly sections: EmptyPlaceholderRuleSections;
  readonly notes: readonly string[];
}

export interface PlaceholderTaxRuleSet {
  readonly metadata: PlaceholderTaxRuleMetadata;
  readonly bundle: PlaceholderTaxRuleBundle;
}
