"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { decimalStringToSatang } from "@/tax/money";

import {
  allowanceDraftEntryFormSchema,
  CALCULATOR_STORAGE_KEY,
  expenseEntryFormSchema,
  incomeEntryFormSchema,
  persistedCalculatorStateSchema,
  withholdingEntryFormSchema,
  type AllowanceDraftEntryFormValues,
  type ExpenseEntryFormValues,
  type IncomeEntryFormValues,
  type WithholdingEntryFormValues,
} from "./schemas";
import type {
  AllowanceDraftEntry,
  CalculatorWorkspace,
  ExpenseEntry,
  IncomeEntry,
  WithholdingEntry,
} from "./types";
import {
  createCalculatorWorkspace,
  createTaxRuleResolutionSnapshot,
  getDefaultWorkspaceInput,
  touchWorkspace,
  type CreateWorkspaceInput,
} from "./workspace";
import { createLocalId, nowIsoTimestamp, sanitizeNote } from "./utils";

interface CalculatorStoreState {
  workspace: CalculatorWorkspace | null;
  lastSavedAt: string | null;
  hydrationComplete: boolean;
  persistError: string | null;
  initializeWorkspace: (input: CreateWorkspaceInput, replace?: boolean) => void;
  replaceWorkspace: (input: CreateWorkspaceInput) => void;
  clearLocalData: () => void;
  dismissPersistError: () => void;
  addIncomeEntry: (values: IncomeEntryFormValues) => string | null;
  updateIncomeEntry: (
    id: string,
    values: IncomeEntryFormValues,
  ) => string | null;
  deleteIncomeEntry: (id: string) => void;
  addExpenseEntry: (values: ExpenseEntryFormValues) => string | null;
  updateExpenseEntry: (
    id: string,
    values: ExpenseEntryFormValues,
  ) => string | null;
  deleteExpenseEntry: (id: string) => void;
  addWithholdingEntry: (values: WithholdingEntryFormValues) => string | null;
  updateWithholdingEntry: (
    id: string,
    values: WithholdingEntryFormValues,
  ) => string | null;
  deleteWithholdingEntry: (id: string) => void;
  addAllowanceDraftEntry: (
    values: AllowanceDraftEntryFormValues,
  ) => string | null;
  updateAllowanceDraftEntry: (
    id: string,
    values: AllowanceDraftEntryFormValues,
  ) => string | null;
  deleteAllowanceDraftEntry: (id: string) => void;
}

function parseMoneyAmount(amount: string) {
  return decimalStringToSatang(amount, {
    roundingPolicy: "round",
    allowNegative: false,
  });
}

function buildIncomeEntry(values: IncomeEntryFormValues): IncomeEntry {
  const timestamp = nowIsoTimestamp();
  return {
    id: createLocalId(),
    occurredOn: values.occurredOn,
    categoryCode: values.categoryCode,
    sourceName: values.sourceName?.trim() || undefined,
    amountSatang: parseMoneyAmount(values.amount),
    note: sanitizeNote(values.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildExpenseEntry(values: ExpenseEntryFormValues): ExpenseEntry {
  const timestamp = nowIsoTimestamp();
  return {
    id: createLocalId(),
    occurredOn: values.occurredOn,
    categoryCode: values.categoryCode,
    amountSatang: parseMoneyAmount(values.amount),
    taxRelevanceStatus: values.taxRelevanceStatus,
    note: sanitizeNote(values.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildWithholdingEntry(
  values: WithholdingEntryFormValues,
): WithholdingEntry {
  const timestamp = nowIsoTimestamp();
  return {
    id: createLocalId(),
    occurredOn: values.occurredOn,
    payerName: values.payerName?.trim() || undefined,
    certificateReference: values.certificateReference?.trim() || undefined,
    amountSatang: parseMoneyAmount(values.amount),
    note: sanitizeNote(values.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildAllowanceDraftEntry(
  values: AllowanceDraftEntryFormValues,
): AllowanceDraftEntry {
  const timestamp = nowIsoTimestamp();
  return {
    id: createLocalId(),
    categoryCode: values.categoryCode,
    declaredAmountSatang:
      values.amount && values.amount.length > 0
        ? parseMoneyAmount(values.amount)
        : undefined,
    note: sanitizeNote(values.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function updateEntryTimestamp<T extends { updatedAt: string }>(entry: T): T {
  return {
    ...entry,
    updatedAt: nowIsoTimestamp(),
  };
}

export const useCalculatorStore = create<CalculatorStoreState>()(
  persist(
    (set, get) => ({
      workspace: null,
      lastSavedAt: null,
      hydrationComplete: false,
      persistError: null,

      initializeWorkspace: (input, replace = false) => {
        const current = get().workspace;
        if (current && !replace) {
          return;
        }

        set({
          workspace: createCalculatorWorkspace(input),
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
      },

      replaceWorkspace: (input) => {
        set({
          workspace: createCalculatorWorkspace(input),
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
      },

      clearLocalData: () => {
        set({
          workspace: null,
          lastSavedAt: null,
          persistError: null,
        });
      },

      dismissPersistError: () => {
        set({ persistError: null });
      },

      addIncomeEntry: (values) => {
        const parsed = incomeEntryFormSchema.safeParse(values);
        if (!parsed.success || !get().workspace) {
          return parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? null);
        }

        const entry = buildIncomeEntry(parsed.data);
        set((state) => ({
          workspace: state.workspace
            ? touchWorkspace(state.workspace, {
                incomeEntries: [...state.workspace.incomeEntries, entry],
              })
            : null,
          lastSavedAt: nowIsoTimestamp(),
        }));
        return null;
      },

      updateIncomeEntry: (id, values) => {
        const parsed = incomeEntryFormSchema.safeParse(values);
        const workspace = get().workspace;
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        }
        if (!workspace) {
          return "ยังไม่มี workspace";
        }

        set({
          workspace: touchWorkspace(workspace, {
            incomeEntries: workspace.incomeEntries.map((entry) =>
              entry.id === id
                ? updateEntryTimestamp({
                    ...entry,
                    occurredOn: parsed.data.occurredOn,
                    categoryCode: parsed.data.categoryCode,
                    sourceName: parsed.data.sourceName?.trim() || undefined,
                    amountSatang: parseMoneyAmount(parsed.data.amount),
                    note: sanitizeNote(parsed.data.note),
                  })
                : entry,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
        return null;
      },

      deleteIncomeEntry: (id) => {
        const workspace = get().workspace;
        if (!workspace) {
          return;
        }

        set({
          workspace: touchWorkspace(workspace, {
            incomeEntries: workspace.incomeEntries.filter(
              (entry) => entry.id !== id,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
      },

      addExpenseEntry: (values) => {
        const parsed = expenseEntryFormSchema.safeParse(values);
        if (!parsed.success || !get().workspace) {
          return parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? null);
        }

        const entry = buildExpenseEntry(parsed.data);
        set((state) => ({
          workspace: state.workspace
            ? touchWorkspace(state.workspace, {
                expenseEntries: [...state.workspace.expenseEntries, entry],
              })
            : null,
          lastSavedAt: nowIsoTimestamp(),
        }));
        return null;
      },

      updateExpenseEntry: (id, values) => {
        const parsed = expenseEntryFormSchema.safeParse(values);
        const workspace = get().workspace;
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        }
        if (!workspace) {
          return "ยังไม่มี workspace";
        }

        set({
          workspace: touchWorkspace(workspace, {
            expenseEntries: workspace.expenseEntries.map((entry) =>
              entry.id === id
                ? updateEntryTimestamp({
                    ...entry,
                    occurredOn: parsed.data.occurredOn,
                    categoryCode: parsed.data.categoryCode,
                    amountSatang: parseMoneyAmount(parsed.data.amount),
                    taxRelevanceStatus: parsed.data.taxRelevanceStatus,
                    note: sanitizeNote(parsed.data.note),
                  })
                : entry,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
        return null;
      },

      deleteExpenseEntry: (id) => {
        const workspace = get().workspace;
        if (!workspace) {
          return;
        }

        set({
          workspace: touchWorkspace(workspace, {
            expenseEntries: workspace.expenseEntries.filter(
              (entry) => entry.id !== id,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
      },

      addWithholdingEntry: (values) => {
        const parsed = withholdingEntryFormSchema.safeParse(values);
        if (!parsed.success || !get().workspace) {
          return parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? null);
        }

        const entry = buildWithholdingEntry(parsed.data);
        set((state) => ({
          workspace: state.workspace
            ? touchWorkspace(state.workspace, {
                withholdingEntries: [
                  ...state.workspace.withholdingEntries,
                  entry,
                ],
              })
            : null,
          lastSavedAt: nowIsoTimestamp(),
        }));
        return null;
      },

      updateWithholdingEntry: (id, values) => {
        const parsed = withholdingEntryFormSchema.safeParse(values);
        const workspace = get().workspace;
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        }
        if (!workspace) {
          return "ยังไม่มี workspace";
        }

        set({
          workspace: touchWorkspace(workspace, {
            withholdingEntries: workspace.withholdingEntries.map((entry) =>
              entry.id === id
                ? updateEntryTimestamp({
                    ...entry,
                    occurredOn: parsed.data.occurredOn,
                    payerName: parsed.data.payerName?.trim() || undefined,
                    certificateReference:
                      parsed.data.certificateReference?.trim() || undefined,
                    amountSatang: parseMoneyAmount(parsed.data.amount),
                    note: sanitizeNote(parsed.data.note),
                  })
                : entry,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
        return null;
      },

      deleteWithholdingEntry: (id) => {
        const workspace = get().workspace;
        if (!workspace) {
          return;
        }

        set({
          workspace: touchWorkspace(workspace, {
            withholdingEntries: workspace.withholdingEntries.filter(
              (entry) => entry.id !== id,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
      },

      addAllowanceDraftEntry: (values) => {
        const parsed = allowanceDraftEntryFormSchema.safeParse(values);
        if (!parsed.success || !get().workspace) {
          return parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? null);
        }

        const entry = buildAllowanceDraftEntry(parsed.data);
        set((state) => ({
          workspace: state.workspace
            ? touchWorkspace(state.workspace, {
                allowanceDraftEntries: [
                  ...state.workspace.allowanceDraftEntries,
                  entry,
                ],
              })
            : null,
          lastSavedAt: nowIsoTimestamp(),
        }));
        return null;
      },

      updateAllowanceDraftEntry: (id, values) => {
        const parsed = allowanceDraftEntryFormSchema.safeParse(values);
        const workspace = get().workspace;
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        }
        if (!workspace) {
          return "ยังไม่มี workspace";
        }

        set({
          workspace: touchWorkspace(workspace, {
            allowanceDraftEntries: workspace.allowanceDraftEntries.map(
              (entry) =>
                entry.id === id
                  ? updateEntryTimestamp({
                      ...entry,
                      categoryCode: parsed.data.categoryCode,
                      declaredAmountSatang:
                        parsed.data.amount && parsed.data.amount.length > 0
                          ? parseMoneyAmount(parsed.data.amount)
                          : undefined,
                      note: sanitizeNote(parsed.data.note),
                    })
                  : entry,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
        return null;
      },

      deleteAllowanceDraftEntry: (id) => {
        const workspace = get().workspace;
        if (!workspace) {
          return;
        }

        set({
          workspace: touchWorkspace(workspace, {
            allowanceDraftEntries: workspace.allowanceDraftEntries.filter(
              (entry) => entry.id !== id,
            ),
          }),
          lastSavedAt: nowIsoTimestamp(),
        });
      },
    }),
    {
      name: CALCULATOR_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspace: state.workspace,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.clearLocalData();
          return;
        }

        if (!state?.workspace) {
          return;
        }

        const parsed = persistedCalculatorStateSchema.safeParse({
          workspace: state.workspace,
          lastSavedAt: state.lastSavedAt,
        });

        if (!parsed.success) {
          state.clearLocalData();
          state.persistError =
            "ข้อมูลในอุปกรณ์มีรูปแบบไม่ถูกต้องหรือไม่เข้ากัน กรุณาล้างข้อมูลแล้วเริ่มใหม่";
          return;
        }

        state.workspace = {
          ...parsed.data.workspace!,
          taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
            parsed.data.workspace!.taxYearBE,
          ),
        };
      },
    },
  ),
);

export { getDefaultWorkspaceInput, type CreateWorkspaceInput };
