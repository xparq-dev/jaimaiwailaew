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
