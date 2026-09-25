import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";

describe("i18n foundation", () => {
  it("keeps Thai as the default and ships a complete dictionary for every locale", () => {
    expect(defaultLocale).toBe("th");

    for (const locale of locales) {
      expect(dictionaries[locale].brand.name).not.toHaveLength(0);
      expect(Object.keys(dictionaries[locale].navigation)).toEqual(
        Object.keys(dictionaries.th.navigation),
      );
      expect(Object.keys(dictionaries[locale].footer)).toEqual(
        Object.keys(dictionaries.th.footer),
      );
    }
  });

  it("rejects unsupported locale values", () => {
    expect(isLocale("th")).toBe(true);
    expect(isLocale("en")).toBe(false);
    expect(isLocale("th-TH")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
