import { resolveTaxRules } from "@/tax/engine/taxRuleResolver";
import type { TaxCalculationMode } from "@/tax/engine/contracts";

import {
  CALCULATOR_SCHEMA_VERSION,
  type AllowanceDraftEntry,
  type CalculatorPersona,
  type CalculatorWorkspace,
  type ExpenseEntry,
  type IncomeEntry,
  type WithholdingEntry,
} from "./types";
import {
  createLocalId,
  getEntryChronologicalSortKey,
  nowIsoTimestamp,
  taxYearPeriodDefaults,
} from "./utils";

export interface CreateWorkspaceInput {
  readonly persona: CalculatorPersona;
  readonly taxYearBE: 2568 | 2569;
  readonly calculationMode: TaxCalculationMode;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly reportName?: string | undefined;
}

export function createTaxRuleResolutionSnapshot(taxYearBE: 2568 | 2569) {
  const resolution = resolveTaxRules({ taxYearBE });
  return {
    taxYearBE,
    ruleSetId: resolution.metadata?.ruleSetId ?? null,
    ruleSetVersion: resolution.metadata?.version ?? null,
    availability: resolution.availability,
    status: resolution.metadata?.status ?? "unverified",
    resolvedAt: nowIsoTimestamp(),
  };
}

export function createCalculatorWorkspace(
  input: CreateWorkspaceInput,
): CalculatorWorkspace {
  const timestamp = nowIsoTimestamp();

  return {
    id: createLocalId(),
    schemaVersion: CALCULATOR_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    taxYearBE: input.taxYearBE,
    persona: input.persona,
    calculationMode: input.calculationMode,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    reportName: input.reportName,
    incomeEntries: [],
    expenseEntries: [],
    withholdingEntries: [],
    allowanceDraftEntries: [],
    socialSecuritySettings:
      input.persona === "salaried_employee"
        ? { mode: "auto_m33" }
        : { mode: "none" },
    taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(input.taxYearBE),
    localOnly: true,
  };
}

export function getDefaultWorkspaceInput(
  persona: CalculatorPersona,
  taxYearBE: 2568 | 2569,
  periodChoice: "first_half" | "full_year" = "first_half",
): CreateWorkspaceInput {
  const periods = taxYearPeriodDefaults(taxYearBE);

  switch (persona) {
    case "online_seller_business":
      return {
        persona,
        taxYearBE,
        calculationMode: "pnd94",
        periodStart: periods.firstHalfStart,
        periodEnd: periods.firstHalfEnd,
      };
    case "freelancer":
      return {
        persona,
        taxYearBE,
        calculationMode:
          periodChoice === "full_year" ? "annual_estimate" : "pnd94",
        periodStart:
          periodChoice === "full_year"
            ? periods.fullYearStart
            : periods.firstHalfStart,
        periodEnd:
          periodChoice === "full_year"
            ? periods.fullYearEnd
            : periods.firstHalfEnd,
      };
    case "salaried_employee":
      return {
        persona,
        taxYearBE,
        calculationMode: "pnd91",
        periodStart: periods.fullYearStart,
        periodEnd: periods.fullYearEnd,
      };
    case "multiple_income":
      return {
        persona,
        taxYearBE,
        calculationMode: "multi_income_estimate",
        periodStart:
          periodChoice === "full_year"
            ? periods.fullYearStart
            : periods.firstHalfStart,
        periodEnd:
          periodChoice === "full_year"
            ? periods.fullYearEnd
            : periods.firstHalfEnd,
      };
    case "unsure":
      return {
        persona,
        taxYearBE,
        calculationMode: "annual_estimate",
        periodStart: periods.fullYearStart,
        periodEnd: periods.fullYearEnd,
      };
  }
}

export function touchWorkspace(
  workspace: CalculatorWorkspace,
  patch: Partial<
    Pick<
      CalculatorWorkspace,
      | "incomeEntries"
      | "expenseEntries"
      | "withholdingEntries"
      | "allowanceDraftEntries"
      | "socialSecuritySettings"
      | "periodStart"
      | "periodEnd"
      | "calculationMode"
      | "reportName"
      | "persona"
      | "taxYearBE"
    >
  >,
): CalculatorWorkspace {
  return {
    ...workspace,
    ...patch,
    updatedAt: nowIsoTimestamp(),
    taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
      patch.taxYearBE ?? workspace.taxYearBE,
    ),
  };
}

export function sortEntriesByDateDesc<
  T extends {
    readonly entryFrequency: "one_time" | "monthly";
    readonly occurredOn: string | null;
    readonly occurredMonth: string | null;
  },
>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    const keyA = getEntryChronologicalSortKey(a);
    const keyB = getEntryChronologicalSortKey(b);
    return keyA < keyB ? 1 : keyA > keyB ? -1 : 0;
  });
}

export type EntryCollectionKey =
  | "incomeEntries"
  | "expenseEntries"
  | "withholdingEntries"
  | "allowanceDraftEntries";

export type WorkspaceEntry =
  IncomeEntry | ExpenseEntry | WithholdingEntry | AllowanceDraftEntry;
