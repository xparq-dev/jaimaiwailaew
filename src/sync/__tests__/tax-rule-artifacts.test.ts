import { describe, expect, it } from "vitest";

import {
  prepareTaxRuleArtifact,
  storeImmutableTaxRuleArtifact,
  type ArtifactBucket,
} from "../../../workers/tax-rule-artifacts";
import manifests2569 from "../../tax/rules/2569/manifest.json";
import metadata2569 from "../../tax/rules/2569/meta.json";

class MemoryBucket implements ArtifactBucket {
  readonly values = new Map<string, string>();
  writes = 0;

  async get(key: string) {
    const value = this.values.get(key);
    return value ? { json: async <T>() => JSON.parse(value) as T } : null;
  }

  async put(key: string, value: string) {
    this.writes += 1;
    this.values.set(key, value);
    return {};
  }
}

function candidate() {
  return structuredClone({
    metadata: metadata2569,
    manifests: manifests2569,
  });
}

describe("immutable tax-rule artifacts", () => {
  it("computes a stable checksum without trusting canonicalChecksum from input", async () => {
    const first = candidate();
    const second = candidate();
    const secondWithChecksum = {
      ...second,
      metadata: {
        ...second.metadata,
        canonicalChecksum: "f".repeat(64),
      },
    };
    const reordered = {
      manifests: secondWithChecksum.manifests,
      metadata: secondWithChecksum.metadata,
    };

    const [left, right] = await Promise.all([
      prepareTaxRuleArtifact(first),
      prepareTaxRuleArtifact(reordered),
    ]);

    expect(left.checksum).toMatch(/^[a-f0-9]{64}$/u);
    expect(right.checksum).toBe(left.checksum);
    expect(left.ruleSet.metadata.canonicalChecksum).toBe(left.checksum);
    expect(left.objectKey).toContain(left.checksum);
  });

  it("does not overwrite a content-addressed object that already exists", async () => {
    const bucket = new MemoryBucket();
    const artifact = await prepareTaxRuleArtifact(candidate());

    await storeImmutableTaxRuleArtifact(bucket, artifact);
    await storeImmutableTaxRuleArtifact(bucket, artifact);

    expect(bucket.writes).toBe(1);
    expect(bucket.values).toHaveLength(1);
  });
});
