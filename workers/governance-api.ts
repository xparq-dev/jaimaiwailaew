import type { D1Database } from "@cloudflare/workers-types/index";

import {
  resolveTaxGovernanceTransition,
  TAX_GOVERNANCE_ROLES,
  validateTaxGovernanceHistory,
  validateTaxPublicationCandidate,
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
import {
  artifactWriteSchema,
  prepareTaxRuleArtifact,
  readTaxRuleArtifact,
  storeImmutableTaxRuleArtifact,
  type ArtifactBucket,
} from "./tax-rule-artifacts";

export interface GovernanceEnvironment {
  readonly GOVERNANCE_BOOTSTRAP_OWNER_SUB?: string;
  readonly GOVERNANCE_DB?: D1Database;
  readonly DATA_BUCKET?: ArtifactBucket;
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

    if (
      !context.environment.GOVERNANCE_BOOTSTRAP_OWNER_SUB ||
      (!context.environment.GOVERNANCE_DB && !dependencies.createStore)
    ) {
      return context.respond({ error: "governance_unavailable" }, 503);
    }

    const store = dependencies.createStore
      ? dependencies.createStore(context.environment)
      : new D1GovernanceStore(context.environment.GOVERNANCE_DB!);

    if (
      context.pathname === "/api/admin/eligibility" &&
      context.request.method === "GET"
    ) {
      const roles = await resolveServerAuthority({
        bootstrapOwnerSub: context.environment.GOVERNANCE_BOOTSTRAP_OWNER_SUB,
        store,
        userId: context.identity.sub,
      });
      return context.respond({ eligible: roles.length > 0 }, 200);
    }

    if (context.identity.aal !== "aal2") {
      return context.respond({ error: "mfa_required" }, 403);
    }

    if (!context.environment.DATA_BUCKET) {
      return context.respond({ error: "governance_unavailable" }, 503);
    }

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

    const artifactMatch = context.pathname.match(
      /^\/api\/admin\/tax-rules\/([^/]+)\/versions\/([^/]+)\/artifact$/,
    );
    if (artifactMatch) {
      const ruleSetId = decodePathSegment(artifactMatch[1]);
      const version = decodePathSegment(artifactMatch[2]);
      if (
        !machineIdentifierSchema.safeParse(ruleSetId).success ||
        !semverVersionSchema.safeParse(version).success
      ) {
        return context.respond({ error: "invalid_rule_identity" }, 400);
      }
      if (
        !hasRole(roles, "owner", "author", "reviewer", "approver", "publisher")
      ) {
        return context.respond({ error: "governance_authority_required" }, 403);
      }

      if (context.request.method === "GET") {
        const record = await store.getTaxRuleVersion(ruleSetId, version);
        if (!record) {
          return context.respond({ ruleSet: null, version: null }, 200);
        }
        const artifact = await store.getTaxRuleArtifact(
          ruleSetId,
          version,
          record.currentChecksum,
        );
        if (!artifact) {
          return context.respond({ error: "artifact_metadata_missing" }, 503);
        }
        const ruleSet = await readTaxRuleArtifact(
          context.environment.DATA_BUCKET,
          artifact.objectKey,
        );
        if (!ruleSet) {
          return context.respond({ error: "artifact_object_missing" }, 503);
        }
        return context.respond({ ruleSet, version: record }, 200);
      }

      if (context.request.method === "PUT") {
        if (!hasRole(roles, "owner", "author")) {
          return context.respond({ error: "author_authority_required" }, 403);
        }
        const parsed = artifactWriteSchema.safeParse(
          await context.parseBody(context.request),
        );
        if (!parsed.success) {
          return context.respond({ error: "invalid_artifact_request" }, 400);
        }
        const history = await store.getGovernanceHistory(ruleSetId, version);
        const historyValidation =
          history.length === 0
            ? { currentStatus: "draft" as const, isValid: true }
            : validateTaxGovernanceHistory({
                schemaVersion: "1.0.0",
                ruleSetId,
                version,
                events: history,
              });
        if (
          !historyValidation.isValid ||
          historyValidation.currentStatus !== "draft"
        ) {
          return context.respond({ error: "artifact_edit_not_allowed" }, 409);
        }
        const artifact = await prepareTaxRuleArtifact(parsed.data.ruleSet);
        if (
          artifact.ruleSet.metadata.ruleSetId !== ruleSetId ||
          artifact.ruleSet.metadata.version !== version
        ) {
          return context.respond({ error: "artifact_identity_mismatch" }, 400);
        }
        await storeImmutableTaxRuleArtifact(
          context.environment.DATA_BUCKET,
          artifact,
        );
        const saved = await store.saveTaxRuleArtifact({
          actorId: context.identity.sub,
          artifact: {
            ruleSetId,
            version,
            checksum: artifact.checksum,
            objectKey: artifact.objectKey,
            taxYearBE: artifact.ruleSet.metadata.taxYearBE,
            schemaVersion: artifact.ruleSet.metadata.schemaVersion,
            createdAt: now(),
            createdBy: context.identity.sub,
          },
          expectedRevision: parsed.data.expectedRevision,
          occurredAt: now(),
        });
        if (!saved) {
          return context.respond({ error: "artifact_revision_conflict" }, 409);
        }
        console.log(
          JSON.stringify({
            action: "tax_rule.artifact_stored",
            actorId: context.identity.sub,
            checksum: artifact.checksum,
            revision: saved.revision,
            ruleSetId,
            version,
          }),
        );
        return context.respond(
          {
            checksum: artifact.checksum,
            ruleSet: artifact.ruleSet,
            version: saved,
          },
          200,
        );
      }
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
        if (
          event.action === "submit_for_review" ||
          event.action === "publish"
        ) {
          const current = await store.getTaxRuleVersion(ruleSetId, version);
          if (
            !event.snapshotChecksum ||
            !current ||
            current.currentChecksum !== event.snapshotChecksum
          ) {
            return context.respond(
              { error: "current_artifact_checksum_required" },
              409,
            );
          }
          if (event.action === "publish") {
            const artifact = await store.getTaxRuleArtifact(
              ruleSetId,
              version,
              event.snapshotChecksum,
            );
            const ruleSet = artifact
              ? await readTaxRuleArtifact(
                  context.environment.DATA_BUCKET,
                  artifact.objectKey,
                )
              : null;
            if (!ruleSet) {
              return context.respond({ error: "artifact_object_missing" }, 503);
            }
            const publication = validateTaxPublicationCandidate({
              governanceHistory: history,
              ruleSet,
            });
            if (!publication.isPublishable) {
              return context.respond(
                { error: "publication_not_ready", issues: publication.issues },
                409,
              );
            }
          }
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
