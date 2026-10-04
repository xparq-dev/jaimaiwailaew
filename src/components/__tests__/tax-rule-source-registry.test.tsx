import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaxRuleSourceRegistry } from "@/components/tax-rule-source-registry";

describe("TaxRuleSourceRegistry", () => {
  it("shows human-facing status and official links without internal identifiers", () => {
    render(
      <TaxRuleSourceRegistry
        entries={[
          {
            calculationAvailable: true,
            lastReviewedAt: "2026-09-20",
            scope: ["personal-income-tax-estimate"],
            sources: [
              {
                authority: "กรมสรรพากร",
                evidenceLevel: "primary_official",
                lastCheckedAt: "2026-09-20",
                title: "ประกาศตัวอย่าง",
                url: "https://www.rd.go.th/example",
              },
            ],
            taxYearBE: 2569,
            taxYearCE: 2026,
            version: "1.0.0",
          },
        ]}
      />,
    );

    expect(screen.getByText("พร้อมใช้สำหรับการประมาณการ")).toBeVisible();
    expect(screen.getByText("ประกาศตัวอย่าง")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "เปิดแหล่งอ้างอิง" }),
    ).toHaveAttribute("href", "https://www.rd.go.th/example");
    expect(screen.queryByText(/ruleSetId|sourceId/i)).not.toBeInTheDocument();
  });
});
