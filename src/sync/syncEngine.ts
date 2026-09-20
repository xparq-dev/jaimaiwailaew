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
  const syncedAt = now().toISOString();

  if (!localWorkspace) {
    const remoteWorkspaces = await transport.listWorkspaces(userId);
    const newest = newestRemoteWorkspace(remoteWorkspaces);
    return newest
      ? { action: "pulled", workspace: newest.workspace, syncedAt }
      : { action: "none", workspace: null, syncedAt };
  }

  const remoteDocument = await transport.getWorkspace(localWorkspace.id);
  if (!remoteDocument) {
    await transport.putWorkspace(createCloudWorkspaceDocument(localWorkspace));
    return { action: "pushed", workspace: localWorkspace, syncedAt };
  }

  const winner = resolveLastWriteWins(localWorkspace, remoteDocument);
  if (winner === "remote") {
    return {
      action: "pulled",
      workspace: remoteDocument.workspace,
      syncedAt,
    };
  }

  if (winner === "local") {
    await transport.putWorkspace(
      createCloudWorkspaceDocument(localWorkspace, remoteDocument),
    );
    return { action: "pushed", workspace: localWorkspace, syncedAt };
  }

  return { action: "none", workspace: localWorkspace, syncedAt };
}
