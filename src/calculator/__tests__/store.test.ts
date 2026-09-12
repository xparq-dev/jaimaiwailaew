import { beforeEach, describe, expect, it } from "vitest";

import {
  CALCULATOR_STORAGE_KEY,
  persistedCalculatorStateSchema,
} from "@/calculator/schemas";
import { useCalculatorStore } from "@/calculator/store";
import { getDefaultWorkspaceInput } from "@/calculator/workspace";

describe("Calculator Zustand Local Store and Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useCalculatorStore.getState().clearLocalData();
  });

  it("uses the correct namespace and versioned storage key", () => {
    expect(CALCULATOR_STORAGE_KEY).toBe("jaimaiwailaew:calculator:v1");
  });

  it("initializes a workspace and persists it to local storage", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    useCalculatorStore.getState().initializeWorkspace(input);

    const state = useCalculatorStore.getState();
    expect(state.workspace).not.toBeNull();
    expect(state.workspace?.persona).toBe("online_seller_business");
    expect(state.workspace?.taxYearBE).toBe(2569);
    expect(state.workspace?.localOnly).toBe(true);

    const storedRaw = localStorage.getItem(CALCULATOR_STORAGE_KEY);
    expect(storedRaw).not.toBeNull();
    const parsed = JSON.parse(storedRaw!);
    expect(parsed.state.workspace.id).toBe(state.workspace?.id);
  });

  it("performs local CRUD operations for income entries", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    useCalculatorStore.getState().initializeWorkspace(input);

    // Add income
    const addResult = useCalculatorStore.getState().addIncomeEntry({
      occurredOn: "2026-03-01",
      categoryCode: "online_sales",
      sourceName: "Shopee",
      amount: "15000.00",
      note: "Batch 1 sales",
    });
    expect(addResult).toBeNull(); // null means no error

    let workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.incomeEntries).toHaveLength(1);
    const entryId = workspace.incomeEntries[0]!.id;
    expect(workspace.incomeEntries[0]!.sourceName).toBe("Shopee");

    // Update income
    const updateResult = useCalculatorStore
      .getState()
      .updateIncomeEntry(entryId, {
        occurredOn: "2026-03-02",
        categoryCode: "online_sales",
        sourceName: "Shopee & Lazada",
        amount: "20000.00",
        note: "Updated batch",
      });
    expect(updateResult).toBeNull();

    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.incomeEntries[0]!.sourceName).toBe("Shopee & Lazada");
    expect(workspace.incomeEntries[0]!.amountSatang).toBe(2000000);

    // Delete income
    useCalculatorStore.getState().deleteIncomeEntry(entryId);
    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.incomeEntries).toHaveLength(0);
  });

  it("performs local CRUD operations for withholding and allowance drafts", () => {
    const input = getDefaultWorkspaceInput("freelancer", 2569, "first_half");
    useCalculatorStore.getState().initializeWorkspace(input);

    // Add withholding
    useCalculatorStore.getState().addWithholdingEntry({
      occurredOn: "2026-04-10",
      payerName: "Client A",
      certificateReference: "WHT-123",
      amount: "1500.00",
    });
    let workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.withholdingEntries).toHaveLength(1);
    const whtId = workspace.withholdingEntries[0]!.id;

    // Add allowance draft
    useCalculatorStore.getState().addAllowanceDraftEntry({
      categoryCode: "insurance_draft",
      amount: "25000.00",
      note: "Life insurance policy",
    });
    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.allowanceDraftEntries).toHaveLength(1);
    const alwId = workspace.allowanceDraftEntries[0]!.id;

    // Delete both
    useCalculatorStore.getState().deleteWithholdingEntry(whtId);
    useCalculatorStore.getState().deleteAllowanceDraftEntry(alwId);

    workspace = useCalculatorStore.getState().workspace!;
    expect(workspace.withholdingEntries).toHaveLength(0);
    expect(workspace.allowanceDraftEntries).toHaveLength(0);
  });

  it("clears local data and wipes storage completely on user request", () => {
    const input = getDefaultWorkspaceInput(
      "online_seller_business",
      2569,
      "first_half",
    );
    useCalculatorStore.getState().initializeWorkspace(input);
    expect(useCalculatorStore.getState().workspace).not.toBeNull();

    useCalculatorStore.getState().clearLocalData();
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
        schemaVersion: 999, // Only version 1 is allowed
      },
      lastSavedAt: null,
    };
    expect(
      persistedCalculatorStateSchema.safeParse(invalidVersion).success,
    ).toBe(false);
  });
});
