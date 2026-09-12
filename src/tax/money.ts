/**
 * Safe Money precision utility for Thai Baht operations in integer satang.
 * 1 Thai Baht = 100 satang.
 */

declare const MoneySatangBrand: unique symbol;

/** Branded type for safe integer satang values. */
export type MoneySatang = number & { readonly [MoneySatangBrand]: true };

export type RoundingPolicy =
  "round" | "floor" | "ceil" | "bankers" | "exact_only";

export interface DecimalConversionOptions {
  readonly roundingPolicy: RoundingPolicy;
  readonly allowNegative?: boolean | undefined;
}

export interface MoneyOptions {
  readonly allowNegative?: boolean | undefined;
}

const MAX_SATANG = Number.MAX_SAFE_INTEGER;
const MIN_SATANG = Number.MIN_SAFE_INTEGER;

/** Type guard for MoneySatang integer values within safe bounds. */
export function isMoneySatang(
  value: unknown,
  options: MoneyOptions = {},
): value is MoneySatang {
  if (typeof value !== "number") {
    return false;
  }
  if (!Number.isInteger(value)) {
    return false;
  }
  if (value > MAX_SATANG || value < MIN_SATANG) {
    return false;
  }
  if (!options.allowNegative && value < 0) {
    return false;
  }
  return true;
}

/** Assert and brand a raw number as MoneySatang. */
export function toMoneySatang(
  value: number,
  options: MoneyOptions = {},
): MoneySatang {
  if (!isMoneySatang(value, options)) {
    throw new TypeError(
      `Invalid MoneySatang value: ${value}. Must be a safe integer satang${
        options.allowNegative ? "" : " (non-negative)"
      }.`,
    );
  }
  return value as MoneySatang;
}

/** Converts integer Baht to integer satang. */
export function bahtToSatang(
  baht: number,
  options: MoneyOptions = {},
): MoneySatang {
  if (
    typeof baht !== "number" ||
    !Number.isFinite(baht) ||
    !Number.isInteger(baht)
  ) {
    throw new TypeError(
      `bahtToSatang expects an integer Baht value, got: ${baht}`,
    );
  }
  const satang = baht * 100;
  return toMoneySatang(satang, options);
}

/** Converts integer satang to decimal Baht number (for display/formatting only). */
export function satangToBaht(satang: MoneySatang): number {
  if (!isMoneySatang(satang, { allowNegative: true })) {
    throw new TypeError(`satangToBaht expects a valid MoneySatang value.`);
  }
  return satang / 100;
}

/**
 * Converts a decimal Baht string (e.g. "1500.50") to MoneySatang.
 * Requires explicit RoundingPolicy to prevent uncontrolled rounding bugs.
 */
export function decimalStringToSatang(
  bahtString: string,
  options: DecimalConversionOptions,
): MoneySatang {
  if (typeof bahtString !== "string") {
    throw new TypeError("Decimal Baht input must be a string.");
  }

  const trimmed = bahtString.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    throw new Error(`Malformed decimal Baht string: "${bahtString}"`);
  }

  const isNegative = trimmed.startsWith("-");
  if (isNegative && !options.allowNegative) {
    throw new Error(
      `Negative money amount disallowed by policy: "${bahtString}"`,
    );
  }

  const parts = trimmed.split(".");
  const wholeStr = (parts[0] ?? "0").replace("-", "");
  const fracStr = parts[1] ?? "";

  const wholeSatang = BigInt(wholeStr) * BigInt(100);

  let fracSatang = BigInt(0);
  let remainder = BigInt(0);

  if (fracStr.length === 0) {
    fracSatang = BigInt(0);
    remainder = BigInt(0);
  } else if (fracStr.length === 1) {
    const firstDigit = fracStr[0] ?? "0";
    fracSatang = BigInt(firstDigit) * BigInt(10);
  } else if (fracStr.length === 2) {
    fracSatang = BigInt(fracStr.slice(0, 2));
  } else {
    fracSatang = BigInt(fracStr.slice(0, 2));
    const extra = fracStr.slice(2);
    remainder = BigInt(extra);
  }

  let totalSatang = wholeSatang + fracSatang;

  if (remainder > BigInt(0)) {
    switch (options.roundingPolicy) {
      case "exact_only":
        throw new Error(
          `Exact conversion required, but "${bahtString}" has excess decimal places.`,
        );
      case "floor":
        // Keep totalSatang as truncated
        break;
      case "ceil":
        totalSatang += BigInt(1);
        break;
      case "round": {
        const firstExtraDigit = Number(fracStr[2] ?? 0);
        if (firstExtraDigit >= 5) {
          totalSatang += BigInt(1);
        }
        break;
      }
      case "bankers": {
        const firstExtraDigit = Number(fracStr[2] ?? 0);
        if (firstExtraDigit > 5) {
          totalSatang += BigInt(1);
        } else if (firstExtraDigit === 5) {
          const hasMoreDigits = fracStr
            .slice(3)
            .split("")
            .some((d) => d !== "0");
          if (hasMoreDigits || totalSatang % BigInt(2) !== BigInt(0)) {
            totalSatang += BigInt(1);
          }
        }
        break;
      }
    }
  }

  let resultNum = Number(totalSatang);
  if (isNegative) {
    resultNum = -resultNum;
  }

  const moneyOptions: MoneyOptions =
    options.allowNegative !== undefined
      ? { allowNegative: options.allowNegative }
      : {};

  return toMoneySatang(resultNum, moneyOptions);
}

/** Safely adds two MoneySatang amounts. */
export function safeAddMoney(
  a: MoneySatang,
  b: MoneySatang,
  options: MoneyOptions = {},
): MoneySatang {
  if (
    !isMoneySatang(a, { allowNegative: true }) ||
    !isMoneySatang(b, { allowNegative: true })
  ) {
    throw new TypeError("safeAddMoney requires valid MoneySatang inputs.");
  }
  const result = a + b;
  return toMoneySatang(result, options);
}

/** Safely subtracts two MoneySatang amounts (a - b). */
export function safeSubtractMoney(
  a: MoneySatang,
  b: MoneySatang,
  options: MoneyOptions = {},
): MoneySatang {
  if (
    !isMoneySatang(a, { allowNegative: true }) ||
    !isMoneySatang(b, { allowNegative: true })
  ) {
    throw new TypeError("safeSubtractMoney requires valid MoneySatang inputs.");
  }
  const result = a - b;
  return toMoneySatang(result, options);
}

/** Compares two MoneySatang amounts. Returns -1, 0, or 1. */
export function compareMoney(a: MoneySatang, b: MoneySatang): -1 | 0 | 1 {
  if (
    !isMoneySatang(a, { allowNegative: true }) ||
    !isMoneySatang(b, { allowNegative: true })
  ) {
    throw new TypeError("compareMoney requires valid MoneySatang inputs.");
  }
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Formats integer satang to Thai Baht string with 2 decimals (e.g. "1,500.50 ฿"). */
export function formatThaiBaht(satang: MoneySatang): string {
  if (!isMoneySatang(satang, { allowNegative: true })) {
    throw new TypeError("formatThaiBaht requires a valid MoneySatang input.");
  }
  const baht = satang / 100;
  return (
    new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(baht) + " ฿"
  );
}
