import type { CalculatorWorkspace } from "@/calculator/types";
import { calculatorWorkspaceSchema } from "@/calculator/schemas";

import type {
  CloudSyncTransport,
  CloudWorkspaceDocument,
  SyncResult,
} from "./types";

function newestRemoteWorkspace(
  documents: readonly CloudWorkspaceDocument[],
): CloudWorkspaceDocument | null {
  return (
    [...documents].sort(
      (left, right) =>
        Date.parse(right.workspace.updatedAt) -
        Date.parse(left.workspace.updatedAt),
    )[0] ?? null
  );
}

export function createCloudWorkspaceDocument(
  workspace: CalculatorWorkspace,
  previous?: CloudWorkspaceDocument | null,
): CloudWorkspaceDocument {
  return {
    version: 1,
    workspace: calculatorWorkspaceSchema.parse(workspace),
    customCategories: previous?.customCategories ?? [],
    updatedAt: workspace.updatedAt,
  };
}

export function resolveLastWriteWins(
  localWorkspace: CalculatorWorkspace,
  remoteDocument: CloudWorkspaceDocument,
): "local" | "remote" | "equal" {
  const localUpdatedAt = Date.parse(localWorkspace.updatedAt);
  const remoteUpdatedAt = Date.parse(remoteDocument.workspace.updatedAt);

  if (localUpdatedAt > remoteUpdatedAt) return "local";
  if (remoteUpdatedAt > localUpdatedAt) return "remote";
  return "equal";
}

export async function syncWorkspace({
  userId,
  localWorkspace,
  transport,
  now = () => new Date(),
}: {
  readonly userId: string;
  readonly localWorkspace: CalculatorWorkspace | null;
  readonly transport: CloudSyncTransport;
  readonly now?: () => Date;
}): Promise<SyncResult> {
  return syncWorkspaces({
    userId,
    localWorkspaces: localWorkspace ? [localWorkspace] : [],
    pendingDeletionIds: [],
    transport,
    now,
  });
}

export async function syncWorkspaces({
  userId,
  localWorkspaces,
  pendingDeletionIds = [],
  transport,
  now = () => new Date(),
}: {
  readonly userId: string;
  readonly localWorkspaces: readonly CalculatorWorkspace[];
  readonly pendingDeletionIds?: readonly string[];
  readonly transport: CloudSyncTransport;
  readonly now?: () => Date;
}): Promise<SyncResult> {
  const syncedAt = now().toISOString();
  const completedDeletionIds: string[] = [];
  for (const workspaceId of new Set(pendingDeletionIds)) {
    await transport.deleteWorkspace(workspaceId);
    completedDeletionIds.push(workspaceId);
  }

  const snapshot = await transport.listWorkspaceSnapshot(userId);
  const deletedIds = new Set(
    snapshot.deletions.map((deletion) => deletion.workspaceId),
  );
  const remoteDocuments = snapshot.workspaces.filter(
    (document) => !deletedIds.has(document.workspace.id),
  );
  const eligibleLocalWorkspaces = localWorkspaces.filter(
    (workspace) => !deletedIds.has(workspace.id),
  );
  const localById = new Map(
    eligibleLocalWorkspaces.map((item) => [item.id, item]),
  );
  const remoteById = new Map(
    remoteDocuments.map((item) => [item.workspace.id, item]),
  );
  const resolved = new Map<string, CalculatorWorkspace>();
  let pushed = false;
  let pulled = localWorkspaces.length !== eligibleLocalWorkspaces.length;

  for (const local of eligibleLocalWorkspaces) {
    const remote = remoteById.get(local.id);
    if (!remote) {
      await transport.putWorkspace(createCloudWorkspaceDocument(local));
      resolved.set(local.id, local);
      pushed = true;
      continue;
    }

    const winner = resolveLastWriteWins(local, remote);
    if (winner === "remote") {
      resolved.set(local.id, remote.workspace);
      pulled = true;
    } else {
      resolved.set(local.id, local);
      if (winner === "local") {
        await transport.putWorkspace(
          createCloudWorkspaceDocument(local, remote),
        );
        pushed = true;
      }
    }
  }

  for (const remote of remoteDocuments) {
    if (!localById.has(remote.workspace.id)) {
      resolved.set(remote.workspace.id, remote.workspace);
      pulled = true;
    }
  }

  const workspaces = [...resolved.values()].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
  const newest = newestRemoteWorkspace(
    workspaces.map((workspace) => createCloudWorkspaceDocument(workspace)),
  )?.workspace;
  const action =
    pushed && pulled
      ? "merged"
      : pushed
        ? "pushed"
        : pulled
          ? "pulled"
          : "none";

  return {
    action,
    workspace: newest ?? null,
    workspaces,
    completedDeletionIds,
    syncedAt,
  };
}
