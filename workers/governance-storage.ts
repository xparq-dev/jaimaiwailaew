import type { D1Database } from "@cloudflare/workers-types/index";
import { z } from "zod";

import {
  TAX_GOVERNANCE_ROLES,
  taxGovernanceEventSchema,
  type TaxGovernanceEvent,
  type TaxGovernanceRole,
} from "../src/tax/governance";

export const ASSIGNABLE_AUTHORITY_ROLES = [
  ...TAX_GOVERNANCE_ROLES,
  "auditor",
] as const;

export type AssignableAuthorityRole =
  (typeof ASSIGNABLE_AUTHORITY_ROLES)[number];
export type ServerAuthorityRole = AssignableAuthorityRole | "owner";

export const authorityMutationSchema = z.strictObject({
  roles: z.array(z.enum(ASSIGNABLE_AUTHORITY_ROLES)).min(1),
  expectedVersion: z.number().int().min(0),
  reason: z.string().trim().min(10).max(500),
});

export const authorityRevocationSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(10).max(500),
});

export const governanceEventInputSchema = z.strictObject({
  action: z.enum([
    "submit_for_review",
    "request_changes",
    "approve",
    "publish",
    "retire",
  ]),
  expectedEventId: z.string().trim().min(1).nullable(),
  note: z.string().trim().min(10).max(1_000),
  snapshotChecksum: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/u)
    .optional(),
});

export interface AuthorityRecord {
  readonly userId: string;
  readonly roles: readonly AssignableAuthorityRole[];
  readonly active: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export interface AuditRecord {
  readonly eventId: string;
  readonly category: string;
  readonly action: string;
  readonly actorId: string;
  readonly subjectId: string;
  readonly details: unknown;
  readonly occurredAt: string;
}

export interface TaxRuleArtifactRecord {
  readonly ruleSetId: string;
  readonly version: string;
  readonly checksum: string;
  readonly objectKey: string;
  readonly taxYearBE: number;
  readonly schemaVersion: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface TaxRuleVersionRecord {
  readonly ruleSetId: string;
  readonly version: string;
  readonly currentChecksum: string;
  readonly revision: number;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly publishedChecksum: string | null;
  readonly publishedAt: string | null;
  readonly publishedBy: string | null;
}

export interface GovernanceStore {
  getAuthority(userId: string): Promise<AuthorityRecord | null>;
  listAuthorities(): Promise<readonly AuthorityRecord[]>;
  setAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly roles: readonly AssignableAuthorityRole[];
    readonly userId: string;
  }): Promise<AuthorityRecord | null>;
  revokeAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly userId: string;
  }): Promise<AuthorityRecord | null>;
  getGovernanceHistory(
    ruleSetId: string,
    version: string,
  ): Promise<readonly TaxGovernanceEvent[]>;
  appendGovernanceEvent(input: {
    readonly event: TaxGovernanceEvent;
    readonly expectedEventId: string | null;
    readonly sequence: number;
  }): Promise<boolean>;
  listAuditEvents(limit: number): Promise<readonly AuditRecord[]>;
  getTaxRuleArtifact(
    ruleSetId: string,
    version: string,
    checksum: string,
  ): Promise<TaxRuleArtifactRecord | null>;
  getTaxRuleVersion(
    ruleSetId: string,
    version: string,
  ): Promise<TaxRuleVersionRecord | null>;
  saveTaxRuleArtifact(input: {
    readonly actorId: string;
    readonly artifact: TaxRuleArtifactRecord;
    readonly expectedRevision: number;
    readonly occurredAt: string;
  }): Promise<TaxRuleVersionRecord | null>;
}

interface AuthorityRow {
  user_id: string;
  roles_json: string;
  active: number;
  version: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

interface GovernanceEventRow {
  event_id: string;
  rule_set_id: string;
  version: string;
  action: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  actor_roles_json: string;
  occurred_at: string;
  note: string;
  snapshot_checksum: string | null;
}

interface AuditRow {
  event_id: string;
  category: string;
  action: string;
  actor_id: string;
  subject_id: string;
  details_json: string;
  occurred_at: string;
}

interface ArtifactRow {
  rule_set_id: string;
  version: string;
  checksum: string;
  object_key: string;
  tax_year_be: number;
  schema_version: string;
  created_at: string;
  created_by: string;
}

interface VersionRow {
  rule_set_id: string;
  version: string;
  current_checksum: string;
  revision: number;
  updated_at: string;
  updated_by: string;
  published_checksum: string | null;
  published_at: string | null;
  published_by: string | null;
}

const storedRolesSchema = z.array(z.enum(ASSIGNABLE_AUTHORITY_ROLES)).min(1);

function authorityFromRow(row: AuthorityRow): AuthorityRecord {
  return {
    userId: row.user_id,
    roles: storedRolesSchema.parse(JSON.parse(row.roles_json)),
    active: row.active === 1,
    version: row.version,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function governanceEventFromRow(row: GovernanceEventRow): TaxGovernanceEvent {
  return taxGovernanceEventSchema.parse({
    eventId: row.event_id,
    ruleSetId: row.rule_set_id,
    version: row.version,
    action: row.action,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorId: row.actor_id,
    actorRoles: JSON.parse(row.actor_roles_json) as TaxGovernanceRole[],
    occurredAt: row.occurred_at,
    note: row.note,
    ...(row.snapshot_checksum
      ? { snapshotChecksum: row.snapshot_checksum }
      : {}),
  });
}

function auditFromRow(row: AuditRow): AuditRecord {
  return {
    eventId: row.event_id,
    category: row.category,
    action: row.action,
    actorId: row.actor_id,
    subjectId: row.subject_id,
    details: JSON.parse(row.details_json) as unknown,
    occurredAt: row.occurred_at,
  };
}

function artifactFromRow(row: ArtifactRow): TaxRuleArtifactRecord {
  return {
    ruleSetId: row.rule_set_id,
    version: row.version,
    checksum: row.checksum,
    objectKey: row.object_key,
    taxYearBE: row.tax_year_be,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function versionFromRow(row: VersionRow): TaxRuleVersionRecord {
  return {
    ruleSetId: row.rule_set_id,
    version: row.version,
    currentChecksum: row.current_checksum,
    revision: row.revision,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    publishedChecksum: row.published_checksum,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
  };
}

export class D1GovernanceStore implements GovernanceStore {
  constructor(private readonly database: D1Database) {}

  async getAuthority(userId: string) {
    const row = await this.database
      .prepare("SELECT * FROM admin_authorities WHERE user_id = ?1")
      .bind(userId)
      .first<AuthorityRow>();
    return row ? authorityFromRow(row) : null;
  }

  async listAuthorities() {
    const result = await this.database
      .prepare("SELECT * FROM admin_authorities ORDER BY user_id ASC")
      .all<AuthorityRow>();
    return result.results.map(authorityFromRow);
  }

  async setAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly roles: readonly AssignableAuthorityRole[];
    readonly userId: string;
  }) {
    const roles = JSON.stringify([...new Set(input.roles)].sort());
    const statement =
      input.expectedVersion === 0
        ? this.database
            .prepare(
              `INSERT INTO admin_authorities (
                 user_id, roles_json, active, version, created_at, created_by,
                 updated_at, updated_by, change_reason
               ) VALUES (?1, ?2, 1, 1, ?3, ?4, ?3, ?4, ?5)
               ON CONFLICT(user_id) DO NOTHING
               RETURNING *`,
            )
            .bind(
              input.userId,
              roles,
              input.occurredAt,
              input.actorId,
              input.reason,
            )
        : this.database
            .prepare(
              `UPDATE admin_authorities
               SET roles_json = ?1, active = 1, version = version + 1,
                   updated_at = ?2, updated_by = ?3, change_reason = ?4
               WHERE user_id = ?5 AND version = ?6
               RETURNING *`,
            )
            .bind(
              roles,
              input.occurredAt,
              input.actorId,
              input.reason,
              input.userId,
              input.expectedVersion,
            );
    const row = await statement.first<AuthorityRow>();
    return row ? authorityFromRow(row) : null;
  }

  async revokeAuthority(input: {
    readonly actorId: string;
    readonly expectedVersion: number;
    readonly occurredAt: string;
    readonly reason: string;
    readonly userId: string;
  }) {
    const row = await this.database
      .prepare(
        `UPDATE admin_authorities
         SET active = 0, version = version + 1, updated_at = ?1,
             updated_by = ?2, change_reason = ?3
         WHERE user_id = ?4 AND version = ?5 AND active = 1
         RETURNING *`,
      )
      .bind(
        input.occurredAt,
        input.actorId,
        input.reason,
        input.userId,
        input.expectedVersion,
      )
      .first<AuthorityRow>();
    return row ? authorityFromRow(row) : null;
  }

  async getGovernanceHistory(ruleSetId: string, version: string) {
    const result = await this.database
      .prepare(
        `SELECT * FROM tax_rule_governance_events
         WHERE rule_set_id = ?1 AND version = ?2
         ORDER BY sequence ASC`,
      )
      .bind(ruleSetId, version)
      .all<GovernanceEventRow>();
    return result.results.map(governanceEventFromRow);
  }

  async appendGovernanceEvent(input: {
    readonly event: TaxGovernanceEvent;
    readonly expectedEventId: string | null;
    readonly sequence: number;
  }) {
    const event = input.event;
    try {
      const result = await this.database
        .prepare(
          `INSERT INTO tax_rule_governance_events (
           event_id, rule_set_id, version, sequence, action, from_status,
           to_status, actor_id, actor_roles_json, occurred_at, note,
           snapshot_checksum
         )
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12
         WHERE (
           ?13 IS NULL AND NOT EXISTS (
             SELECT 1 FROM tax_rule_governance_events
             WHERE rule_set_id = ?2 AND version = ?3
           )
         ) OR (
           ?13 IS NOT NULL AND ?13 = (
             SELECT event_id FROM tax_rule_governance_events
             WHERE rule_set_id = ?2 AND version = ?3
             ORDER BY sequence DESC LIMIT 1
           )
         )`,
        )
        .bind(
          event.eventId,
          event.ruleSetId,
          event.version,
          input.sequence,
          event.action,
          event.fromStatus,
          event.toStatus,
          event.actorId,
          JSON.stringify(event.actorRoles),
          event.occurredAt,
          event.note,
          event.snapshotChecksum ?? null,
          input.expectedEventId,
        )
        .run();
      return result.meta.changes === 1;
    } catch (error) {
      // The publish trigger is the final atomic guard. A competing artifact
      // update must surface as a normal optimistic-concurrency conflict, not
      // as an internal server error.
      if (String(error).includes("publish_artifact_not_current")) {
        return false;
      }
      throw error;
    }
  }

  async listAuditEvents(limit: number) {
    const result = await this.database
      .prepare(
        `SELECT * FROM admin_audit_events
         ORDER BY occurred_at DESC, event_id DESC LIMIT ?1`,
      )
      .bind(limit)
      .all<AuditRow>();
    return result.results.map(auditFromRow);
  }

  async getTaxRuleArtifact(
    ruleSetId: string,
    version: string,
    checksum: string,
  ) {
    const row = await this.database
      .prepare(
        `SELECT * FROM tax_rule_artifacts
         WHERE rule_set_id = ?1 AND version = ?2 AND checksum = ?3`,
      )
      .bind(ruleSetId, version, checksum)
      .first<ArtifactRow>();
    return row ? artifactFromRow(row) : null;
  }

  async getTaxRuleVersion(ruleSetId: string, version: string) {
    const row = await this.database
      .prepare(
        `SELECT * FROM tax_rule_versions
         WHERE rule_set_id = ?1 AND version = ?2`,
      )
      .bind(ruleSetId, version)
      .first<VersionRow>();
    return row ? versionFromRow(row) : null;
  }

  async saveTaxRuleArtifact(input: {
    readonly actorId: string;
    readonly artifact: TaxRuleArtifactRecord;
    readonly expectedRevision: number;
    readonly occurredAt: string;
  }) {
    const artifact = input.artifact;
    const artifactStatement = this.database
      .prepare(
        `INSERT INTO tax_rule_artifacts (
           rule_set_id, version, checksum, object_key, tax_year_be,
           schema_version, created_at, created_by
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(rule_set_id, version, checksum) DO NOTHING`,
      )
      .bind(
        artifact.ruleSetId,
        artifact.version,
        artifact.checksum,
        artifact.objectKey,
        artifact.taxYearBE,
        artifact.schemaVersion,
        artifact.createdAt,
        artifact.createdBy,
      );
    const versionStatement =
      input.expectedRevision === 0
        ? this.database
            .prepare(
              `INSERT INTO tax_rule_versions (
                 rule_set_id, version, current_checksum, revision,
                 updated_at, updated_by
               ) VALUES (?1, ?2, ?3, 1, ?4, ?5)
               ON CONFLICT(rule_set_id, version) DO NOTHING
               RETURNING *`,
            )
            .bind(
              artifact.ruleSetId,
              artifact.version,
              artifact.checksum,
              input.occurredAt,
              input.actorId,
            )
        : this.database
            .prepare(
              `UPDATE tax_rule_versions
               SET current_checksum = ?1, revision = revision + 1,
                   updated_at = ?2, updated_by = ?3
               WHERE rule_set_id = ?4 AND version = ?5 AND revision = ?6
                 AND published_checksum IS NULL
               RETURNING *`,
            )
            .bind(
              artifact.checksum,
              input.occurredAt,
              input.actorId,
              artifact.ruleSetId,
              artifact.version,
              input.expectedRevision,
            );
    const [, versionResult] = await this.database.batch([
      artifactStatement,
      versionStatement,
    ]);
    const row = versionResult?.results[0] as VersionRow | undefined;
    return row ? versionFromRow(row) : null;
  }
}

async function sha256(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

async function secretValuesEqual(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([
    sha256(left),
    sha256(right),
  ]);
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (first: ArrayBuffer, second: ArrayBuffer) => boolean;
  };
  if (subtle.timingSafeEqual) {
    return subtle.timingSafeEqual(leftHash, rightHash);
  }

  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index]! ^ rightBytes[index]!;
  }
  return difference === 0;
}

export async function resolveServerAuthority(input: {
  readonly bootstrapOwnerSub: string | undefined;
  readonly store: GovernanceStore;
  readonly userId: string;
}): Promise<readonly ServerAuthorityRole[]> {
  if (
    input.bootstrapOwnerSub &&
    (await secretValuesEqual(input.userId, input.bootstrapOwnerSub))
  ) {
    return ["owner", ...ASSIGNABLE_AUTHORITY_ROLES];
  }
  const authority = await input.store.getAuthority(input.userId);
  return authority?.active ? authority.roles : [];
}
