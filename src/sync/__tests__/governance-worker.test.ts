import { describe, expect, it } from "vitest";

import { createGovernanceApi } from "../../../workers/governance-api";
import type {
  AssignableAuthorityRole,
  AuditRecord,
  AuthorityRecord,
  GovernanceStore,
} from "../../../workers/governance-storage";
import {
  createWorkerHandler,
  type R2BucketLike,
  type WorkerEnvironment,
} from "../../../workers/index";
import type { TaxGovernanceEvent } from "../../tax/governance";

class MemoryGovernanceStore implements GovernanceStore {
  readonly authorities = new Map<string, AuthorityRecord>();
  readonly histories = new Map<string, TaxGovernanceEvent[]>();
  readonly audit: AuditRecord[] = [];

  async getAuthority(userId: string) {
    return this.authorities.get(userId) ?? null;
  }

  async listAuthorities() {
    return [...this.authorities.values()];
  }

  async setAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly roles: readonly AssignableAuthorityRole[];
    readonly userId: string;
  }) {
    const existing = this.authorities.get(input.userId);
    if ((existing?.version ?? 0) !== input.expectedVersion) return null;
    const record: AuthorityRecord = {
      userId: input.userId,
      roles: input.roles,
      active: true,
      version: input.expectedVersion + 1,
      createdAt: existing?.createdAt ?? input.occurredAt,
      createdBy: existing?.createdBy ?? input.actorId,
      updatedAt: input.occurredAt,
      updatedBy: input.actorId,
    };
    this.authorities.set(input.userId, record);
    this.audit.unshift({
      eventId: `authority:${input.userId}:${record.version}`,
      category: "authority",
      action: existing ? "authority.updated" : "authority.assigned",
      actorId: input.actorId,
      subjectId: input.userId,
      details: { reason: input.reason, roles: input.roles },
      occurredAt: input.occurredAt,
    });
    return record;
  }

  async revokeAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly userId: string;
  }) {
    const existing = this.authorities.get(input.userId);
    if (!existing?.active || existing.version !== input.expectedVersion) {
      return null;
    }
    const record = {
      ...existing,
      active: false,
      version: existing.version + 1,
      updatedAt: input.occurredAt,
      updatedBy: input.actorId,
    };
    this.authorities.set(input.userId, record);
    this.audit.unshift({
      eventId: `authority:${input.userId}:${record.version}`,
      category: "authority",
      action: "authority.revoked",
      actorId: input.actorId,
      subjectId: input.userId,
      details: { reason: input.reason },
      occurredAt: input.occurredAt,
    });
    return record;
  }

  async getGovernanceHistory(ruleSetId: string, version: string) {
    return this.histories.get(`${ruleSetId}@${version}`) ?? [];
  }

  async appendGovernanceEvent(input: {
    readonly event: TaxGovernanceEvent;
    readonly expectedEventId: string | null;
    readonly sequence: number;
  }) {
    const key = `${input.event.ruleSetId}@${input.event.version}`;
    const events = this.histories.get(key) ?? [];
    if ((events.at(-1)?.eventId ?? null) !== input.expectedEventId)
      return false;
    if (input.sequence !== events.length + 1) return false;
    this.histories.set(key, [...events, input.event]);
    this.audit.unshift({
      eventId: `governance:${input.event.eventId}`,
      category: "tax_rule_governance",
      action: `tax_rule.${input.event.action}`,
      actorId: input.event.actorId,
      subjectId: key,
      details: { sequence: input.sequence },
      occurredAt: input.event.occurredAt,
    });
    return true;
  }

  async listAuditEvents(limit: number) {
    return this.audit.slice(0, limit);
  }
}

function environment(): WorkerEnvironment {
  return {
    DATA_BUCKET: {} as R2BucketLike,
    GOVERNANCE_BOOTSTRAP_OWNER_SUB: "owner-user",
    SUPABASE_URL: "https://example.supabase.co",
    ALLOWED_ORIGIN: "https://jaimaiwailaew.vercel.app",
  };
}

function request(userId: string, path: string, init?: RequestInit) {
  return new Request(`https://sync.example${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${userId}`,
      Origin: "https://jaimaiwailaew.vercel.app",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

function testSystem(aal = "aal2") {
  const store = new MemoryGovernanceStore();
  let tick = 0;
  const handleGovernanceApi = createGovernanceApi({
    createStore: () => store,
    now: () => `2026-10-07T10:0${tick++}:00.000Z`,
    randomId: () => `event-${tick}`,
  });
  const handler = createWorkerHandler({
    handleGovernanceApi,
    verifyToken: async (token) => ({ aal, sub: token }),
  });
  return { handler, store };
}

async function assign(
  handler: ReturnType<typeof createWorkerHandler>,
  userId: string,
  roles: readonly AssignableAuthorityRole[],
) {
  return handler.fetch(
    request("owner-user", `/api/admin/authorities/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        expectedVersion: 0,
        reason: `Assign required governance role to ${userId}`,
        roles,
      }),
    }),
    environment(),
  );
}

describe("server-side governance authority", () => {
  it("requires an AAL2 session before any admin storage access", async () => {
    const { handler, store } = testSystem("aal1");
    const response = await handler.fetch(
      request("owner-user", "/api/admin/me"),
      environment(),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "mfa_required" });
    expect(store.authorities.size).toBe(0);
  });

  it("resolves the bootstrap owner only from the server secret", async () => {
    const { handler } = testSystem();
    const owner = await handler.fetch(
      request("owner-user", "/api/admin/me"),
      environment(),
    );
    const stranger = await handler.fetch(
      request("stranger", "/api/admin/me"),
      environment(),
    );

    expect(owner.status).toBe(200);
    expect(await owner.json()).toEqual({
      roles: expect.arrayContaining(["owner", "approver", "publisher"]),
    });
    expect(stranger.status).toBe(403);
    expect(await stranger.json()).toEqual({
      error: "admin_authority_required",
    });
  });

  it("assigns and revokes roles with optimistic version checks and audit", async () => {
    const { handler, store } = testSystem();
    const assigned = await assign(handler, "review-user", ["reviewer"]);
    expect(assigned.status).toBe(200);

    const stale = await assign(handler, "review-user", ["approver"]);
    expect(stale.status).toBe(409);

    const revoked = await handler.fetch(
      request("owner-user", "/api/admin/authorities/review-user", {
        method: "DELETE",
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Reviewer access is no longer required",
        }),
      }),
      environment(),
    );
    expect(revoked.status).toBe(200);
    expect((await store.getAuthority("review-user"))?.active).toBe(false);
    expect(store.audit.map((event) => event.action)).toEqual([
      "authority.revoked",
      "authority.assigned",
    ]);
  });

  it("never permits the bootstrap owner to be changed through the API", async () => {
    const { handler } = testSystem();
    const response = await handler.fetch(
      request("owner-user", "/api/admin/authorities/owner-user", {
        method: "DELETE",
        body: JSON.stringify({
          expectedVersion: 1,
          reason: "Attempt to revoke immutable bootstrap owner",
        }),
      }),
      environment(),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "bootstrap_owner_is_immutable",
    });
  });
});

describe("server-side tax rule governance history", () => {
  it("derives actor identity and roles on the server through publish", async () => {
    const { handler, store } = testSystem();
    await assign(handler, "author-user", ["author"]);
    await assign(handler, "approver-user", ["approver"]);
    await assign(handler, "publisher-user", ["publisher"]);
    const path = "/api/admin/tax-rules/th-pit-2569-next/versions/1.0.0/history";

    const submitted = await handler.fetch(
      request("author-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "submit_for_review",
          expectedEventId: null,
          note: "Submit immutable candidate for independent review",
        }),
      }),
      environment(),
    );
    expect(submitted.status).toBe(201);
    const submitEvent = (await submitted.json()) as {
      event: TaxGovernanceEvent;
    };
    expect(submitEvent.event.actorId).toBe("author-user");

    const approved = await handler.fetch(
      request("approver-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          expectedEventId: submitEvent.event.eventId,
          note: "Approve independently reviewed official-source candidate",
        }),
      }),
      environment(),
    );
    expect(approved.status).toBe(201);
    const approveEvent = (await approved.json()) as {
      event: TaxGovernanceEvent;
    };

    const published = await handler.fetch(
      request("publisher-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "publish",
          expectedEventId: approveEvent.event.eventId,
          note: "Publish checksum-pinned approved tax rule artifact",
          snapshotChecksum: "a".repeat(64),
        }),
      }),
      environment(),
    );
    expect(published.status).toBe(201);
    expect(
      await store.getGovernanceHistory("th-pit-2569-next", "1.0.0"),
    ).toHaveLength(3);
  });

  it("rejects unauthorized roles, self-approval, and stale history heads", async () => {
    const { handler } = testSystem();
    await assign(handler, "mixed-user", ["author", "approver"]);
    await assign(handler, "review-user", ["reviewer"]);
    const path = "/api/admin/tax-rules/th-pit-2569-next/versions/1.0.0/history";

    const submitted = await handler.fetch(
      request("mixed-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "submit_for_review",
          expectedEventId: null,
          note: "Submit candidate that requires independent approval",
        }),
      }),
      environment(),
    );
    const submitEvent = (await submitted.json()) as {
      event: TaxGovernanceEvent;
    };

    const selfApproval = await handler.fetch(
      request("mixed-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          expectedEventId: submitEvent.event.eventId,
          note: "This self approval must be rejected by policy",
        }),
      }),
      environment(),
    );
    expect(selfApproval.status).toBe(409);

    const unauthorized = await handler.fetch(
      request("review-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          expectedEventId: submitEvent.event.eventId,
          note: "Reviewer does not hold the approver authority role",
        }),
      }),
      environment(),
    );
    expect(unauthorized.status).toBe(403);

    const stale = await handler.fetch(
      request("review-user", path, {
        method: "POST",
        body: JSON.stringify({
          action: "request_changes",
          expectedEventId: null,
          note: "Stale browser state must not append a new event",
        }),
      }),
      environment(),
    );
    expect(stale.status).toBe(409);
  });
});
