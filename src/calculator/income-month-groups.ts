import type { MoneySatang } from "@/tax/money";
import { safeAddMoney, toMoneySatang } from "@/tax/money";

import { filterEntriesByPeriod } from "./arithmetic";
import type { EntryFrequency, IncomeEntry } from "./types";
import { formatThaiMonthYear, getEntryMonthKey } from "./utils";
import { sortEntriesByDateDesc } from "./workspace";

export interface IncomeFrequencyGroup {
  readonly entryFrequency: EntryFrequency;
  readonly label: string;
  readonly entries: readonly IncomeEntry[];
  readonly totalSatang: MoneySatang;
}

export interface IncomeMonthGroup {
  readonly monthKey: string;
  readonly label: string;
  readonly entryCount: number;
  readonly totalSatang: MoneySatang;
  readonly frequencyGroups: readonly IncomeFrequencyGroup[];
}

const FREQUENCY_ORDER: readonly EntryFrequency[] = ["monthly", "one_time"];

const FREQUENCY_LABELS: Record<EntryFrequency, string> = {
  monthly: "รายการรายเดือน",
  one_time: "รายการระบุวัน",
};

function sumIncomeEntries(entries: readonly IncomeEntry[]): MoneySatang {
  return entries.reduce(
    (total, entry) => safeAddMoney(total, entry.amountSatang),
    toMoneySatang(0),
  );
}

export function buildIncomeMonthGroups(
  entries: readonly IncomeEntry[],
): IncomeMonthGroup[] {
  const entriesByMonth = new Map<string, IncomeEntry[]>();

  for (const entry of entries) {
    const monthKey = getEntryMonthKey(entry);
    if (!monthKey) {
      continue;
    }

    const monthEntries = entriesByMonth.get(monthKey);
    if (monthEntries) {
      monthEntries.push(entry);
    } else {
      entriesByMonth.set(monthKey, [entry]);
    }
  }

  return [...entriesByMonth.entries()]
    .sort(([leftMonth], [rightMonth]) =>
      leftMonth < rightMonth ? 1 : leftMonth > rightMonth ? -1 : 0,
    )
    .map(([monthKey, monthEntries]) => {
      const frequencyGroups = FREQUENCY_ORDER.flatMap((entryFrequency) => {
        const frequencyEntries = sortEntriesByDateDesc(
          monthEntries.filter(
            (entry) => entry.entryFrequency === entryFrequency,
          ),
        );

        if (frequencyEntries.length === 0) {
          return [];
        }

        return [
          {
            entryFrequency,
            label: FREQUENCY_LABELS[entryFrequency],
            entries: frequencyEntries,
            totalSatang: sumIncomeEntries(frequencyEntries),
          },
        ];
      });

      return {
        monthKey,
        label: formatThaiMonthYear(monthKey),
        entryCount: monthEntries.length,
        totalSatang: sumIncomeEntries(monthEntries),
        frequencyGroups,
      };
    });
}

export function buildIncomeMonthGroupsForPeriod(
  entries: readonly IncomeEntry[],
  periodStart: string,
  periodEnd: string,
): IncomeMonthGroup[] {
  return buildIncomeMonthGroups(
    filterEntriesByPeriod(entries, periodStart, periodEnd),
  );
}
