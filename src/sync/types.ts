import { z } from "zod";

import { calculatorWorkspaceSchema } from "@/calculator/schemas";
import type { CalculatorWorkspace } from "@/calculator/types";

export const customCategorySchema = z.strictObject({
  id: z.string().trim().min(1).max(120),
  workspaceId: z.string().trim().min(1).max(120),
  kind: z.enum(["income", "expense"]),
  label: z.string().trim().min(1).max(120),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const cloudWorkspaceDocumentSchema = z.strictObject({
  version: z.literal(1),
  workspace: calculatorWorkspaceSchema,
  customCategories: z.array(customCategorySchema).default([]),
  updatedAt: z.string().datetime({ offset: true }),
});

export const cloudWorkspaceDeletionSchema = z.strictObject({
  workspaceId: z.string().trim().min(1).max(120),
  deletedAt: z.string().datetime({ offset: true }),
});

export const cloudWorkspaceListResponseSchema = z.strictObject({
  workspaces: z.array(cloudWorkspaceDocumentSchema),
  deletions: z.array(cloudWorkspaceDeletionSchema).default([]),
});

export type CustomCategory = z.infer<typeof customCategorySchema>;
export type CloudWorkspaceDocument = z.infer<
  typeof cloudWorkspaceDocumentSchema
>;
export type CloudWorkspaceDeletion = z.infer<
  typeof cloudWorkspaceDeletionSchema
>;
export type CloudWorkspaceSnapshot = z.infer<
  typeof cloudWorkspaceListResponseSchema
>;

export type CloudSyncStatus =
  | "disabled"
  | "auth_required"
  | "config_missing"
  | "offline"
  | "idle"
  | "syncing"
  | "synced"
  | "error";

export interface CloudSyncTransport {
  listWorkspaceSnapshot(userId: string): Promise<CloudWorkspaceSnapshot>;
  getWorkspace(workspaceId: string): Promise<CloudWorkspaceDocument | null>;
  putWorkspace(document: CloudWorkspaceDocument): Promise<void>;
  deleteWorkspace(workspaceId: string): Promise<CloudWorkspaceDeletion>;
}

export interface SyncResult {
  readonly action: "none" | "pushed" | "pulled" | "merged";
  readonly workspace: CalculatorWorkspace | null;
  readonly workspaces: readonly CalculatorWorkspace[];
  readonly completedDeletionIds: readonly string[];
  readonly syncedAt: string;
}
