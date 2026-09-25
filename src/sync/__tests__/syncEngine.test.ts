import { describe, expect, it, vi } from "vitest";

import type { CalculatorWorkspace } from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";

import {
  createCloudWorkspaceDocument,
  syncWorkspace,
  syncWorkspaces,
} from "../syncEngine";
import type { CloudSyncTransport, CloudWorkspaceDocument } from "../types";

function workspace(id: string, updatedAt: string): CalculatorWorkspace {
  return {
    ...createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    ),
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt,
  };
}

function transportFixture(
  documents: readonly CloudWorkspaceDocument[] = [],
  deletionIds: readonly string[] = [],
): CloudSyncTransport {
  return {
    listWorkspaceSnapshot: vi.fn().mockResolvedValue({
      workspaces: documents,
      deletions: deletionIds.map((workspaceId) => ({
        workspaceId,
        deletedAt: "2026-09-20T12:00:00.000Z",
      })),
    }),
    getWorkspace: vi
      .fn()
      .mockImplementation(
        async (id: string) =>
          documents.find((item) => item.workspace.id === id) ?? null,
      ),
    putWorkspace: vi.fn().mockResolvedValue(undefined),
    deleteWorkspace: vi
      .fn()
      .mockImplementation(async (workspaceId: string) => ({
        workspaceId,
        deletedAt: "2026-09-20T12:00:00.000Z",
      })),
  };
}

const now = () => new Date("2026-09-20T12:00:00.000Z");

describe("syncWorkspace Last-Write-Wins", () => {
  it("pushes a local workspace that does not exist in R2", async () => {
    const local = workspace("workspace-a", "2026-09-20T10:00:00.000Z");
    const transport = transportFixture();

    const result = await syncWorkspace({
      userId: "user-a",
      localWorkspace: local,
      transport,
      now,
    });

    expect(result.action).toBe("pushed");
    expect(transport.putWorkspace).toHaveBeenCalledWith(
      createCloudWorkspaceDocument(local),
    );
  });

  it("pulls the remote copy when it is newer", async () => {
    const local = workspace("workspace-a", "2026-09-20T10:00:00.000Z");
    const remote = createCloudWorkspaceDocument(
      workspace("workspace-a", "2026-09-20T11:00:00.000Z"),
    );

    const result = await syncWorkspace({
      userId: "user-a",
      localWorkspace: local,
      transport: transportFixture([remote]),
      now,
    });

    expect(result.action).toBe("pulled");
    expect(result.workspace?.updatedAt).toBe("2026-09-20T11:00:00.000Z");
  });

  it("pushes the local copy when it is newer", async () => {
    const local = workspace("workspace-a", "2026-09-20T12:00:00.000Z");
    const remote = createCloudWorkspaceDocument(
      workspace("workspace-a", "2026-09-20T11:00:00.000Z"),
    );
    const transport = transportFixture([remote]);

    const result = await syncWorkspace({
      userId: "user-a",
      localWorkspace: local,
      transport,
      now,
    });

    expect(result.action).toBe("pushed");
    expect(transport.putWorkspace).toHaveBeenCalledOnce();
  });

  it("does nothing when both copies have the same update time", async () => {
    const local = workspace("workspace-a", "2026-09-20T12:00:00.000Z");
    const transport = transportFixture([createCloudWorkspaceDocument(local)]);

    const result = await syncWorkspace({
      userId: "user-a",
      localWorkspace: local,
      transport,
      now,
    });

    expect(result.action).toBe("none");
    expect(transport.putWorkspace).not.toHaveBeenCalled();
  });

  it("restores the newest remote workspace when the device has none", async () => {
    const older = createCloudWorkspaceDocument(
      workspace("older", "2026-09-19T12:00:00.000Z"),
    );
    const newest = createCloudWorkspaceDocument(
      workspace("newest", "2026-09-20T12:00:00.000Z"),
    );

    const result = await syncWorkspace({
      userId: "user-a",
      localWorkspace: null,
      transport: transportFixture([older, newest]),
      now,
    });

    expect(result.action).toBe("pulled");
    expect(result.workspace?.id).toBe("newest");
    expect(result.workspaces.map((item) => item.id)).toEqual([
      "newest",
      "older",
    ]);
  });

  it("merges and synchronizes every local and remote workspace by id", async () => {
    const localOnly = workspace("local-only", "2026-09-20T10:00:00.000Z");
    const newerLocal = workspace("shared", "2026-09-20T12:00:00.000Z");
    const olderRemote = createCloudWorkspaceDocument(
      workspace("shared", "2026-09-20T11:00:00.000Z"),
    );
    const remoteOnly = createCloudWorkspaceDocument(
      workspace("remote-only", "2026-09-20T09:00:00.000Z"),
    );
    const transport = transportFixture([olderRemote, remoteOnly]);

    const result = await syncWorkspaces({
      userId: "user-a",
      localWorkspaces: [localOnly, newerLocal],
      transport,
      now,
    });

    expect(result.action).toBe("merged");
    expect(result.workspaces.map((item) => item.id).sort()).toEqual([
      "local-only",
      "remote-only",
      "shared",
    ]);
    expect(transport.putWorkspace).toHaveBeenCalledTimes(2);
  });

  it("propagates queued deletions and never resurrects a tombstoned workspace", async () => {
    const deleted = workspace("deleted-workspace", "2026-09-20T11:00:00.000Z");
    const active = workspace("active-workspace", "2026-09-20T12:00:00.000Z");
    const transport = transportFixture(
      [createCloudWorkspaceDocument(active)],
      [deleted.id],
    );

    const result = await syncWorkspaces({
      userId: "user-a",
      localWorkspaces: [active, deleted],
      pendingDeletionIds: [deleted.id],
      transport,
      now,
    });

    expect(transport.deleteWorkspace).toHaveBeenCalledWith(deleted.id);
    expect(transport.putWorkspace).not.toHaveBeenCalled();
    expect(result.completedDeletionIds).toEqual([deleted.id]);
    expect(result.workspaces.map((item) => item.id)).toEqual([active.id]);
  });
});
