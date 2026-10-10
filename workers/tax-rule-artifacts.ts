import { z } from "zod";

import { taxRuleSetSchema } from "../src/tax/schemas";
import type { TaxRuleSet } from "../src/tax/types";

export const artifactWriteSchema = z.strictObject({
  expectedRevision: z.number().int().min(0),
  ruleSet: z.unknown(),
});

export interface ArtifactObject {
  json<T>(): Promise<T>;
}

export interface ArtifactBucket {
  get(key: string): Promise<ArtifactObject | null>;
  put(
    key: string,
    value: string,
    options?: {
      onlyIf?: { etagDoesNotMatch?: string };
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
}

export interface PreparedTaxRuleArtifact {
  readonly canonicalJson: string;
  readonly checksum: string;
  readonly objectKey: string;
  readonly ruleSet: TaxRuleSet;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "canonicalChecksum")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalValue(child)]),
    );
  }
  return value;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function objectKey(ruleSetId: string, version: string, checksum: string) {
  return `governance/tax-rules/${ruleSetId}/${version}/${checksum}.json`;
}

export async function prepareTaxRuleArtifact(
  input: unknown,
): Promise<PreparedTaxRuleArtifact> {
  const parsed = taxRuleSetSchema.parse(input);
  const canonicalJson = JSON.stringify(canonicalValue(parsed));
  const checksum = await sha256Hex(canonicalJson);
  const ruleSet = taxRuleSetSchema.parse({
    ...parsed,
    metadata: { ...parsed.metadata, canonicalChecksum: checksum },
  });
  return {
    canonicalJson: JSON.stringify(ruleSet),
    checksum,
    objectKey: objectKey(
      ruleSet.metadata.ruleSetId,
      ruleSet.metadata.version,
      checksum,
    ),
    ruleSet,
  };
}

export async function storeImmutableTaxRuleArtifact(
  bucket: ArtifactBucket,
  artifact: PreparedTaxRuleArtifact,
) {
  const existing = await bucket.get(artifact.objectKey);
  if (existing) return;
  await bucket.put(artifact.objectKey, artifact.canonicalJson, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: {
      checksum: artifact.checksum,
      ruleSetId: artifact.ruleSet.metadata.ruleSetId,
      version: artifact.ruleSet.metadata.version,
    },
  });
}

export async function readTaxRuleArtifact(bucket: ArtifactBucket, key: string) {
  const object = await bucket.get(key);
  if (!object) return null;
  return taxRuleSetSchema.parse(await object.json<unknown>());
}
