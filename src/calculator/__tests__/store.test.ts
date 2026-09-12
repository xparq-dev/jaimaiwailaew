import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CALCULATOR_STORAGE_KEY,
  CALCULATOR_STORAGE_KEY_V1,
  CALCULATOR_STORAGE_KEY_V2,
  persistedCalculatorStateSchema,
} from "@/calculator/schemas";
import { useCalculatorStore } from "@/calculator/store";
import { getDefaultWorkspaceInput } from "@/calculator/workspace";
import { migrateLocalStorageV1ToV2 } from "@/calculator/migration";

describe("Calculator Zustand Local Store and Migration Safety", () => {
  beforeEach(() => {
    localStorage.clear();
    useCalculatorStore.getState().clearLocalData();
  });

  it("uses the correct namespace and versioned storage key v2", () => {
    expect(CALCULATOR_STORAGE_KEY).toBe("jaimaiwailaew:calculator:v2");
    expect(CALCULATOR_STORAGE_KEY_V2).toBe("jaimaiwailaew:calculator:v2");
    expect(CALCULATOR_STORAGE_KEY_V1).toBe("jaimaiwailaew:calculator:v1");
  });

  it("initializes a workspace with schemaVersion 2 and persists it to v2 storage", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    useCalculatorStore.getState().initializeWorkspace(input);

    const state = useCalculatorStore.getState();
    expect(state.workspace).not.toBeNull();
    expect(state.workspace?.schemaVersion).toBe(2);
    expect(state.workspace?.persona).toBe("online_seller_business");
    expect(state.workspace?.taxYearBE).toBe(2569);
    expect(state.workspace?.localOnly).toBe(true);

    const storedRaw = localStorage.getItem(CALCULATOR_STORAGE_KEY_V2);
    expect(storedRaw).not.toBeNull();
    const parsed = JSON.parse(storedRaw!);
    expect(parsed.state.workspace.id).toBe(state.workspace?.id);
    expect(parsed.state.workspace.schemaVersion).toBe(2);
  });

  it("performs local CRUD operations for one_time and monthly income entries", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    useCalculatorStore.getState().initializeWorkspace(input);

    // 1. Add one_time income
    const addOneTimeResult = useCalculatorStore.getState().addIncomeEntry({
      entryFrequency: "one_time",
      occurredOn: "2026-03-01",
      categoryCode: "online_sales",
      sourceName: "Shopee",
      amount: "15000.00",
      note: "Batch 1 sales",
    });
    expect(addOneTimeResult).toBeNull();

    // 2. Add monthly income
    const addMonthlyResult = useCalculatorStore.getState().addIncomeEntry({
      entryFrequency: "monthly",
      occurredMonth: "2026-03",
      categoryCode: "salary",
      sourceName: "Main Job",
      amount: "50000.00",
      note: "March Salary",
    });
    expect(addMonthlyResult).toBeNull();

    let workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.incomeEntries).toHaveLength(2);
    const oneTimeEntry = workspace.incomeEntries.find(
      (e) => e.entryFrequency === "one_time",
    )!;
    const monthlyEntry = workspace.incomeEntries.find(
      (e) => e.entryFrequency === "monthly",
    )!;

    expect(oneTimeEntry.occurredOn).toBe("2026-03-01");
    expect(oneTimeEntry.occurredMonth).toBeNull();
    expect(monthlyEntry.occurredMonth).toBe("2026-03");
    expect(monthlyEntry.occurredOn).toBeNull();

    // 3. Update entry frequency from one_time to monthly
    const updateResult = useCalculatorStore
      .getState()
      .updateIncomeEntry(oneTimeEntry.id, {
        entryFrequency: "monthly",
        occurredMonth: "2026-04",
        categoryCode: "online_sales",
        sourceName: "Shopee & Lazada",
        amount: "20000.00",
        note: "Updated batch",
      });
    expect(updateResult).toBeNull();

    workspace = useCalculatorStore.getState().workspace!;
    const updatedEntry = workspace.incomeEntries.find(
      (e) => e.id === oneTimeEntry.id,
    )!;
    expect(updatedEntry.entryFrequency).toBe("monthly");
    expect(updatedEntry.occurredMonth).toBe("2026-04");
    expect(updatedEntry.occurredOn).toBeNull();
    expect(updatedEntry.amountSatang).toBe(2000000);

    // 4. Delete entries
    useCalculatorStore.getState().deleteIncomeEntry(oneTimeEntry.id);
    useCalculatorStore.getState().deleteIncomeEntry(monthlyEntry.id);
    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.incomeEntries).toHaveLength(0);
  });

  it("performs local CRUD operations for expense and withholding with frequencies", () => {
    const input = getDefaultWorkspaceInput("freelancer", 2569, "first_half");
    useCalculatorStore.getState().initializeWorkspace(input);

    // Add monthly expense
    useCalculatorStore.getState().addExpenseEntry({
      entryFrequency: "monthly",
      occurredMonth: "2026-04",
      categoryCode: "utilities",
      taxRelevanceStatus: "likely_related",
      amount: "3500.00",
      note: "Office internet",
    });

    // Add one_time withholding
    useCalculatorStore.getState().addWithholdingEntry({
      entryFrequency: "one_time",
      occurredOn: "2026-04-10",
      payerName: "Client A",
      certificateReference: "WHT-123",
      amount: "1500.00",
    });

    let workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.expenseEntries).toHaveLength(1);
    expect(workspace.withholdingEntries).toHaveLength(1);
    expect(workspace.expenseEntries[0]!.entryFrequency).toBe("monthly");
    expect(workspace.expenseEntries[0]!.occurredMonth).toBe("2026-04");
    expect(workspace.withholdingEntries[0]!.entryFrequency).toBe("one_time");
    expect(workspace.withholdingEntries[0]!.occurredOn).toBe("2026-04-10");

    // Add allowance draft
    useCalculatorStore.getState().addAllowanceDraftEntry({
      categoryCode: "insurance_draft",
      amount: "25000.00",
      note: "Life insurance policy",
    });
    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.allowanceDraftEntries).toHaveLength(1);

    // Delete
    useCalculatorStore
      .getState()
      .deleteExpenseEntry(workspace.expenseEntries[0]!.id);
    useCalculatorStore
      .getState()
      .deleteWithholdingEntry(workspace.withholdingEntries[0]!.id);
    useCalculatorStore
      .getState()
      .deleteAllowanceDraftEntry(workspace.allowanceDraftEntries[0]!.id);

    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.expenseEntries).toHaveLength(0);
    expect(workspace.withholdingEntries).toHaveLength(0);
    expect(workspace.allowanceDraftEntries).toHaveLength(0);
  });

  it("clears local data and wipes both v1 and v2 keys on user request", () => {
    localStorage.setItem(CALCULATOR_STORAGE_KEY_V1, JSON.stringify({ old: 1 }));
    localStorage.setItem(CALCULATOR_STORAGE_KEY_V2, JSON.stringify({ new: 2 }));

    useCalculatorStore.getState().clearLocalData();
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).toBeNull();
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V2)).toBeNull();
    expect(useCalculatorStore.getState().workspace).toBeNull();
    expect(useCalculatorStore.getState().lastSavedAt).toBeNull();
  });

  it("validates persisted state with Zod and catches malformed data", () => {
    // Valid state
    const validState = {
      workspace: null,
      lastSavedAt: null,
    };
    expect(persistedCalculatorStateSchema.safeParse(validState).success).toBe(
      true,
    );

    // Invalid schemaVersion
    const invalidVersion = {
      workspace: {
        id: "loc-1",
        schemaVersion: 999, // Only version 2 is allowed for v2 schema
      },
      lastSavedAt: null,
    };
    expect(
      persistedCalculatorStateSchema.safeParse(invalidVersion).success,
    ).toBe(false);
  });

  // ==========================================
  // Migration Safety Sequence Tests (write → validate → verify → delete old)
  // ==========================================

  const sampleLegacyV1 = {
    state: {
      workspace: {
        id: "legacy-ws-123",
        schemaVersion: 1,
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        taxYearBE: 2569,
        persona: "online_seller_business",
        calculationMode: "pnd94",
        periodStart: "2026-01-01",
        periodEnd: "2026-06-30",
        reportName: "My Shop",
        incomeEntries: [
          {
            id: "inc-leg-1",
            occurredOn: "2026-03-01",
            categoryCode: "online_sales",
            sourceName: "Shopee",
            amountSatang: 1500000,
            createdAt: "2026-03-01T00:00:00.000Z",
            updatedAt: "2026-03-01T00:00:00.000Z",
          },
        ],
        expenseEntries: [
          {
            id: "exp-leg-1",
            occurredOn: "2026-03-05",
            categoryCode: "shipping",
            amountSatang: 250000,
            taxRelevanceStatus: "likely_related",
            createdAt: "2026-03-05T00:00:00.000Z",
            updatedAt: "2026-03-05T00:00:00.000Z",
          },
        ],
        withholdingEntries: [
          {
            id: "wht-leg-1",
            occurredOn: "2026-03-10",
            payerName: "Platform Co",
            certificateReference: "WHT-001",
            amountSatang: 45000,
            createdAt: "2026-03-10T00:00:00.000Z",
            updatedAt: "2026-03-10T00:00:00.000Z",
          },
        ],
        allowanceDraftEntries: [
          {
            id: "alw-leg-1",
            categoryCode: "personal_draft",
            declaredAmountSatang: 6000000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        taxRuleResolutionSnapshot: {
          taxYearBE: 2569,
          ruleSetId: null,
          ruleSetVersion: null,
          availability: "unavailable_unverified_rules",
          resolvedAt: "2026-02-01T00:00:00.000Z",
        },
        localOnly: true,
      },
      lastSavedAt: "2026-03-10T00:00:00.000Z",
    },
    version: 0,
  };

  it("successful migration: v2 is written, read back, verified, and only then v1 is removed", () => {
    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(sampleLegacyV1),
    );

    const result = migrateLocalStorageV1ToV2(localStorage);
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    expect(result.workspace?.id).toBe("legacy-ws-123");
    expect(result.workspace?.schemaVersion).toBe(2);

    // Legacy entries migrated to one_time with occurredMonth = null
    expect(result.workspace?.incomeEntries[0]!.entryFrequency).toBe("one_time");
    expect(result.workspace?.incomeEntries[0]!.occurredOn).toBe("2026-03-01");
    expect(result.workspace?.incomeEntries[0]!.occurredMonth).toBeNull();

    expect(result.workspace?.expenseEntries[0]!.entryFrequency).toBe(
      "one_time",
    );
    expect(result.workspace?.expenseEntries[0]!.occurredOn).toBe("2026-03-05");
    expect(result.workspace?.expenseEntries[0]!.occurredMonth).toBeNull();

    expect(result.workspace?.withholdingEntries[0]!.entryFrequency).toBe(
      "one_time",
    );
    expect(result.workspace?.withholdingEntries[0]!.occurredOn).toBe(
      "2026-03-10",
    );
    expect(result.workspace?.withholdingEntries[0]!.occurredMonth).toBeNull();

    // v2 key is in localStorage and v1 is removed
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V2)).not.toBeNull();
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).toBeNull();
  });

  it("localStorage setItem failure (e.g. quota exceeded): v1 remains untouched", () => {
    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(sampleLegacyV1),
    );

    const mockStorage: Storage = {
      ...localStorage,
      getItem: (k: string) => localStorage.getItem(k),
      removeItem: (k: string) => localStorage.removeItem(k),
      setItem: (k: string) => {
        if (k === CALCULATOR_STORAGE_KEY_V2) {
          throw new Error("QuotaExceededError");
        }
      },
    };

    const result = migrateLocalStorageV1ToV2(mockStorage);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("ไม่สามารถย้ายข้อมูล");

    // v1 MUST still exist untouched
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).not.toBeNull();
  });

  it("v2 re-read or validation fail: v1 remains untouched", () => {
    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(sampleLegacyV1),
    );

    const mockStorage: Storage = {
      ...localStorage,
      getItem: (k: string) => {
        if (k === CALCULATOR_STORAGE_KEY_V2) {
          return JSON.stringify({ corrupted: true }); // Returns invalid JSON for v2
        }
        return localStorage.getItem(k);
      },
      setItem: (k: string, v: string) => localStorage.setItem(k, v),
      removeItem: (k: string) => localStorage.removeItem(k),
    };

    const result = migrateLocalStorageV1ToV2(mockStorage);
    expect(result.success).toBe(false);
    // v1 MUST still be untouched
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).not.toBeNull();
  });

  it("integrity count mismatch on re-read: v1 remains untouched and not deleted", () => {
    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(sampleLegacyV1),
    );

    const mockStorage: Storage = {
      ...localStorage,
      getItem: (k: string) => {
        if (k === CALCULATOR_STORAGE_KEY_V2) {
          // Return valid v2 structure but missing the income entry (count mismatch)
          const validV2WithoutIncome = {
            state: {
              workspace: {
                ...sampleLegacyV1.state.workspace,
                schemaVersion: 2,
                incomeEntries: [], // count mismatch: 0 instead of 1
                expenseEntries: [
                  {
                    ...sampleLegacyV1.state.workspace.expenseEntries[0],
                    entryFrequency: "one_time",
                    occurredMonth: null,
                  },
                ],
                withholdingEntries: [
                  {
                    ...sampleLegacyV1.state.workspace.withholdingEntries[0],
                    entryFrequency: "one_time",
                    occurredMonth: null,
                  },
                ],
              },
              lastSavedAt: sampleLegacyV1.state.lastSavedAt,
            },
            version: 0,
          };
          return JSON.stringify(validV2WithoutIncome);
        }
        return localStorage.getItem(k);
      },
      setItem: (k: string, v: string) => localStorage.setItem(k, v),
      removeItem: (k: string) => localStorage.removeItem(k),
    };

    const result = migrateLocalStorageV1ToV2(mockStorage);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("ไม่สามารถย้ายข้อมูล");
    // v1 MUST NOT be deleted
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).not.toBeNull();
  });

  it("malformed v1 JSON: fails safe, does not crash, and does not delete v1", () => {
    const malformedRaw = "{ invalid json content ...";
    localStorage.setItem(CALCULATOR_STORAGE_KEY_V1, malformedRaw);

    const result = migrateLocalStorageV1ToV2(localStorage);
    expect(result.success).toBe(false);
    expect(result.workspace).toBeNull();
    // v1 is NOT deleted
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).toBe(malformedRaw);
  });

  it("malformed v1 schema (missing required fields): fails safe and does not delete v1", () => {
    const invalidSchema = {
      state: {
        workspace: {
          id: "missing-entries",
          schemaVersion: 1,
          // missing incomeEntries, expenseEntries etc.
        },
      },
    };
    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(invalidSchema),
    );

    const result = migrateLocalStorageV1ToV2(localStorage);
    expect(result.success).toBe(false);
    // v1 is NOT deleted
    expect(localStorage.getItem(CALCULATOR_STORAGE_KEY_V1)).not.toBeNull();
  });

  it("migration does not make network requests or log financial data", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const consoleLogSpy = vi.spyOn(console, "log");

    localStorage.setItem(
      CALCULATOR_STORAGE_KEY_V1,
      JSON.stringify(sampleLegacyV1),
    );

    const result = migrateLocalStorageV1ToV2(localStorage);
    expect(result.success).toBe(true);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
