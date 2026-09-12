import type { TaxCalculationScope, TaxRuleMetadata, TaxYearBE } from "../types";

export const TAX_CALCULATION_MODES = [
  "pnd94",
  "pnd91",
  "annual-estimate",
  "multi-income-estimate",
] as const;

export type TaxCalculationMode = (typeof TAX_CALCULATION_MODES)[number];

export interface TaxCalculationPeriod {
  readonly startDate: string;
  readonly endDate: string;
}

export interface TaxCalculationEntry {
  readonly id: string;
  readonly occurredOn: string;
  /** Integer satang, validated at the application boundary. */
  readonly amountSatang: number;
  readonly categoryCode: string;
  readonly note?: string;
}

export interface TaxCalculationInput {
  readonly taxYearBE: TaxYearBE;
  readonly mode: TaxCalculationMode;
  readonly period: TaxCalculationPeriod;
  readonly incomes: readonly TaxCalculationEntry[];
  readonly expenses: readonly TaxCalculationEntry[];
  readonly withholdings: readonly TaxCalculationEntry[];
  readonly allowances: readonly TaxCalculationEntry[];
  readonly assumptions: Readonly<Record<string, boolean>>;
}

export interface ExecutableTaxRuleMetadata extends Omit<
  TaxRuleMetadata,
  "status" | "verificationStatus" | "calculationEnabled" | "publicationBlocked"
> {
  readonly status: "approved" | "published";
  readonly verificationStatus: "verified";
  readonly calculationEnabled: true;
  readonly publicationBlocked: false;
}

/**
 * Deliberately opaque until professionally verified rule structures are added.
 * Placeholder bundles cannot satisfy this contract because they are disabled,
 * draft, and require verification.
 */
export interface ExecutableTaxRuleSet {
  readonly metadata: ExecutableTaxRuleMetadata;
  readonly compiledRules: Readonly<Record<string, unknown>>;
}

export interface TaxCalculationWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "blocking";
}

export interface TaxCalculationResult {
  readonly kind: "estimate";
  readonly taxYearBE: TaxYearBE;
  readonly ruleSetId: string;
  readonly ruleSetVersion: string;
  readonly scope: TaxCalculationScope;
  readonly assumptions: readonly string[];
  readonly warnings: readonly TaxCalculationWarning[];
  readonly output: Readonly<Record<string, unknown>>;
}

export interface TaxCalculationRequest {
  readonly input: TaxCalculationInput;
  readonly ruleSet: ExecutableTaxRuleSet;
}

export interface TaxCalculationEngine {
  calculate(request: TaxCalculationRequest): TaxCalculationResult;
}
