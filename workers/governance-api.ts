import type { D1Database } from "@cloudflare/workers-types/index";

import {
  resolveTaxGovernanceTransition,
  TAX_GOVERNANCE_ROLES,
  validateTaxGovernanceHistory,
  type TaxGovernanceEvent,
  type TaxGovernanceHistory,
  type TaxGovernanceRole,
  type TaxGovernanceStatus,
} from "../src/tax/governance";
import {
  machineIdentifierSchema,
  semverVersionSchema,
} from "../src/tax/schemas";
import {
  authorityMutationSchema,
  authorityRevocationSchema,
  D1GovernanceStore,
  governanceEventInputSchema,
  resolveServerAuthority,
  type GovernanceStore,
  type ServerAuthorityRole,
} from "./governance-storage";

export interface GovernanceEnvironment {
  readonly GOVERNANCE_BOOTSTRAP_OWNER_SUB?: string;
  readonly GOVERNANCE_DB?: D1Database;
}

interface GovernanceIdentity {
  readonly aal?: string;
  readonly sub: string;
}

interface GovernanceApiDependencies {
  readonly createStore?: (
    environment: GovernanceEnvironment,
  ) => GovernanceStore;
  readonly now?: () => string;
  readonly randomId?: () => string;
}

interface GovernanceApiContext {
  readonly environment: GovernanceEnvironment;
  readonly identity: GovernanceIdentity;
  readonly pathname: string;
  readonly request: Request;
  readonly respond: (body: unknown, status: number) => Response;
  readonly parseBody: (request: Request) => Promise<unknown>;
}

function hasRole(
  roles: readonly ServerAuthorityRole[],
  ...required: readonly ServerAuthorityRole[]
) {
  return required.some((role) => roles.includes(role));
}

function governanceRoles(
  roles: readonly ServerAuthorityRole[],
): TaxGovernanceRole[] {
  return TAX_GOVERNANCE_ROLES.filter((role) => roles.includes(role));
}

function decodePathSegment(value: string | undefined) {
  try {
    return decodeURIComponent(value ?? "");
  } catch {
    return "";
  }
}

export function createGovernanceApi(
  dependencies: GovernanceApiDependencies = {},
) {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const randomId = dependencies.randomId ?? (() => crypto.randomUUID());

  return async function handleGovernanceApi(
    context: GovernanceApiContext,
  ): Promise<Response | null> {
    if (!context.pathname.startsWith("/api/admin")) return null;

    if (context.identity.aal !== "aal2") {
      return context.respond({ error: "mfa_required" }, 403);
    }

    if (
      !context.environment.GOVERNANCE_BOOTSTRAP_OWNER_SUB ||
      (!context.environment.GOVERNANCE_DB && !dependencies.createStore)
    ) {
      return context.respond({ error: "governance_unavailable" }, 503);
    }

    const store = dependencies.createStore
      ? dependencies.createStore(context.environment)
      : new D1GovernanceStore(context.environment.GOVERNANCE_DB!);
    const roles = await resolveServerAuthority({
      bootstrapOwnerSub: context.environment.GOVERNANCE_BOOTSTRAP_OWNER_SUB,
      store,
      userId: context.identity.sub,
    });

    if (roles.length === 0) {
      return context.respond({ error: "admin_authority_required" }, 403);
    }

    if (
      context.pathname === "/api/admin/me" &&
      context.request.method === "GET"
    ) {
      return context.respond({ roles }, 200);
    }

    if (context.pathname === "/api/admin/authorities") {
      if (!hasRole(roles, "owner")) {
        return context.respond({ error: "owner_authority_required" }, 403);
      }
      if (context.request.method === "GET") {
        return context.respond(
          { authorities: await store.listAuthorities() },
          200,
        );
      }
    }

    const authorityMatch = context.pathname.match(
      /^\/api\/admin\/authorities\/([^/]+)$/,
    );
    if (
      authorityMatch &&
      (context.request.method === "PUT" || context.request.method === "DELETE")
    ) {
      if (!hasRole(roles, "owner")) {
        return context.respond({ error: "owner_authority_required" }, 403);
      }
      const targetUserId = decodePathSegment(authorityMatch[1]);
      if (!machineIdentifierSchema.safeParse(targetUserId).success) {
        return context.respond({ error: "invalid_authority_subject" }, 400);
      }
      if (
        await resolveBootstrapOwnerTarget(
          targetUserId,
          context.environment.GOVERNANCE_BOOTSTRAP_OWNER_SUB,
          store,
        )
      ) {
        return context.respond({ error: "bootstrap_owner_is_immutable" }, 409);
      }

      const body = await context.parseBody(context.request);
      if (context.request.method === "PUT") {
        const parsed = authorityMutationSchema.safeParse(body);
        if (!parsed.success) {
          return context.respond({ error: "invalid_authority_change" }, 400);
        }
        const record = await store.setAuthority({
          actorId: context.identity.sub,
          expectedVersion: parsed.data.expectedVersion,
          occurredAt: now(),
          reason: parsed.data.reason,
          roles: parsed.data.roles,
          userId: targetUserId,
        });
        if (!record) {
          return context.respond({ error: "authority_version_conflict" }, 409);
        }
        console.log(
          JSON.stringify({
            action: "authority.changed",
            actorId: context.identity.sub,
            subjectId: targetUserId,
            version: record.version,
          }),
        );
        return context.respond({ authority: record }, 200);
      }

      const parsed = authorityRevocationSchema.safeParse(body);
      if (!parsed.success) {
        return context.respond({ error: "invalid_authority_revocation" }, 400);
      }
      const record = await store.revokeAuthority({
        actorId: context.identity.sub,
        expectedVersion: parsed.data.expectedVersion,
        occurredAt: now(),
        reason: parsed.data.reason,
        userId: targetUserId,
      });
      if (!record) {
        return context.respond({ error: "authority_version_conflict" }, 409);
      }
      console.log(
        JSON.stringify({
          action: "authority.revoked",
          actorId: context.identity.sub,
          subjectId: targetUserId,
          version: record.version,
        }),
      );
      return context.respond({ authority: record }, 200);
    }

    if (
      context.pathname === "/api/admin/audit" &&
      context.request.method === "GET"
    ) {
      if (!hasRole(roles, "owner", "auditor")) {
        return context.respond({ error: "audit_authority_required" }, 403);
      }
      const requestedLimit = Number(
        new URL(context.request.url).searchParams.get("limit") ?? "50",
      );
      const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 50;
      return context.respond(
        { events: await store.listAuditEvents(limit) },
        200,
      );
    }

    const historyMatch = context.pathname.match(
      /^\/api\/admin\/tax-rules\/([^/]+)\/versions\/([^/]+)\/history$/,
    );
    if (historyMatch) {
      const ruleSetId = decodePathSegment(historyMatch[1]);
      const version = decodePathSegment(historyMatch[2]);
      if (
        !machineIdentifierSchema.safeParse(ruleSetId).success ||
        !semverVersionSchema.safeParse(version).success
      ) {
        return context.respond({ error: "invalid_rule_identity" }, 400);
      }
      if (!hasRole(roles, "owner", "auditor", ...TAX_GOVERNANCE_ROLES)) {
        return context.respond({ error: "governance_authority_required" }, 403);
      }
      const events = await store.getGovernanceHistory(ruleSetId, version);
      if (context.request.method === "GET") {
        return context.respond({ ruleSetId, version, events }, 200);
      }
      if (context.request.method === "POST") {
        const parsed = governanceEventInputSchema.safeParse(
          await context.parseBody(context.request),
        );
        if (!parsed.success) {
          return context.respond({ error: "invalid_governance_event" }, 400);
        }
        const previous = events.at(-1);
        if ((previous?.eventId ?? null) !== parsed.data.expectedEventId) {
          return context.respond({ error: "governance_history_conflict" }, 409);
        }
        const fromStatus: TaxGovernanceStatus = previous?.toStatus ?? "draft";
        const transition = resolveTaxGovernanceTransition(
          parsed.data.action,
          fromStatus,
        );
        if (!transition) {
          return context.respond(
            { error: "governance_transition_not_allowed" },
            409,
          );
        }
        const event: TaxGovernanceEvent = {
          eventId: randomId(),
          ruleSetId,
          version,
          action: parsed.data.action,
          fromStatus,
          toStatus: transition.to,
          actorId: context.identity.sub,
          actorRoles: governanceRoles(roles),
          occurredAt: now(),
          note: parsed.data.note,
          ...(parsed.data.snapshotChecksum
            ? { snapshotChecksum: parsed.data.snapshotChecksum }
            : {}),
        };
        const history: TaxGovernanceHistory = {
          schemaVersion: "1.0.0",
          ruleSetId,
          version,
          events: [...events, event],
        };
        const validation = validateTaxGovernanceHistory(history);
        if (!validation.isValid) {
          const unauthorized = validation.issues.some(
            (issue) => issue.code === "role-not-authorized",
          );
          return context.respond(
            {
              error: unauthorized
                ? "governance_role_not_authorized"
                : "invalid_governance_history",
            },
            unauthorized ? 403 : 409,
          );
        }
        const appended = await store.appendGovernanceEvent({
          event,
          expectedEventId: parsed.data.expectedEventId,
          sequence: events.length + 1,
        });
        if (!appended) {
          return context.respond({ error: "governance_history_conflict" }, 409);
        }
        console.log(
          JSON.stringify({
            action: `tax_rule.${event.action}`,
            actorId: context.identity.sub,
            eventId: event.eventId,
            ruleSetId,
            version,
          }),
        );
        return context.respond({ event }, 201);
      }
    }

    return context.respond({ error: "not_found" }, 404);
  };
}

async function resolveBootstrapOwnerTarget(
  targetUserId: string,
  bootstrapOwnerSub: string,
  store: GovernanceStore,
) {
  const targetRoles = await resolveServerAuthority({
    bootstrapOwnerSub,
    store,
    userId: targetUserId,
  });
  return targetRoles.includes("owner");
}
