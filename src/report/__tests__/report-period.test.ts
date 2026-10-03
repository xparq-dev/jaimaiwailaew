import { describe, expect, it } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import {
  buildReportPeriodOptions,
  createReportWorkspace,
} from "@/report/report-period";

describe("report periods", () => {
  it("offers unique workspace, half-year, yearly, and monthly periods", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const options = buildReportPeriodOptions(workspace);

    expect(options[0]).toMatchObject({
      id: "workspace",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-30",
      isWorkspacePeriod: true,
    });
    expect(options.some((option) => option.id === "first-half")).toBe(false);
    expect(options.find((option) => option.id === "year")).toMatchObject({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
    });
    expect(options.filter((option) => option.kind === "month")).toHaveLength(
      12,
    );
    expect(
      options.find((option) => option.id === "month-2026-02"),
    ).toMatchObject({ periodStart: "2026-02-01", periodEnd: "2026-02-28" });
  });

  it("creates a non-mutating scoped workspace without undated deductions", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
    );
    const january = buildReportPeriodOptions(workspace).find(
      (option) => option.id === "month-2026-01",
    );

    expect(january).toBeDefined();
    const scoped = createReportWorkspace(workspace, january!);

    expect(scoped).not.toBe(workspace);
    expect(scoped.periodStart).toBe("2026-01-01");
    expect(scoped.periodEnd).toBe("2026-01-31");
    expect(scoped.allowanceDraftEntries).toEqual([]);
    expect(scoped.socialSecuritySettings.mode).toBe("auto_m33");
    expect(workspace.periodStart).toBe("2026-01-01");
    expect(workspace.periodEnd).toBe("2026-12-31");
  });
});
