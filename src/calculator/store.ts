"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { decimalStringToSatang } from "@/tax/money";

import {
  allowanceDraftEntryFormSchema,
  CALCULATOR_STORAGE_KEY_V1,
  CALCULATOR_STORAGE_KEY_V2,
  CALCULATOR_STORAGE_KEY,
  expenseEntryFormSchema,
  incomeEntryFormSchema,
  persistedCalculatorStateSchema,
  socialSecuritySettingsFormSchema,
  withholdingEntryFormSchema,
  type AllowanceDraftEntryFormValues,
  type ExpenseEntryFormValues,
  type IncomeEntryFormValues,
  type SocialSecuritySettingsFormValues,
  type WithholdingEntryFormValues,
} from "./schemas";
import type {
  AllowanceDraftEntry,
  CalculatorPersona,
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
import { migrateLocalStorageV1ToV2 } from "./migration";

interface CalculatorStoreState {
  workspace: CalculatorWorkspace | null;
  otherWorkspaces: CalculatorWorkspace[];
  pendingWorkspaceDeletionIds: string[];
  lastSavedAt: string | null;
  hydrationComplete: boolean;
  persistError: string | null;
  initializeWorkspace: (input: CreateWorkspaceInput, replace?: boolean) => void;
  createAdditionalWorkspace: (input: CreateWorkspaceInput) => void;
  selectWorkspace: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string, queueCloudDeletion: boolean) => void;
  acknowledgeWorkspaceDeletions: (workspaceIds: readonly string[]) => void;
  replaceWorkspace: (input: CreateWorkspaceInput) => void;
  updateWorkspacePersona: (persona: CalculatorPersona) => void;
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
  updateSocialSecuritySettings: (
    values: SocialSecuritySettingsFormValues,
  ) => string | null;
  restoreWorkspaceFromSync: (workspace: CalculatorWorkspace) => string | null;
  restoreWorkspacesFromSync: (
    workspaces: readonly CalculatorWorkspace[],
  ) => string | null;
}

function parseMoneyAmount(amount: string) {
  return decimalStringToSatang(amount, {
    roundingPolicy: "round",
    allowNegative: false,
  });
}

function buildIncomeEntry(values: IncomeEntryFormValues): IncomeEntry {
  const timestamp = nowIsoTimestamp();
  if (values.entryFrequency === "monthly") {
    return {
      id: createLocalId(),
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: values.occurredMonth!,
      categoryCode: values.categoryCode,
      sourceName: values.sourceName?.trim() || undefined,
      amountSatang: parseMoneyAmount(values.amount),
      note: sanitizeNote(values.note),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
  return {
    id: createLocalId(),
    entryFrequency: "one_time",
    occurredOn: values.occurredOn!,
    occurredMonth: null,
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
  if (values.entryFrequency === "monthly") {
    return {
      id: createLocalId(),
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: values.occurredMonth!,
      categoryCode: values.categoryCode,
      amountSatang: parseMoneyAmount(values.amount),
      taxRelevanceStatus: values.taxRelevanceStatus,
      note: sanitizeNote(values.note),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
  return {
    id: createLocalId(),
    entryFrequency: "one_time",
    occurredOn: values.occurredOn!,
    occurredMonth: null,
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
  if (values.entryFrequency === "monthly") {
    return {
      id: createLocalId(),
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: values.occurredMonth!,
      payerName: values.payerName?.trim() || undefined,
      certificateReference: values.certificateReference?.trim() || undefined,
      amountSatang: parseMoneyAmount(values.amount),
      note: sanitizeNote(values.note),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
  return {
    id: createLocalId(),
    entryFrequency: "one_time",
    occurredOn: values.occurredOn!,
    occurredMonth: null,
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
      otherWorkspaces: [],
      pendingWorkspaceDeletionIds: [],
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

      createAdditionalWorkspace: (input) => {
        const current = get().workspace;
        const next = createCalculatorWorkspace(input);
        set((state) => ({
          workspace: next,
          otherWorkspaces: current
            ? [
                current,
                ...state.otherWorkspaces.filter(
                  (candidate) => candidate.id !== current.id,
                ),
              ]
            : state.otherWorkspaces,
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        }));
      },

      selectWorkspace: (workspaceId) => {
        const current = get().workspace;
        if (!current || current.id === workspaceId) return;
        const selected = get().otherWorkspaces.find(
          (candidate) => candidate.id === workspaceId,
        );
        if (!selected) return;

        set((state) => ({
          workspace: selected,
          otherWorkspaces: [
            current,
            ...state.otherWorkspaces.filter(
              (candidate) => candidate.id !== workspaceId,
            ),
          ],
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        }));
      },

      deleteWorkspace: (workspaceId, queueCloudDeletion) => {
        const state = get();
        const allWorkspaces = [
          ...(state.workspace ? [state.workspace] : []),
          ...state.otherWorkspaces,
        ];
        if (!allWorkspaces.some((candidate) => candidate.id === workspaceId)) {
          return;
        }

        const remaining = allWorkspaces.filter(
          (candidate) => candidate.id !== workspaceId,
        );
        const active =
          state.workspace?.id === workspaceId
            ? (remaining[0] ?? null)
            : state.workspace;
        set({
          workspace: active,
          otherWorkspaces: active
            ? remaining.filter((candidate) => candidate.id !== active.id)
            : [],
          pendingWorkspaceDeletionIds: queueCloudDeletion
            ? [...new Set([...state.pendingWorkspaceDeletionIds, workspaceId])]
            : state.pendingWorkspaceDeletionIds,
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
      },

      acknowledgeWorkspaceDeletions: (workspaceIds) => {
        const completed = new Set(workspaceIds);
        set((state) => ({
          pendingWorkspaceDeletionIds: state.pendingWorkspaceDeletionIds.filter(
            (workspaceId) => !completed.has(workspaceId),
          ),
        }));
      },

      replaceWorkspace: (input) => {
        set({
          workspace: createCalculatorWorkspace(input),
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
      },

      updateWorkspacePersona: (persona) => {
        const workspace = get().workspace;
        if (!workspace || workspace.persona === persona) {
          return;
        }

        set({
          workspace: touchWorkspace(workspace, { persona }),
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
      },

      clearLocalData: () => {
        set({
          workspace: null,
          otherWorkspaces: [],
          pendingWorkspaceDeletionIds: [],
          lastSavedAt: null,
          persistError: null,
        });
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem(CALCULATOR_STORAGE_KEY_V1);
            localStorage.removeItem(CALCULATOR_STORAGE_KEY_V2);
          }
        } catch {
          // ignore
        }
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
            incomeEntries: workspace.incomeEntries.map((entry) => {
              if (entry.id !== id) return entry;
              if (parsed.data.entryFrequency === "monthly") {
                return updateEntryTimestamp({
                  ...entry,
                  entryFrequency: "monthly" as const,
                  occurredOn: null,
                  occurredMonth: parsed.data.occurredMonth!,
                  categoryCode: parsed.data.categoryCode,
                  sourceName: parsed.data.sourceName?.trim() || undefined,
                  amountSatang: parseMoneyAmount(parsed.data.amount),
                  note: sanitizeNote(parsed.data.note),
                });
              }
              return updateEntryTimestamp({
                ...entry,
                entryFrequency: "one_time" as const,
                occurredOn: parsed.data.occurredOn!,
                occurredMonth: null,
                categoryCode: parsed.data.categoryCode,
                sourceName: parsed.data.sourceName?.trim() || undefined,
                amountSatang: parseMoneyAmount(parsed.data.amount),
                note: sanitizeNote(parsed.data.note),
              });
            }),
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
            expenseEntries: workspace.expenseEntries.map((entry) => {
              if (entry.id !== id) return entry;
              if (parsed.data.entryFrequency === "monthly") {
                return updateEntryTimestamp({
                  ...entry,
                  entryFrequency: "monthly" as const,
                  occurredOn: null,
                  occurredMonth: parsed.data.occurredMonth!,
                  categoryCode: parsed.data.categoryCode,
                  amountSatang: parseMoneyAmount(parsed.data.amount),
                  taxRelevanceStatus: parsed.data.taxRelevanceStatus,
                  note: sanitizeNote(parsed.data.note),
                });
              }
              return updateEntryTimestamp({
                ...entry,
                entryFrequency: "one_time" as const,
                occurredOn: parsed.data.occurredOn!,
                occurredMonth: null,
                categoryCode: parsed.data.categoryCode,
                amountSatang: parseMoneyAmount(parsed.data.amount),
                taxRelevanceStatus: parsed.data.taxRelevanceStatus,
                note: sanitizeNote(parsed.data.note),
              });
            }),
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
            withholdingEntries: workspace.withholdingEntries.map((entry) => {
              if (entry.id !== id) return entry;
              if (parsed.data.entryFrequency === "monthly") {
                return updateEntryTimestamp({
                  ...entry,
                  entryFrequency: "monthly" as const,
                  occurredOn: null,
                  occurredMonth: parsed.data.occurredMonth!,
                  payerName: parsed.data.payerName?.trim() || undefined,
                  certificateReference:
                    parsed.data.certificateReference?.trim() || undefined,
                  amountSatang: parseMoneyAmount(parsed.data.amount),
                  note: sanitizeNote(parsed.data.note),
                });
              }
              return updateEntryTimestamp({
                ...entry,
                entryFrequency: "one_time" as const,
                occurredOn: parsed.data.occurredOn!,
                occurredMonth: null,
                payerName: parsed.data.payerName?.trim() || undefined,
                certificateReference:
                  parsed.data.certificateReference?.trim() || undefined,
                amountSatang: parseMoneyAmount(parsed.data.amount),
                note: sanitizeNote(parsed.data.note),
              });
            }),
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

      updateSocialSecuritySettings: (values) => {
        const parsed = socialSecuritySettingsFormSchema.safeParse(values);
        const workspace = get().workspace;
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        }
        if (!workspace) {
          return "ยังไม่มี workspace";
        }

        const socialSecuritySettings =
          parsed.data.mode === "manual"
            ? {
                mode: "manual" as const,
                manualContributionSatang: parseMoneyAmount(
                  parsed.data.manualAmount!,
                ),
              }
            : { mode: parsed.data.mode };

        set({
          workspace: touchWorkspace(workspace, { socialSecuritySettings }),
          lastSavedAt: nowIsoTimestamp(),
          persistError: null,
        });
        return null;
      },

      restoreWorkspaceFromSync: (workspace) => {
        const parsed = persistedCalculatorStateSchema.safeParse({
          workspace,
          lastSavedAt: workspace.updatedAt,
        });
        if (!parsed.success || !parsed.data.workspace) {
          return "ข้อมูลจาก Cloud มีรูปแบบไม่ถูกต้อง จึงยังไม่ได้นำมาใช้";
        }

        set({
          workspace: {
            ...parsed.data.workspace,
            taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
              parsed.data.workspace.taxYearBE,
            ),
          },
          lastSavedAt: parsed.data.lastSavedAt,
          persistError: null,
        });
        return null;
      },

      restoreWorkspacesFromSync: (workspaces) => {
        const unique = new Map<string, CalculatorWorkspace>();
        for (const candidate of workspaces) {
          const parsed = persistedCalculatorStateSchema.safeParse({
            workspace: candidate,
            otherWorkspaces: [],
            pendingWorkspaceDeletionIds: [],
            lastSavedAt: candidate.updatedAt,
          });
          if (!parsed.success || !parsed.data.workspace) {
            return "ข้อมูลจาก Cloud มีรูปแบบไม่ถูกต้อง จึงยังไม่ได้นำมาใช้";
          }
          unique.set(parsed.data.workspace.id, {
            ...parsed.data.workspace,
            taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
              parsed.data.workspace.taxYearBE,
            ),
          });
        }

        const normalized = [...unique.values()];
        const pendingDeletions = new Set(get().pendingWorkspaceDeletionIds);
        const available = normalized.filter(
          (candidate) => !pendingDeletions.has(candidate.id),
        );
        const currentId = get().workspace?.id;
        const active =
          available.find((candidate) => candidate.id === currentId) ??
          [...available].sort(
            (left, right) =>
              Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
          )[0] ??
          null;

        set({
          workspace: active,
          otherWorkspaces: active
            ? available.filter((candidate) => candidate.id !== active.id)
            : [],
          lastSavedAt: active?.updatedAt ?? null,
          persistError: null,
        });
        return null;
      },
    }),
    {
      name: CALCULATOR_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspace: state.workspace,
        otherWorkspaces: state.otherWorkspaces,
        pendingWorkspaceDeletionIds: state.pendingWorkspaceDeletionIds,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.clearLocalData();
          return;
        }

        // Check if migration from v1 is needed (when v2 is empty but v1 exists)
        if (typeof localStorage !== "undefined") {
          const v2Raw = localStorage.getItem(CALCULATOR_STORAGE_KEY_V2);
          const v1Raw = localStorage.getItem(CALCULATOR_STORAGE_KEY_V1);

          if (!v2Raw && v1Raw) {
            const migrationResult = migrateLocalStorageV1ToV2(localStorage);
            if (migrationResult.success && migrationResult.workspace) {
              if (state) {
                state.workspace = {
                  ...migrationResult.workspace,
                  taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
                    migrationResult.workspace.taxYearBE,
                  ),
                };
                state.lastSavedAt = migrationResult.lastSavedAt;
                state.otherWorkspaces = [];
                state.pendingWorkspaceDeletionIds = [];
                state.persistError = null;
              }
              return;
            }

            if (!migrationResult.success) {
              // Migration failed: do NOT delete v1, do NOT crash, show safe Thai error
              if (state) {
                state.workspace = null;
                state.lastSavedAt = null;
                state.persistError = migrationResult.errorMessage;
              }
              return;
            }
          }
        }

        if (!state?.workspace) {
          return;
        }

        const parsed = persistedCalculatorStateSchema.safeParse({
          workspace: state.workspace,
          otherWorkspaces: state.otherWorkspaces,
          pendingWorkspaceDeletionIds: state.pendingWorkspaceDeletionIds,
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
        state.otherWorkspaces = parsed.data.otherWorkspaces.map(
          (workspace) => ({
            ...workspace,
            taxRuleResolutionSnapshot: createTaxRuleResolutionSnapshot(
              workspace.taxYearBE,
            ),
          }),
        );
        state.pendingWorkspaceDeletionIds =
          parsed.data.pendingWorkspaceDeletionIds;
      },
    },
  ),
);

export { getDefaultWorkspaceInput, type CreateWorkspaceInput };
