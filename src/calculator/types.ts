import type { MoneySatang } from "@/tax/money";
import type { TaxCalculationMode } from "@/tax/engine/contracts";

export const CALCULATOR_SCHEMA_VERSION = 2 as const;

export const CALCULATOR_PERSONAS = [
  "online_seller_business",
  "freelancer",
  "salaried_employee",
  "multiple_income",
  "unsure",
] as const;

export type CalculatorPersona = (typeof CALCULATOR_PERSONAS)[number];

export const ENTRY_FREQUENCIES = ["one_time", "monthly"] as const;
export type EntryFrequency = (typeof ENTRY_FREQUENCIES)[number];

export const INCOME_CATEGORY_CODES = [
  "salary",
  "bonus",
  "overtime",
  "commission",
  "online_sales",
  "store_sales",
  "business_income",
  "freelance_service",
  "professional_service",
  "creator_affiliate",
  "rental",
  "interest",
  "dividend",
  "investment",
  "royalty",
  "agriculture",
  "pension",
  "prize_grant",
  "other",
] as const;

export type IncomeCategoryCode = (typeof INCOME_CATEGORY_CODES)[number];

export const EXPENSE_CATEGORY_CODES = [
  "inventory",
  "shipping",
  "packaging",
  "platform_fee",
  "advertising",
  "transport",
  "utilities",
  "supplies",
  "other",
] as const;

export type ExpenseCategoryCode = (typeof EXPENSE_CATEGORY_CODES)[number];

export const EXPENSE_TAX_RELEVANCE_STATUSES = [
  "likely_related",
  "needs_review",
  "personal",
  "uncategorized",
] as const;

export type ExpenseTaxRelevanceStatus =
  (typeof EXPENSE_TAX_RELEVANCE_STATUSES)[number];

export const ALLOWANCE_DRAFT_CATEGORY_CODES = [
  "personal_draft",
  "family_draft",
  "insurance_draft",
  "savings_investment_draft",
  "donation_draft",
  "other",
] as const;

export type AllowanceDraftCategoryCode =
  (typeof ALLOWANCE_DRAFT_CATEGORY_CODES)[number];

export const SOCIAL_SECURITY_CALCULATION_MODES = [
  "none",
  "auto_m33",
  "manual",
] as const;

export type SocialSecurityCalculationMode =
  (typeof SOCIAL_SECURITY_CALCULATION_MODES)[number];

export type SocialSecuritySettings =
  | { readonly mode: "none" }
  | { readonly mode: "auto_m33" }
  | {
      readonly mode: "manual";
      readonly manualContributionSatang: MoneySatang;
    };

export interface BaseIncomeEntry {
  readonly id: string;
  readonly categoryCode: IncomeCategoryCode;
  readonly sourceName?: string | undefined;
  readonly amountSatang: MoneySatang;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OneTimeIncomeEntry extends BaseIncomeEntry {
  readonly entryFrequency: "one_time";
  readonly occurredOn: string;
  readonly occurredMonth: null;
}

export interface MonthlyIncomeEntry extends BaseIncomeEntry {
  readonly entryFrequency: "monthly";
  readonly occurredOn: null;
  readonly occurredMonth: string;
}

export type IncomeEntry = OneTimeIncomeEntry | MonthlyIncomeEntry;

export interface BaseExpenseEntry {
  readonly id: string;
  readonly categoryCode: ExpenseCategoryCode;
  readonly amountSatang: MoneySatang;
  readonly taxRelevanceStatus: ExpenseTaxRelevanceStatus;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OneTimeExpenseEntry extends BaseExpenseEntry {
  readonly entryFrequency: "one_time";
  readonly occurredOn: string;
  readonly occurredMonth: null;
}

export interface MonthlyExpenseEntry extends BaseExpenseEntry {
  readonly entryFrequency: "monthly";
  readonly occurredOn: null;
  readonly occurredMonth: string;
}

export type ExpenseEntry = OneTimeExpenseEntry | MonthlyExpenseEntry;

export interface BaseWithholdingEntry {
  readonly id: string;
  readonly payerName?: string | undefined;
  readonly certificateReference?: string | undefined;
  readonly amountSatang: MoneySatang;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OneTimeWithholdingEntry extends BaseWithholdingEntry {
  readonly entryFrequency: "one_time";
  readonly occurredOn: string;
  readonly occurredMonth: null;
}

export interface MonthlyWithholdingEntry extends BaseWithholdingEntry {
  readonly entryFrequency: "monthly";
  readonly occurredOn: null;
  readonly occurredMonth: string;
}

export type WithholdingEntry =
  OneTimeWithholdingEntry | MonthlyWithholdingEntry;

export interface AllowanceDraftEntry {
  readonly id: string;
  readonly categoryCode: AllowanceDraftCategoryCode;
  readonly declaredAmountSatang?: MoneySatang | undefined;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TaxRuleResolutionSnapshot {
  readonly taxYearBE: number;
  readonly ruleSetId: string | null;
  readonly ruleSetVersion: string | null;
  readonly availability: string;
  readonly status?: string | undefined;
  readonly resolvedAt: string;
}

export interface CalculatorWorkspace {
  readonly id: string;
  readonly schemaVersion: typeof CALCULATOR_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly taxYearBE: 2568 | 2569;
  readonly persona: CalculatorPersona;
  readonly calculationMode: TaxCalculationMode;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly reportName?: string | undefined;
  readonly incomeEntries: readonly IncomeEntry[];
  readonly expenseEntries: readonly ExpenseEntry[];
  readonly withholdingEntries: readonly WithholdingEntry[];
  readonly allowanceDraftEntries: readonly AllowanceDraftEntry[];
  readonly socialSecuritySettings: SocialSecuritySettings;
  readonly taxRuleResolutionSnapshot: TaxRuleResolutionSnapshot;
  readonly localOnly: true;
}

export interface CalculatorArithmeticTotals {
  readonly totalIncomeSatang: MoneySatang;
  readonly totalExpenseSatang: MoneySatang;
  readonly netBeforeTaxSatang: MoneySatang;
  readonly totalWithholdingSatang: MoneySatang;
  readonly totalDeclaredAllowanceSatang: MoneySatang;
}

export type CalculatorWarningSeverity = "info" | "warning";

export interface CalculatorWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: CalculatorWarningSeverity;
}

export interface CalculatorAssumption {
  readonly id: string;
  readonly message: string;
}

export interface CalculatorCompleteness {
  readonly score: number;
  readonly maxScore: number;
  readonly statusLabel: string;
  readonly description: string;
}

export interface MonthlyArithmeticBreakdownRow {
  readonly monthKey: string;
  readonly label: string;
  readonly incomeSatang: MoneySatang;
  readonly expenseSatang: MoneySatang;
  readonly netSatang: MoneySatang;
}
