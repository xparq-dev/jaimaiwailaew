import {
  CALCULATOR_STORAGE_KEY_V1,
  CALCULATOR_STORAGE_KEY_V2,
  legacyV1PersistedCalculatorStateSchema,
  persistedCalculatorStateSchema,
} from "./schemas";
import type {
  CalculatorWorkspace,
  IncomeEntry,
  ExpenseEntry,
  WithholdingEntry,
} from "./types";

export interface MigrationResult {
  readonly success: boolean;
  readonly migrated: boolean;
  readonly workspace: CalculatorWorkspace | null;
  readonly lastSavedAt: string | null;
  readonly errorMessage: string | null;
}

export const MIGRATION_ERROR_MESSAGE =
  "ไม่สามารถย้ายข้อมูลที่บันทึกไว้ในอุปกรณ์นี้ได้อย่างปลอดภัย ข้อมูลเดิมยังไม่ถูกลบ โปรดลองอีกครั้งหรือล้างข้อมูลในอุปกรณ์เมื่อแน่ใจแล้ว";

/**
 * Executes a write → validate → verify → delete old atomic-like migration from v1 to v2.
 * Never deletes v1 unless v2 is written, read back, re-validated, and verified for full integrity.
 */
export function migrateLocalStorageV1ToV2(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = localStorage,
): MigrationResult {
  let v1Raw: string | null = null;
  try {
    v1Raw = storage.getItem(CALCULATOR_STORAGE_KEY_V1);
  } catch {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // If no v1 data exists, nothing to migrate
  if (!v1Raw) {
    return {
      success: true,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: null,
    };
  }

  // 1 & 2. Parse & Validate v1 state with Zod
  let parsedV1Json: unknown;
  try {
    parsedV1Json = JSON.parse(v1Raw);
  } catch {
    // Malformed JSON: do NOT delete v1, do NOT crash
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // Handle Zustand persist wrapper ({ state: { workspace, lastSavedAt }, version: ... })
  const v1StateCandidate =
    parsedV1Json &&
    typeof parsedV1Json === "object" &&
    "state" in parsedV1Json &&
    parsedV1Json.state &&
    typeof parsedV1Json.state === "object"
      ? (parsedV1Json as { state: unknown }).state
      : parsedV1Json;

  const v1Parsed =
    legacyV1PersistedCalculatorStateSchema.safeParse(v1StateCandidate);

  if (!v1Parsed.success) {
    // Malformed v1 data: do NOT delete v1, do NOT crash
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  const legacyState = v1Parsed.data;

  // If workspace is null, v1 has no active workspace
  if (!legacyState.workspace) {
    try {
      storage.removeItem(CALCULATOR_STORAGE_KEY_V1);
    } catch {
      // ignore
    }
    return {
      success: true,
      migrated: true,
      workspace: null,
      lastSavedAt: legacyState.lastSavedAt,
      errorMessage: null,
    };
  }

  const legacyWorkspace = legacyState.workspace;

  // 3. Migrate in memory
  const migratedIncomeEntries: IncomeEntry[] =
    legacyWorkspace.incomeEntries.map((entry) => ({
      ...entry,
      entryFrequency: "one_time" as const,
      occurredOn: entry.occurredOn,
      occurredMonth: null,
    }));

  const migratedExpenseEntries: ExpenseEntry[] =
    legacyWorkspace.expenseEntries.map((entry) => ({
      ...entry,
      entryFrequency: "one_time" as const,
      occurredOn: entry.occurredOn,
      occurredMonth: null,
    }));

  const migratedWithholdingEntries: WithholdingEntry[] =
    legacyWorkspace.withholdingEntries.map((entry) => ({
      ...entry,
      entryFrequency: "one_time" as const,
      occurredOn: entry.occurredOn,
      occurredMonth: null,
    }));

  const migratedWorkspace: CalculatorWorkspace = {
    ...legacyWorkspace,
    schemaVersion: 2,
    incomeEntries: migratedIncomeEntries,
    expenseEntries: migratedExpenseEntries,
    withholdingEntries: migratedWithholdingEntries,
    allowanceDraftEntries: legacyWorkspace.allowanceDraftEntries,
    socialSecuritySettings: { mode: "none" },
  };

  const migratedState = {
    workspace: migratedWorkspace,
    lastSavedAt: legacyState.lastSavedAt,
  };

  // 4. Validate migrated state with Zod v2 schema
  const v2ValidationBeforeWrite =
    persistedCalculatorStateSchema.safeParse(migratedState);

  if (!v2ValidationBeforeWrite.success) {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // 5. Write migrated state to jaimaiwailaew:calculator:v2 in Zustand persist format
  const v2PersistedPayload = JSON.stringify({
    state: migratedState,
    version: 0,
  });

  try {
    storage.setItem(CALCULATOR_STORAGE_KEY_V2, v2PersistedPayload);
  } catch {
    // e.g. quota exceeded or storage unavailable: DO NOT delete v1!
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // 6. Read back from localStorage
  let v2ReadBackRaw: string | null = null;
  try {
    v2ReadBackRaw = storage.getItem(CALCULATOR_STORAGE_KEY_V2);
  } catch {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  if (!v2ReadBackRaw) {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // 7. Validate v2 read-back state with Zod v2 schema
  let v2ReadBackJson: unknown;
  try {
    v2ReadBackJson = JSON.parse(v2ReadBackRaw);
  } catch {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  const v2ReadBackState =
    v2ReadBackJson &&
    typeof v2ReadBackJson === "object" &&
    "state" in v2ReadBackJson &&
    v2ReadBackJson.state &&
    typeof v2ReadBackJson.state === "object"
      ? (v2ReadBackJson as { state: unknown }).state
      : v2ReadBackJson;

  const v2ValidationAfterRead =
    persistedCalculatorStateSchema.safeParse(v2ReadBackState);

  if (!v2ValidationAfterRead.success || !v2ValidationAfterRead.data.workspace) {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  const verifiedWorkspace = v2ValidationAfterRead.data.workspace;

  // 8. Verify data integrity
  const integrityOk =
    verifiedWorkspace.id === legacyWorkspace.id &&
    verifiedWorkspace.schemaVersion === 2 &&
    verifiedWorkspace.incomeEntries.length ===
      legacyWorkspace.incomeEntries.length &&
    verifiedWorkspace.expenseEntries.length ===
      legacyWorkspace.expenseEntries.length &&
    verifiedWorkspace.withholdingEntries.length ===
      legacyWorkspace.withholdingEntries.length &&
    verifiedWorkspace.allowanceDraftEntries.length ===
      legacyWorkspace.allowanceDraftEntries.length &&
    verifiedWorkspace.incomeEntries.every(
      (entry) =>
        entry.entryFrequency === "one_time" && entry.occurredMonth === null,
    ) &&
    verifiedWorkspace.expenseEntries.every(
      (entry) =>
        entry.entryFrequency === "one_time" && entry.occurredMonth === null,
    ) &&
    verifiedWorkspace.withholdingEntries.every(
      (entry) =>
        entry.entryFrequency === "one_time" && entry.occurredMonth === null,
    );

  if (!integrityOk) {
    return {
      success: false,
      migrated: false,
      workspace: null,
      lastSavedAt: null,
      errorMessage: MIGRATION_ERROR_MESSAGE,
    };
  }

  // 9. ONLY when all checks pass: delete legacy key v1
  try {
    storage.removeItem(CALCULATOR_STORAGE_KEY_V1);
  } catch {
    // ignore
  }

  return {
    success: true,
    migrated: true,
    workspace: verifiedWorkspace,
    lastSavedAt: v2ValidationAfterRead.data.lastSavedAt,
    errorMessage: null,
  };
}
