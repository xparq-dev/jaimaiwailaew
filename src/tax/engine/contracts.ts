import type { MoneySatang } from "../money";
import type {
  CalculationAvailability,
  CalculationFeatureGate,
  CalculationWarning,
  TaxCalculationScope,
  TaxRuleSetStatus,
  TaxRuleSource,
  TaxYearBE,
} from "../types";

export const TAX_CALCULATION_MODES = [
  "pnd94",
  "pnd91",
  "annual_estimate",
  "multi_income_estimate",
] as const;

export type TaxCalculationMode = (typeof TAX_CALCULATION_MODES)[number];

export interface TaxCalculationPeriod {
  readonly startDate: string;
  readonly endDate: string;
}

export interface TaxpayerContext {
  readonly maritalStatus: "single" | "married_joint" | "married_separate";
  readonly numberOfChildren?: number | undefined;
  readonly isDisabledOrElderlyCare?: boolean | undefined;
}

export interface TaxCalculationEntry {
  readonly id: string;
  readonly occurredOn: string;
  /** Integer satang value validated via MoneySatang utility. */
  readonly amountSatang: MoneySatang;
  readonly categoryCode: string;
  readonly note?: string | undefined;
}

export interface TaxCalculationInput {
  readonly taxYearBE: TaxYearBE;
  readonly mode: TaxCalculationMode;
  readonly period: TaxCalculationPeriod;
  readonly taxpayerContext?: TaxpayerContext | undefined;
  readonly incomes: readonly TaxCalculationEntry[];
  readonly expenses: readonly TaxCalculationEntry[];
  readonly withholdings: readonly TaxCalculationEntry[];
  readonly allowances: readonly TaxCalculationEntry[];
  readonly assumptions: Readonly<Record<string, boolean>>;
}

export interface CalculationTotalsStructure {
  /** Sum of total gross income in satang. */
  readonly grossIncomeSatang?: MoneySatang | undefined;
  /** Sum of recorded expenses in satang. */
  readonly totalExpensesSatang?: MoneySatang | undefined;
  /** Sum of recorded withholding tax in satang. */
  readonly totalWithholdingSatang?: MoneySatang | undefined;
  /** Sum of recorded allowances in satang. */
  readonly totalAllowancesSatang?: MoneySatang | undefined;
}

export interface TaxCalculationResult {
  readonly availability: CalculationAvailability;
  readonly taxYearBE: TaxYearBE;
  readonly ruleSetId: string;
  readonly ruleSetVersion: string;
  readonly ruleSetStatus: TaxRuleSetStatus;
  readonly scope: TaxCalculationScope;
  readonly sourceReferences: readonly TaxRuleSource[];
  readonly assumptions: readonly string[];
  readonly warnings: readonly CalculationWarning[];
  readonly trace: readonly string[];
  readonly featureGates: CalculationFeatureGate;
  /** Totals are undefined or contain basic totals only when available. Never contains taxDue/refund/finalTax. */
  readonly totals?: CalculationTotalsStructure | undefined;
}

/** Helper factory for deterministic unavailable tax calculation results (Safe-by-Default). */
export function createUnavailableTaxCalculationResult(params: {
  readonly taxYearBE: TaxYearBE;
  readonly availability: Exclude<CalculationAvailability, "available">;
  readonly reasonMessage: string;
  readonly ruleSetId?: string | undefined;
  readonly ruleSetVersion?: string | undefined;
  readonly ruleSetStatus?: TaxRuleSetStatus | undefined;
  readonly scope?: TaxCalculationScope | undefined;
}): TaxCalculationResult {
  return {
    availability: params.availability,
    taxYearBE: params.taxYearBE,
    ruleSetId: params.ruleSetId ?? `th-pit-${params.taxYearBE}-unverified`,
    ruleSetVersion: params.ruleSetVersion ?? "0.0.0-unverified",
    ruleSetStatus: params.ruleSetStatus ?? "unverified",
    scope: params.scope ?? "personal-income-tax-estimate",
    sourceReferences: [],
    assumptions: [
      "Tax rules for this year are unverified or blocked. Calculations cannot be performed.",
    ],
    warnings: [
      {
        code: params.availability,
        message: params.reasonMessage,
        severity: "blocking",
      },
    ],
    trace: [
      `Resolution returned ${params.availability}: ${params.reasonMessage}`,
    ],
    featureGates: {
      summaryTotals: "available",
      taxEstimate: "unavailable_until_verified",
      pnd94Estimate: "unavailable_until_verified",
      pnd91Estimate: "unavailable_until_verified",
      taxRulePublication: "unavailable_until_reviewed",
    },
  };
}
