"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/auth/auth-provider";
import { useCalculatorStore } from "@/calculator/store";

import { createCloudSyncTransport, isCloudSyncConfigured } from "./cloud-api";
import {
  isCloudSyncEnabled,
  setCloudSyncEnabled as persistCloudSyncEnabled,
} from "./preferences";
import { syncWorkspaces } from "./syncEngine";
import type { CloudSyncStatus } from "./types";

interface CloudSyncContextValue {
  readonly status: CloudSyncStatus;
  readonly enabled: boolean;
  readonly lastSyncedAt: string | null;
  readonly error: string | null;
  setEnabled(enabled: boolean): void;
  syncNow(): Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

export function CloudSyncProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { status: authStatus, user, getAccessToken } = useAuth();
  const workspaceUpdatedAt = useCalculatorStore(
    (state) =>
      [state.workspace, ...state.otherWorkspaces]
        .filter((workspace) => workspace !== null)
        .map((workspace) => `${workspace.id}:${workspace.updatedAt}`)
        .join("|") + `|deleted:${state.pendingWorkspaceDeletionIds.join(",")}`,
  );
  const restoreWorkspacesFromSync = useCalculatorStore(
    (state) => state.restoreWorkspacesFromSync,
  );
  const acknowledgeWorkspaceDeletions = useCalculatorStore(
    (state) => state.acknowledgeWorkspaceDeletions,
  );
  const [enabledOverride, setEnabledOverride] = useState<{
    readonly userId: string;
    readonly enabled: boolean;
  } | null>(null);
  const enabled = user
    ? enabledOverride?.userId === user.id
      ? enabledOverride.enabled
      : isCloudSyncEnabled(user.id)
    : false;
  const [status, setStatus] = useState<CloudSyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const transport = useMemo(
    () => createCloudSyncTransport(getAccessToken),
    [getAccessToken],
  );

  const syncNow = useCallback(async () => {
    if (runningRef.current) return;
    if (!isCloudSyncConfigured) {
      setStatus("config_missing");
      return;
    }
    if (authStatus !== "authenticated" || !user) {
      setStatus("auth_required");
      return;
    }
    if (!enabled) {
      setStatus("disabled");
      return;
    }
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    runningRef.current = true;
    setStatus("syncing");
    setError(null);
    try {
      const calculatorState = useCalculatorStore.getState();
      const result = await syncWorkspaces({
        userId: user.id,
        localWorkspaces: [
          ...(calculatorState.workspace ? [calculatorState.workspace] : []),
          ...calculatorState.otherWorkspaces,
        ],
        pendingDeletionIds: calculatorState.pendingWorkspaceDeletionIds,
        transport,
      });
      if (result.action === "pulled" || result.action === "merged") {
        const restoreError = restoreWorkspacesFromSync(result.workspaces);
        if (restoreError) throw new Error(restoreError);
      }
      acknowledgeWorkspaceDeletions(result.completedDeletionIds);
      setLastSyncedAt(result.syncedAt);
      setStatus("synced");
    } catch (syncError) {
      const message =
        syncError instanceof Error
          ? syncError.message
          : "ไม่สามารถซิงก์ข้อมูลได้";
      setError(message);
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [
    acknowledgeWorkspaceDeletions,
    authStatus,
    enabled,
    restoreWorkspacesFromSync,
    transport,
    user,
  ]);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      void syncNow();
    }, 900);
    const handleOnline = () => void syncNow();
    const handleOffline = () => setStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled, syncNow, workspaceUpdatedAt]);

  const setEnabled = useCallback(
    (nextEnabled: boolean) => {
      if (!user) return;
      persistCloudSyncEnabled(user.id, nextEnabled);
      setEnabledOverride({ userId: user.id, enabled: nextEnabled });
      setStatus(nextEnabled ? "idle" : "disabled");
      setError(null);
    },
    [user],
  );

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      status: enabled ? status : "disabled",
      enabled,
      lastSyncedAt,
      error,
      setEnabled,
      syncNow,
    }),
    [enabled, error, lastSyncedAt, setEnabled, status, syncNow],
  );

  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error("useCloudSync must be used inside CloudSyncProvider");
  }
  return context;
}
