import { z } from "zod";

import {
  isoDateOrTimestampSchema,
  machineIdentifierSchema,
  ruleSetIdSchema,
  semverVersionSchema,
  taxRuleSetSchema,
} from "@/tax/schemas";

export const TAX_GOVERNANCE_ROLES = [
  "author",
  "reviewer",
  "approver",
  "publisher",
] as const;
export type TaxGovernanceRole = (typeof TAX_GOVERNANCE_ROLES)[number];

export const TAX_GOVERNANCE_ACTIONS = [
  "submit_for_review",
  "request_changes",
  "approve",
  "publish",
  "retire",
] as const;
export type TaxGovernanceAction = (typeof TAX_GOVERNANCE_ACTIONS)[number];

export const TAX_GOVERNANCE_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "retired",
] as const;
export type TaxGovernanceStatus = (typeof TAX_GOVERNANCE_STATUSES)[number];

export const taxGovernanceRoleSchema = z.enum(TAX_GOVERNANCE_ROLES);
export const taxGovernanceActionSchema = z.enum(TAX_GOVERNANCE_ACTIONS);
export const taxGovernanceStatusSchema = z.enum(TAX_GOVERNANCE_STATUSES);

export const taxGovernanceEventSchema = z.strictObject({
  eventId: machineIdentifierSchema,
  ruleSetId: ruleSetIdSchema,
  version: semverVersionSchema,
  action: taxGovernanceActionSchema,
  fromStatus: taxGovernanceStatusSchema,
  toStatus: taxGovernanceStatusSchema,
  actorId: machineIdentifierSchema,
  actorRoles: z.array(taxGovernanceRoleSchema).min(1),
  occurredAt: isoDateOrTimestampSchema,
  note: z.string().trim().min(1),
  snapshotChecksum: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/u, "Checksum must be a lower-case SHA-256 value.")
    .optional(),
});

export const taxGovernanceHistorySchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  ruleSetId: ruleSetIdSchema,
  version: semverVersionSchema,
  events: z.array(taxGovernanceEventSchema).min(1),
});

export type TaxGovernanceEvent = z.infer<typeof taxGovernanceEventSchema>;
export type TaxGovernanceHistory = z.infer<typeof taxGovernanceHistorySchema>;

export interface TaxGovernanceIssue {
  readonly code: string;
  readonly eventIndex: number | null;
  readonly message: string;
}

export interface TaxGovernanceValidationResult {
  readonly currentStatus: TaxGovernanceStatus | null;
  readonly isValid: boolean;
  readonly issues: readonly TaxGovernanceIssue[];
}

export interface TaxPublicationValidationResult {
  readonly isPublishable: boolean;
  readonly issues: readonly TaxGovernanceIssue[];
}

interface TransitionPolicy {
  readonly action: TaxGovernanceAction;
  readonly from: TaxGovernanceStatus;
  readonly roles: readonly TaxGovernanceRole[];
  readonly to: TaxGovernanceStatus;
}

const TRANSITION_POLICIES: readonly TransitionPolicy[] = [
  {
    action: "submit_for_review",
    from: "draft",
    roles: ["author"],
    to: "in_review",
  },
  {
    action: "request_changes",
    from: "in_review",
    roles: ["reviewer", "approver"],
    to: "draft",
  },
  {
    action: "request_changes",
    from: "approved",
    roles: ["reviewer", "approver"],
    to: "draft",
  },
  {
    action: "approve",
    from: "in_review",
    roles: ["approver"],
    to: "approved",
  },
  {
    action: "publish",
    from: "approved",
    roles: ["publisher"],
    to: "published",
  },
  {
    action: "retire",
    from: "published",
    roles: ["publisher"],
    to: "retired",
  },
];

function schemaIssues(error: z.ZodError): TaxGovernanceIssue[] {
  return error.issues.map((issue) => ({
    code: "invalid-governance-schema",
    eventIndex:
      issue.path[0] === "events" && typeof issue.path[1] === "number"
        ? issue.path[1]
        : null,
    message: `${issue.path.map(String).join(".") || "history"}: ${issue.message}`,
  }));
}

function hasAnyRole(
  actorRoles: readonly TaxGovernanceRole[],
  allowedRoles: readonly TaxGovernanceRole[],
): boolean {
  return allowedRoles.some((role) => actorRoles.includes(role));
}

function isReviewedOfficialSource(source: {
  readonly evidenceLevel: string;
  readonly lastCheckedAt: string | null;
  readonly reviewerStatus: string;
  readonly url: string | null;
}): boolean {
  return (
    ["primary_official", "secondary_official"].includes(source.evidenceLevel) &&
    source.reviewerStatus === "reviewed" &&
    Boolean(source.url) &&
    Boolean(source.lastCheckedAt)
  );
}

function validateParsedHistory(
  history: TaxGovernanceHistory,
): TaxGovernanceValidationResult {
  const issues: TaxGovernanceIssue[] = [];
  const eventIds = new Set<string>();
  let currentStatus: TaxGovernanceStatus = "draft";
  let previousTimestamp = Number.NEGATIVE_INFINITY;
  let submittedBy: string | null = null;
  let approvedBy: string | null = null;

  history.events.forEach((event, eventIndex) => {
    if (eventIds.has(event.eventId)) {
      issues.push({
        code: "duplicate-event-id",
        eventIndex,
        message: `Event ID ${event.eventId} is duplicated.`,
      });
    }
    eventIds.add(event.eventId);

    if (
      event.ruleSetId !== history.ruleSetId ||
      event.version !== history.version
    ) {
      issues.push({
        code: "history-identity-mismatch",
        eventIndex,
        message: "Event rule-set identity does not match its history.",
      });
    }

    const timestamp = Date.parse(event.occurredAt);
    if (!Number.isFinite(timestamp) || timestamp <= previousTimestamp) {
      issues.push({
        code: "non-monotonic-event-time",
        eventIndex,
        message: "Governance events must be strictly ordered by time.",
      });
    }
    previousTimestamp = timestamp;

    if (event.fromStatus !== currentStatus) {
      issues.push({
        code: "broken-status-chain",
        eventIndex,
        message: `Expected transition from ${currentStatus}, received ${event.fromStatus}.`,
      });
    }

    const policy = TRANSITION_POLICIES.find(
      (candidate) =>
        candidate.action === event.action &&
        candidate.from === event.fromStatus &&
        candidate.to === event.toStatus,
    );

    if (!policy) {
      issues.push({
        code: "transition-not-allowed",
        eventIndex,
        message: `${event.action} cannot transition ${event.fromStatus} to ${event.toStatus}.`,
      });
    } else if (!hasAnyRole(event.actorRoles, policy.roles)) {
      issues.push({
        code: "role-not-authorized",
        eventIndex,
        message: `${event.action} requires one of these roles: ${policy.roles.join(", ")}.`,
      });
    }

    if (event.action === "submit_for_review") {
      submittedBy = event.actorId;
      approvedBy = null;
    }

    if (event.action === "approve") {
      if (!submittedBy || event.actorId === submittedBy) {
        issues.push({
          code: "author-cannot-approve",
          eventIndex,
          message: "The actor who submitted a version cannot approve it.",
        });
      }
      approvedBy = event.actorId;
    }

    if (event.action === "publish") {
      if (!approvedBy || event.actorId === approvedBy) {
        issues.push({
          code: "approver-cannot-publish",
          eventIndex,
          message: "The actor who approved a version cannot publish it.",
        });
      }
      if (!event.snapshotChecksum) {
        issues.push({
          code: "publish-checksum-required",
          eventIndex,
          message: "A publish event must pin a SHA-256 snapshot checksum.",
        });
      }
    }

    if (event.action === "request_changes") {
      submittedBy = null;
      approvedBy = null;
    }

    currentStatus = event.toStatus;
  });

  return {
    currentStatus,
    isValid: issues.length === 0,
    issues,
  };
}

export function validateTaxGovernanceHistory(
  input: unknown,
): TaxGovernanceValidationResult {
  const parsed = taxGovernanceHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      currentStatus: null,
      isValid: false,
      issues: schemaIssues(parsed.error),
    };
  }
  return validateParsedHistory(parsed.data);
}

export function validateTaxPublicationCandidate(input: {
  readonly governanceHistory: unknown;
  readonly ruleSet: unknown;
}): TaxPublicationValidationResult {
  const issues: TaxGovernanceIssue[] = [];
  const parsedRuleSet = taxRuleSetSchema.safeParse(input.ruleSet);
  const parsedHistory = taxGovernanceHistorySchema.safeParse(
    input.governanceHistory,
  );

  if (!parsedRuleSet.success) {
    issues.push(
      ...parsedRuleSet.error.issues.map((issue) => ({
        code: "invalid-rule-set",
        eventIndex: null,
        message: `${issue.path.map(String).join(".") || "ruleSet"}: ${issue.message}`,
      })),
    );
  }

  if (!parsedHistory.success) {
    issues.push(...schemaIssues(parsedHistory.error));
  }

  const historyValidation = parsedHistory.success
    ? validateParsedHistory(parsedHistory.data)
    : null;
  if (historyValidation) {
    issues.push(...historyValidation.issues);
  }

  if (!parsedRuleSet.success || !parsedHistory.success) {
    return { isPublishable: false, issues };
  }

  const ruleSet = parsedRuleSet.data;
  const history = parsedHistory.data;

  if (
    ruleSet.metadata.ruleSetId !== history.ruleSetId ||
    ruleSet.metadata.version !== history.version
  ) {
    issues.push({
      code: "publication-identity-mismatch",
      eventIndex: null,
      message: "Rule-set identity does not match the governance history.",
    });
  }

  if (
    ruleSet.metadata.status !== "published" ||
    ruleSet.metadata.validationStatus !== "valid" ||
    ruleSet.metadata.notForCalculation
  ) {
    issues.push({
      code: "publication-metadata-not-ready",
      eventIndex: null,
      message:
        "Publication metadata must be published, valid, and enabled for calculation.",
    });
  }

  if (historyValidation?.currentStatus !== "published") {
    issues.push({
      code: "governance-history-not-published",
      eventIndex: null,
      message: "Governance history must end with an authorized publish event.",
    });
  }

  const publishEvent = [...history.events]
    .reverse()
    .find((event) => event.action === "publish");
  if (
    !publishEvent?.snapshotChecksum ||
    !ruleSet.metadata.canonicalChecksum ||
    publishEvent.snapshotChecksum !== ruleSet.metadata.canonicalChecksum
  ) {
    issues.push({
      code: "publication-checksum-mismatch",
      eventIndex: null,
      message:
        "Published metadata must contain the SHA-256 checksum pinned by the publish event.",
    });
  }

  if (!ruleSet.metadata.lastReviewedAt || !ruleSet.metadata.lastReviewedBy) {
    issues.push({
      code: "publication-review-record-required",
      eventIndex: null,
      message: "Published metadata must record who reviewed it and when.",
    });
  }

  const releaseChangelog = ruleSet.metadata.changelog.find(
    (entry) => entry.version === ruleSet.metadata.version,
  );
  if (!releaseChangelog) {
    issues.push({
      code: "publication-changelog-required",
      eventIndex: null,
      message: "Published metadata must include a changelog for its version.",
    });
  } else {
    const knownSourceIds = new Set(
      ruleSet.metadata.sources.map((source) => source.sourceId),
    );
    if (
      releaseChangelog.references.length === 0 ||
      releaseChangelog.references.some(
        (reference) => !knownSourceIds.has(reference.sourceId),
      )
    ) {
      issues.push({
        code: "publication-changelog-source-mismatch",
        eventIndex: null,
        message:
          "The release changelog must reference sources in the published metadata.",
      });
    }
  }

  if (ruleSet.metadata.sources.length === 0) {
    issues.push({
      code: "publication-source-required",
      eventIndex: null,
      message: "At least one reviewed official source is required.",
    });
  }

  for (const source of ruleSet.metadata.sources) {
    if (!isReviewedOfficialSource(source)) {
      issues.push({
        code: "publication-source-not-ready",
        eventIndex: null,
        message: `Source ${source.sourceId} is not a reviewed official source with URL and checked date.`,
      });
    }
  }

  if (ruleSet.manifests.length === 0) {
    issues.push({
      code: "publication-manifest-required",
      eventIndex: null,
      message: "At least one reviewed rule-family manifest is required.",
    });
  }

  for (const manifest of ruleSet.manifests) {
    if (
      manifest.status !== "published" ||
      manifest.reviewerStatus !== "reviewed" ||
      manifest.notForCalculation
    ) {
      issues.push({
        code: "publication-manifest-not-ready",
        eventIndex: null,
        message: `Manifest ${manifest.manifestId} is not ready for publication.`,
      });
    }

    if (manifest.version !== ruleSet.metadata.version) {
      issues.push({
        code: "publication-manifest-version-mismatch",
        eventIndex: null,
        message: `Manifest ${manifest.manifestId} does not use the published version.`,
      });
    }

    if (
      manifest.sources.length === 0 ||
      manifest.sources.some((source) => !isReviewedOfficialSource(source))
    ) {
      issues.push({
        code: "publication-manifest-source-not-ready",
        eventIndex: null,
        message: `Manifest ${manifest.manifestId} must cite reviewed official sources with URLs and checked dates.`,
      });
    }
  }

  return { isPublishable: issues.length === 0, issues };
}
