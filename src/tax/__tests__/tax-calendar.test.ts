import { describe, expect, it } from "vitest";

import { getTaxCalendarEntries } from "@/tax/tax-calendar";

describe("getTaxCalendarEntries", () => {
  it("publishes only the reviewed personal-income filing deadlines", () => {
    const entries = getTaxCalendarEntries();

    expect(entries).toHaveLength(2);
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          formLabel: "ภ.ง.ด.94",
          taxYearBE: 2569,
          channels: [
            expect.objectContaining({
              deadline: "2026-10-08",
              label: "ยื่นผ่านอินเทอร์เน็ต",
            }),
          ],
        }),
        expect.objectContaining({
          formLabel: "ภ.ง.ด.90/91",
          taxYearBE: 2568,
          channels: expect.arrayContaining([
            expect.objectContaining({ deadline: "2026-03-31" }),
            expect.objectContaining({ deadline: "2026-04-08" }),
          ]),
        }),
      ]),
    );
  });

  it("keeps source links official and omits private application data", () => {
    const serialized = JSON.stringify(getTaxCalendarEntries());

    for (const entry of getTaxCalendarEntries()) {
      expect(entry.source.authority).toBe("กรมสรรพากร");
      expect(entry.source.url).toMatch(/^https:\/\/(www\.)?rd\.go\.th\//u);
      expect(entry.source.checkedAt).toBe("2026-10-04");
    }

    expect(serialized).not.toMatch(
      /workspace|entryId|userId|ruleSetId|taxDue|refundAmount/iu,
    );
  });
});
