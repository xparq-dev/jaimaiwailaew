import { beforeEach, describe, expect, it } from "vitest";

import {
  clearLocalExportHistory,
  LOCAL_EXPORT_HISTORY_LIMIT,
  LOCAL_EXPORT_HISTORY_STORAGE_KEY,
  readLocalExportHistory,
  recordLocalExportHistory,
} from "@/export/local-export-history";

const candidate = {
  format: "pdf" as const,
  reportReference: "JMWL-20261004-120000-123",
  periodLabel: "1 ม.ค. 2569 – 31 ธ.ค. 2569",
  templateLabel: "ฉบับเต็ม",
};

describe("local export history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores only bounded report metadata after a download", () => {
    const result = recordLocalExportHistory(
      localStorage,
      candidate,
      new Date("2026-10-04T05:00:01.000Z"),
    );

    expect(result.persisted).toBe(true);
    expect(result.records).toEqual([
      {
        ...candidate,
        downloadedAt: "2026-10-04T05:00:01.000Z",
      },
    ]);
    expect(localStorage.getItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY)).not.toMatch(
      /amount|workspace|entry|user|fileName/iu,
    );
  });

  it("keeps the latest download for one reference and format", () => {
    recordLocalExportHistory(
      localStorage,
      candidate,
      new Date("2026-10-04T05:00:01.000Z"),
    );
    const result = recordLocalExportHistory(
      localStorage,
      candidate,
      new Date("2026-10-04T05:05:00.000Z"),
    );

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.downloadedAt).toBe("2026-10-04T05:05:00.000Z");
  });

  it("limits history and returns the newest records first", () => {
    for (let index = 0; index < LOCAL_EXPORT_HISTORY_LIMIT + 3; index += 1) {
      recordLocalExportHistory(
        localStorage,
        {
          ...candidate,
          reportReference: `JMWL-20261004-12${String(index).padStart(4, "0")}-123`,
        },
        new Date(Date.UTC(2026, 9, 4, 5, 0, index)),
      );
    }

    const result = readLocalExportHistory(localStorage);
    expect(result.records).toHaveLength(LOCAL_EXPORT_HISTORY_LIMIT);
    expect(result.records[0]?.downloadedAt).toBe("2026-10-04T05:00:22.000Z");
  });

  it("fails closed for malformed history without deleting it", () => {
    localStorage.setItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY, "{malformed");

    expect(readLocalExportHistory(localStorage)).toEqual({
      records: [],
      persisted: false,
    });
    expect(localStorage.getItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY)).toBe(
      "{malformed",
    );
  });

  it("does not block the download flow when storage rejects a write", () => {
    const storage = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    };

    expect(
      recordLocalExportHistory(
        storage,
        candidate,
        new Date("2026-10-04T05:00:01.000Z"),
      ),
    ).toEqual({ records: [], persisted: false });
  });

  it("clears history without affecting any other storage key", () => {
    recordLocalExportHistory(localStorage, candidate);
    localStorage.setItem("calculator-data", "preserved");

    expect(clearLocalExportHistory(localStorage)).toBe(true);
    expect(localStorage.getItem(LOCAL_EXPORT_HISTORY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("calculator-data")).toBe("preserved");
  });
});
