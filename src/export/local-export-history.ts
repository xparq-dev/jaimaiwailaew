export const LOCAL_EXPORT_HISTORY_STORAGE_KEY =
  "jaimaiwailaew:export-history:v1";
export const LOCAL_EXPORT_HISTORY_LIMIT = 20;

export type LocalExportFormat = "pdf" | "xlsx" | "csv";

export interface LocalExportHistoryRecord {
  readonly format: LocalExportFormat;
  readonly reportReference: string;
  readonly periodLabel: string;
  readonly templateLabel: string;
  readonly downloadedAt: string;
}

export interface LocalExportHistoryCandidate {
  readonly format: LocalExportFormat;
  readonly reportReference: string;
  readonly periodLabel: string;
  readonly templateLabel: string;
}

interface LocalExportHistoryPayload {
  readonly schemaVersion: 1;
  readonly records: readonly LocalExportHistoryRecord[];
}

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface LocalExportHistoryResult {
  readonly records: readonly LocalExportHistoryRecord[];
  readonly persisted: boolean;
}

const REPORT_REFERENCE_PATTERN = /^JMWL-\d{8}-\d{6}-\d{3}$/u;
const VALID_FORMATS: readonly LocalExportFormat[] = ["pdf", "xlsx", "csv"];

function isBoundedText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" && value.length > 0 && value.length <= maxLength
  );
}

function isHistoryRecord(value: unknown): value is LocalExportHistoryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<LocalExportHistoryRecord>;
  return (
    VALID_FORMATS.includes(record.format as LocalExportFormat) &&
    typeof record.reportReference === "string" &&
    REPORT_REFERENCE_PATTERN.test(record.reportReference) &&
    isBoundedText(record.periodLabel, 120) &&
    isBoundedText(record.templateLabel, 80) &&
    typeof record.downloadedAt === "string" &&
    Number.isFinite(Date.parse(record.downloadedAt))
  );
}

export function readLocalExportHistory(
  storage: HistoryStorage,
): LocalExportHistoryResult {
  try {
    const raw = storage.getItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY);
    if (!raw) {
      return { records: [], persisted: true };
    }

    const parsed = JSON.parse(raw) as Partial<LocalExportHistoryPayload>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
      return { records: [], persisted: false };
    }

    const records = parsed.records
      .filter(isHistoryRecord)
      .sort(
        (left, right) =>
          Date.parse(right.downloadedAt) - Date.parse(left.downloadedAt),
      )
      .slice(0, LOCAL_EXPORT_HISTORY_LIMIT);

    return {
      records,
      persisted: records.length === parsed.records.length,
    };
  } catch {
    return { records: [], persisted: false };
  }
}

export function recordLocalExportHistory(
  storage: HistoryStorage,
  candidate: LocalExportHistoryCandidate,
  downloadedAt: Date = new Date(),
): LocalExportHistoryResult {
  if (Number.isNaN(downloadedAt.getTime())) {
    return {
      records: readLocalExportHistory(storage).records,
      persisted: false,
    };
  }

  const current = readLocalExportHistory(storage).records;
  const nextRecord: LocalExportHistoryRecord = {
    ...candidate,
    downloadedAt: downloadedAt.toISOString(),
  };
  if (!isHistoryRecord(nextRecord)) {
    return { records: current, persisted: false };
  }

  const records = [
    nextRecord,
    ...current.filter(
      (record) =>
        record.reportReference !== candidate.reportReference ||
        record.format !== candidate.format,
    ),
  ].slice(0, LOCAL_EXPORT_HISTORY_LIMIT);
  const payload: LocalExportHistoryPayload = { schemaVersion: 1, records };

  try {
    storage.setItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(payload));
    return { records, persisted: true };
  } catch {
    return { records: current, persisted: false };
  }
}

export function clearLocalExportHistory(storage: HistoryStorage): boolean {
  try {
    storage.removeItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
