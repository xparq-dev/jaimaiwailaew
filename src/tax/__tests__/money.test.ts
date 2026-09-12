import { describe, expect, it } from "vitest";

import {
  bahtToSatang,
  compareMoney,
  decimalStringToSatang,
  formatThaiBaht,
  isMoneySatang,
  safeAddMoney,
  safeSubtractMoney,
  satangToBaht,
  toMoneySatang,
} from "../money";

describe("Money precision utilities", () => {
  it("performs exact money addition and subtraction without floating point errors", () => {
    const a = bahtToSatang(100);
    const b = bahtToSatang(50);

    const sum = safeAddMoney(a, b);
    expect(sum).toBe(15000);
    expect(satangToBaht(sum)).toBe(150);

    const diff = safeSubtractMoney(a, b);
    expect(diff).toBe(5000);
    expect(satangToBaht(diff)).toBe(50);
  });

  it("converts decimal strings according to explicit rounding policies", () => {
    // 1500.505 -> round -> 150051 satang
    expect(decimalStringToSatang("1500.505", { roundingPolicy: "round" })).toBe(
      150051,
    );

    // 1500.505 -> floor -> 150050 satang
    expect(decimalStringToSatang("1500.505", { roundingPolicy: "floor" })).toBe(
      150050,
    );

    // 1500.501 -> ceil -> 150051 satang
    expect(decimalStringToSatang("1500.501", { roundingPolicy: "ceil" })).toBe(
      150051,
    );

    // 1500.505 -> exact_only -> throws
    expect(() =>
      decimalStringToSatang("1500.505", { roundingPolicy: "exact_only" }),
    ).toThrow();
  });

  it("rejects malformed money string inputs", () => {
    expect(() =>
      decimalStringToSatang("abc", { roundingPolicy: "round" }),
    ).toThrow();

    expect(() =>
      decimalStringToSatang("1,500.50", { roundingPolicy: "round" }),
    ).toThrow();

    expect(() =>
      decimalStringToSatang("1500.50.00", { roundingPolicy: "round" }),
    ).toThrow();
  });

  it("enforces negative money policy as documented", () => {
    // By default, negative money is disallowed
    expect(() =>
      decimalStringToSatang("-100.00", { roundingPolicy: "round" }),
    ).toThrow();

    // Allowed when explicit flag is true
    const negativeSatang = decimalStringToSatang("-100.00", {
      roundingPolicy: "round",
      allowNegative: true,
    });
    expect(negativeSatang).toBe(-10000);
    expect(isMoneySatang(negativeSatang, { allowNegative: true })).toBe(true);
    expect(isMoneySatang(negativeSatang, { allowNegative: false })).toBe(false);
  });

  it("rejects large or unsafe integer money values beyond MAX_SAFE_INTEGER", () => {
    const unsafeValue = Number.MAX_SAFE_INTEGER + 100;
    expect(isMoneySatang(unsafeValue)).toBe(false);
    expect(() => toMoneySatang(unsafeValue)).toThrow();

    expect(isMoneySatang(NaN)).toBe(false);
    expect(isMoneySatang(Infinity)).toBe(false);
    expect(isMoneySatang(12.34)).toBe(false);
  });

  it("compares and formats Thai Baht satang accurately", () => {
    const m1 = toMoneySatang(150050);
    const m2 = toMoneySatang(200000);

    expect(compareMoney(m1, m2)).toBe(-1);
    expect(compareMoney(m2, m1)).toBe(1);
    expect(compareMoney(m1, m1)).toBe(0);

    expect(formatThaiBaht(m1)).toContain("1,500.50");
  });
});
