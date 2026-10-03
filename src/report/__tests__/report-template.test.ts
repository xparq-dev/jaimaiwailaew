import { describe, expect, it } from "vitest";

import {
  getReportTemplate,
  REPORT_TEMPLATE_OPTIONS,
} from "@/report/report-template";

describe("report templates", () => {
  it("keeps the full report as the default and exposes three distinct uses", () => {
    expect(REPORT_TEMPLATE_OPTIONS.map((template) => template.id)).toEqual([
      "full",
      "summary",
      "transactions",
    ]);
    expect(getReportTemplate("full").sections).toEqual({
      breakdown: true,
      income: true,
      expense: true,
      withholding: true,
      deductions: true,
      taxEstimate: true,
    });
  });

  it("does not expose detailed or tax sections in the summary template", () => {
    expect(getReportTemplate("summary").sections).toMatchObject({
      breakdown: true,
      income: false,
      expense: false,
      withholding: false,
      deductions: false,
      taxEstimate: false,
    });
  });
});
