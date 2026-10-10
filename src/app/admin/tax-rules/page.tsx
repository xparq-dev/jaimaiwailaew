import type { Metadata } from "next";

import { AdminTaxRuleAccess } from "@/components/admin/admin-tax-rule-access";
import manifests2568 from "@/tax/rules/2568/manifest.json";
import metadata2568 from "@/tax/rules/2568/meta.json";
import manifests2569 from "@/tax/rules/2569/manifest.json";
import metadata2569 from "@/tax/rules/2569/meta.json";
import { taxRuleSetSchema } from "@/tax/schemas";

export const metadata: Metadata = { title: "ดูแลกฎภาษี" };

export default function AdminTaxRulesPage() {
  return (
    <AdminTaxRuleAccess
      seeds={[
        taxRuleSetSchema.parse({
          metadata: metadata2568,
          manifests: manifests2568,
        }),
        taxRuleSetSchema.parse({
          metadata: metadata2569,
          manifests: manifests2569,
        }),
      ]}
    />
  );
}
