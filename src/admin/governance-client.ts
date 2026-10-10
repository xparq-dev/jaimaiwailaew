import { z } from "zod";

import {
  taxGovernanceEventSchema,
  type TaxGovernanceAction,
} from "@/tax/governance";
import { taxRuleSetSchema } from "@/tax/schemas";

const apiUrl = process.env.NEXT_PUBLIC_CLOUD_SYNC_API_URL?.replace(/\/$/, "");
const testMode = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "1";

const adminRoleSchema = z.enum([
  "owner",
  "auditor",
  "author",
  "reviewer",
  "approver",
  "publisher",
]);

const versionRecordSchema = z.strictObject({
  ruleSetId: z.string(),
  version: z.string(),
  currentChecksum: z.string(),
  revision: z.number().int().positive(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  publishedChecksum: z.string().nullable(),
  publishedAt: z.string().nullable(),
  publishedBy: z.string().nullable(),
});

const authorityRecordSchema = z.strictObject({
  userId: z.string(),
  roles: z.array(adminRoleSchema.exclude(["owner"])),
  active: z.boolean(),
  version: z.number().int().positive(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

const artifactResponseSchema = z.strictObject({
  ruleSet: taxRuleSetSchema.nullable(),
  version: versionRecordSchema.nullable(),
});

const eligibilityResponseSchema = z.strictObject({
  eligible: z.boolean(),
});

const auditRecordSchema = z.strictObject({
  eventId: z.string(),
  category: z.string(),
  action: z.string(),
  actorId: z.string(),
  subjectId: z.string(),
  details: z.record(z.string(), z.unknown()),
  occurredAt: z.string(),
});

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type TaxRuleVersionRecord = z.infer<typeof versionRecordSchema>;
export type TaxRuleArtifactResponse = z.infer<typeof artifactResponseSchema>;
export type AdminAuditRecord = z.infer<typeof auditRecordSchema>;

interface ErrorBody {
  readonly error?: string;
  readonly issues?: readonly {
    readonly code?: string;
    readonly message?: string;
  }[];
}

export class AdminApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly issues: readonly {
      readonly code?: string;
      readonly message?: string;
    }[] = [],
  ) {
    super(code);
    this.name = "AdminApiError";
  }
}

export class AdminGovernanceClient {
  constructor(private readonly getAccessToken: () => Promise<string | null>) {}

  private async request(path: string, init?: RequestInit) {
    if (!apiUrl) throw new AdminApiError("admin_api_unconfigured", 503);
    const token = await this.getAccessToken();
    if (!token) throw new AdminApiError("authentication_required", 401);
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      let body: ErrorBody = {};
      try {
        body = (await response.json()) as ErrorBody;
      } catch {
        // Keep the status-only fallback.
      }
      throw new AdminApiError(
        body.error ?? "admin_request_failed",
        response.status,
        body.issues ?? [],
      );
    }
    return response;
  }

  async getEligibility() {
    if (testMode) {
      const override =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem("jaimaiwailaew:e2e:admin-eligible");
      return { eligible: override !== "0" };
    }
    const response = await this.request("/api/admin/eligibility");
    return eligibilityResponseSchema.parse(await response.json());
  }

  async getMe() {
    if (testMode) {
      return {
        roles: [
          "owner",
          "auditor",
          "author",
          "reviewer",
          "approver",
          "publisher",
        ] as AdminRole[],
      };
    }
    const response = await this.request("/api/admin/me");
    return z
      .strictObject({ roles: z.array(adminRoleSchema) })
      .parse(await response.json());
  }

  async listAuthorities() {
    if (testMode) return { authorities: [] };
    const response = await this.request("/api/admin/authorities");
    return z
      .strictObject({ authorities: z.array(authorityRecordSchema) })
      .parse(await response.json());
  }

  async getAuditEvents(limit = 50) {
    if (testMode) return { events: [] as AdminAuditRecord[] };
    const response = await this.request(
      `/api/admin/audit?limit=${encodeURIComponent(String(limit))}`,
    );
    return z
      .strictObject({ events: z.array(auditRecordSchema) })
      .parse(await response.json());
  }

  async setAuthority(input: {
    readonly expectedVersion: number;
    readonly reason: string;
    readonly roles: readonly Exclude<AdminRole, "owner">[];
    readonly userId: string;
  }) {
    const response = await this.request(
      `/api/admin/authorities/${encodeURIComponent(input.userId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          expectedVersion: input.expectedVersion,
          reason: input.reason,
          roles: input.roles,
        }),
      },
    );
    return z
      .strictObject({ authority: authorityRecordSchema })
      .parse(await response.json());
  }

  async revokeAuthority(input: {
    readonly expectedVersion: number;
    readonly reason: string;
    readonly userId: string;
  }) {
    const response = await this.request(
      `/api/admin/authorities/${encodeURIComponent(input.userId)}`,
      {
        method: "DELETE",
        body: JSON.stringify({
          expectedVersion: input.expectedVersion,
          reason: input.reason,
        }),
      },
    );
    return z
      .strictObject({ authority: authorityRecordSchema })
      .parse(await response.json());
  }

  async getArtifact(ruleSetId: string, version: string) {
    if (testMode) return { ruleSet: null, version: null };
    const response = await this.request(
      `/api/admin/tax-rules/${encodeURIComponent(ruleSetId)}/versions/${encodeURIComponent(version)}/artifact`,
    );
    return artifactResponseSchema.parse(await response.json());
  }

  async saveArtifact(input: {
    readonly expectedRevision: number;
    readonly ruleSet: unknown;
    readonly ruleSetId: string;
    readonly version: string;
  }) {
    if (testMode) {
      const checksum = "a".repeat(64);
      const ruleSet = taxRuleSetSchema.parse({
        ...(input.ruleSet as object),
        metadata: {
          ...(input.ruleSet as { metadata?: object }).metadata,
          canonicalChecksum: checksum,
        },
      });
      return {
        checksum,
        ruleSet,
        version: versionRecordSchema.parse({
          ruleSetId: input.ruleSetId,
          version: input.version,
          currentChecksum: checksum,
          revision: input.expectedRevision + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: "e2e-user",
          publishedChecksum: null,
          publishedAt: null,
          publishedBy: null,
        }),
      };
    }
    const response = await this.request(
      `/api/admin/tax-rules/${encodeURIComponent(input.ruleSetId)}/versions/${encodeURIComponent(input.version)}/artifact`,
      {
        method: "PUT",
        body: JSON.stringify({
          expectedRevision: input.expectedRevision,
          ruleSet: input.ruleSet,
        }),
      },
    );
    return z
      .strictObject({
        checksum: z.string(),
        ruleSet: taxRuleSetSchema,
        version: versionRecordSchema,
      })
      .parse(await response.json());
  }

  async getHistory(ruleSetId: string, version: string) {
    if (testMode) return { ruleSetId, version, events: [] };
    const response = await this.request(
      `/api/admin/tax-rules/${encodeURIComponent(ruleSetId)}/versions/${encodeURIComponent(version)}/history`,
    );
    return z
      .strictObject({
        ruleSetId: z.string(),
        version: z.string(),
        events: z.array(taxGovernanceEventSchema),
      })
      .parse(await response.json());
  }

  async appendEvent(input: {
    readonly action: TaxGovernanceAction;
    readonly expectedEventId: string | null;
    readonly note: string;
    readonly ruleSetId: string;
    readonly snapshotChecksum?: string;
    readonly version: string;
  }) {
    const response = await this.request(
      `/api/admin/tax-rules/${encodeURIComponent(input.ruleSetId)}/versions/${encodeURIComponent(input.version)}/history`,
      {
        method: "POST",
        body: JSON.stringify({
          action: input.action,
          expectedEventId: input.expectedEventId,
          note: input.note,
          ...(input.snapshotChecksum
            ? { snapshotChecksum: input.snapshotChecksum }
            : {}),
        }),
      },
    );
    return z
      .strictObject({ event: taxGovernanceEventSchema })
      .parse(await response.json());
  }
}
