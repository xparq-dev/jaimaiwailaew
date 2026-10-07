import { describe, expect, it } from "vitest";

import {
  validateTaxGovernanceHistory,
  validateTaxPublicationCandidate,
} from "@/tax/governance";
import manifests2569 from "@/tax/rules/2569/manifest.json";
import metadata2569 from "@/tax/rules/2569/meta.json";

const checksum = "a".repeat(64);

function validHistory() {
  return {
    schemaVersion: "1.0.0",
    ruleSetId: metadata2569.ruleSetId,
    version: metadata2569.version,
    events: [
      {
        eventId: "submit-v1",
        ruleSetId: metadata2569.ruleSetId,
        version: metadata2569.version,
        action: "submit_for_review",
        fromStatus: "draft",
        toStatus: "in_review",
        actorId: "rule-author",
        actorRoles: ["author"],
        occurredAt: "2026-09-20T08:00:00Z",
        note: "Submit the immutable candidate for independent review.",
      },
      {
        eventId: "approve-v1",
        ruleSetId: metadata2569.ruleSetId,
        version: metadata2569.version,
        action: "approve",
        fromStatus: "in_review",
        toStatus: "approved",
        actorId: "tax-approver",
        actorRoles: ["approver"],
        occurredAt: "2026-09-20T09:00:00Z",
        note: "Approve the reviewed official-source candidate.",
      },
      {
        eventId: "publish-v1",
        ruleSetId: metadata2569.ruleSetId,
        version: metadata2569.version,
        action: "publish",
        fromStatus: "approved",
        toStatus: "published",
        actorId: "release-publisher",
        actorRoles: ["publisher"],
        occurredAt: "2026-09-20T10:00:00Z",
        note: "Publish the checksum-pinned artifact.",
        snapshotChecksum: checksum,
      },
    ],
  };
}

function publishedRuleSet() {
  const ruleSet = structuredClone({
    metadata: metadata2569,
    manifests: manifests2569,
  });
  return {
    ...ruleSet,
    metadata: {
      ...ruleSet.metadata,
      canonicalChecksum: checksum,
    },
  };
}

describe("tax governance history", () => {
  it("accepts an ordered four-eyes submit, approve, and publish workflow", () => {
    const result = validateTaxGovernanceHistory(validHistory());

    expect(result).toEqual({
      currentStatus: "published",
      isValid: true,
      issues: [],
    });
  });

  it("rejects self-approval and self-publication", () => {
    const history = validHistory();
    history.events[1]!.actorId = "rule-author";
    history.events[2]!.actorId = "rule-author";

    const result = validateTaxGovernanceHistory(history);

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "author-cannot-approve",
        "approver-cannot-publish",
      ]),
    );
  });

  it("rejects unauthorized, broken, duplicated, and unordered events", () => {
    const history = validHistory();
    history.events[1]!.actorRoles = ["author"];
    history.events[1]!.fromStatus = "draft";
    history.events[1]!.eventId = "submit-v1";
    history.events[1]!.occurredAt = "2026-09-20T07:00:00Z";

    const result = validateTaxGovernanceHistory(history);
    const issueCodes = result.issues.map((issue) => issue.code);

    expect(issueCodes).toEqual(
      expect.arrayContaining([
        "duplicate-event-id",
        "non-monotonic-event-time",
        "broken-status-chain",
        "transition-not-allowed",
      ]),
    );
  });

  it("requires a checksum when a version is published", () => {
    const history = validHistory();
    delete history.events[2]!.snapshotChecksum;

    const result = validateTaxGovernanceHistory(history);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "publish-checksum-required" }),
    );
  });

  it("rejects an actor without the role required by the transition", () => {
    const history = validHistory();
    history.events[1]!.actorRoles = ["reviewer"];

    const result = validateTaxGovernanceHistory(history);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "role-not-authorized" }),
    );
  });

  it("supports request changes followed by a fresh review cycle", () => {
    const history = validHistory();
    history.events.splice(
      1,
      0,
      {
        eventId: "request-changes-v1",
        ruleSetId: metadata2569.ruleSetId,
        version: metadata2569.version,
        action: "request_changes",
        fromStatus: "in_review",
        toStatus: "draft",
        actorId: "tax-reviewer",
        actorRoles: ["reviewer"],
        occurredAt: "2026-09-20T08:15:00Z",
        note: "Request corrected source notes.",
      },
      {
        eventId: "resubmit-v1",
        ruleSetId: metadata2569.ruleSetId,
        version: metadata2569.version,
        action: "submit_for_review",
        fromStatus: "draft",
        toStatus: "in_review",
        actorId: "rule-author",
        actorRoles: ["author"],
        occurredAt: "2026-09-20T08:30:00Z",
        note: "Resubmit the corrected immutable candidate.",
      },
    );

    expect(validateTaxGovernanceHistory(history).isValid).toBe(true);
  });
});

describe("tax publication gate", () => {
  it("accepts a schema-valid published artifact with reviewed official sources", () => {
    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet: publishedRuleSet(),
    });

    expect(result).toEqual({ isPublishable: true, issues: [] });
  });

  it("fails closed when source evidence is not reviewed and official", () => {
    const ruleSet = publishedRuleSet();
    ruleSet.metadata.sources[0]!.evidenceLevel = "professional_review";
    ruleSet.metadata.sources[0]!.reviewerStatus = "under_review";

    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "publication-source-not-ready" }),
    );
  });

  it("fails closed when a family manifest has no reviewed official source", () => {
    const ruleSet = publishedRuleSet();
    ruleSet.manifests[0]!.sources = [];

    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "publication-manifest-source-not-ready",
      }),
    );
  });

  it("fails closed when the published artifact checksum does not match", () => {
    const ruleSet = publishedRuleSet();
    ruleSet.metadata.canonicalChecksum = "b".repeat(64);

    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "publication-checksum-mismatch" }),
    );
  });

  it("fails closed when the release changelog does not reference a known source", () => {
    const ruleSet = publishedRuleSet();
    const releaseEntry = ruleSet.metadata.changelog.find(
      (entry) => entry.version === ruleSet.metadata.version,
    );
    expect(releaseEntry).toBeDefined();
    releaseEntry!.references = [];

    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "publication-changelog-source-mismatch",
      }),
    );
  });

  it("fails closed when a manifest version differs from the release", () => {
    const ruleSet = publishedRuleSet();
    ruleSet.manifests[0]!.version = "2.0.0";

    const result = validateTaxPublicationCandidate({
      governanceHistory: validHistory(),
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "publication-manifest-version-mismatch",
      }),
    );
  });

  it("fails closed for invalid metadata or a mismatched governance identity", () => {
    const ruleSet = publishedRuleSet();
    ruleSet.metadata.validationStatus = "blocked";
    const history = validHistory();
    history.version = "2.0.0";

    const result = validateTaxPublicationCandidate({
      governanceHistory: history,
      ruleSet,
    });

    expect(result.isPublishable).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["invalid-rule-set", "history-identity-mismatch"]),
    );
  });
});
