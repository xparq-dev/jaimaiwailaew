import { resolveTaxRules } from "@/tax/engine/taxRuleResolver";
import {
  SUPPORTED_TAX_YEARS_BE,
  type EvidenceLevel,
  type TaxCalculationScope,
} from "@/tax/types";

export interface TaxRuleSourceRegistrySource {
  readonly authority: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly lastCheckedAt: string | null;
  readonly title: string;
  readonly url: string;
}

export interface TaxRuleSourceRegistryYear {
  readonly calculationAvailable: boolean;
  readonly lastReviewedAt: string | null;
  readonly scope: readonly TaxCalculationScope[];
  readonly sources: readonly TaxRuleSourceRegistrySource[];
  readonly taxYearBE: number;
  readonly taxYearCE: number | null;
  readonly version: string | null;
}

function sourceKey(source: TaxRuleSourceRegistrySource): string {
  return `${source.url}\u0000${source.title}`;
}

/**
 * A public, read-only projection of the local rule registry.
 *
 * Intentionally omits rule-set, source, workspace and reviewer identifiers.
 * The page using this projection is a transparency view, not a tax-rule editor
 * or an administrator audit surface.
 */
export function getTaxRuleSourceRegistry(): readonly TaxRuleSourceRegistryYear[] {
  return SUPPORTED_TAX_YEARS_BE.map((taxYearBE) => {
    const resolution = resolveTaxRules({ taxYearBE });
    const metadata = resolution.metadata;

    if (!metadata) {
      return {
        calculationAvailable: false,
        lastReviewedAt: null,
        scope: [],
        sources: [],
        taxYearBE,
        taxYearCE: null,
        version: null,
      };
    }

    const uniqueSources = new Map<string, TaxRuleSourceRegistrySource>();
    for (const source of metadata.sources) {
      if (!source.url) {
        continue;
      }

      const publicSource: TaxRuleSourceRegistrySource = {
        authority: source.authority,
        evidenceLevel: source.evidenceLevel,
        lastCheckedAt: source.lastCheckedAt,
        title: source.title,
        url: source.url,
      };
      uniqueSources.set(sourceKey(publicSource), publicSource);
    }

    return {
      calculationAvailable:
        resolution.availability === "available" &&
        resolution.featureGates.taxEstimate === "available",
      lastReviewedAt: metadata.lastReviewedAt,
      scope: metadata.scope,
      sources: [...uniqueSources.values()].sort((left, right) =>
        left.title.localeCompare(right.title, "th-TH"),
      ),
      taxYearBE: metadata.taxYearBE,
      taxYearCE: metadata.taxYearCE,
      version: metadata.version,
    };
  });
}
