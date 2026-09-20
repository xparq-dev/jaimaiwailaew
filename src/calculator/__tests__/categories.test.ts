import { describe, expect, it } from "vitest";

import {
  getDefaultIncomeSourceSuggestion,
  getIncomeCategoryLabel,
  getIncomeSourceSuggestions,
} from "@/calculator/categories";
import { INCOME_CATEGORY_CODES } from "@/calculator/types";

describe("income source suggestions", () => {
  it("matches the default source to every selected income category", () => {
    for (const categoryCode of INCOME_CATEGORY_CODES) {
      expect(getDefaultIncomeSourceSuggestion(categoryCode)).toBe(
        getIncomeCategoryLabel(categoryCode),
      );
      expect(getIncomeSourceSuggestions(categoryCode).length).toBeGreaterThan(
        0,
      );
    }
  });
});
