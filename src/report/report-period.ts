import type { CalculatorWorkspace } from "@/calculator/types";
import { formatThaiDate, formatThaiMonthYear } from "@/calculator/utils";

export type ReportPeriodKind = "workspace" | "year" | "half" | "month";

export interface ReportPeriodOption {
  readonly id: string;
  readonly kind: ReportPeriodKind;
  readonly label: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly isWorkspacePeriod: boolean;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dateRangeKey(periodStart: string, periodEnd: string): string {
  return `${periodStart}:${periodEnd}`;
}

export function buildReportPeriodOptions(
  workspace: CalculatorWorkspace,
): readonly ReportPeriodOption[] {
  const year = workspace.taxYearBE - 543;
  const workspaceRange = dateRangeKey(
    workspace.periodStart,
    workspace.periodEnd,
  );
  const candidates: ReportPeriodOption[] = [
    {
      id: "workspace",
      kind: "workspace",
      label: `ช่วง Workspace (${formatThaiDate(workspace.periodStart)} – ${formatThaiDate(workspace.periodEnd)})`,
      periodStart: workspace.periodStart,
      periodEnd: workspace.periodEnd,
      isWorkspacePeriod: true,
    },
    {
      id: "year",
      kind: "year",
      label: `ทั้งปี ${workspace.taxYearBE}`,
      periodStart: `${year}-01-01`,
      periodEnd: `${year}-12-31`,
      isWorkspacePeriod: false,
    },
    {
      id: "first-half",
      kind: "half",
      label: `ครึ่งปีแรก ${workspace.taxYearBE}`,
      periodStart: `${year}-01-01`,
      periodEnd: `${year}-06-30`,
      isWorkspacePeriod: false,
    },
    {
      id: "second-half",
      kind: "half",
      label: `ครึ่งปีหลัง ${workspace.taxYearBE}`,
      periodStart: `${year}-07-01`,
      periodEnd: `${year}-12-31`,
      isWorkspacePeriod: false,
    },
    ...Array.from({ length: 12 }, (_, index): ReportPeriodOption => {
      const month = index + 1;
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      return {
        id: `month-${monthKey}`,
        kind: "month",
        label: formatThaiMonthYear(monthKey),
        periodStart: `${monthKey}-01`,
        periodEnd: `${monthKey}-${lastDayOfMonth(year, month)}`,
        isWorkspacePeriod: false,
      };
    }),
  ];

  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const range = dateRangeKey(candidate.periodStart, candidate.periodEnd);
    if (seen.has(range)) {
      return [];
    }
    seen.add(range);
    return [
      range === workspaceRange
        ? { ...candidate, isWorkspacePeriod: true }
        : candidate,
    ];
  });
}

export function createReportWorkspace(
  workspace: CalculatorWorkspace,
  period: ReportPeriodOption,
): CalculatorWorkspace {
  if (period.isWorkspacePeriod) {
    return workspace;
  }

  return {
    ...workspace,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    allowanceDraftEntries: [],
    socialSecuritySettings:
      workspace.socialSecuritySettings.mode === "auto_m33"
        ? workspace.socialSecuritySettings
        : { mode: "none" },
  };
}
