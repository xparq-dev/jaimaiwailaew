export const locales = ["th", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

export function isLocale(value: string | null): value is Locale {
  return locales.some((locale) => locale === value);
}
