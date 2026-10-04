import { describe, expect, it } from "vitest";

import { createReportDocumentReference } from "@/report/report-document-reference";

describe("report document reference", () => {
  it("creates a local reference from the Bangkok export time", () => {
    expect(
      createReportDocumentReference(new Date("2026-09-13T07:55:06.123Z")),
    ).toBe("JMWL-20260913-145506-123");
  });

  it("rejects an invalid export time", () => {
    expect(() => createReportDocumentReference(new Date("invalid"))).toThrow(
      "Report reference requires a valid date.",
    );
  });
});
