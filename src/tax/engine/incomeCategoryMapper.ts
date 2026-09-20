import type { IncomeCategoryCode } from "@/calculator/types";
import type { IncomeTypeCode } from "./pitCalculator";

/**
 * Maps application-level IncomeCategoryCode to Revenue Code Section 40 IncomeTypeCode.
 *
 * Rules:
 *  - 40(1) Employment: salary, bonus, overtime, commission, pension
 *  - 40(2) Service/Freelance: freelance_service, creator_affiliate
 *  - 40(3) Royalties/Copyright: royalty
 *  - 40(4) Dividends/Interest: interest, dividend, investment
 *  - 40(5) Rental: rental
 *  - 40(6) Liberal Professions: professional_service (defaulted to 40_6_other)
 *  - 40(8) Commerce/Business: online_sales, store_sales, business_income, agriculture, prize_grant, other
 */
export const INCOME_CATEGORY_TO_INCOME_TYPE_MAP: Record<
  IncomeCategoryCode,
  IncomeTypeCode
> = {
  salary: "40_1",
  bonus: "40_1",
  overtime: "40_1",
  commission: "40_1",
  pension: "40_1",

  freelance_service: "40_2",
  creator_affiliate: "40_2",

  royalty: "40_3",

  interest: "40_4",
  dividend: "40_4",
  investment: "40_4",

  rental: "40_5",

  professional_service: "40_6_other",

  online_sales: "40_8",
  store_sales: "40_8",
  business_income: "40_8",
  agriculture: "40_8",
  prize_grant: "40_8",
  other: "40_8",
};

export function mapIncomeCategoryToIncomeType(
  categoryCode: IncomeCategoryCode,
): IncomeTypeCode {
  return INCOME_CATEGORY_TO_INCOME_TYPE_MAP[categoryCode] ?? "40_8";
}
