import type { EntryFrequency } from "./types";

export function createLocalId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

export function sanitizeNote(note: string | undefined): string | undefined {
  if (!note) {
    return undefined;
  }

  const sanitized = note.replace(/<[^>]*>/g, "").trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

export function isDateWithinPeriod(
  date: string,
  periodStart: string,
  periodEnd: string,
): boolean {
  return date >= periodStart && date <= periodEnd;
}

export function isMonthWithinPeriod(
  month: string,
  periodStart: string,
  periodEnd: string,
): boolean {
  const startMonth = periodStart.slice(0, 7);
  const endMonth = periodEnd.slice(0, 7);
  return month >= startMonth && month <= endMonth;
}

export function isEntryWithinPeriod(
  entry: {
    readonly entryFrequency: EntryFrequency;
    readonly occurredOn: string | null;
    readonly occurredMonth: string | null;
  },
  periodStart: string,
  periodEnd: string,
): boolean {
  if (entry.entryFrequency === "one_time" && entry.occurredOn) {
    return isDateWithinPeriod(entry.occurredOn, periodStart, periodEnd);
  }
  if (entry.entryFrequency === "monthly" && entry.occurredMonth) {
    return isMonthWithinPeriod(entry.occurredMonth, periodStart, periodEnd);
  }
  return false;
}

export function getEntryMonthKey(entry: {
  readonly entryFrequency: EntryFrequency;
  readonly occurredOn: string | null;
  readonly occurredMonth: string | null;
}): string {
  if (entry.entryFrequency === "monthly" && entry.occurredMonth) {
    return entry.occurredMonth;
  }
  if (entry.entryFrequency === "one_time" && entry.occurredOn) {
    return entry.occurredOn.slice(0, 7);
  }
  return "";
}

/**
 * Generates a pure sort key for chronological descending ordering.
 * For one_time: uses occurredOn directly (e.g. "2026-03-15").
 * For monthly: uses occurredMonth + "-01" so that it groups with that month (e.g. "2026-03-01").
 */
export function getEntryChronologicalSortKey(entry: {
  readonly entryFrequency: EntryFrequency;
  readonly occurredOn: string | null;
  readonly occurredMonth: string | null;
}): string {
  if (entry.entryFrequency === "one_time" && entry.occurredOn) {
    return entry.occurredOn;
  }
  if (entry.entryFrequency === "monthly" && entry.occurredMonth) {
    return `${entry.occurredMonth}-01`;
  }
  return "";
}

export function compareDatesDescending(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? 1 : -1;
}

export function taxYearPeriodDefaults(taxYearBE: 2568 | 2569) {
  const taxYearCE = taxYearBE - 543;

  return {
    firstHalfStart: `${taxYearCE}-01-01`,
    firstHalfEnd: `${taxYearCE}-06-30`,
    fullYearStart: `${taxYearCE}-01-01`,
    fullYearEnd: `${taxYearCE}-12-31`,
  };
}

export function formatThaiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatThaiMonthYear(isoMonth: string): string {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month) {
    return isoMonth;
  }

  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function formatEntryPeriod(entry: {
  readonly entryFrequency: EntryFrequency;
  readonly occurredOn: string | null;
  readonly occurredMonth: string | null;
}): string {
  if (entry.entryFrequency === "monthly" && entry.occurredMonth) {
    return formatThaiMonthYear(entry.occurredMonth);
  }
  if (entry.entryFrequency === "one_time" && entry.occurredOn) {
    return formatThaiDate(entry.occurredOn);
  }
  return "—";
}

export function formatThaiDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}
