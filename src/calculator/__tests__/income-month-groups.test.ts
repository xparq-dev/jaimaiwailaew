import { describe, expect, it } from "vitest";

import { computeArithmeticTotals } from "@/calculator/arithmetic";
import {
  buildIncomeMonthGroups,
  buildIncomeMonthGroupsForPeriod,
} from "@/calculator/income-month-groups";
import type { CalculatorWorkspace, IncomeEntry } from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { safeAddMoney, toMoneySatang } from "@/tax/money";

const timestamp = "2026-01-01T00:00:00.000Z";

function oneTimeIncome(
  id: string,
  occurredOn: string,
  amountSatang: number,
): IncomeEntry {
  return {
    id,
    entryFrequency: "one_time",
    occurredOn,
    occurredMonth: null,
    categoryCode: "online_sales",
    sourceName: "ร้านตัวอย่าง",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function monthlyIncome(
  id: string,
  occurredMonth: string,
  amountSatang: number,
): IncomeEntry {
  return {
    id,
    entryFrequency: "monthly",
    occurredOn: null,
    occurredMonth,
    categoryCode: "salary",
    sourceName: "งานประจำ",
    amountSatang: toMoneySatang(amountSatang),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("buildIncomeMonthGroups", () => {
  it("separates months while keeping monthly and dated income in the same month", () => {
    const groups = buildIncomeMonthGroups([
      oneTimeIncome("jan-early", "2026-01-05", 4_900_00),
      monthlyIncome("jan-monthly", "2026-01", 18_000_00),
      oneTimeIncome("jan-late", "2026-01-26", 3_600_00),
      monthlyIncome("feb-monthly", "2026-02", 18_000_00),
    ]);

    expect(groups.map((group) => group.monthKey)).toEqual([
      "2026-02",
      "2026-01",
    ]);
    expect(groups[0]).toMatchObject({
      label: "กุมภาพันธ์ 2569",
      entryCount: 1,
      totalSatang: toMoneySatang(18_000_00),
    });
    expect(groups[1]).toMatchObject({
      label: "มกราคม 2569",
      entryCount: 3,
      totalSatang: toMoneySatang(26_500_00),
    });
    expect(
      groups[1]?.frequencyGroups.map((group) => ({
        entryFrequency: group.entryFrequency,
        label: group.label,
        entryIds: group.entries.map((entry) => entry.id),
        totalSatang: group.totalSatang,
      })),
    ).toEqual([
      {
        entryFrequency: "monthly",
        label: "รายการรายเดือน",
        entryIds: ["jan-monthly"],
        totalSatang: toMoneySatang(18_000_00),
      },
      {
        entryFrequency: "one_time",
        label: "รายการระบุวัน",
        entryIds: ["jan-late", "jan-early"],
        totalSatang: toMoneySatang(8_500_00),
      },
    ]);
  });

  it("does not mutate the source entries", () => {
    const entries = [
      oneTimeIncome("one-time", "2026-01-10", 1_000_00),
      monthlyIncome("monthly", "2026-01", 2_000_00),
    ];
    const before = structuredClone(entries);

    buildIncomeMonthGroups(entries);

    expect(entries).toEqual(before);
  });

  it("keeps month and frequency totals equal to the selected-period Summary total", () => {
    const baseWorkspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const incomeEntries = [
      oneTimeIncome("jan-dated", "2026-01-10", 1_000_00),
      monthlyIncome("jan-monthly", "2026-01", 2_000_00),
      monthlyIncome("feb-monthly", "2026-02", 3_000_00),
      oneTimeIncome("outside", "2026-07-01", 9_000_00),
    ];
    const workspace: CalculatorWorkspace = { ...baseWorkspace, incomeEntries };

    const groups = buildIncomeMonthGroupsForPeriod(
      incomeEntries,
      workspace.periodStart,
      workspace.periodEnd,
    );
    const totalOfMonths = groups.reduce(
      (total, group) => safeAddMoney(total, group.totalSatang),
      toMoneySatang(0),
    );

    for (const group of groups) {
      const totalOfFrequencyGroups = group.frequencyGroups.reduce(
        (total, frequencyGroup) =>
          safeAddMoney(total, frequencyGroup.totalSatang),
        toMoneySatang(0),
      );
      expect(totalOfFrequencyGroups).toBe(group.totalSatang);
    }

    expect(groups.map((group) => group.monthKey)).toEqual([
      "2026-02",
      "2026-01",
    ]);
    expect(totalOfMonths).toBe(
      computeArithmeticTotals(workspace).totalIncomeSatang,
    );
    expect(
      groups.flatMap((group) =>
        group.frequencyGroups.flatMap((frequencyGroup) =>
          frequencyGroup.entries.map((entry) => entry.id),
        ),
      ),
    ).not.toContain("outside");
  });
});
